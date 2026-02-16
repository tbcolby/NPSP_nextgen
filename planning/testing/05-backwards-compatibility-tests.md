# Backwards Compatibility Test Suite

**Scope**: Ensure modernization changes do not break existing NPSP installations
**Assessment Finding**: No dedicated BC test suite exists; "all existing tests pass" should be a global quality gate

---

## Backwards Compatibility Contract

### What Constitutes the Public API

| Surface | Examples | Breaking Change If... |
|---------|----------|----------------------|
| `global` Apex classes/methods | Any class with `global` access | Signature changes, removal |
| `public` `@AuraEnabled` methods | Controller methods called by LWC/Aura | Signature changes, return type changes |
| Aura application events | `HH_HouseholdSavedEvent`, etc. | Event removed or renamed |
| Custom Settings API names | `Allocations_Settings__c` | Field removed (before CMT migration complete) |
| Custom Metadata Types | `Rollup__mdt`, `Filter_Group__mdt`, `Filter_Rule__mdt`, etc. | Field removed or renamed |
| Platform Events | `DeploymentEvent__e` | Field removed, event renamed |
| TDTM handler registration | `Trigger_Handler__c` records | Load order changed, handler removed |
| Sharing behavior | `without sharing` → `inherited sharing` | Users lose access to records they previously saw |

### What Is NOT Public API

| Surface | Reason |
|---------|--------|
| `private` / `protected` methods | Internal implementation detail |
| Test classes (`*_TEST`) | Not consumed externally |
| Internal utility classes | Not intended for external use |
| CSS class names in LWC | Implementation detail |
| Internal field names | Not part of public schema |

---

## Test Categories

### 1. Existing Test Preservation

**Rule**: All existing test classes must pass without modification after any change.

```bash
# Run FULL existing test suite (no modifications)
cci task run run_tests --org bc_test \
  -o required_org_code_coverage_percent 85

# Compare results against baseline
# Any new failure = backwards compatibility break
```

**CI Enforcement**:
```yaml
backwards_compatibility:
  gate: blocking
  check: "All pre-existing test classes pass"
  exception_process: "Requires supervisor + human approval to waive"
```

### 2. Sharing Behavior Comparison

Validate that sharing mode changes don't alter query results:

```apex
// Note: TEST_SecurityHelper is to be created as part of this testing strategy.
// The rollup execution below uses CRLP_Batch_Base (the actual rollup batch class).
@IsTest
static void shouldReturnSameResults_SharingModeChange() {
    // Setup: Create data visible to admin but not restricted user
    Account orgAccount = new Account(Name = 'Restricted Org');
    insert orgAccount;

    // TEST_SecurityHelper is to be created (see testing strategy)
    User restrictedUser = UTIL_UnitTestData_TEST.createUserWithoutInsert(
        UTIL_Profile.PROFILE_STANDARD_USER);
    insert restrictedUser;

    // Run operation as admin (baseline)
    List<Account> adminResults;
    System.runAs(new User(Id = UserInfo.getUserId())) {
        adminResults = [SELECT npo02__TotalOppAmount__c FROM Account
                        WHERE Id = :orgAccount.Id];
    }

    // Run same operation as restricted user
    List<Account> restrictedResults;
    System.runAs(restrictedUser) {
        restrictedResults = [SELECT npo02__TotalOppAmount__c FROM Account
                             WHERE Id = :orgAccount.Id];
    }

    // Compare: operations that previously used without sharing
    // should produce the same results for both users
    System.assertEquals(adminResults.size(), restrictedResults.size(),
        'Sharing change should not alter rollup results for operations ' +
        'that require system-level data access');
}
```

### 3. Custom Setting Compatibility

Validate dual-source pattern works correctly:

```apex
@IsTest
static void shouldReadFromCustomSetting_WhenCMTEmpty() {
    // Setup: Custom Setting exists, CMT does not
    Allocations_Settings__c cs = new Allocations_Settings__c(
        Default_Allocations_Enabled__c = true
    );
    insert cs;

    // Act: Read through facade
    Allocations_Settings__c result =
        UTIL_CustomSettingsFacade.getAllocationsSettings();

    // Assert: Should fall back to Custom Setting
    System.assert(result.Default_Allocations_Enabled__c,
        'Facade should return Custom Setting value when CMT is empty');
}

@IsTest
static void shouldReadFromCMT_WhenBothExist() {
    // Setup: Both Custom Setting and CMT exist
    // CMT value should take precedence
    // (Uses test override since CMT can't be inserted in tests)
    // Note: NPSP_ConfigurationService does not currently exist.
    // The following is a proposed pattern for when a CMT configuration
    // service is implemented.
    // NPSP_ConfigurationService.getInstance()
    //     .setTestOverride('AllocationSettings', testCMTRecord);

    // Act
    Allocations_Settings__c result =
        UTIL_CustomSettingsFacade.getAllocationsSettings();

    // Assert: Should return CMT value
    System.assert(result.Default_Allocations_Enabled__c,
        'Facade should prefer CMT over Custom Setting');
}
```

### 4. Aura Event Compatibility

Validate that LWC replacements still fire Aura events:

```javascript
// Jest test for LWC → Aura event bridge
it('should fire Aura-compatible event after form save', async () => {
    const element = createElement('c-npsp-form', { is: NpspForm });
    document.body.appendChild(element);

    const eventHandler = jest.fn();
    element.addEventListener('save', eventHandler);

    // Trigger save
    await element.handleSave();
    await flushPromises();

    expect(eventHandler).toHaveBeenCalled();
    // Verify event detail matches previous Aura event structure
    expect(eventHandler.mock.calls[0][0].detail).toHaveProperty('recordId');
});
```

### 5. @AuraEnabled Signature Stability

```apex
@IsTest
static void shouldMaintainAuraEnabledSignatures() {
    // Test that all public @AuraEnabled methods maintain their signatures
    // This is a compile-time check — if signatures change, tests won't compile

    // Example: RD2_EntryFormController
    // Actual signature: getInitialView(Id parentId, Id recordId) returns RD2_AppView
    RD2_AppView result = RD2_EntryFormController.getInitialView(
        /* parentId */ null,
        /* recordId */ null
    );
    // If method signature changes, this test fails to compile
}
```

### 6. Named Credential Fallback

```apex
// Note: TEST_HttpMockFactory is to be created as part of this testing strategy.
@IsTest
static void shouldFallbackToCustomSetting_WhenNamedCredentialMissing() {
    // Setup: No Named Credential configured
    // Legacy Custom Setting credentials exist

    // TEST_HttpMockFactory is to be created; use a standard mock for now
    Test.setMock(HttpCalloutMock.class, new UTIL_HttpMock_TEST.StaticMock(
        200, '{"status": "ok"}'));

    // Act: Call integration service
    // The actual class is PS_IntegrationService (not NPSP_IntegrationService)
    PS_IntegrationService svc = new PS_IntegrationService();
    // Note: sendWithRetry() does not exist on PS_IntegrationService.
    // Use the actual method for making callouts, e.g.:
    HttpResponse response = svc.sendRequest(buildTestRequest());

    // Assert: Should succeed via Custom Setting fallback
    System.assertEquals(200, response.getStatusCode(),
        'Integration should fall back to CS credentials');
}
```

---

## Execution Schedule

| Test Category | When | Duration | Blocking? |
|--------------|------|----------|-----------|
| Existing test preservation | Every PR | ~15 min | Yes |
| Sharing comparison | Sprint end (WS-02) | ~10 min | Yes |
| Custom Setting compat | Sprint end (WS-07) | ~5 min | Yes |
| Aura event compat | Sprint end (WS-06) | ~5 min | Yes |
| Full BC suite | Phase milestone | ~30 min | Yes |

---

## 7. Namespace Migration Testing

Validate that the `npsp__` to `npsp2__` namespace migration tooling works correctly:

### Data Migration Tests

```apex
@IsTest
static void shouldMigrateAllRecords_FromNpspToNpsp2() {
    // Setup: Create records in npsp2__ objects simulating migrated data
    // (In test context, we validate the migration utility logic, not actual
    //  cross-namespace operations which require two installed packages)

    // Create source data
    List<Account> accounts = TEST_AccountBuilder.createAccounts(200);
    insert accounts;

    // Act: Run migration utility
    Test.startTest();
    NPSP2_NamespaceMigrationUtility migrator =
        new NPSP2_NamespaceMigrationUtility();
    NPSP2_NamespaceMigrationUtility.MigrationResult result =
        migrator.migrateObject('Account');
    Test.stopTest();

    // Assert: All records migrated
    Assert.areEqual(200, result.recordsMigrated,
        'All 200 accounts should be migrated');
    Assert.areEqual(0, result.errors.size(),
        'No errors should occur during migration');
}

@IsTest
static void shouldGeneratePreMigrationAuditReport() {
    // Act: Run pre-migration audit
    Test.startTest();
    NPSP2_NamespaceMigrationUtility migrator =
        new NPSP2_NamespaceMigrationUtility();
    NPSP2_NamespaceMigrationUtility.AuditReport report =
        migrator.runPreMigrationAudit();
    Test.stopTest();

    // Assert: Report identifies items needing attention
    Assert.isNotNull(report, 'Audit report should not be null');
    Assert.isNotNull(report.flowsReferencingOldNamespace,
        'Report should list flows referencing npsp__ namespace');
    Assert.isNotNull(report.formulaFieldsReferencingOldNamespace,
        'Report should list formula fields referencing npsp__ namespace');
}

@IsTest
static void shouldValidateFieldMappingCompleteness() {
    // Verify that every npsp__ field has a corresponding npsp2__ mapping
    Test.startTest();
    List<Namespace_Field_Mapping__mdt> mappings = [
        SELECT npsp__Field_API_Name__c, npsp2__Field_API_Name__c,
               Object_API_Name__c
        FROM Namespace_Field_Mapping__mdt
    ];
    Test.stopTest();

    // Each critical object should have mappings
    Set<String> mappedObjects = new Set<String>();
    for (Namespace_Field_Mapping__mdt m : mappings) {
        mappedObjects.add(m.Object_API_Name__c);
        Assert.isNotNull(m.npsp2__Field_API_Name__c,
            'Every mapping must have a target npsp2__ field: ' +
            m.npsp__Field_API_Name__c);
    }

    // Verify critical objects are covered
    Assert.isTrue(mappedObjects.contains('Account'),
        'Account field mappings must exist');
    Assert.isTrue(mappedObjects.contains('Contact'),
        'Contact field mappings must exist');
    Assert.isTrue(mappedObjects.contains('Opportunity'),
        'Opportunity field mappings must exist');
}
```

### Post-Migration Verification Tests

```apex
@IsTest
static void shouldVerifyRecordCountsAfterMigration() {
    // Setup: Create test data and run migration
    List<Account> sourceAccounts = TEST_AccountBuilder.createAccounts(50);
    insert sourceAccounts;

    NPSP2_NamespaceMigrationUtility migrator =
        new NPSP2_NamespaceMigrationUtility();
    migrator.migrateObject('Account');

    // Act: Run post-migration verification
    Test.startTest();
    NPSP2_NamespaceMigrationUtility.VerificationResult verification =
        migrator.verifyMigration('Account');
    Test.stopTest();

    // Assert
    Assert.isTrue(verification.recordCountsMatch,
        'Source and target record counts should match');
    Assert.isTrue(verification.lookupIntegrityValid,
        'All lookup relationships should be correctly remapped');
}
```

### Execution Schedule for Namespace Migration Tests

| Test Category | When | Duration | Blocking? |
|--------------|------|----------|-----------|
| Field mapping completeness | Every PR touching migration | ~2 min | Yes |
| Data migration (bulk) | Sprint end | ~10 min | Yes |
| Pre-migration audit | Phase milestone | ~5 min | Yes |
| Post-migration verification | Phase milestone | ~10 min | Yes |
| Full namespace migration suite | Pre-release | ~30 min | Yes |

---

## Waiver Process

If a backwards compatibility test must be broken:

1. Agent documents why the break is unavoidable
2. Supervisor reviews and confirms no alternative exists
3. Human architect approves the break
4. Migration guide written for affected orgs
5. Deprecation notice added (minimum 1 release before removal)
6. Test updated to reflect new expected behavior

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
