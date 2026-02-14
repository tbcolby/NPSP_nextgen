# WS-02: Security Architecture — Implementation Subplan

**Phase**: 1 (Foundation)
**Primary Agent**: `security_agent`
**Supporting Agents**: `apex_agent`, `lwc_agent`
**Planning Doc**: [02-SECURITY-ARCHITECTURE.md](../02-SECURITY-ARCHITECTURE.md)
**Blocks**: WS-03, WS-04, WS-06, WS-09

---

## Objective

Remediate all 54 `without sharing` classes, implement systematic CRUD/FLS enforcement using fflib_SecurityUtils, eliminate SOQL injection risks, and establish security scanning in CI/CD.

---

## Sprint Breakdown

### Sprint 1-2: Security Audit & Framework Setup

**Agent**: `security_agent`
**Tasks**:
1. Complete inventory of all 54 `without sharing` classes:
   - Categorize each as: justified / needs conversion / needs investigation
   - Document justification for each that must remain `without sharing`
   - Expected outcome: ~40 classes need conversion to `inherited sharing`
2. Scan for SOQL injection patterns:
   - `String` concatenation in SOQL queries
   - Dynamic SOQL without `String.escapeSingleQuotes()`
   - Dynamic field/object name references without validation
3. Scan for sensitive data exposure:
   - `System.debug` with passwords/tokens/secrets
   - Error messages exposing internal details
4. Create security baseline report

**Agent**: `devops_agent`
**Tasks**:
1. Integrate PMD security rules into CI pipeline:
   - `ApexCRUDViolation`
   - `ApexSharingViolations`
   - `ApexSOQLInjection`
   - `ApexXSSFromURLParam`
2. Create GitHub Action for security scanning on PRs
3. Configure vulnerability alerting

**Deliverables**:
- `docs/security-audit-report.md` — Full vulnerability inventory
- CI security scanning pipeline active
- Categorized list of all `without sharing` classes

### Sprint 3-4: Sharing Mode Remediation

**Agent**: `security_agent` + `apex_agent`
**Tasks**:
1. Convert `without sharing` → `inherited sharing` in batches:
   - **Batch 1** (Low risk): Utility classes, helpers
     - `UTIL_*` classes using `without sharing`
     - `ERR_*` error handling classes
   - **Batch 2** (Medium risk): Service layer classes
     - `*_SVC` / `*Service` classes
     - Selector classes
   - **Batch 3** (High risk): Domain logic classes
     - `RD2_*`, `CRLP_*`, `BDI_*` domain classes
     - Trigger handlers
2. For each class converted:
   - `security_agent` identifies the class and required sharing mode
   - `apex_agent` makes the code change
   - `testing_agent` runs targeted tests with `System.runAs()` validation

**Justified Exceptions** (remain `without sharing`):
- `STG_InstallScript` — Install scripts need elevated access
- `UTIL_CustomSettingsFacade` — Custom settings access pattern
- `TDTM_Config_API` — Framework config requires system context
- Document each exception in class-level ApexDoc

**Deliverables**:
- ~40 classes converted to `inherited sharing`
- All exceptions documented with justification
- Test suite validates sharing enforcement

### Sprint 5-6: CRUD/FLS Enforcement

**Agent**: `security_agent` + `apex_agent`
**Tasks**:
1. Implement CRUD/FLS check framework:
   ```apex
   // Standard pattern using fflib_SecurityUtils
   fflib_SecurityUtils.checkObjectIsInsertable(Contact.SObjectType);
   fflib_SecurityUtils.checkFieldIsAccessible(Contact.SObjectType, Contact.Email);
   ```
2. Add CRUD checks to all DML operations in service layer classes:
   - Insert operations: `isCreateable()` check
   - Update operations: `isUpdateable()` check
   - Delete operations: `isDeletable()` check
3. Add FLS checks to selector/query classes:
   - `isAccessible()` for read operations
   - `isUpdateable()` for fields being modified
4. Create `NPSP_SecurityUtils` wrapper for common patterns:
   ```apex
   public class NPSP_SecurityUtils {
       public static void checkCRUD(SObjectType objType, AccessType access) { ... }
       public static void checkFLS(SObjectType objType, List<SObjectField> fields) { ... }
   }
   ```

**Agent**: `testing_agent`
**Tasks**:
1. Create security test utilities:
   - `TEST_SecurityHelper.createRestrictedUser()`
   - `TEST_SecurityHelper.runAsMinimalAccess()`
2. Add CRUD/FLS tests to all service class test suites
3. Verify tests cover both positive (has access) and negative (no access) scenarios

**Deliverables**:
- `NPSP_SecurityUtils` utility class
- CRUD checks on all DML in service layer
- FLS checks on all selectors
- Security test utilities

### Sprint 7-8: SOQL Injection Remediation & LWC Security

**Agent**: `security_agent`
**Tasks**:
1. Fix all identified SOQL injection vectors:
   - Replace string concatenation with bind variables
   - Add `String.escapeSingleQuotes()` where dynamic SOQL is unavoidable
   - Validate dynamic object/field names against `Schema.getGlobalDescribe()`
2. Remove all sensitive data from `System.debug` calls

**Agent**: `lwc_agent`
**Tasks**:
1. Audit all 125 LWC components for:
   - `innerHTML` usage with user data
   - Client-side data storage (localStorage/sessionStorage)
   - URL parameter handling without validation
   - CSP compliance (no inline scripts, no `eval()`)
2. Fix identified XSS vectors
3. Ensure all form inputs have server-side validation backing

**Deliverables**:
- Zero SOQL injection vulnerabilities
- Zero sensitive data in debug logs
- LWC security audit report with all issues resolved
- Clean PMD security scan

---

## Agent Coordination Protocol

```
Sharing Mode Conversion (per class):
  security_agent → apex_agent: "Convert CLASS_NAME to inherited sharing"
  apex_agent: Makes code change
  apex_agent → testing_agent: "Run CLASS_NAME_TEST with sharing validation"
  testing_agent → security_agent: "Tests pass with correct sharing behavior"
  security_agent → supervisor: "CLASS_NAME remediated and verified"

CRUD/FLS Enforcement (per service class):
  security_agent: Identifies required checks
  security_agent → apex_agent: "Add CRUD checks to SERVICE_CLASS DML operations"
  apex_agent: Implements checks
  apex_agent → testing_agent: "Create CRUD/FLS tests for SERVICE_CLASS"
  testing_agent: Creates + runs tests
  security_agent: Final review
```

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| Sharing | No `without sharing` without documented justification | `security_agent` |
| CRUD/FLS | All DML has CRUD checks, all queries have FLS checks | `security_agent` |
| Injection | Zero SOQL injection vectors (PMD clean) | `devops_agent` (CI) |
| XSS | Zero client-side XSS vectors | `security_agent` |
| Tests | Security tests pass for all converted classes | `testing_agent` |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| `without sharing` classes | 54 | 30 | 14 | <10 (justified only) |
| Explicit CRUD/FLS checks | 16 | 50+ | 150+ | All DML covered |
| SOQL injection vectors | TBD | -50% | -80% | 0 |
| PMD security violations | TBD | -60% | -90% | 0 critical |
| Security test coverage | Low | 50% | 80% | 95%+ |

---

---

## Permission Set Strategy

### Overview

The project will ship with a permission set model following the pattern established by NPPatch (`NPPatch_Admin`). Permission sets provide a cleaner, more flexible security model than profile-based access, and are the recommended approach for 2GP packages.

### Package Permission Sets

| Permission Set | Purpose | Includes |
|---------------|---------|----------|
| `NPSP2_Admin` | Full admin access to all NPSP_nextgen objects and features | CRUD on all custom objects, all custom fields, all CMTs, all app pages |
| `NPSP2_User` | Standard user access for day-to-day nonprofit operations | Read/Create/Edit on Opportunities, Contacts, Accounts; Read on rollup fields |
| `NPSP2_ReadOnly` | Read-only access for reporting users | Read on all custom objects and fields |
| `NPSP2_DataImport` | Access for data import operations | CRUD on Data Import objects, BDI field mappings |
| `NPSP2_IntegrationUser` | API/integration user access | CRUD on integration objects, Named Credential access |

### 2GP Packaging Considerations

- **No profile deployments**: 2GP unlocked packages cannot include profiles. All object/field access MUST be granted via permission sets.
- **Permission Set Groups**: Consider grouping permission sets for common role combinations (e.g., `NPSP2_FundraisingManager` = `NPSP2_User` + `NPSP2_DataImport`).
- **Sharing model**: 2GP packages use Organization-Wide Defaults (OWDs) set by the subscriber org. The package should document recommended OWDs but cannot enforce them.
- **Custom Permissions**: Use Custom Permissions within permission sets to control feature access (e.g., `NPSP2_ManageRecurringDonations`, `NPSP2_RunBatchJobs`).

### Implementation Tasks

1. Create `NPSP2_Admin` permission set with full CRUD on all package objects
2. Create `NPSP2_User` permission set with standard user access
3. Create `NPSP2_ReadOnly` permission set for reporting
4. Add permission set assignment to CCI `dev_org` flow
5. Update all test classes to assign appropriate permission sets via `System.runAs()`
6. Document permission set setup in admin guide

*Subplan Version: 1.1*
*Last Updated: 2026-02-13*
