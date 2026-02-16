# Test Data Strategy

**Scope**: All workstreams
**Existing**: `UTIL_UnitTestData_TEST`, builder classes (`TEST_ContactBuilder`, `TEST_OpportunityBuilder`, `TEST_RecurringDonationBuilder`), JSON fixtures for LWC, CumulusCI LDV data tasks

---

## Test Data Tiers

```
┌────────────────────────────────────────────────────────┐
│ TIER 1: Unit Test Data (In-Memory / DML-free)          │
│  Builder pattern → no database round-trips             │
│  Used by: Apex unit tests, service layer tests         │
├────────────────────────────────────────────────────────┤
│ TIER 2: Integration Test Data (DML + @TestSetup)       │
│  Factory methods → real records in test transaction     │
│  Used by: Trigger tests, batch tests, CRUD/FLS tests   │
├────────────────────────────────────────────────────────┤
│ TIER 3: LWC Mock Data (JSON Fixtures)                  │
│  Static JSON → wire adapter / Apex method mocks        │
│  Used by: Jest tests for LWC components                │
├────────────────────────────────────────────────────────┤
│ TIER 4: E2E / Robot Data (Scratch Org Data)            │
│  CumulusCI data tasks → real org with realistic data   │
│  Used by: Robot Framework, UAT, regression testing     │
├────────────────────────────────────────────────────────┤
│ TIER 5: LDV Performance Data (Bulk Datasets)           │
│  CumulusCI LDV tasks → 10K-100K+ records               │
│  Used by: Performance tests, governor limit validation │
└────────────────────────────────────────────────────────┘
```

---

## Tier 1: Builder Pattern (Apex Unit Tests)

### Existing Builders
- `TEST_ContactBuilder` — Contact creation with household logic (uses static factory methods: `dummyContact()`, `dummyContactWithId()` — not fluent builder pattern)
- `TEST_OpportunityBuilder` — Opportunity with stages, amounts (has `build()` but no `buildAndInsert()`)
- `TEST_RecurringDonationBuilder` — RD2 with schedule (has `build()` but no `buildAndInsert()`)

### New Builders (to be created in WS-10, Sprint 3-4)
- `TEST_AccountBuilder` — Account with RecordType, household logic
- `TEST_AllocationBuilder` — Allocation with GAU
- `TEST_DataImportBuilder` — BDI records
- `TEST_PaymentBuilder` — Payment records

### Builder Pattern Standard

> **Note**: The following is an illustrative example for `TEST_AccountBuilder` (to be created in WS-10). Existing builders vary in style — e.g., `TEST_ContactBuilder` uses static factory methods rather than the fluent builder pattern.

```apex
// Proposed: TEST_AccountBuilder (to be created in WS-10)
public class TEST_AccountBuilder {
    private Account record;

    private TEST_AccountBuilder() {
        this.record = new Account(Name = 'Test Account');
    }

    public static TEST_AccountBuilder dummyAccount() {
        return new TEST_AccountBuilder();
    }

    public TEST_AccountBuilder withName(String name) {
        record.Name = name;
        return this;
    }

    public TEST_AccountBuilder withRecordType(String rtName) {
        record.RecordTypeId = Schema.SObjectType.Account
            .getRecordTypeInfosByDeveloperName()
            .get(rtName).getRecordTypeId();
        return this;
    }

    // Build without DML (Tier 1)
    public Account build() {
        return record;
    }
}
```

### Rules
- All builders in `TEST_*Builder` naming pattern
- `build()` returns in-memory record (no DML)
- For DML insertion, call `insert` explicitly after `build()` (existing builders do not have a `buildAndInsert()` method)
- Fluent API (method chaining) for new builders; existing builders may use static factory methods
- Sensible defaults for all required fields

---

## Tier 2: Integration Test Factories

### @TestSetup Pattern

```apex
// Note: This example uses proposed builders (to be created in WS-10).
// Existing builders use build() and explicit DML, or static factory methods.
@TestSetup
static void setupTestData() {
    // Use builders for consistent data
    Account household = TEST_AccountBuilder.dummyAccount()
        .withRecordType('HH_Account')
        .withName('Test Household')
        .build();
    insert household;

    Contact donor = TEST_ContactBuilder.dummyContact();
    donor.AccountId = household.Id;
    donor.Email = 'donor@test.com';
    insert donor;

    Opportunity donation = TEST_OpportunityBuilder.dummyOpportunity()
        .withContact(donor)
        .withAmount(100)
        .withStage('Closed Won')
        .build();
    insert donation;
}
```

### Bulk Data Factory (to be created in WS-10)

```apex
// Proposed: TEST_BulkDataFactory (to be created in WS-10)
public class TEST_BulkDataFactory {
    public static List<Contact> createContacts(Integer count,
                                                Account household) {
        List<Contact> contacts = new List<Contact>();
        for (Integer i = 0; i < count; i++) {
            contacts.add(TEST_ContactBuilder.dummyContact()
                .withAccount(household)
                .withLastName('Contact ' + i)
                .build());
        }
        insert contacts;
        return contacts;
    }
}
```

---

## Tier 3: LWC JSON Fixtures

### Existing Structure
Each LWC component has `__tests__/data/` with JSON fixtures. For example:
```
lwc/rd2EntryForm/
  __tests__/
    data/
      rd2WithACHCommitmentInitialView.json
      installmentPeriodPicklistValues.json
      rd2WithoutCommitmentInitialView.json
      contactGetRecord.json
    rd2EntryForm.test.js
```
> **Note**: Filenames shown above are actual examples from the codebase. Fixture filenames do not always match Apex method names directly.

### Fixture Standards
- One JSON file per wire adapter or Apex method response
- Filename matches the Apex method name
- Realistic data (not minimal stubs)
- Include error response fixtures (`*Error.json`)
- Maximum fixture size: 50KB (larger fixtures indicate test scope creep)

### Mock Registration (jest.config.js)

The actual `jest.config.js` uses `moduleNameMapper` entries for controllers like `GE_GiftEntryController`, `BGE_DataImportBatchEntry_CTRL`, etc. For example:

```javascript
moduleNameMapper: {
    '^@salesforce/apex/GE_GiftEntryController.\\w+$':
        '<rootDir>/force-app/main/default/lwc/__mocks__/apex.js'
}
```
> **Note**: Individual fixtures are typically loaded in test files via `import` or `require`, not via `moduleNameMapper`.

---

## Tier 4: E2E / Robot Framework Data

### CumulusCI Data Loading

Use the existing `test_data_qa_org` task (or similar) to load test data:

```bash
# Load test data using existing CCI task
cci task run test_data_qa_org --org qa
```

> **Note**: A dedicated `load_uat_data` task does not currently exist. Use `test_data_qa_org` or define a custom task in `cumulusci.yml` if needed.

### Robot Framework Test Data

Robot tests use keyword-driven data creation:
```robot
*** Test Cases ***
Create Donation With Allocation
    ${contact}=    Create Contact    FirstName=Test    LastName=Donor
    ${opp}=        Create Opportunity    Contact=${contact}    Amount=1000
    ${alloc}=      Create Allocation     Opportunity=${opp}    Percent=100
```

---

## Tier 5: LDV Performance Data

### Existing CumulusCI LDV Tasks

```yaml
tasks:
  download_ldv_tests:
    # Downloads large data volume test datasets
  deploy_ldv_tests:
    # Deploys LDV data to scratch org
```

### LDV Dataset Definitions

| Dataset | Record Count | Purpose |
|---------|-------------|---------|
| Standard | 200 records per object | Bulk trigger testing |
| Medium | 10K contacts, 50K opportunities | Batch processing |
| Large | 100K contacts, 500K opportunities | LDV governor limits |
| Skew | 1 account with 50K children | Data skew handling |

### Performance Test Data Rules
- LDV data loaded via CumulusCI bulk data tasks (not Apex DML)
- LDV orgs are persistent (30-day scratch org or sandbox)
- Data is not reset between test runs (cumulative)
- Baseline measurements taken on fresh LDV data

---

## Data Security Rules

1. **No real donor data** in any test dataset
2. **No PII in JSON fixtures** — use obviously fake data ("Test Donor", "test@example.com")
3. **No credentials** in test data files
4. **Sanitize error messages** in test fixtures — no stack traces or internal details

---

*Document Version: 1.0*
*Last Updated: 2026-02-12*
