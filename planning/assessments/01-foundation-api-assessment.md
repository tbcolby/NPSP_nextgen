# WS-01: Foundation & API Modernization — Assessment

**Review Date**: 2026-02-12
**Implementation Plan**: [01-foundation-api.md](../implementation/01-foundation-api.md)
**Planning Doc**: [01-FOUNDATION-API-MODERNIZATION.md](../01-FOUNDATION-API-MODERNIZATION.md)
**Overall Rating**: **Adequate**

---

## Well-Architected Alignment

| Pillar | Score | Notes |
|--------|-------|-------|
| Trusted | Adequate | Security review only in Sprint 5-6; should be continuous |
| Easy | Adequate | Migration guide planned (Sprint 7-8); no admin impact analysis |
| Adaptable | Strong | Base classes create solid extensibility foundation |
| Intentional | Adequate | "Deprecated API usages" starts at TBD; undermines measurability |
| Automated | Adequate | Compile validation CI job; no automated rollback mechanism |

---

## Accuracy Findings

### ~~Critical: API Version Target Inconsistency~~ — RESOLVED

The planning doc (`01-FOUNDATION-API-MODERNIZATION.md`) originally targeted **API 60.0** while implementation documents targeted **62.0+**. This inconsistency has been **resolved** by the NPPatch best practices review decision (2026-02-13): the unified target is now **API 63.0** across all documents. The implementation subplan (`01-foundation-api.md`) has been updated to reflect this.

- **Resolved target**: API 63.0 (all documents aligned)
- **Decision source**: NPPatch best practices review

### Minor: Agent Supporting Role

No supporting agent gaps for this workstream — assignments are consistent.

### Verified Correct
- 1,689 Apex class count consistent across all docs
- Sprint numbering internally consistent (4 pairs, Sprint 1-8)
- All cross-references to planning doc resolve correctly
- Compile validation CI approach is technically sound

---

## Backwards Compatibility Risks

### Risk 1: Deprecated API Method Removal — MEDIUM

The plan commits to a Big Bang upgrade (53.0 to 62.0+) without a completed deprecated method inventory. The planning doc defers this to "Appendix B: Deprecated Methods Scan Results — To be populated during pre-migration phase."

For 1,689 classes spanning a 9-version jump, this is a significant gap. Deprecated methods removed between API 53.0 and 62.0 could cause compile failures across critical domain classes.

**Mitigation**: Complete the deprecated method inventory as Sprint 0, before committing to the upgrade approach. If the inventory reveals >50 deprecated method usages, consider the phased upgrade (53 to 56 to 60 to 62) instead of Big Bang.

### Risk 2: @AuraEnabled Signature Changes — MEDIUM

Sprint 3-4 mentions "Update @AuraEnabled method signatures for API 62.0 compatibility" but does not specify what changes are expected. If method signatures change (return types, parameter types, cacheable attributes), any custom Aura/LWC component calling these methods will break.

**Mitigation**: Catalog all public `@AuraEnabled` methods and freeze their signatures as a compatibility contract before upgrading.

### Risk 3: Base Class Impact on Existing Handlers — MEDIUM

`NPSP_BaseTriggerHandler` (Sprint 7-8) must coexist with `TDTM_Runnable`. The plan does not state whether `TDTM_Runnable` will be deprecated. Orgs with custom trigger handlers extending `TDTM_Runnable` would break if it is removed.

**Mitigation**: Explicitly commit to maintaining `TDTM_Runnable` as a supported base class. `NPSP_BaseTriggerHandler` should extend or wrap it, not replace it.

### Risk 4: Behavioral Changes from API Bump — LOW-MEDIUM

Salesforce guarantees API backwards compatibility, but subtle behavioral changes occur between versions (stricter validation, different defaults). The Big Bang approach amplifies this risk across all 1,689 classes simultaneously.

**Mitigation**: Create a "compatibility test suite" that exercises every public API surface from an external consumer perspective. Run before and after the version bump.

---

## Well-Architected Detail

### Trusted
- Security review is scheduled for Sprint 5-6 only (domain class upgrades). Utility class upgrades in Sprint 3-4 have no security review gate.
- `NPSP_BaseSelector` promises "CRUD/FLS checks built in" but defers design to WS-02. If WS-02 is delayed, base classes ship without security enforcement.
- API version changes can alter `Schema.DescribeFieldResult.isAccessible()` behavior; no regression testing is planned for security behavior changes.

**Recommendation**: Add security smoke tests to every sprint, not just Sprint 5-6. Specify the CRUD/FLS stub in the base selector even before WS-02 completes.

### Automated
- No automated rollback mechanism. The plan mentions "separate branch per sprint" but does not define automated rollback if an upgrade causes production issues.

**Recommendation**: Define rollback criteria and automation (e.g., if >5 test failures after upgrade, automatically revert the batch).

---

## Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| ~~**P0**~~ | ~~Resolve version target~~ | **RESOLVED** — Target is API 63.0 per NPPatch decision (2026-02-13) |
| **P1** | Complete deprecated method inventory | Must be Sprint 0, before committing to Big Bang approach |
| **P1** | Freeze @AuraEnabled signatures | Catalog all public methods; treat as compatibility contract |
| **P1** | Commit to TDTM_Runnable support | State explicitly that it will not be deprecated |
| **P2** | Add continuous security review | Security smoke tests every sprint, not just Sprint 5-6 |
| **P2** | Establish TBD baselines | "Deprecated API usages" must have concrete numbers by Sprint 2 |

---

*Assessment Version: 1.1*
*Last Updated: 2026-02-13*
