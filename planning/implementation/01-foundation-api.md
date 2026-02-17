# WS-01: Foundation & API Modernization — Implementation Subplan

**Phase**: 1 (Foundation)
**Primary Agent**: `apex_agent`
**Planning Doc**: [01-FOUNDATION-API-MODERNIZATION.md](../01-FOUNDATION-API-MODERNIZATION.md)
**Status**: ✅ Substantially complete

---

## Objective

Upgrade the NPSP codebase from API version 53.0 to 63.0, replace deprecated API calls, and configure the 2GP unlocked package with the `npsp2` namespace.

---

## Completed Work

### Sprint 1-2: 2GP Package Setup & API Audit — ✅ COMPLETE (PR #1)

- Registered `npsp2` namespace
- Configured `sfdx-project.json` for 2GP unlocked package (API 63.0)
- Created scratch org definitions with API 63.0
- CI pipeline configured for `sf package version create` workflow
- Scanned all Apex classes — 100% on API 63.0

### Sprint 3-4: API Version Upgrade — ✅ COMPLETE (PR #1)

- All utility, helper, and selector classes upgraded to API 63.0
- Zero compile errors from API changes
- All `@AuraEnabled` method signatures validated

### Sprint 5-6: Core Domain Class Upgrades — ✅ COMPLETE (PR #1)

- All domain classes (RD2, CRLP, BDI, ALLO, GE, HH) on API 63.0
- TDTM trigger handler metadata updated
- Full test suite green, coverage at 85%+

---

## Remaining Work

### Sprint 7-8: Foundation Base Classes — DEFERRED

The original plan called for creating foundation base classes:
- `NPSP_BaseService` — Standard service layer base
- `NPSP_BaseSelector` — Selector base with CRUD/FLS
- `NPSP_BaseBatch` — Batch base with monitoring
- `NPSP_BaseTriggerHandler` — Enhanced TDTM handler base

**Decision**: Deferred. These abstract base classes add infrastructure overhead without solving immediate problems. The existing patterns (TDTM_Runnable, CRLP_Batch_Base, service/selector conventions) work well. If needed, base classes can be introduced incrementally when a concrete need arises (e.g., NPSP_QueueableBase during WS-03 async work).

---

## Success Metrics

| Metric | Start | Current | Target |
|--------|-------|---------|--------|
| Classes on API 63.0 | 0% | **100%** ✅ | 100% |
| Deprecated API usages | TBD | **0** ✅ | 0 |
| 2GP package configured | No | **Yes** ✅ | Yes |
| Test coverage | 85% | **85%+** ✅ | 85%+ |

---

*Subplan Version: 2.0*
*Last Updated: 2026-02-16*
