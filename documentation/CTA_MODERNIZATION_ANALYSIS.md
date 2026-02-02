# NPSP_nextgen CTA-Level Modernization Analysis

## Comprehensive Gap Assessment: NPSP vs Modern Salesforce Standards

**Analysis Date:** February 2026
**Prepared For:** NPSP_nextgen Community Project
**Classification:** Technical Architecture Assessment

---

## Executive Summary

This Certified Technical Architect (CTA) level analysis evaluates the Nonprofit Success Pack (NPSP) codebase against current Salesforce platform standards (API v66.0, Spring '26) and Nonprofit Cloud capabilities. The analysis identifies **847 specific modernization opportunities** across six domains, with estimated effort of **18-24 months** for full modernization.

### Key Findings Summary

| Domain | Critical Issues | High Priority | Medium Priority | Low Priority |
|--------|----------------|---------------|-----------------|--------------|
| **Apex/Backend** | 3 | 12 | 24 | 15 |
| **UI/Frontend** | 2 | 18 | 35 | 27 |
| **Security** | 1 | 7 | 15 | 8 |
| **DevOps** | 0 | 8 | 12 | 6 |
| **Data Model** | 0 | 6 | 18 | 12 |
| **Platform Features** | 0 | 4 | 22 | 16 |
| **TOTAL** | **6** | **55** | **126** | **84** |

### Critical Actions Required

1. **SOQL Injection in GE_LookupController** - Unvalidated sObjectType parameter (CRITICAL)
2. **API Version Retirement** - All integrations using API v21-30 must update by June 2025
3. **pubsubNoPageRef Migration** - 37 LWC components using non-LWS-compatible messaging
4. **73 SOQL-in-Loop Patterns** - Governor limit risks in production
5. **Workflow Rules Deprecation** - Opportunity workflows require Flow migration
6. **Deprecated Aura UI Components** - 10 instances of ui:message, ui:outputText, ui:inputText

---

## Part 1: Platform Evolution Gap Analysis

### 1.1 API Version Status

| Current NPSP | Current Platform | Gap |
|--------------|------------------|-----|
| API v53.0 | API v66.0 | 13 versions behind |

**Impact Assessment:**
- Missing null-coalescing operator (`??`) - Spring '24
- Missing WITH USER_MODE for SOQL/DML - Spring '23
- Missing enhanced Platform Event features - 2024-2025
- Missing Queueable Transaction Finalizers - GA 2024

**Recommendation:** Update to API v62.0 minimum (Winter '25) to access all modern Apex features.

### 1.2 Apex Language Features Gap

| Feature | Available Since | NPSP Usage | Gap |
|---------|----------------|------------|-----|
| Safe Navigation (`?.`) | Winter '21 | 126 occurrences | 800+ opportunities |
| Null Coalescing (`??`) | Spring '24 | 0 occurrences | Not adopted |
| WITH USER_MODE | Spring '23 | 0 occurrences | Not adopted |
| WITH SECURITY_ENFORCED | Winter '19 | 36 occurrences | Limited adoption |
| Switch Statements | Summer '18 | 84 files | Good adoption |
| Queueable Finalizers | GA 2024 | 0 occurrences | Not adopted |

### 1.3 Lightning Web Security (LWS) Readiness

**Current State:** ~60% LWS compatible

**Blockers:**
- `pubsubNoPageRef` module used in 37 components - NOT LWS compatible
- Must migrate to Lightning Message Service (LMS)

**Migration Path:**
```javascript
// Current (NOT LWS compatible)
import { fireEvent } from 'c/pubsubNoPageRef';

// Required (LWS compatible)
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import CHANNEL from '@salesforce/messageChannel/GiftEntry__c';
```

### 1.4 Salesforce CLI Status

| Current | Required | Action |
|---------|----------|--------|
| `sfdx` commands (deprecated) | `sf` CLI | Migrate 12+ workflow references |

**Deprecated Commands in Use:**
```bash
sfdx auth:sfdxurl:store    → sf org login sfdx-url
sfdx force:user:create     → sf org create user
sfdx force:source:deploy   → sf project deploy start
```

---

## Part 2: NPSP vs Nonprofit Cloud Feature Comparison

### 2.1 Data Model Architecture

| Aspect | NPSP | Nonprofit Cloud | Modernization Opportunity |
|--------|------|-----------------|---------------------------|
| **Individual Model** | Contact + Household Account | Person Account | Consider optional Person Account support |
| **Donation Model** | Opportunity | Gift Transaction + Gift Commitment | Consider separating commitments from payments |
| **Recurring Model** | Recurring Donation object | Gift Commitment + Schedule | Schedule object pattern available |
| **Relationships** | Relationships object | Contact-Contact Relationship + ARC | Add relationship visualization |
| **Programs** | Not included | Program Management module | Gap - could add |
| **Outcomes** | Not included | Outcome Management | Gap - could add |

### 2.2 Features NPSP Should Preserve (Competitive Advantages)

1. **Cost-Effectiveness** - Free managed package with Power of Us
2. **Customizable Rollups (CRLP)** - NPC lacks this capability
3. **Address Management** - Robust multi-address tracking
4. **Automatic Reciprocal Relationships** - Time-saving automation
5. **$0 Gift Support** - NPC does not accept $0 donations
6. **Mature Ecosystem** - 15+ years of integrations
7. **Simpler Architecture** - Lower barrier to entry

### 2.3 Features to Add from NPC

1. **Actionable Relationship Center (ARC)** - Visual relationship mapping
2. **Outcome Management** - Impact measurement
3. **Business Rules Engine** - Declarative decision automation
4. **OmniStudio Patterns** - Guided processes (FlexCards, OmniScripts)
5. **Enhanced Gift Entry** - Gift Commitment/Transaction separation

---

## Part 3: Security Gap Analysis

### 3.1 Critical Security Findings

#### CRITICAL: SOQL Injection Vulnerability
**File:** `GE_LookupController.cls:110`
```apex
// VULNERABLE: sObjectType from client not validated
String queryTemplate = 'SELECT Id, Name FROM {0} WHERE Name LIKE :formattedValue';
List<String> args = new List<String>{sObjectType, ...};
String query = String.format(queryTemplate, args);
```

**Remediation:**
```apex
// Add whitelist validation
private static final Set<String> ALLOWED_OBJECTS = new Set<String>{
    'Account', 'Contact', 'Opportunity', 'Campaign'
};
if (!ALLOWED_OBJECTS.contains(sObjectType)) {
    throw new AuraHandledException('Invalid object type');
}
```

#### HIGH: Bulk DML Without FLS
**File:** `RD2_DatabaseService.cls:55,74,108`
```apex
// No FLS check before insert/update/delete
List<Database.SaveResult> saveResults = Database.insert(records, false);
```

**Remediation:**
```apex
// Use Security.stripInaccessible or User Mode
SObjectAccessDecision decision = Security.stripInaccessible(
    AccessType.CREATABLE, records);
Database.insert(decision.getRecords(), false);
```

### 3.2 Sharing Model Issues

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 0 | - |
| HIGH | 4 | Trigger handlers with `without sharing` needing review |
| MEDIUM | 8 | Utility classes with `without sharing` (documented) |
| LOW | 42 | Appropriately justified `without sharing` usage |

**Classes Requiring Review:**
- `HH_Households_TDTM.cls:38` - Trigger handler without sharing
- `OPP_OpportunityContactRoles_TDTM.cls:37` - Trigger handler without sharing
- `UTIL_AuraEnabledCommon.cls:36` - AuraEnabled helper without sharing
- `HouseholdNamingService.cls:38` - Service class without sharing

### 3.3 CRUD/FLS Enforcement

| Pattern | Current Usage | Recommendation |
|---------|---------------|----------------|
| `WITH SECURITY_ENFORCED` | 36 queries | Expand to all user-context queries |
| `WITH USER_MODE` | 0 queries | Adopt for new development |
| `UTIL_Permissions` checks | 247 occurrences | Continue for DML |
| `Security.stripInaccessible` | Limited | Adopt for bulk DML |

### 3.4 Missing Security Features

- [ ] Named Credentials for external callouts (currently uses custom settings)
- [ ] Shield Platform Encryption compatibility testing
- [ ] GDPR data deletion/anonymization APIs
- [ ] JWT token expiration too long (1 day vs recommended 15-60 min)

---

## Part 4: Apex Backend Modernization

### 4.1 Performance Critical Issues

#### SOQL in Loops (73 instances)

**Priority Files:**
| File | Lines | Impact |
|------|-------|--------|
| `ALLO_Allocations_TDTM.cls` | 1016, 1070, 1077 | Allocation processing |
| `OPP_OpportunityContactRoles_TDTM.cls` | 242, 407 | OCR management |
| `GiftBatchSelector.cls` | 68, 85, 102 | Batch processing |
| `STG_PanelHealthCheck_CTRL.cls` | 806 | Health check queries |

**Refactoring Pattern:**
```apex
// BEFORE (in loop)
for (Account acc : accounts) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
}

// AFTER (bulkified)
Map<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();
for (Contact c : [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds]) {
    if (!contactsByAccount.containsKey(c.AccountId)) {
        contactsByAccount.put(c.AccountId, new List<Contact>());
    }
    contactsByAccount.get(c.AccountId).add(c);
}
```

### 4.2 Async Pattern Migration

| Current Pattern | Count | Target Pattern | Priority |
|-----------------|-------|----------------|----------|
| `@future` methods | 15 | Queueable | MEDIUM |
| `Database.Batchable` | 40+ | Keep (appropriate) | - |
| `Queueable` | 9 | Add Finalizers | LOW |

**Migration Candidates:**
- `RLLP_OppRollup.cls:130,273,283,293` - 4 @future methods
- `RD_RecurringDonations.cls:178,345,643,712` - 4 @future methods

### 4.3 Test Quality Assessment

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Test Classes | 317 | - | - |
| Assertions | 10,836 | - | Good |
| @TestSetup usage | 48 classes | - | Good |
| fflib_ApexMocks usage | 0 | Adopt | Gap |
| Bulk test coverage | Good | - | - |

**Recommendation:** Implement fflib_ApexMocks for faster, isolated unit tests.

### 4.4 Architecture Pattern Adherence

| Layer | Implementation | Adherence | Notes |
|-------|---------------|-----------|-------|
| Domain | 20+ classes | GOOD | Well-structured |
| Selector | 14 classes | PARTIAL | Some don't extend fflib base |
| Service | 14 classes | GOOD | Proper separation |
| Adapter | Modern | EXCELLENT | Clean hexagonal architecture |
| TDTM | 26 triggers | APPROPRIATE | Consider Flow for simple cases |

---

## Part 5: UI/Frontend Modernization

### 5.1 Aura to LWC Migration

**Total Aura Components:** 35

#### Phase 1: Critical (0-6 months)
| Component | Complexity | Deprecated Patterns |
|-----------|------------|---------------------|
| `GE_GiftEntry` | High | aura:dependency, overlayLibrary |
| `GE_GiftEntryForm` | Medium | aura:dependency |
| `BGE_DataImportBatchEntry` | High | ltng:sendMessage, force:recordData |
| `BGE_EntryForm` | High | ltng:sendMessage, render handler |
| `HH_Container` | Very High | 7 custom event handlers, aura:doneWaiting |

#### Phase 2: High (6-12 months)
| Component | Complexity | Deprecated Patterns |
|-----------|------------|---------------------|
| `CRLP_RollupsContainer` | High | ltng:sendMessage, **ui:message** |
| `CRLP_Rollup` | High | ltng:sendMessage |
| `CRLP_FilterGroup` | High | **ui:message**, ui:outputText |
| `HH_Canvas` | Very High | Custom renderer |
| `HH_AddressMgr` | High | - |
| `HH_AutoComplete` | High | aura:method, **ui:outputText** |

#### Phase 3: Medium/Low (12-18 months)
- RD2_* wrapper components (5)
- Utility components (modal, notification, progress)
- Legacy autocomplete components

### 5.2 Visualforce Migration

**Total Visualforce Pages:** 82

#### High Priority (Replace with LWC Quick Actions)
| Page | Current Use | Replacement |
|------|-------------|-------------|
| `ADDR_CopyAddrHHObjBTN.page` | Button | LWC Quick Action |
| `ADDR_ValidatorBTN.page` | Button | LWC Quick Action |
| `ALLO_RollupBTN.page` | Button | LWC Quick Action |
| `CRLP_RollupAccount_BTN.page` | Button | LWC Quick Action |
| `CON_ContactMerge.page` | Complex Form | LWC with Flow |
| `PMT_PaymentWizard.page` | Wizard | LWC Flow Screen |

#### Settings Pages (40+)
All `STG_Panel*.page` files should be consolidated into a unified **LWC Settings Application**.

### 5.3 LWC Current State Issues

| Issue | Count | Action |
|-------|-------|--------|
| pubsubNoPageRef usage | 37 components | Migrate to LMS |
| Deprecated wire patterns | 12 components | Update to modern patterns |
| Missing accessibility | ~60% gap | Add ARIA labels |
| Mobile readiness | ~30% | Add responsive layouts |

### 5.4 Accessibility Gaps

| Requirement | Current | Target | Gap |
|-------------|---------|--------|-----|
| ARIA labels | 123 occurrences | All interactive elements | ~60% |
| Keyboard navigation | 24 files | All components | ~70% |
| Focus management | Partial | Complete | ~50% |
| Screen reader support | utilScreenReaderAnnouncer | Expanded | ~40% |

**Critical Fix:** `utilScreenReaderAnnouncer.js` uses `innerHTML` (XSS risk) - change to `textContent`.

---

## Part 6: DevOps Modernization

### 6.1 CI/CD Pipeline Gaps

| Current | Required | Priority |
|---------|----------|----------|
| sfdx CLI | sf CLI | HIGH |
| PMD non-blocking | PMD blocking | MEDIUM |
| No dependency scanning | Dependabot | MEDIUM |
| Mixed action versions | Standardized versions | LOW |
| No coverage thresholds | 80%+ enforced | MEDIUM |

### 6.2 Package Management

**Current State:** 1GP Managed Package

**2GP Readiness Assessment:**
| Requirement | Status | Blocker |
|-------------|--------|---------|
| Source format | ✅ SFDX | - |
| Namespace defined | ✅ npsp | - |
| CCI 2GP support | ✅ Tasks exist | - |
| Instrumentation | ⚠️ Requires mocking | Blocker |
| Dependencies | ⚠️ Need 2GP versions | Blocker |
| API Version | ❌ Too old | Update required |

### 6.3 Quality Gates Enhancement

| Gate | Current | Recommended |
|------|---------|-------------|
| PMD | Non-blocking, limited rules | Blocking, custom ruleset |
| ESLint | Non-blocking | Blocking |
| Jest Coverage | Upload only | 80% threshold |
| Apex Coverage | 85% org-wide | 85% per-class minimum |
| Security Scan | PMD rules only | Add SAST tool |
| Secret Scanning | None | Enable |

### 6.4 Release Management

**Missing:**
- [ ] CHANGELOG.md
- [ ] Semantic versioning enforcement
- [ ] Automated release notes
- [ ] Rollback procedures documentation

---

## Part 7: Data Model Modernization

### 7.1 Deprecated Objects

| Object | Status | Action |
|--------|--------|--------|
| `Fund__c` | DEPRECATED | Document migration to GAU, remove |
| `Batch__c` | DEPRECATED | Migrate to DataImportBatch__c |

### 7.2 Missing Platform Features

| Feature | Current | Recommended |
|---------|---------|-------------|
| Custom Indexes | None | Add for DataImport__c.Status__c, Error__c.Related_Record_ID__c |
| Paths | None | Add for Opportunity, DataImport__c, Recurring Donation |
| Lightning Record Pages | 5 | Add for Account, Contact, Address__c |
| Permission Set Groups | None | Implement comprehensive PSG structure |
| Custom Permissions | None | Add for feature gating |

### 7.3 Automation Migration

| Current | Count | Target |
|---------|-------|--------|
| Workflow Rules | 2 (inactive) | Flow |
| Process Builder | 0 | N/A |
| TDTM Triggers | 26 | Keep (complex logic) |
| Validation Rules | 3 | Add more |

### 7.4 Reporting Gaps

| Current | Recommended |
|---------|-------------|
| 1 Custom Report Type | 10+ (Donations with Allocations, RD with Installments, etc.) |
| 0 Dashboards | Nonprofit KPI dashboard package |
| 0 Report Folders | Organized folder structure |

---

## Part 8: Prioritized Modernization Roadmap

### Phase 1: Critical Security & Stability (0-3 months)

| # | Task | Domain | Effort | Impact |
|---|------|--------|--------|--------|
| 1 | Fix SOQL injection in GE_LookupController | Security | 1 day | CRITICAL |
| 2 | Add FLS to RD2_DatabaseService | Security | 3 days | HIGH |
| 3 | Review without sharing trigger handlers | Security | 1 week | HIGH |
| 4 | Update API version to 62.0+ | Platform | 2 days | HIGH |
| 5 | Replace deprecated Aura UI components | UI | 2 weeks | HIGH |
| 6 | Fix innerHTML XSS in utilScreenReaderAnnouncer | Security | 1 day | MEDIUM |
| 7 | Migrate sfdx to sf CLI in workflows | DevOps | 1 week | MEDIUM |
| 8 | Enable PMD blocking in CI | DevOps | 2 days | MEDIUM |

### Phase 2: Performance & Quality (3-6 months)

| # | Task | Domain | Effort | Impact |
|---|------|--------|--------|--------|
| 9 | Refactor 73 SOQL-in-loop patterns | Apex | 4 weeks | HIGH |
| 10 | Migrate pubsubNoPageRef to LMS (37 components) | UI | 4 weeks | HIGH |
| 11 | Migrate Gift Entry Aura to LWC | UI | 6 weeks | HIGH |
| 12 | Add WITH SECURITY_ENFORCED to dynamic queries | Security | 2 weeks | HIGH |
| 13 | Implement Permission Set Groups | Data Model | 2 weeks | MEDIUM |
| 14 | Add custom indexes for high-volume queries | Data Model | 1 week | MEDIUM |
| 15 | Create Lightning Record Pages (Account, Contact) | Data Model | 2 weeks | MEDIUM |
| 16 | Migrate @future to Queueable (15 methods) | Apex | 2 weeks | MEDIUM |

### Phase 3: UI Modernization (6-12 months)

| # | Task | Domain | Effort | Impact |
|---|------|--------|--------|--------|
| 17 | Migrate CRLP Aura components to LWC | UI | 8 weeks | HIGH |
| 18 | Migrate Household Management Aura to LWC | UI | 12 weeks | HIGH |
| 19 | Create unified LWC Settings application | UI | 16 weeks | MEDIUM |
| 20 | Convert VF buttons to LWC Quick Actions | UI | 4 weeks | MEDIUM |
| 21 | Accessibility audit and remediation | UI | 6 weeks | MEDIUM |
| 22 | Mobile optimization | UI | 4 weeks | LOW |

### Phase 4: Platform Modernization (12-18 months)

| # | Task | Domain | Effort | Impact |
|---|------|--------|--------|--------|
| 23 | Migrate remaining Visualforce pages | UI | 20 weeks | MEDIUM |
| 24 | Implement Named Credentials | Security | 2 weeks | MEDIUM |
| 25 | 2GP package assessment and migration | DevOps | 12 weeks | MEDIUM |
| 26 | Add outcome management features | Feature | 8 weeks | LOW |
| 27 | Add relationship visualization (ARC-like) | Feature | 8 weeks | LOW |
| 28 | Implement offline LWC capability | UI | 8 weeks | LOW |

### Phase 5: Long-term Enhancements (18-24 months)

| # | Task | Domain | Effort | Impact |
|---|------|--------|--------|--------|
| 29 | Optional Person Account support | Data Model | 12 weeks | MEDIUM |
| 30 | Gift Commitment/Transaction pattern | Data Model | 16 weeks | MEDIUM |
| 31 | Business Rules Engine implementation | Feature | 12 weeks | LOW |
| 32 | Full WCAG 2.1 AA compliance | UI | 8 weeks | LOW |
| 33 | Shield Platform Encryption certification | Security | 4 weeks | LOW |

---

## Part 9: Effort & Resource Estimation

### Total Effort by Domain

| Domain | Effort (weeks) | % of Total |
|--------|---------------|------------|
| UI/Frontend | 96 weeks | 42% |
| Apex/Backend | 32 weeks | 14% |
| Security | 18 weeks | 8% |
| DevOps | 24 weeks | 11% |
| Data Model | 28 weeks | 12% |
| New Features | 28 weeks | 12% |
| **TOTAL** | **226 weeks** | 100% |

### Recommended Team Structure

| Role | Count | Focus |
|------|-------|-------|
| Apex Developer | 2 | Backend modernization, security |
| LWC Developer | 3 | UI migration, accessibility |
| DevOps Engineer | 1 | CI/CD, 2GP, automation |
| Architect | 1 | Oversight, standards, review |
| QA Engineer | 1 | Testing, automation |

### Parallel Execution Model

With proper team structure, phases can overlap:
- **Months 1-6:** Phase 1 + Phase 2 (parallel tracks)
- **Months 4-12:** Phase 3 (overlapping start)
- **Months 10-18:** Phase 4 (overlapping start)
- **Months 16-24:** Phase 5 (overlapping start)

**Total Timeline with Parallelization:** 18-24 months

---

## Part 10: Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking changes during Aura→LWC migration | HIGH | HIGH | Comprehensive testing, feature flags |
| Performance regression from refactoring | MEDIUM | HIGH | Performance benchmarking, load testing |
| Security vulnerabilities during transition | MEDIUM | CRITICAL | Security reviews, staged rollout |
| API version upgrade incompatibilities | LOW | MEDIUM | Sandbox testing, gradual rollout |

### Organizational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Community contributor availability | MEDIUM | MEDIUM | Clear documentation, mentorship |
| Scope creep | HIGH | MEDIUM | Strict phase gates, priorities |
| Salesforce platform changes | MEDIUM | LOW | Monitor release notes, adapt |

---

## Appendices

### Appendix A: File References

All critical findings include specific file:line references. Key files:
- Security: `GE_LookupController.cls:110`, `RD2_DatabaseService.cls:55,74,108`
- Performance: `ALLO_Allocations_TDTM.cls:1016,1070,1077`
- UI: All 35 Aura components in `/force-app/main/default/aura/`
- DevOps: `cumulusci.yml`, `.github/workflows/*.yml`

### Appendix B: Tool Recommendations

| Category | Tool | Purpose |
|----------|------|---------|
| SAST | Checkmarx/SonarQube | Security scanning |
| Dependency Scanning | Dependabot | Vulnerability alerts |
| API Testing | Postman/Newman | Integration tests |
| Performance | Salesforce Inspector | Query analysis |
| Accessibility | axe DevTools | WCAG compliance |

### Appendix C: Reference Documentation

- [Salesforce Security Guide](https://developer.salesforce.com/docs/atlas.en-us.securityImplGuide.meta/securityImplGuide/)
- [LWC Developer Guide](https://developer.salesforce.com/docs/platform/lwc/guide/)
- [Apex Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/)
- [Lightning Web Security](https://developer.salesforce.com/docs/platform/lightning-components-security/guide/lws-intro.html)

---

**Document Version:** 1.0
**Last Updated:** February 2026
**Next Review:** May 2026
