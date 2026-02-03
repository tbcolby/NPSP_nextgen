# NPSP_nextgen Modernization Burndown List

This document tracks backwards-compatible modernization items across multiple release cycles. All items are designed to be incremental and safe for existing orgs.

**Last Updated**: 2026-02-03
**Target Completion**: Q4 2027

---

## Executive Summary

| Category | Total Items | Completed | In Progress | Remaining |
|----------|-------------|-----------|-------------|-----------|
| Phase 1: Foundation | 8 | 0 | 0 | 8 |
| Phase 2: Security | 12 | 0 | 0 | 12 |
| Phase 3: Async Modernization | 15 | 0 | 0 | 15 |
| Phase 4: Performance | 18 | 0 | 0 | 18 |
| Phase 5: Code Quality | 14 | 0 | 0 | 14 |
| Phase 6: UI Modernization | 35 | 0 | 0 | 35 |
| Phase 7: Configuration | 14 | 0 | 0 | 14 |
| Phase 8: Accessibility | 10 | 0 | 0 | 10 |
| Phase 9: Integration | 8 | 0 | 0 | 8 |
| Phase 10: Long-term | 20 | 0 | 0 | 20 |
| **TOTAL** | **154** | **0** | **0** | **154** |

**Estimated Total Effort**: 800-1200 hours across 8 quarterly releases

---

## Guiding Principles

1. **Backwards Compatibility First**: No breaking changes for existing orgs
2. **Easy Implementation**: Prefer automated fixes and low-risk changes
3. **Incremental Progress**: Small PRs that can be reviewed and tested quickly
4. **Test Coverage**: All changes must maintain 85%+ coverage
5. **Sandbox Testing**: All changes tested in sandbox before production guidance

---

## Release Timeline

| Release | Target Date | Focus Areas | Story Points |
|---------|-------------|-------------|--------------|
| v1.0 | Q1 2026 | Foundation, Critical Security | 40 |
| v1.1 | Q2 2026 | Security Hardening, Quick Wins | 50 |
| v1.2 | Q3 2026 | Async Modernization | 60 |
| v1.3 | Q4 2026 | Performance Optimization | 55 |
| v2.0 | Q1 2027 | Code Quality, Standards | 45 |
| v2.1 | Q2 2027 | UI Modernization (Tier 1) | 70 |
| v2.2 | Q3 2027 | Configuration, Accessibility | 50 |
| v2.3 | Q4 2027 | Integration, Final Polish | 40 |

---

## Phase 1: Foundation (Release v1.0)

### 1.1 API Version Upgrade
**Status**: ⬜ Not Started
**Effort**: 4-8 hours | **Risk**: Low | **Priority**: P0-Critical

**Current State**: API 53.0 (Winter '22) - 8+ versions behind current

| Task | File/Location | Status |
|------|---------------|--------|
| Update sfdx-project.json to API 60.0 | `/sfdx-project.json:9` | ⬜ |
| Verify all tests pass on new API | CI/CD | ⬜ |
| Update Aura component at v37.0 | Audit needed | ⬜ |
| Document any breaking changes | CHANGELOG.md | ⬜ |

**Backwards Compatibility**: Fully compatible - Salesforce guarantees API compatibility.

---

### 1.2 Convert `testMethod` to `@IsTest`
**Status**: ⬜ Not Started
**Effort**: 2-3 hours (automated) | **Risk**: Very Low | **Priority**: P1

**Current State**: 644 instances of deprecated `testMethod` keyword

```bash
# Automation script
find force-app -name "*_TEST.cls" -exec sed -i '' \
  's/static testMethod void/static void/g' {} \;
```

| Batch | Files | Status |
|-------|-------|--------|
| Batch 1: CRLP tests | ~50 files | ⬜ |
| Batch 2: RD tests | ~30 files | ⬜ |
| Batch 3: BDI tests | ~25 files | ⬜ |
| Batch 4: All others | ~230 files | ⬜ |

---

### 1.3 Remove Unnecessary `@track` from LWC
**Status**: ⬜ Not Started
**Effort**: 2-3 hours | **Risk**: Very Low | **Priority**: P1

**Current State**: 70+ instances of `@track` on primitive types (unnecessary since API 49.0)

| Component | Primitives to Fix | Status |
|-----------|-------------------|--------|
| geFormWidget | 3 | ⬜ |
| geDonationMatching | 2 | ⬜ |
| rd2EntryForm | 4 | ⬜ |
| geTemplateBuilder | 5 | ⬜ |
| All others (~60) | ~56 | ⬜ |

---

### 1.4 Fix PMD/ESLint Violations
**Status**: ⬜ Not Started
**Effort**: 4-6 hours | **Risk**: Low | **Priority**: P1

| Category | Count | Status |
|----------|-------|--------|
| Unused variables | TBD | ⬜ |
| Missing semicolons (JS) | TBD | ⬜ |
| Console.log statements | TBD | ⬜ |
| Empty catch blocks | TBD | ⬜ |

---

### 1.5 Address TODO/FIXME Comments
**Status**: ⬜ Not Started
**Effort**: 8-12 hours | **Risk**: Low | **Priority**: P2

**Current State**: 48 TODO/FIXME comments across 37 files

| Priority | File | Comment | Status |
|----------|------|---------|--------|
| High | TDTM_TriggerHandler.cls | Implementation needed | ⬜ |
| High | CRLP_RollupProcessor_SVC.cls | Performance concern | ⬜ |
| Medium | BGE_ConfigurationWizard_CTRL.cls | 2 items | ⬜ |
| Medium | ALLO_Allocations_TDTM.cls | 2 items | ⬜ |
| Low | Other 33 files | Various | ⬜ |

---

### 1.6 Update Deprecated fflib Methods
**Status**: ⬜ Not Started
**Effort**: 3-5 hours | **Risk**: Low | **Priority**: P2

**Files with @deprecated usage**:
- `fflib_SObjectSelector.cls`
- `fflib_QueryFactory.cls`

| Method | Replacement | Status |
|--------|-------------|--------|
| subselectQuery(SObjectType) | subselectQuery(String) | ⬜ |
| newQueryFactory() | newQueryFactory(Boolean) | ⬜ |

---

### 1.7 Standardize Code Formatting
**Status**: ⬜ Not Started
**Effort**: 2-4 hours | **Risk**: Very Low | **Priority**: P3

- [ ] Run Prettier on all LWC files
- [ ] Establish Apex formatting standard
- [ ] Add pre-commit hooks for formatting

---

### 1.8 Update Package Dependencies
**Status**: ⬜ Not Started
**Effort**: 2-3 hours | **Risk**: Low | **Priority**: P2

| Dependency | Current | Target | Status |
|------------|---------|--------|--------|
| @salesforce/sfdx-lwc-jest | 1.4.0 | Latest | ⬜ |
| eslint | 8.7.0 | Latest 8.x | ⬜ |
| jest | 27.4.3 | Latest 27.x | ⬜ |
| prettier | 2.5.1 | Latest 2.x | ⬜ |

---

## Phase 2: Security Hardening (Release v1.0-v1.1)

### 2.1 Fix SOQL Injection Vulnerabilities (CRITICAL)
**Status**: ⬜ Not Started
**Effort**: 4-6 hours | **Risk**: Low (fixes security) | **Priority**: P0-Critical

| File | Line | Issue | Fix | Status |
|------|------|-------|-----|--------|
| ALLO_Multicurrency_TEST.cls | ~70 | String concat with oppId | Use bind variable | ⬜ |
| HH_OppContactRoles_TDTM.cls | dynamic | String concat in WHERE | Use bind variable | ⬜ |
| STG_PanelOppBatch_CTRL.cls | dynamic | Unparameterized object | Use Schema validation | ⬜ |
| PSC_Opportunity_TDTM.cls | 87, 96 | Dynamic queries | Use bind variables | ⬜ |

**Pattern to apply**:
```apex
// UNSAFE
String query = 'SELECT Id FROM Account WHERE Id = \'' + accountId + '\'';

// SAFE
String query = 'SELECT Id FROM Account WHERE Id = :accountId';
```

---

### 2.2 Add Explicit Sharing Declarations
**Status**: ⬜ Not Started
**Effort**: 10-15 hours | **Risk**: Low-Medium | **Priority**: P1

**Current State**: 30+ public/global classes without explicit sharing

| Priority | Class | Current | Target | Status |
|----------|-------|---------|--------|--------|
| Critical | UTIL_Version_API.cls | implicit | inherited sharing | ⬜ |
| Critical | ERR_Handler_API.cls | implicit | inherited sharing | ⬜ |
| High | SaveResultView.cls | implicit | inherited sharing | ⬜ |
| High | AggregateResultProxy.cls | implicit | inherited sharing | ⬜ |
| High | CRLP_Rollup_TDTM.cls | implicit | inherited sharing | ⬜ |
| High | RD_RecurringDonations.cls | implicit | inherited sharing | ⬜ |
| Medium | 24+ other classes | implicit | inherited sharing | ⬜ |

---

### 2.3 Add Database Operation Error Handling
**Status**: ⬜ Not Started
**Effort**: 8-10 hours | **Risk**: Very Low | **Priority**: P1

**Classes needing explicit allOrNone parameter**:

| Class | Operations | Status |
|-------|------------|--------|
| RD_RecurringDonations.cls | insert, delete | ⬜ |
| OPP_OpportunityContactRoles_TDTM.cls | insert, delete | ⬜ |
| ALLO_AllocationsDMLService.cls | insert, update, delete | ⬜ |
| BDI_DataImportService.cls | multiple DML | ⬜ |
| 20+ other classes | various | ⬜ |

---

### 2.4 Implement CRUD/FLS Security Checks
**Status**: ⬜ Not Started
**Effort**: 15-20 hours | **Risk**: Medium | **Priority**: P1

**Current State**: Only 1 file uses `Security.stripInaccessible()` (CON_ContactMerge_CTRL.cls)

| Priority | Area | Files | Status |
|----------|------|-------|--------|
| Critical | Batch classes | 45 files | ⬜ |
| Critical | Visualforce controllers | 40+ files | ⬜ |
| High | Aura controllers | 35 files | ⬜ |
| High | Service classes | 50+ files | ⬜ |
| Medium | Selector classes | 20+ files | ⬜ |

**Implementation Pattern**:
```apex
// Check before DML
if (!Schema.sObjectType.Account.isUpdateable()) {
    throw new SecurityException('Insufficient permissions');
}

// Or use stripInaccessible (API 48.0+)
List<Account> accounts = (List<Account>) Security.stripInaccessible(
    AccessType.UPDATABLE,
    [SELECT Id, Name, SecretField__c FROM Account]
).getRecords();
```

---

### 2.5 Remove Hardcoded Credentials/IDs
**Status**: ⬜ Not Started
**Effort**: 2-3 hours | **Risk**: Low | **Priority**: P2

| File | Issue | Status |
|------|-------|--------|
| RP_Constants.cls | YouTube playlist ID (external, low risk) | ⬜ |
| Audit all test classes | Hardcoded test IDs | ⬜ |

---

### 2.6-2.12 Additional Security Items
| ID | Item | Effort | Status |
|----|------|--------|--------|
| 2.6 | Audit permission set assignments | 4h | ⬜ |
| 2.7 | Review field-level security on objects | 6h | ⬜ |
| 2.8 | Implement Content Security Policy headers | 3h | ⬜ |
| 2.9 | Add input validation on all controllers | 8h | ⬜ |
| 2.10 | Review sharing rules configuration | 4h | ⬜ |
| 2.11 | Audit remote site settings | 2h | ⬜ |
| 2.12 | Document security model | 4h | ⬜ |

---

## Phase 3: Async Apex Modernization (Release v1.2)

### 3.1 Convert @future Methods to Queueable
**Status**: ⬜ Not Started
**Effort**: 20-30 hours | **Risk**: Medium | **Priority**: P1

**Current State**: 13 @future methods identified

| Class | Method | Callout? | Status |
|-------|--------|----------|--------|
| TDTM_Runnable.cls | runFuture() | No | ⬜ |
| HouseholdNamingService.cls | updateHouseholdNameAsync() | No | ⬜ |
| USER_UserService.cls | handleDeactivatedSysAdminFuture() | No | ⬜ |
| RD_RecurringDonations.cls | updateRecurringDonationOnOppChangeFuture() | No | ⬜ |
| RD_RecurringDonations.cls | insertOppsOnRecurringDonationInsertFuture() | No | ⬜ |
| RD_RecurringDonations.cls | oppContactRolesFuture() | No | ⬜ |
| RD_RecurringDonations.cls | updateExistingOppsFuture() | No | ⬜ |
| ERR_Notifier.cls | notifyOnFailure() | No | ⬜ |
| CRLP_RecalculateBTN_CTRL.cls | recalculateRollupsFuture() | No | ⬜ |
| STG_PanelDataImportAdvancedMapping_CTRL.cls | (method TBD) | No | ⬜ |
| RLLP_OppRollup.cls | rollupAccountsFuture() | No | ⬜ |
| RLLP_OppRollup.cls | rollupContactsFuture() | No | ⬜ |
| RLLP_OppRollup.cls | rollupHouseholdsFuture() | No | ⬜ |

**Benefits of Queueable**:
- Better error handling with try-catch
- Support for chaining jobs
- Can monitor via AsyncApexJob
- Support for Finalizer pattern (API 54+)

---

### 3.2 Add Finalizer Pattern to Queueables
**Status**: ⬜ Not Started
**Effort**: 8-12 hours | **Risk**: Low | **Priority**: P2

**Current State**: Only GiftEntryProcessorQueue uses Finalizer

| Queueable Class | Add Finalizer | Status |
|-----------------|---------------|--------|
| CRLP_RollupQueueable | Yes - for error recovery | ⬜ |
| ERR_AsyncErrors | Yes - for monitoring | ⬜ |
| RD2_QueueableService (inner classes) | Yes - for cleanup | ⬜ |
| ElevateBatchCapturer | Yes - for callout recovery | ⬜ |
| New converted @future → Queueable | Yes | ⬜ |

---

### 3.3 Modernize Batch Apex Patterns
**Status**: ⬜ Not Started
**Effort**: 15-25 hours | **Risk**: Medium | **Priority**: P2

**Current State**: 45 batch classes, varying patterns

| Batch Class Group | Count | Modernization Needed | Status |
|-------------------|-------|---------------------|--------|
| CRLP Batches | 14 | Add Finalizer support | ⬜ |
| RLLP Legacy Batches | 4 | Consider deprecation | ⬜ |
| RD Batches | 5 | Add Finalizer, improve chaining | ⬜ |
| Utility Batches | 10 | Standardize patterns | ⬜ |
| Other Batches | 12 | Review and standardize | ⬜ |

**Modernization targets**:
- Add Database.RaisesPlatformEvents for better monitoring
- Implement consistent error handling
- Add progress tracking via custom objects or platform events

---

### 3.4 Implement Platform Events
**Status**: ⬜ Not Started
**Effort**: 20-30 hours | **Risk**: Medium | **Priority**: P2

**Current State**: Limited platform event usage

| Use Case | Event Name | Status |
|----------|------------|--------|
| Batch job completion | BatchJobComplete__e | ⬜ |
| Error notification | ErrorOccurred__e | ⬜ |
| Data import progress | DataImportProgress__e | ⬜ |
| Rollup calculation complete | RollupComplete__e | ⬜ |

---

### 3.5 Deprecate UTIL_MasterSchedulable
**Status**: ⬜ Not Started
**Effort**: 4-6 hours | **Risk**: Low | **Priority**: P3

**Current State**: Already marked deprecated, needs cleanup

- [ ] Document migration path for existing scheduled jobs
- [ ] Create replacement scheduling mechanism
- [ ] Update documentation

---

### 3.6-3.15 Additional Async Items
| ID | Item | Effort | Status |
|----|------|--------|--------|
| 3.6 | Add job chaining documentation | 4h | ⬜ |
| 3.7 | Implement async job monitoring dashboard | 8h | ⬜ |
| 3.8 | Add retry logic to failed queueables | 6h | ⬜ |
| 3.9 | Optimize batch scope sizes | 4h | ⬜ |
| 3.10 | Add batch job deduplication | 4h | ⬜ |
| 3.11 | Implement graceful batch cancellation | 6h | ⬜ |
| 3.12 | Add async job metrics collection | 8h | ⬜ |
| 3.13 | Create scheduled job health check | 4h | ⬜ |
| 3.14 | Document async patterns for contributors | 4h | ⬜ |
| 3.15 | Add async job integration tests | 8h | ⬜ |

---

## Phase 4: Performance Optimization (Release v1.3)

### 4.1 Fix Governor Limit Issues - SOQL in Loops
**Status**: ⬜ Not Started
**Effort**: 12-16 hours | **Risk**: Medium | **Priority**: P1

**Critical Files Identified**:

| File | Line | Issue | Status |
|------|------|-------|--------|
| OPP_OpportunityContactRoles_TDTM.cls | 122 | SOQL inside for loop | ⬜ |
| OPP_OpportunityContactRoles_TDTM.cls | 242 | SOQL in for-each | ⬜ |
| OPP_OpportunityContactRoles_TDTM.cls | 407 | SOQL in for-each | ⬜ |
| RD_RecurringDonations.cls | 215 | Dynamic SOQL in loop | ⬜ |
| GE_LookupController.cls | 67, 116 | Dynamic SOQL in loops | ⬜ |
| BGE_DataImportBatchEntry_CTRL.cls | 239 | Dynamic SOQL in loop | ⬜ |
| PSC_Opportunity_TDTM.cls | 87, 96 | Dynamic SOQL in loops | ⬜ |

**Fix Pattern**: Move queries outside loops, use Maps for lookups

---

### 4.2 Fix Governor Limit Issues - Nested Loops
**Status**: ⬜ Not Started
**Effort**: 8-12 hours | **Risk**: Medium | **Priority**: P1

| File | Lines | Issue | Status |
|------|-------|-------|--------|
| OPP_OpportunityContactRoles_TDTM.cls | 170-212 | 3-level nested loop with string ops | ⬜ |
| OPP_OpportunityContactRoles_TDTM.cls | 836-850 | O(n²) contains check on List | ⬜ |
| BGE_BatchGiftEntry_UTIL.cls | 112-141 | 3-level nested loop with getDescribe() | ⬜ |
| GE_Template.cls | 158-173 | Nested loops with map operations | ⬜ |

**Fix Pattern**:
- Use Set instead of List for contains() operations
- Cache describe results outside loops
- Flatten nested loops where possible

---

### 4.3 Cache Schema Describe Calls
**Status**: ⬜ Not Started
**Effort**: 6-10 hours | **Risk**: Low | **Priority**: P1

**Current State**: Multiple uncached getGlobalDescribe() calls

| File | Lines | Issue | Status |
|------|-------|-------|--------|
| BGE_BatchGiftEntry_UTIL.cls | 135-136 | getDescribe() in triple nested loop | ⬜ |
| BDI_ManageAdvancedMappingCtrl.cls | 457, 724, 739, 798 | Multiple getGlobalDescribe() | ⬜ |
| ADV_PackageInfo_SVC.cls | 82, 87 | describeSObjects() in loop | ⬜ |

**Solution**: Use UTIL_Describe caching pattern consistently

---

### 4.4 Implement Platform Cache
**Status**: ⬜ Not Started
**Effort**: 15-20 hours | **Risk**: Medium | **Priority**: P2

**Current State**: No Platform Cache usage

| Cache Partition | Use Case | TTL | Status |
|-----------------|----------|-----|--------|
| npsp.settings | Custom settings cache | 1 hour | ⬜ |
| npsp.describe | Schema describe cache | 12 hours | ⬜ |
| npsp.metadata | Custom metadata cache | 1 hour | ⬜ |
| npsp.rollups | Rollup config cache | 30 min | ⬜ |

---

### 4.5 Optimize Collection Operations
**Status**: ⬜ Not Started
**Effort**: 6-8 hours | **Risk**: Low | **Priority**: P2

| Pattern | Current | Optimized | Status |
|---------|---------|-----------|--------|
| List.contains() in loops | O(n²) | Use Set | ⬜ |
| String concatenation in loops | Heap growth | Use List.join() | ⬜ |
| Map creation in loops | CPU | Create once outside | ⬜ |

---

### 4.6-4.18 Additional Performance Items
| ID | Item | Effort | Status |
|----|------|--------|--------|
| 4.6 | Add query selectivity analysis | 4h | ⬜ |
| 4.7 | Optimize CRLP rollup queries | 8h | ⬜ |
| 4.8 | Add index hints documentation | 2h | ⬜ |
| 4.9 | Implement lazy loading in LWC | 6h | ⬜ |
| 4.10 | Optimize wire adapter caching | 4h | ⬜ |
| 4.11 | Add CPU time monitoring | 4h | ⬜ |
| 4.12 | Implement query pagination | 8h | ⬜ |
| 4.13 | Optimize trigger recursion checks | 4h | ⬜ |
| 4.14 | Add heap size monitoring | 4h | ⬜ |
| 4.15 | Implement chunked DML | 6h | ⬜ |
| 4.16 | Optimize describe call patterns | 4h | ⬜ |
| 4.17 | Add performance test suite | 12h | ⬜ |
| 4.18 | Document LDV best practices | 4h | ⬜ |

---

## Phase 5: Code Quality (Release v2.0)

### 5.1 Introduce Null-Safe Operators
**Status**: ⬜ Not Started
**Effort**: Ongoing (lint rules: 4h) | **Risk**: Very Low | **Priority**: P2

**Current State**: 1,658 instances of `!= null`, 0 instances of `?.` or `??`

**Strategy**: New code only, gradual migration during maintenance

- [ ] Add PMD rule to prefer null-safe operators
- [ ] Update coding standards documentation
- [ ] Create example patterns guide

---

### 5.2 Standardize Exception Handling
**Status**: ⬜ Not Started
**Effort**: 8-12 hours | **Risk**: Low | **Priority**: P2

**Current State**: 571 instances of `catch(Exception e)`

| Domain | Exception Class | Status |
|--------|-----------------|--------|
| Recurring Donations | RD2_Exception | ⬜ |
| Customizable Rollups | CRLP_Exception | ⬜ |
| Batch Data Import | BDI_Exception | ⬜ |
| Allocations | ALLO_Exception | ⬜ |
| Gift Entry | GE_Exception | ⬜ |

---

### 5.3 Add ApexDoc Documentation
**Status**: ⬜ Not Started
**Effort**: 20-30 hours | **Risk**: Very Low | **Priority**: P2

**Priority Classes Needing Documentation**:

| Priority | Class Type | Count | Status |
|----------|------------|-------|--------|
| Critical | API Classes (*_API) | 15 | ⬜ |
| Critical | Service Classes (*_SVC, *Service) | 40 | ⬜ |
| High | Controller Classes (*_CTRL) | 50 | ⬜ |
| High | TDTM Handlers (*_TDTM) | 49 | ⬜ |
| Medium | Selector Classes (*_SEL, *Selector) | 20 | ⬜ |
| Medium | Batch Classes (*_BATCH) | 45 | ⬜ |

---

### 5.4 Add JSDoc to LWC Components
**Status**: ⬜ Not Started
**Effort**: 10-15 hours | **Risk**: Very Low | **Priority**: P3

**Priority Components**:

| Component | Priority | Status |
|-----------|----------|--------|
| geFormRenderer | High | ⬜ |
| rd2EntryForm | High | ⬜ |
| geTemplateBuilder | High | ⬜ |
| bdiObjectMappingModal | Medium | ⬜ |
| All others (~120) | Low | ⬜ |

---

### 5.5-5.14 Additional Code Quality Items
| ID | Item | Effort | Status |
|----|------|--------|--------|
| 5.5 | Remove dead code | 8h | ⬜ |
| 5.6 | Consolidate duplicate code | 12h | ⬜ |
| 5.7 | Add method complexity limits | 4h | ⬜ |
| 5.8 | Standardize naming conventions | 6h | ⬜ |
| 5.9 | Add code review checklist | 2h | ⬜ |
| 5.10 | Create architectural decision records | 8h | ⬜ |
| 5.11 | Add integration test framework | 12h | ⬜ |
| 5.12 | Improve test assertion messages | 6h | ⬜ |
| 5.13 | Add negative test cases | 12h | ⬜ |
| 5.14 | Create code quality dashboard | 8h | ⬜ |

---

## Phase 6: UI Modernization (Release v2.1-v2.2)

### 6.1 Aura to LWC Migration - Tier 1 (Simple)
**Status**: ⬜ Not Started
**Effort**: 20-30 hours | **Risk**: Low | **Priority**: P2

| Component | Complexity | Status |
|-----------|------------|--------|
| svg.cmp | Very Low | ⬜ |
| notificationRedirecter.cmp | Very Low | ⬜ |
| modalHeader.cmp | Low | ⬜ |
| modalFooter.cmp | Low | ⬜ |
| HH_ContactCard.cmp | Low | ⬜ |
| autocompleteOption.cmp | Low | ⬜ |
| HH_AutoCompleteOption.cmp | Low | ⬜ |
| progressMarker.cmp | Low | ⬜ |
| pageNotification.cmp | Low | ⬜ |
| CRLP_Tooltip.cmp | Low | ⬜ |

---

### 6.2 Aura to LWC Migration - Tier 2 (Medium)
**Status**: ⬜ Not Started
**Effort**: 40-60 hours | **Risk**: Medium | **Priority**: P3

| Component | Complexity | Status |
|-----------|------------|--------|
| HH_AutoComplete.cmp | Medium | ⬜ |
| autocomplete.cmp | Medium | ⬜ |
| RD2_EnablementDelegate.cmp | Medium | ⬜ |
| RD2_EnablementDelegateSimple.cmp | Medium | ⬜ |
| CRLP_FilterGroup.cmp | Medium | ⬜ |
| CRLP_SelectField.cmp | Medium | ⬜ |
| ERR_RecordLog.cmp | Medium | ⬜ |
| HH_AutoCompleteDataProvider.cmp | Medium | ⬜ |
| RD2_PauseForm.cmp | Medium | ⬜ |

---

### 6.3 Aura to LWC Migration - Tier 3 (Complex)
**Status**: ⬜ Not Started
**Effort**: 80-120 hours | **Risk**: High | **Priority**: P4 (Deferred)

| Component | Complexity | Dependencies | Status |
|-----------|------------|--------------|--------|
| GE_GiftEntry.cmp | Very High | Multiple | ⬜ |
| GE_GiftEntryForm.cmp | Very High | Multiple | ⬜ |
| GE_TemplateBuilder.cmp | Very High | Multiple | ⬜ |
| HH_AddressMgr.cmp | High | Maps, APIs | ⬜ |
| HH_Container.cmp | High | Multiple | ⬜ |
| HH_Canvas.cmp | High | D3/Canvas | ⬜ |
| RD2_EntryForm.cmp | High | Elevate | ⬜ |
| BGE_DonationSelector.cmp | High | Multiple | ⬜ |
| BGE_DataImportBatchEntry.cmp | High | Multiple | ⬜ |
| BGE_ConfigurationWizard.cmp | High | Multiple | ⬜ |
| BGE_EntryForm.cmp | High | Multiple | ⬜ |
| BGE_BatchGiftEntryTab.cmp | High | Multiple | ⬜ |
| BDI_ManageAdvancedMapping.cmp | High | Metadata | ⬜ |
| CRLP_Rollup.cmp | Medium-High | Multiple | ⬜ |
| CRLP_RollupsContainer.cmp | Medium-High | Multiple | ⬜ |
| REL_RelationshipsContainer.cmp | Medium-High | Tree | ⬜ |

---

### 6.4 Visualforce Migration - Priority Pages
**Status**: ⬜ Not Started
**Effort**: 60-100 hours | **Risk**: Medium-High | **Priority**: P4 (Deferred)

**Current State**: 79 Visualforce pages

| Priority | Page | Replacement | Status |
|----------|------|-------------|--------|
| High | HH_ManageHH.page | LWC | ⬜ |
| High | REL_RelationshipsViewer.page | LWC | ⬜ |
| High | CON_ContactMerge.page | LWC | ⬜ |
| Medium | ALLO_ManageAllocations.page | LWC | ⬜ |
| Medium | PSC_ManageSoftCredits.page | LWC | ⬜ |
| Medium | PMT_PaymentWizard.page | LWC | ⬜ |
| Low | STG_Panel*.page (30+) | LWC Settings App | ⬜ |
| Low | Button pages (*BTN.page) | Quick Actions | ⬜ |

---

### 6.5-6.35 Additional UI Items
| ID | Item | Effort | Status |
|----|------|--------|--------|
| 6.5-6.15 | LWC component refactoring | 40h | ⬜ |
| 6.16-6.25 | Add loading states to all components | 20h | ⬜ |
| 6.26-6.35 | Implement consistent error handling UI | 30h | ⬜ |

---

## Phase 7: Configuration Modernization (Release v2.2)

### 7.1 Custom Settings to Custom Metadata Migration
**Status**: ⬜ Not Started
**Effort**: 40-60 hours | **Risk**: Medium | **Priority**: P2

**Current State**: 14 Custom Settings objects

| Custom Setting | Type | Migration Candidate | Status |
|----------------|------|---------------------|--------|
| Allocations_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Address_Verification_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Addr_Verification_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Batch_Data_Entry_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Customizable_Rollup_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Data_Import_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Error_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Gift_Entry_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Household_Naming_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Levels_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Package_Settings__c | Hierarchy | Yes - CMT | ⬜ |
| Custom_Column_Header__c | List | Yes - CMT | ⬜ |
| Opportunity_Naming_Settings__c | List | Yes - CMT | ⬜ |
| Relationship_Sync_Excluded_Fields__c | List | Yes - CMT | ⬜ |

**Benefits of CMT**:
- Deployable via metadata API
- No SOQL limits
- Version controllable
- Better for ISV packaging

---

### 7.2 Optimize UTIL_CustomSettingsFacade
**Status**: ⬜ Not Started
**Effort**: 8-12 hours | **Risk**: Low | **Priority**: P2

- [ ] Add Platform Cache layer
- [ ] Implement lazy loading
- [ ] Add cache invalidation hooks
- [ ] Document caching strategy

---

### 7.3-7.14 Additional Configuration Items
| ID | Item | Effort | Status |
|----|------|--------|--------|
| 7.3 | Migrate Trigger_Handler__c to CMT | 8h | ⬜ |
| 7.4 | Add configuration validation | 6h | ⬜ |
| 7.5 | Create settings migration utility | 12h | ⬜ |
| 7.6 | Add settings export/import | 8h | ⬜ |
| 7.7 | Document all settings | 8h | ⬜ |
| 7.8 | Add settings change tracking | 6h | ⬜ |
| 7.9 | Create settings health check | 4h | ⬜ |
| 7.10 | Add default settings validation | 4h | ⬜ |
| 7.11 | Implement settings versioning | 6h | ⬜ |
| 7.12 | Add settings backup/restore | 6h | ⬜ |
| 7.13 | Create settings comparison tool | 4h | ⬜ |
| 7.14 | Add settings audit logging | 4h | ⬜ |

---

## Phase 8: Accessibility (Release v2.2)

### 8.1 Add Missing ARIA Attributes
**Status**: ⬜ Not Started
**Effort**: 15-20 hours | **Risk**: Very Low | **Priority**: P2

**Current State**: 85 ARIA attributes across 33 LWC components (good start, needs expansion)

| Component Category | Components | ARIA Coverage | Status |
|--------------------|------------|---------------|--------|
| Form components | 25 | Partial | ⬜ |
| Modal components | 8 | Partial | ⬜ |
| Navigation components | 10 | Low | ⬜ |
| Data display components | 15 | Low | ⬜ |
| Other components | ~65 | Varies | ⬜ |

---

### 8.2 Implement Keyboard Navigation
**Status**: ⬜ Not Started
**Effort**: 12-16 hours | **Risk**: Low | **Priority**: P2

| Component | Keyboard Support | Status |
|-----------|------------------|--------|
| Modal dialogs | Focus trapping | ⬜ |
| Dropdown menus | Arrow key nav | ⬜ |
| Data tables | Row navigation | ⬜ |
| Tree views | Expand/collapse | ⬜ |
| Form wizards | Tab order | ⬜ |

---

### 8.3-8.10 Additional Accessibility Items
| ID | Item | Effort | Status |
|----|------|--------|--------|
| 8.3 | Add screen reader announcements | 8h | ⬜ |
| 8.4 | Fix color contrast issues | 6h | ⬜ |
| 8.5 | Add focus indicators | 4h | ⬜ |
| 8.6 | Implement skip links | 2h | ⬜ |
| 8.7 | Add form error announcements | 4h | ⬜ |
| 8.8 | Create a11y test suite | 8h | ⬜ |
| 8.9 | Document a11y patterns | 4h | ⬜ |
| 8.10 | Add WCAG 2.1 AA compliance | 12h | ⬜ |

---

## Phase 9: Integration Modernization (Release v2.3)

### 9.1 Implement Named Credentials
**Status**: ⬜ Not Started
**Effort**: 12-16 hours | **Risk**: Medium | **Priority**: P2

**Current State**: 47 files with HTTP callouts, 0 use Named Credentials

| Integration | Current | Target | Status |
|-------------|---------|--------|--------|
| Elevate Payment Services | Hardcoded endpoints | Named Credential | ⬜ |
| Address Validation (SmartyStreets) | Hardcoded | Named Credential | ⬜ |
| Address Validation (Cicero) | Hardcoded | Named Credential | ⬜ |
| Address Validation (Google) | Hardcoded | Named Credential | ⬜ |
| YouTube API (Resources) | Hardcoded | Named Credential | ⬜ |

---

### 9.2 Implement External Services
**Status**: ⬜ Not Started
**Effort**: 8-12 hours | **Risk**: Medium | **Priority**: P3

| Service | OpenAPI Spec | Status |
|---------|--------------|--------|
| Elevate Payment API | Create spec | ⬜ |
| Address Validation | Create spec | ⬜ |

---

### 9.3-9.8 Additional Integration Items
| ID | Item | Effort | Status |
|----|------|--------|--------|
| 9.3 | Add callout retry logic | 6h | ⬜ |
| 9.4 | Implement circuit breaker pattern | 8h | ⬜ |
| 9.5 | Add callout monitoring | 4h | ⬜ |
| 9.6 | Create integration test mocks | 8h | ⬜ |
| 9.7 | Document integration patterns | 4h | ⬜ |
| 9.8 | Add API versioning support | 6h | ⬜ |

---

## Phase 10: Long-term Items (Post v2.3)

### 10.1-10.20 Future Modernization
| ID | Item | Effort | Priority | Status |
|----|------|--------|----------|--------|
| 10.1 | Full VF to LWC migration | 100h+ | P4 | ⬜ |
| 10.2 | Implement Flow-based automation | 40h | P3 | ⬜ |
| 10.3 | Add CRM Analytics dashboards | 30h | P4 | ⬜ |
| 10.4 | Implement Einstein features | 40h | P4 | ⬜ |
| 10.5 | Add mobile optimization | 30h | P3 | ⬜ |
| 10.6 | Implement Experience Cloud components | 50h | P4 | ⬜ |
| 10.7 | Add multi-language support improvements | 20h | P3 | ⬜ |
| 10.8 | Implement event-driven architecture | 40h | P3 | ⬜ |
| 10.9 | Add comprehensive logging framework | 20h | P2 | ⬜ |
| 10.10 | Create admin configuration app | 60h | P3 | ⬜ |
| 10.11 | Implement feature flags system | 20h | P3 | ⬜ |
| 10.12 | Add A/B testing capability | 30h | P4 | ⬜ |
| 10.13 | Create developer sandbox toolkit | 20h | P3 | ⬜ |
| 10.14 | Implement GraphQL API layer | 40h | P4 | ⬜ |
| 10.15 | Add real-time sync capabilities | 30h | P4 | ⬜ |
| 10.16 | Implement offline support | 40h | P4 | ⬜ |
| 10.17 | Add progressive web app features | 30h | P4 | ⬜ |
| 10.18 | Create component library package | 40h | P3 | ⬜ |
| 10.19 | Implement microservices patterns | 60h | P4 | ⬜ |
| 10.20 | Full security audit and hardening | 40h | P2 | ⬜ |

---

## Appendix A: File Reference

### Critical Files Requiring Attention

| File | Issues | Priority |
|------|--------|----------|
| OPP_OpportunityContactRoles_TDTM.cls | 12 governor issues | P0 |
| BGE_BatchGiftEntry_UTIL.cls | 3 governor issues | P1 |
| BDI_ManageAdvancedMappingCtrl.cls | 4 describe call issues | P1 |
| RD_RecurringDonations.cls | 4 @future methods, SOQL issues | P1 |
| UTIL_CustomSettingsFacade.cls | Caching optimization needed | P2 |

---

## Appendix B: Testing Requirements

All changes must:
1. Pass existing test suite (85%+ coverage maintained)
2. Include new tests for changed behavior
3. Be tested in scratch org before PR
4. Include bulk testing (200+ records) for triggers/batch
5. Include negative test cases for error handling

---

## Appendix C: Rollback Strategy

Each release should include:
1. Deployment scripts with rollback capability
2. Data backup procedures
3. Feature flags for gradual rollout
4. Monitoring for regression detection
5. Communication plan for issues

---

## Appendix D: Progress Tracking

### Burndown Chart Data

| Date | Total | Completed | Remaining | Velocity |
|------|-------|-----------|-----------|----------|
| 2026-02-03 | 154 | 0 | 154 | - |
| | | | | |

### Sprint Velocity History

| Sprint | Planned | Completed | Notes |
|--------|---------|-----------|-------|
| | | | |

---

*Document maintained by NPSP_nextgen community. Last updated: 2026-02-03*
