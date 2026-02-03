# Security Architecture Plan

## Executive Summary

This document defines the security modernization strategy for NPSP_nextgen, addressing critical gaps in CRUD/FLS enforcement, sharing model declarations, SOQL injection prevention, and secure coding patterns. Security is the highest priority modernization area given the sensitive nature of nonprofit donor data.

**Core Principle**: Defense in depth with multiple security layers, defaulting to most restrictive access.

---

## 1. Current State Analysis

### 1.1 Security Posture Assessment

```
┌─────────────────────────────────────────────────────────────────┐
│                 CURRENT SECURITY POSTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CRUD/FLS Enforcement     [████░░░░░░░░░░░░░░░░]  15%           │
│  Sharing Declarations     [████████░░░░░░░░░░░░]  40%           │
│  SOQL Injection Prevention[████████████████░░░░]  80%           │
│  Input Validation         [██████████░░░░░░░░░░]  50%           │
│  Error Handling           [████████████░░░░░░░░]  60%           │
│  Secure API Patterns      [██████░░░░░░░░░░░░░░]  30%           │
│                                                                  │
│  Overall Security Score:  ~45%                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Critical Vulnerabilities Identified

| Category | Severity | Count | Details |
|----------|----------|-------|---------|
| SOQL Injection | Critical | 4 | String concatenation in queries |
| Missing Sharing | High | 30+ | Classes without explicit sharing |
| Missing CRUD/FLS | High | 200+ | No field-level security checks |
| Broad Exception Handling | Medium | 571 | Information leakage risk |
| Missing Input Validation | Medium | 50+ | Controller methods |

### 1.3 SOQL Injection Vulnerabilities (Critical)

**File 1**: `ALLO_Multicurrency_TEST.cls:70`
```apex
// VULNERABLE - String concatenation with variable
List<Allocation__c> queryAllo = Database.query(
    'SELECT Id, Amount__c FROM Allocation__c WHERE Opportunity__c = \'' + oppId + '\''
);
```

**File 2**: `HH_OppContactRoles_TDTM.cls`
```apex
// VULNERABLE - Dynamic WHERE clause construction
String strSoql = 'SELECT Id, AccountId FROM Opportunity
    WHERE Account.npe01__SYSTEM_AccountType__c = \'' + value + '\'';
```

**File 3**: `STG_PanelOppBatch_CTRL.cls`
```apex
// VULNERABLE - Unvalidated object name
String query = 'SELECT Count() FROM ' + objName;
```

**File 4**: `PSC_Opportunity_TDTM.cls:87,96`
```apex
// VULNERABLE - Dynamic queries without bind variables
for (Partial_Soft_Credit__c psc : Database.query(
    'SELECT Id FROM Partial_Soft_Credit__c WHERE Opportunity__c IN :oppIds')) {
```

### 1.4 Sharing Declaration Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                SHARING DECLARATION DISTRIBUTION                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  with sharing    │ ████████████  ~40%  (Good)                │
│  └──────────────────┘                                           │
│  ┌──────────────────┐                                           │
│  │ without sharing  │ ████  ~12%  (Intentional bypasses)        │
│  └──────────────────┘                                           │
│  ┌──────────────────┐                                           │
│  │inherited sharing │ ██  ~3%  (Modern pattern)                 │
│  └──────────────────┘                                           │
│  ┌──────────────────┐                                           │
│  │  NO DECLARATION  │ ████████████████  ~45%  (RISK!)           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 CRUD/FLS Enforcement

**Current State**: Only 1 class (`CON_ContactMerge_CTRL.cls`) uses `Security.stripInaccessible()`

**Gap Analysis**:
| Layer | Classes | CRUD/FLS Coverage |
|-------|---------|-------------------|
| Controllers | 50+ | ~5% |
| Service Classes | 40+ | ~2% |
| Batch Classes | 45 | ~0% |
| TDTM Handlers | 49 | ~0% |
| Selectors | 20+ | ~0% |

---

## 2. Target State Architecture

### 2.1 Security Architecture Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                    TARGET SECURITY ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    PRESENTATION LAYER                    │    │
│  │  LWC/Aura/VF → Input Validation → Output Encoding       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    CONTROLLER LAYER                      │    │
│  │  CRUD Check → FLS Check → Business Validation           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     SERVICE LAYER                        │    │
│  │  inherited sharing → Domain Validation → Audit Logging  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     SELECTOR LAYER                       │    │
│  │  Security.stripInaccessible → Bind Variables Only       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      DATA LAYER                          │    │
│  │  Sharing Rules → Field Security → Record Access         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Security Principles

| Principle | Implementation |
|-----------|----------------|
| **Defense in Depth** | Multiple security layers, not single point |
| **Least Privilege** | Minimum necessary access at each layer |
| **Secure by Default** | `inherited sharing`, CRUD checks enabled |
| **Fail Secure** | Deny access on security check failures |
| **Input Validation** | Validate all external input |
| **Output Encoding** | Encode output to prevent XSS |

---

## 3. Well-Architected Framework Alignment

### 3.1 Trusted (Primary Pillar)

| Principle | Current State | Target State |
|-----------|---------------|--------------|
| **Confidentiality** | Partial FLS | Full FLS enforcement |
| **Integrity** | Basic validation | Comprehensive validation |
| **Availability** | Good | Maintain with security |
| **Privacy** | Limited | GDPR/CCPA considerations |
| **Compliance** | Gaps | SOC 2 alignment |

### 3.2 Security-Specific Well-Architected Guidance

```
┌─────────────────────────────────────────────────────────────────┐
│              SALESFORCE SECURITY WELL-ARCHITECTED               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AUTHENTICATION & AUTHORIZATION                               │
│     ├─ Use platform authentication                              │
│     ├─ Leverage sharing model                                   │
│     └─ Implement CRUD/FLS checks                                │
│                                                                  │
│  2. DATA PROTECTION                                              │
│     ├─ Encrypt sensitive data                                   │
│     ├─ Use Shield Platform Encryption where needed              │
│     └─ Implement data masking                                   │
│                                                                  │
│  3. SECURE CODING                                                │
│     ├─ Prevent injection attacks                                │
│     ├─ Validate all inputs                                      │
│     └─ Handle errors securely                                   │
│                                                                  │
│  4. MONITORING & AUDIT                                           │
│     ├─ Enable audit trail                                       │
│     ├─ Log security events                                      │
│     └─ Monitor for anomalies                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Security Patterns

### 4.1 CRUD/FLS Enforcement Pattern

**Pattern A: Pre-Query Check (Traditional)**
```apex
public class SecureQueryPattern {
    public List<Account> getAccounts() {
        // CRUD check
        if (!Schema.sObjectType.Account.isAccessible()) {
            throw new SecurityException('Insufficient permissions to read Account');
        }

        // FLS check for specific fields
        Map<String, Schema.SObjectField> fieldMap =
            Schema.sObjectType.Account.fields.getMap();

        List<String> fieldsToQuery = new List<String>{'Name', 'BillingCity'};
        for (String fieldName : fieldsToQuery) {
            if (!fieldMap.get(fieldName).getDescribe().isAccessible()) {
                throw new SecurityException('Insufficient permissions for field: ' + fieldName);
            }
        }

        return [SELECT Name, BillingCity FROM Account];
    }
}
```

**Pattern B: stripInaccessible (Modern - Recommended)**
```apex
public class StripInaccessiblePattern {
    public List<Account> getAccounts() {
        // Query includes all fields, stripInaccessible removes unauthorized
        List<Account> accounts = [
            SELECT Name, BillingCity, SecretField__c
            FROM Account
        ];

        // Strip fields user cannot access
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            accounts
        );

        return (List<Account>) decision.getRecords();
    }

    public void updateAccounts(List<Account> accounts) {
        // Strip fields user cannot update before DML
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.UPDATABLE,
            accounts
        );

        update decision.getRecords();
    }
}
```

**Pattern C: NPSP Security Utility (Proposed)**
```apex
/**
 * @description Centralized security utility for NPSP
 * Provides consistent CRUD/FLS enforcement across the application
 */
public inherited sharing class UTIL_Security {

    /**
     * @description Check if user can read the specified object
     * @param sObjectType The SObject type to check
     * @throws SecurityException if access denied
     */
    public static void checkReadAccess(Schema.SObjectType sObjectType) {
        if (!sObjectType.getDescribe().isAccessible()) {
            throw new SecurityException(
                String.format(Label.InsufficientReadAccess,
                    new List<String>{sObjectType.getDescribe().getName()})
            );
        }
    }

    /**
     * @description Check if user can create the specified object
     */
    public static void checkCreateAccess(Schema.SObjectType sObjectType) {
        if (!sObjectType.getDescribe().isCreateable()) {
            throw new SecurityException(
                String.format(Label.InsufficientCreateAccess,
                    new List<String>{sObjectType.getDescribe().getName()})
            );
        }
    }

    /**
     * @description Strip inaccessible fields from records
     * @param accessType The type of access to check
     * @param records The records to process
     * @return Records with inaccessible fields removed
     */
    public static List<SObject> stripInaccessible(
        AccessType accessType,
        List<SObject> records
    ) {
        if (records == null || records.isEmpty()) {
            return records;
        }

        SObjectAccessDecision decision = Security.stripInaccessible(
            accessType,
            records
        );

        // Log stripped fields for debugging (not in production)
        if (UTIL_Debug.isEnabled()) {
            Map<String, Set<String>> strippedFields = decision.getRemovedFields();
            if (!strippedFields.isEmpty()) {
                UTIL_Debug.log('Fields stripped due to FLS: ' + strippedFields);
            }
        }

        return decision.getRecords();
    }
}
```

### 4.2 Sharing Declaration Pattern

**Decision Tree for Sharing Mode**:

```
                    ┌─────────────────────────┐
                    │ Choosing Sharing Mode   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │ Does this class need to │
                    │ bypass sharing rules?   │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │ YES             │                 │ NO
              ▼                 │                 ▼
    ┌─────────────────┐        │       ┌─────────────────────┐
    │ Is this a       │        │       │ Should it inherit   │
    │ system process? │        │       │ from calling class? │
    └────────┬────────┘        │       └──────────┬──────────┘
             │                 │                  │
       ┌─────┴─────┐          │            ┌─────┴─────┐
       │YES    │NO │          │            │YES    │NO │
       ▼       ▼   │          │            ▼       ▼   │
┌──────────┐ ┌─────▼────┐     │  ┌──────────────┐ ┌────▼──────┐
│ without  │ │ Document │     │  │  inherited   │ │   with    │
│ sharing  │ │ WHY and  │     │  │   sharing    │ │  sharing  │
│ + Comment│ │ Review   │     │  │ (DEFAULT)    │ │           │
└──────────┘ └──────────┘     │  └──────────────┘ └───────────┘
                              │
                              │ UNCERTAIN
                              ▼
                    ┌─────────────────────┐
                    │ Use inherited       │
                    │ sharing (safest)    │
                    └─────────────────────┘
```

**Pattern Implementation**:

```apex
// DEFAULT: Use inherited sharing for service classes
public inherited sharing class ALLO_AllocationsService {
    // Inherits sharing context from caller
    // Safe default that respects platform security
}

// EXPLICIT with sharing: User-facing operations
public with sharing class ALLO_ManageAllocations_CTRL {
    // Enforces sharing rules
    // Use for controllers and user-triggered operations
}

// EXPLICIT without sharing: System operations (document reason!)
public without sharing class ALLO_SystemProcessor {
    // SECURITY REVIEW: Bypasses sharing because:
    // 1. This runs as system process for data consistency
    // 2. Access is gated by calling class permissions
    // 3. No user input reaches this class directly
}

// INNER CLASS pattern for selective bypass
public with sharing class ALLO_MixedSharing_CTRL {

    public void userOperation() {
        // Runs with sharing (from outer class)
    }

    // Inner class for system operations
    private without sharing class SystemOperations {
        // SECURITY REVIEW: Limited scope bypass for:
        // - Rollup calculations that need all records
        // - System maintenance operations

        public Decimal calculateTotalAllocations(Id oppId) {
            // Can see all allocations regardless of sharing
            return [SELECT SUM(Amount__c) FROM Allocation__c
                    WHERE Opportunity__c = :oppId][0].get('expr0');
        }
    }
}
```

### 4.3 SOQL Injection Prevention Pattern

**Rule: NEVER concatenate user input into SOQL strings**

```apex
public inherited sharing class SecureQueryBuilder {

    // WRONG - Vulnerable to injection
    public List<Account> getAccountsUnsafe(String searchTerm) {
        String query = 'SELECT Id, Name FROM Account WHERE Name LIKE \'%'
            + searchTerm + '%\'';  // VULNERABLE!
        return Database.query(query);
    }

    // RIGHT - Use bind variables
    public List<Account> getAccountsSafe(String searchTerm) {
        String searchPattern = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        return [SELECT Id, Name FROM Account WHERE Name LIKE :searchPattern];
    }

    // RIGHT - Dynamic SOQL with bind variables
    public List<Account> getAccountsDynamic(String searchTerm, String fieldName) {
        // Validate field name against schema (prevent injection via field name)
        if (!isValidField('Account', fieldName)) {
            throw new SecurityException('Invalid field: ' + fieldName);
        }

        String searchPattern = '%' + String.escapeSingleQuotes(searchTerm) + '%';
        String query = 'SELECT Id, Name FROM Account WHERE ' + fieldName + ' LIKE :searchPattern';
        return Database.query(query);  // searchPattern is bound, not concatenated
    }

    // Validate field exists on object
    private Boolean isValidField(String objectName, String fieldName) {
        Schema.SObjectType sot = Schema.getGlobalDescribe().get(objectName);
        if (sot == null) return false;
        return sot.getDescribe().fields.getMap().containsKey(fieldName.toLowerCase());
    }
}
```

---

## 5. Trade-off Analysis

### 5.1 CRUD/FLS Enforcement Approach

**Option A: Enforce at Every Query (Maximum Security)**

| Pros | Cons |
|------|------|
| Maximum security coverage | Performance overhead |
| Catches all access paths | Verbose code |
| Meets strictest compliance | May break existing functionality |
| Clear audit trail | Requires extensive testing |

**Option B: Enforce at Controller/Service Boundary (Balanced)**

| Pros | Cons |
|------|------|
| Reduced performance impact | Internal code paths unchecked |
| Cleaner code | Requires discipline |
| Easier migration | Trust assumptions in service layer |
| Maintainable | Potential gaps |

**Option C: stripInaccessible Only (Graceful Degradation)**

| Pros | Cons |
|------|------|
| Non-breaking for users | Users may not see expected data |
| Easy to implement | No explicit error feedback |
| Good performance | Harder to debug access issues |
| Gradual adoption | May hide permission problems |

**Recommended Approach**: Hybrid

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYBRID SECURITY APPROACH                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONTROLLER LAYER                                                │
│  ├─ Explicit CRUD checks with exceptions                        │
│  └─ User gets clear error if access denied                      │
│                                                                  │
│  SERVICE LAYER                                                   │
│  ├─ inherited sharing (respects caller context)                 │
│  └─ Validate business rules                                     │
│                                                                  │
│  SELECTOR LAYER                                                  │
│  ├─ Security.stripInaccessible() on results                     │
│  └─ Graceful degradation for partial access                     │
│                                                                  │
│  BATCH/ASYNC LAYER                                               │
│  ├─ Explicit without sharing where needed (documented)          │
│  └─ Run as system context for data integrity                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Sharing Declaration Strategy

**Option A: Convert All to `inherited sharing`**

| Pros | Cons |
|------|------|
| Modern best practice | May break without sharing needs |
| Safest default | Requires review of each class |
| Consistent pattern | Some system ops need bypass |

**Option B: Add Explicit Declarations Only**

| Pros | Cons |
|------|------|
| Non-breaking | Still have implicit classes |
| Lower risk | Incomplete coverage |
| Faster implementation | Technical debt remains |

**Recommended**: Option A with careful review of `without sharing` needs

---

## 6. Risk Assessment

### 6.1 Security Risk Matrix

```
                │ Low Impact  │ Medium Impact │ High Impact   │
────────────────┼─────────────┼───────────────┼───────────────┤
High            │             │               │ SOQL          │
Likelihood      │             │               │ Injection (4) │
────────────────┼─────────────┼───────────────┼───────────────┤
Medium          │ Info        │ Missing       │ Missing       │
Likelihood      │ Disclosure  │ FLS (200+)    │ Sharing (30+) │
────────────────┼─────────────┼───────────────┼───────────────┤
Low             │ Error       │ XSS           │ Privilege     │
Likelihood      │ Messages    │ Vectors       │ Escalation    │
────────────────┴─────────────┴───────────────┴───────────────┘
```

### 6.2 Migration Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Extensive testing, feature flags |
| Performance degradation | Medium | Medium | Benchmark before/after |
| Incomplete coverage | Low | Medium | Automated scanning |
| False sense of security | Low | High | Security review process |

---

## 7. Implementation Phases

### Phase 1: Critical Fixes (Sprint 1-2)

**Priority**: Fix SOQL injection vulnerabilities immediately

| File | Fix | Effort | Status |
|------|-----|--------|--------|
| ALLO_Multicurrency_TEST.cls | Use bind variable | 1h | ⬜ |
| HH_OppContactRoles_TDTM.cls | Use bind variable | 2h | ⬜ |
| STG_PanelOppBatch_CTRL.cls | Validate object name | 2h | ⬜ |
| PSC_Opportunity_TDTM.cls | Use bind variable | 1h | ⬜ |

### Phase 2: Sharing Declarations (Sprint 3-4)

**Priority**: Add explicit sharing to all public/global classes

| Category | Classes | Approach | Status |
|----------|---------|----------|--------|
| API Classes (*_API) | 15 | inherited sharing | ⬜ |
| Controllers (*_CTRL) | 50+ | with sharing | ⬜ |
| Services (*_SVC, *Service) | 40+ | inherited sharing | ⬜ |
| Selectors | 20+ | inherited sharing | ⬜ |
| Batch Classes | 45 | Review each | ⬜ |

### Phase 3: CRUD/FLS Utility (Sprint 5-6)

1. Create `UTIL_Security` class
2. Add unit tests
3. Document usage patterns
4. Create PMD rule to detect direct DML without checks

### Phase 4: CRUD/FLS Rollout (Sprint 7-10)

| Priority | Component Type | Approach |
|----------|---------------|----------|
| 1 | Controllers | Explicit checks |
| 2 | Service classes | stripInaccessible |
| 3 | Batch classes | stripInaccessible |
| 4 | Selectors | stripInaccessible |

---

## 8. Success Metrics

### 8.1 Security Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| SOQL Injection vulnerabilities | 4 | 0 | Code scan |
| Classes with explicit sharing | 55% | 100% | Code scan |
| CRUD/FLS coverage | 15% | 80% | Code scan |
| Security code review coverage | 0% | 100% | PR process |

### 8.2 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Security-related bugs | 0 critical | GitHub issues |
| Test coverage of security code | 90%+ | CI/CD |
| PMD security violations | 0 | CI/CD |

---

## 9. Security Review Checklist

For all PRs touching security-sensitive code:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY REVIEW CHECKLIST                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SHARING & ACCESS                                                │
│  □ Class has explicit sharing declaration                       │
│  □ If 'without sharing', justification documented               │
│  □ CRUD checks present for DML operations                       │
│  □ FLS enforced via stripInaccessible or explicit checks        │
│                                                                  │
│  QUERY SECURITY                                                  │
│  □ No string concatenation in SOQL/SOSL                         │
│  □ All user input uses bind variables                           │
│  □ Dynamic object/field names validated against schema          │
│                                                                  │
│  INPUT VALIDATION                                                │
│  □ All external input validated                                 │
│  □ Appropriate escaping for output context                      │
│  □ Error messages don't leak sensitive info                     │
│                                                                  │
│  TESTING                                                         │
│  □ Tests verify security checks work                            │
│  □ Tests verify access denied scenarios                         │
│  □ Tests use System.runAs() for permission testing              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Appendix

### A. PMD Security Rules Configuration

```xml
<!-- pmd-security-rules.xml -->
<ruleset name="NPSP Security Rules">
    <rule ref="category/apex/security.xml/ApexCRUDViolation"/>
    <rule ref="category/apex/security.xml/ApexSOQLInjection"/>
    <rule ref="category/apex/security.xml/ApexSharingViolations"/>
    <rule ref="category/apex/security.xml/ApexXSSFromURLParam"/>
    <rule ref="category/apex/security.xml/ApexXSSFromEscapeFalse"/>
</ruleset>
```

### B. Related Documents

- [01-FOUNDATION-API-MODERNIZATION.md](01-FOUNDATION-API-MODERNIZATION.md)
- [05-CODE-QUALITY-STANDARDS.md](05-CODE-QUALITY-STANDARDS.md)
- [MODERNIZATION_BURNDOWN.md](../documentation/MODERNIZATION_BURNDOWN.md)

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Security Classification: Internal*
*Author: NPSP_nextgen Security Team*
