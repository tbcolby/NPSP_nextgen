# NPSP_nextgen Master Implementation Plan

## Overview

This plan tracks the modernization of NPSP_nextgen across 10 workstreams. Each workstream maps to a planning document in `planning/` and a domain agent in `.claude/agents/domains/`.

**Total Workstreams**: 10
**Phases**: 3 (Foundation → Core → Experience)
**Current Status**: Phase 1 substantially complete, Phase 2 ready to begin

---

## Phase Map

```
PHASE 0: PACKAGING & NAMESPACE ✅ COMPLETE (PR #1, Feb 2026)
├── npsp2 namespace registered & configured
├── 2GP unlocked package (sfdx-project.json, API 63.0)
├── Elevate integration code stripped
└── CumulusCI 4.6.0, CI pipeline green

PHASE 1: FOUNDATION ✅ SUBSTANTIALLY COMPLETE (PRs #2-8, Feb 2026)
├── WS-01: Foundation & API — API 63.0 upgrade done, base classes deferred
├── WS-02: Security — Sharing, SOQL injection, CRUD/FLS, DML wrapping done
├── WS-05: Code Quality — PMD/ApexDoc/naming standards not yet started
└── WS-10: Testing — testMethod→@IsTest done, builder expansion pending

PHASE 2: CORE MODERNIZATION (Next up)
├── WS-03: Async Apex — @future→Queueable, batch modernization
├── WS-04: Performance — SOQL-in-loops, describe caching, Platform Cache
├── WS-07: Configuration — Custom Settings→CMT migration
└── Remaining WS-02, WS-05, WS-10 items

PHASE 3: EXPERIENCE & INTEGRATION (Deferred)
├── WS-06: UI Modernization — Aura→LWC migration
├── WS-08: Accessibility — WCAG 2.1 AA compliance
└── WS-09: Integration — Named Credentials, resilient callouts
```

---

## Completion Status

### Phase 0: Packaging & Namespace — COMPLETE

| Item | PR | Status |
|------|----|--------|
| Namespace npsp→npsp2 | #1 | ✅ |
| API 53.0→63.0 (all classes) | #1 | ✅ |
| Elevate removal (~120 classes) | #1 | ✅ |
| CumulusCI 4.6.0 | #1 | ✅ |
| CI pipeline fixes | #1 | ✅ |

### Phase 1: Foundation — 87% Complete

| Item | PR | Status | Notes |
|------|----|--------|-------|
| testMethod→@IsTest (648) | #2 | ✅ | |
| @track cleanup (~90 LWC) | #2 | ✅ | |
| Package deps updated | #2 | ✅ | Jest 27.5.1, ESLint 8.57.1, Prettier 2.8.7 |
| ESLint auto-fixes (45) | #2 | ✅ | |
| SOQL injection fixes (8 files) | #3 | ✅ | Bind variables + schema validation |
| Sharing declarations (158 classes) | #3, #4 | ✅ | All public/global classes have explicit sharing |
| Hardcoded ID audit | #3, #4 | ✅ | RP_Constants documented, zero Salesforce IDs |
| CRUD/FLS enforcement (controllers) | #5 | ✅ | 7 @AuraEnabled methods |
| DML wrapping (controllers) | #5 | ✅ | 31 bare DML in 11 controllers |
| DML wrapping (services/batch/TDTM) | #6 | ✅ | 55 bare DML in 27 files |
| Selector FLS hardening | #7 | ✅ | 5 selectors with SECURITY_ENFORCED |
| Controller read guards | #7 | ✅ | 2 controllers |
| TODO/FIXME cleanup | — | ⏳ | 40 items in 37 files, deferred |
| Foundation base classes | — | Deferred | NPSP_BaseService etc. — not needed yet |

### Phase 2+: Not Started

130 items remaining across Phases 2-10. See burndown for details.

---

## Workstream → Agent Mapping

| Workstream | Primary Agent | Planning Doc |
|------------|--------------|-------------|
| WS-01: Foundation & API | `apex_agent` | [01](../01-FOUNDATION-API-MODERNIZATION.md) |
| WS-02: Security | `security_agent` | [02](../02-SECURITY-ARCHITECTURE.md) |
| WS-03: Async Apex | `apex_agent` | [03](../03-ASYNC-APEX-MODERNIZATION.md) |
| WS-04: Performance | `apex_agent` | [04](../04-PERFORMANCE-OPTIMIZATION.md) |
| WS-05: Code Quality | `documentation_agent` | [05](../05-CODE-QUALITY-STANDARDS.md) |
| WS-06: UI Modernization | `lwc_agent` | [06](../06-UI-MODERNIZATION-STRATEGY.md) |
| WS-07: Configuration | `apex_agent` | [07](../07-CONFIGURATION-ARCHITECTURE.md) |
| WS-08: Accessibility | `lwc_agent` | [08](../08-ACCESSIBILITY-COMPLIANCE.md) |
| WS-09: Integration | `apex_agent` | [09](../09-INTEGRATION-ARCHITECTURE.md) |
| WS-10: Testing | `testing_agent` | [10](../10-TESTING-STRATEGY.md) |

---

## Next Phase Priority Order

Based on value/effort analysis of remaining work:

### Tier 1: High Value, Ready Now (~50-70h)

| Work | WS | Est. Hours | Why |
|------|----|-----------|-----|
| **SOQL-in-loops fixes** (7 files) | WS-04 | 12-16h | Governor limit risk in production triggers |
| **Nested loop fixes** (4 files) | WS-04 | 8-12h | O(n²) perf in OPP_OpportunityContactRoles_TDTM |
| **Describe call caching** (3 files) | WS-04 | 6-10h | Repeated getGlobalDescribe() calls |
| **@future→Queueable** (13 methods) | WS-03 | 20-30h | Enables Finalizer error handling |

### Tier 2: High Value, Medium Effort (~40-60h)

| Work | WS | Est. Hours | Why |
|------|----|-----------|-----|
| Input validation on controllers | WS-02 | 8h | Remaining security item |
| Simple Aura→LWC (10 components) | WS-06 | 20-30h | Quick UI wins, 4x perf improvement |
| Null-safe operators + exception handling | WS-05 | 12-16h | Modern Apex patterns |

### Tier 3: Important, Larger Effort (~80-120h)

| Work | WS | Est. Hours | Why |
|------|----|-----------|-----|
| Batch modernization (45 classes) | WS-03 | 15-25h | Add Finalizer support |
| Platform Cache implementation | WS-04 | 15-20h | Cache hot paths |
| Custom Settings→CMT (top 4) | WS-07 | 20-30h | 2GP packaging benefit |
| ApexDoc for API/service classes | WS-05 | 15-20h | Documentation debt |

### Deferred (Phase 3+)

- Complex Aura→LWC (Tier 3, 16 components) — high effort, Aura still works
- Visualforce migration (79 pages) — VF is stable, migrate gradually
- Full WCAG 2.1 AA compliance — start with ARIA + keyboard nav
- Named Credentials migration — blocked on integration design decisions
- Platform Events — nice-to-have, Queueable+Finalizer covers most cases

---

## Dependencies (Simplified)

The original plan had WS-05 (Code Quality) blocking all Phase 2 work. This is removed — we shipped 5 security PRs without quality gates and the code is solid. Dependencies are now:

```
Phase 0 ✅ ──> Phase 1 ✅ ──> Phase 2 (ready)

Phase 2 workstreams can run in parallel:
  WS-03 (Async) — independent
  WS-04 (Performance) — independent
  WS-07 (Configuration) — needs $Setup audit first (P0 #2)

Phase 3 depends on Phase 2:
  WS-06 (UI) — start Tier 1 anytime, Tier 2+ after Phase 2
  WS-08 (Accessibility) — audit can start anytime
  WS-09 (Integration) — after WS-03 async patterns established
```

---

## Consolidated Assessment P0 Items

| # | Item | Status |
|---|------|--------|
| 1 | Functional analysis of 54 `without sharing` classes | ✅ RESOLVED (Phases 2a-2b) |
| 2 | Audit all `$Setup` references (Flows, PBs, VRs, Formulas) | ⏳ Open — blocks WS-07 only |
| 3 | Dual-path integration (Named Credential + CS fallback) | ⚠️ Reduced scope — Elevate removed |
| 4 | PII/data classification framework | ⏳ Open — not blocking concrete work |
| 5 | Platform Event payload security rules | ⏳ Open — only blocks PE feature (optional) |
| 6 | Platform Cache security model (Session vs Org cache) | ⏳ Open — blocks cache implementation |
| 7 | Resolve API version target inconsistency | ✅ RESOLVED (Phase 0, all docs target 63.0) |

**Practical impact**: Only P0 #2 blocks a specific workstream (WS-07). Items #4-6 are architectural decisions that can be made when the relevant work begins. Nothing blocks WS-03 or WS-04.

---

## Success Metrics

| Metric | Baseline | After Phase 1 | Phase 2 Target |
|--------|----------|---------------|---------------|
| API Version | 53.0 | **63.0** ✅ | 63.0 |
| `without sharing` (unjustified) | 54 | **~14** (justified) ✅ | <10 |
| Sharing declarations | 0 | **158 classes** ✅ | Maintain |
| CRUD/FLS checks | 16 | **23** (7 controller + 5 selector + 2 read + pre-existing) ✅ | Maintain |
| SOQL injection vectors | 8+ | **0** ✅ | 0 |
| DML wrapped (non-test) | 0 | **86 operations** ✅ | Maintain |
| `testMethod` remaining | 644 | **0** ✅ | 0 |
| `@track` (unnecessary) | ~90 | **0** ✅ | 0 |
| Apex test coverage | 85% | 85% | 88%+ |
| LWC Jest tests | 45 suites, 279 tests | 45 suites, 279 tests | +15 suites |
| `@future` methods | 13 | 13 | 0 |
| SOQL-in-loop violations | 7+ files | 7+ files | 0 |
| Aura components | 56 | 56 | 46 (Tier 1 migrated) |

---

## Subplan Index

| File | Workstream | Status |
|------|-----------|--------|
| [01-foundation-api.md](01-foundation-api.md) | WS-01: Foundation & API | ✅ Substantially complete |
| [02-security.md](02-security.md) | WS-02: Security Architecture | ✅ Core items complete |
| [03-async-apex.md](03-async-apex.md) | WS-03: Async Apex | Ready to start |
| [04-performance.md](04-performance.md) | WS-04: Performance | Ready to start |
| [05-code-quality.md](05-code-quality.md) | WS-05: Code Quality | Not started |
| [06-ui-modernization.md](06-ui-modernization.md) | WS-06: UI Modernization | Phase 3 |
| [07-configuration.md](07-configuration.md) | WS-07: Configuration | Blocked on P0 #2 |
| [08-accessibility.md](08-accessibility.md) | WS-08: Accessibility | Phase 3 |
| [09-integration.md](09-integration.md) | WS-09: Integration | Phase 3 |
| [10-testing.md](10-testing.md) | WS-10: Testing Strategy | Sprint 1-2 complete |

---

*Document Version: 2.0*
*Last Updated: 2026-02-16*
