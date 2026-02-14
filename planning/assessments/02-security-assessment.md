# WS-02: Security Architecture — Assessment

**Review Date**: 2026-02-12
**Implementation Plan**: [02-security.md](../implementation/02-security.md)
**Planning Doc**: [02-SECURITY-ARCHITECTURE.md](../02-SECURITY-ARCHITECTURE.md)
**Overall Rating**: **Adequate+**

---

## Well-Architected Alignment

| Pillar | Score | Notes |
|--------|-------|-------|
| Trusted | Strong | Comprehensive sharing, CRUD/FLS, SOQL injection, XSS coverage |
| Easy | Weak | No admin-facing security dashboards; no sharing change communication plan |
| Adaptable | Adequate | `NPSP_SecurityUtils` wrapper is extensible |
| Intentional | Strong | Clear categorization (justified/convert/investigate); concrete class counts |
| Automated | Adequate | PMD security rules in CI; no SAST/DAST beyond PMD |

---

## Accuracy Findings

### Medium: Sharing Percentage Mismatch

The planning doc's sharing distribution chart shows `without sharing` at "~12%" but 54 out of 1,689 classes = ~3.2%. The 12% figure appears to reference a different measurement or is inflated.

### Minor: Agent Roster Gap

`devops_agent` performs Sprint 1-2 work (PMD security rule integration) but is not listed in the "Supporting Agents" header. Should be added.

### Minor: fflib API Signature Concern

`fflib_SecurityUtils.checkFieldIsAccessible(Contact.SObjectType, Contact.Email)` may not match the actual fflib method signature. The typical fflib pattern uses string parameters: `fflib_SecurityUtils.checkFieldIsReadable('Contact', 'Email')` or `Schema.DescribeFieldResult` approach.

**Action**: Verify the actual fflib_SecurityUtils API in the NPSP codebase before implementation.

---

## Backwards Compatibility Risks

### Risk 1: Sharing Mode Conversion — CRITICAL

This is the highest-risk change across the entire modernization initiative. The plan targets converting ~40 of 54 `without sharing` classes to `inherited sharing`.

**The core problem**: `inherited sharing` means the class inherits the sharing context of the caller. If the caller runs in `with sharing` context (a user-facing controller), the converted class now enforces sharing rules where it previously did not.

**Concrete break scenarios**:
- **Rollup calculations**: CRLP classes that aggregate across all accounts. With restricted sharing, users see incomplete rollup totals.
- **Household naming**: If `HouseholdNamingService` inherits sharing and a user can't see all household members, names are generated with incomplete data.
- **Error handling**: `ERR_*` classes that log errors across objects. With inherited sharing, users may not see errors on records they can't access.

**Additionally**: ~45% of classes (~760) have NO sharing declaration. Adding `inherited sharing` to these is a behavioral change disguised as best practice — they currently default to `without sharing`.

### Risk 2: Insufficient Validation Approach — HIGH

The plan says `testing_agent` will "run targeted tests with `System.runAs()` validation." However:
- Existing tests likely run as admin only and won't catch sharing regressions
- "Multiple profiles" is not defined — which profiles?
- No before/after comparison of query result counts

### Risk 3: Justified Exceptions Too Small — MEDIUM

The plan lists only 4 exceptions: `STG_InstallScript`, `UTIL_CustomSettingsFacade`, `TDTM_Config_API`, and <10 target. Functional analysis will likely reveal 15-20+ classes that genuinely require `without sharing`:
- ALL rollup calculation classes (CRLP_*)
- ALL batch classes processing cross-org data
- Household naming logic
- Data Import batch processing

---

## Well-Architected Detail

### Trusted — PII Gap (CRITICAL)

Nonprofit organizations process donor data: names, addresses, phone numbers, email, and potentially sensitive demographic data. The security plan has **no mention** of:
- Data classification tiers (Confidential, Internal, Public)
- Shield Platform Encryption considerations
- GDPR/CCPA compliance patterns
- Event Monitoring for security auditing in production

This is the most significant Trusted pillar gap across all plans.

### Easy — Admin Experience Gap

Sharing mode changes can break user workflows. A user who previously had access via `without sharing` code paths may lose access. There is no:
- User communication plan for sharing behavior changes
- Admin-facing diagnostic tool for access issues
- Admin UI for reviewing security settings

**Recommendation**: Add an "NPSP Security Changes Impact Assessment" document and a troubleshooting guide.

### Automated — Scanning Gap

PMD is the only security scanning tool. Consider adding:
- **Salesforce Code Analyzer** (`sfdx scanner`) — bundles PMD + RetireJS + eslint-plugin-aura
- Nightly security scans (not just PR-triggered)
- Production security alerting via Event Monitoring
- Automated secrets detection

---

## Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| **P0** | Functional analysis of all 54 classes | Each class must answer: "Does this need to see records the user cannot see?" BEFORE any conversion |
| **P0** | Add PII/data classification framework | Define data tiers, map sensitive fields, specify encryption considerations |
| **P1** | Create sharing validation test suite | Run operations as restricted users; compare results vs admin |
| **P1** | Expand justified exceptions list | Expect 15-20+, not 4-10, based on functional analysis |
| **P1** | Add Salesforce Code Analyzer | Replace PMD-only with broader sfdx scanner |
| **P2** | Add admin diagnostic tooling | Security change impact assessment and troubleshooting guide |
| **P2** | Add permission set testing strategy | `System.runAs()` alone doesn't assign permission sets |
| **P2** | Fix sharing percentage | Correct the ~12% figure to ~3.2% or clarify measurement |

---

*Assessment Version: 1.0*
*Last Updated: 2026-02-12*
