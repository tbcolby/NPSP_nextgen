# Performance & Load Testing Plan

**Scope**: Beyond 200-record bulk tests — LDV, stress testing, governor limit budgets
**Existing**: Robot Framework `perftests/` (BDI, Insert, RD Batch), CumulusCI LDV data tasks
**Assessment Finding**: Only 200-record tests exist; need 10K/50K/100K scenarios

---

## Performance Test Categories

### 1. Governor Limit Budget Tests

Validate that NPSP operations stay within allocated governor limit budgets, leaving headroom for customer org code.

| Operation | SOQL Budget | DML Budget | CPU Budget | Heap Budget |
|-----------|------------|------------|------------|-------------|
| Contact insert (+ household) | < 30 | < 10 | < 5,000ms | < 3MB |
| Opportunity insert (+ rollup + allocation) | < 40 | < 15 | < 7,000ms | < 4MB |
| Recurring Donation schedule evaluation | < 35 | < 10 | < 5,000ms | < 3MB |
| Data Import batch (per chunk of 200) | < 60 | < 20 | < 8,000ms | < 5MB |
| Rollup calculation (per account) | < 20 | < 5 | < 3,000ms | < 2MB |

**Rationale**: Budgets set at ~50-60% of governor limits to leave room for customer triggers, flows, and validation rules sharing the same transaction.

### Apex Budget Test Pattern

```apex
@IsTest
static void shouldStayWithinGovernorBudget_ContactInsert() {
    // Arrange
    // Note: TEST_BulkDataFactory is to be created (see WS-10).
    // The following is illustrative of the proposed pattern.
    List<Contact> contacts = TEST_BulkDataFactory.createContactsInMemory(200);

    // Act
    Test.startTest();
    Integer soqlBefore = Limits.getQueries();
    Integer dmlBefore = Limits.getDmlStatements();
    Integer cpuBefore = Limits.getCpuTime();

    insert contacts;

    Integer soqlUsed = Limits.getQueries() - soqlBefore;
    Integer dmlUsed = Limits.getDmlStatements() - dmlBefore;
    Integer cpuUsed = Limits.getCpuTime() - cpuBefore;
    Test.stopTest();

    // Assert against budgets (not absolute limits)
    System.assert(soqlUsed <= 30,
        'Contact insert SOQL budget exceeded: ' + soqlUsed + '/30');
    System.assert(dmlUsed <= 10,
        'Contact insert DML budget exceeded: ' + dmlUsed + '/10');
    System.assert(cpuUsed <= 5000,
        'Contact insert CPU budget exceeded: ' + cpuUsed + '/5000ms');
}
```

---

### 2. Bulk Processing Tests (200 Records)

Standard Salesforce bulk API size. Every trigger handler must pass.

```apex
@IsTest
static void shouldHandleBulkInsert_200Contacts() {
    // Note: TEST_BulkDataFactory is to be created (see WS-10).
    List<Contact> contacts = TEST_BulkDataFactory.createContactsInMemory(200);
    Test.startTest();
    insert contacts;
    Test.stopTest();

    // Verify all records processed correctly
    List<Account> households = [SELECT Id FROM Account
        WHERE RecordType.DeveloperName = 'HH_Account'];
    System.assert(households.size() > 0, 'Households should be created');
}
```

---

### 3. Large Data Volume (LDV) Tests

For batch classes and rollup calculations that process high volumes.

| Test Scenario | Record Count | Validates |
|--------------|-------------|-----------|
| Batch Data Import | 10K DataImport__c records | BDI throughput, memory |
| RD2 Batch Evaluation | 10K Recurring Donations | Schedule evaluation at scale |
| Rollup Recalculation | Account with 50K Opportunities | Skew handling |
| Contact Merge | 1K duplicate sets | Merge performance |
| Allocation Recalculation | 10K Opportunities with allocations | Allocation engine |

### LDV Test Execution

```bash
# Load LDV data (CumulusCI)
cci task run download_ldv_tests --org perf
cci task run deploy_ldv_tests --org perf

# Run LDV-specific Apex tests (CCI uses SQL LIKE pattern, not glob)
cci task run run_tests --org perf \
  -o test_name_match "LDV_%_TEST"

# Run Robot Framework performance tests
cci task run robot --org perf \
  -o suites robot/Cumulus/perftests/BDI_Tests.robot
cci task run robot --org perf \
  -o suites robot/Cumulus/perftests/RD_Batch_Tests.robot

# Existing CCI flows for performance/LDV testing:
cci flow run ldv_tests --org perf
cci flow run test_performance_scratch --org perf
cci flow run test_performance_LDV --org perf
```

---

### 4. Data Skew Tests

Accounts with disproportionately large numbers of child records:

| Skew Scenario | Parent Records | Child Records Per Parent |
|--------------|---------------|------------------------|
| Mega-account | 1 Account | 50,000 Opportunities |
| Wide household | 1 Household | 500 Contacts |
| Allocation fan-out | 1 Opportunity | 100 Allocations |
| Deep RD history | 1 Recurring Donation | 1,000 Opportunities |

### Skew Test Pattern

```apex
// Note: This example is illustrative. TEST_AccountBuilder is to be created (WS-10).
// CRLP_Batch_Base is the actual rollup batch class (not CRLP_RollupBatch_SVC).
@IsTest
static void shouldHandleSkewAccount_Rollup() {
    // Create skew account (separate test data class for LDV)
    // TEST_AccountBuilder is to be created in WS-10
    Account skewAccount = new Account(Name = 'Mega Donor Corp');
    insert skewAccount;

    List<Opportunity> opps = new List<Opportunity>();
    for (Integer i = 0; i < 1000; i++) { // Reduced for test context
        opps.add(TEST_OpportunityBuilder
            .newOpportunityBuilder()
            .withAccount(skewAccount.Id)
            .withAmount(100)
            .build());
    }
    insert opps;

    Test.startTest();
    // Trigger rollup recalculation via the actual batch class
    Database.executeBatch(new CRLP_Batch_Base());
    Test.stopTest();

    Account result = [SELECT npo02__TotalOppAmount__c FROM Account
                      WHERE Id = :skewAccount.Id];
    System.assertEquals(100000, result.npo02__TotalOppAmount__c,
        'Rollup should handle skew account correctly');
}
```

---

### 5. Concurrent Processing Tests

Simulate multiple async jobs running simultaneously:

| Scenario | Validates |
|----------|-----------|
| 3 Queueable jobs enqueued in same transaction | Slot consumption |
| Batch + Queueable running simultaneously | Resource contention |
| Platform Event burst (100 events) | Event processing throughput |
| Multiple trigger handlers on same object | TDTM chain performance |

---

## Performance Baselines

### Baseline Collection Process

1. **Sprint 1-2** of each workstream: Establish baselines
2. **Each subsequent sprint**: Compare against baselines
3. **Regression**: Alert if >20% degradation from baseline

### Baseline Metrics

| Metric | Collection Method |
|--------|-------------------|
| SOQL per operation | `Limits.getQueries()` in test |
| DML per operation | `Limits.getDmlStatements()` in test |
| CPU time per operation | `Limits.getCpuTime()` in test |
| Heap size per operation | `Limits.getHeapSize()` in test |
| Batch execution time | CumulusCI `batch_apex_wait` |
| Robot test duration | Robot Framework timing |

---

## CI Integration

### Performance Gate

```yaml
# In CI pipeline (post Tier 2 regression)
performance_gate:
  trigger: Sprint end, release candidate
  checks:
    - All governor budget tests pass
    - No operation exceeds 80% of any governor limit
    - Batch execution time within 120% of baseline
    - No new SOQL/DML-in-loop violations (PMD)
  failure_action: Block release, investigate regression
```

---

*Document Version: 1.0*
*Last Updated: 2026-02-12*
