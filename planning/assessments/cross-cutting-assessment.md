# Cross-Cutting Assessment — Systemic Concerns

**Review Date**: 2026-02-12
**Scope**: Issues spanning multiple workstreams and systemic architectural gaps
**Overall Rating**: **Requires Attention**

---

## NPPatch Decisions Impact (2026-02-13)

Two NPPatch best practices review decisions address systemic concerns in this assessment:

- **2GP Unlocked Package**: The decision to ship as a namespaced 2GP unlocked package resolves distribution concerns. 2GP packages provide a clear upgrade path, support namespace isolation, and enable versioned releases with subscriber management. This strengthens the "Adaptable" and "Automated" pillars across all workstreams.
- **New namespace `npsp2`** (placeholder, TBD): A clean break from the legacy `npsp__` namespace addresses the backwards compatibility concern around public API surface definition (Concern A below). The new namespace means all metadata is explicitly new, reducing the risk of accidental collisions with existing NPSP installations. This also simplifies the breaking change definition -- changes within `npsp2` do not break existing `npsp__` references.

---

## Systemic Concern A: No Formal Backwards Compatibility Contract

The planning index (`00-PLANNING-INDEX.md`) states:
> No breaking changes to public APIs / Graceful degradation for older configurations / Data migration paths that preserve existing data.

This is a three-line aspiration, not an enforceable contract. There is no:

- **Public API surface definition**: Which classes, methods, events, Custom Settings, and metadata types constitute the "public API"?
- **Breaking change definition**: Does changing sharing mode count? Does removing an Aura event count? Does changing CMT field names count?
- **Versioning strategy**: No semantic versioning, deprecation timeline, or sunset period for public APIs
- **Enforcement mechanism**: No quality gate checks for backwards compatibility beyond WS-07's "all existing tests pass"

### Recommendation

Create a formal **NPSP Backwards Compatibility Policy** document that defines:

1. The public API surface (exhaustive list of public/global classes, @AuraEnabled methods, Aura events, Custom Settings, Custom Metadata Types, Platform Events)
2. What constitutes a breaking change (with examples)
3. Required deprecation timeline (minimum 2 major releases)
4. Testing requirements for any change touching the public surface
5. Exception process for unavoidable breaking changes

---

## Systemic Concern B: No Backwards Compatibility Testing Strategy

The quality gates focus on test coverage (85%), security review, and code quality. None include:
- "All existing test classes pass without modification"
- "External consumer simulation tests pass"
- "Sharing behavior comparison tests pass"

WS-07 includes "Backwards compat: All existing tests pass without modification" as a quality gate — but only for the configuration workstream. This should be a **global gate for all workstreams**.

### Recommendation

1. Make "All existing tests pass without modification" a blocking quality gate for ALL workstreams
2. Create a "consumer simulation test suite" that exercises public APIs from an external perspective
3. Create a "sharing behavior comparison suite" that runs operations as restricted users and compares results before/after changes

---

## Systemic Concern C: No Community Impact Assessment Process

The planning documents mention "community governance" and "contributor accessibility" but do not define:
- How changes affect existing NPSP orgs (thousands of installations)
- How to gather feedback from orgs before implementing breaking changes
- How to provide migration tooling for orgs that have customized NPSP
- How external contributors' PRs are handled within the agent framework

### Recommendation

Add a community engagement section to the coordination playbook:
1. Impact assessment template for changes affecting existing orgs
2. Community feedback process for significant architectural changes
3. Migration tooling requirements for breaking changes
4. External contributor PR routing through the agent system

---

## Systemic Concern D: Production Monitoring Absent

Across all 10 workstreams, production monitoring and alerting is the weakest area. The plans have strong CI/CD automation for development workflow (pre-commit, PR checks, CI gates), but:

- **WS-04**: `NPSP_LimitsMonitor` uses `System.debug` — not visible in production
- **WS-03**: Batch monitoring dashboard has no alerting thresholds
- **WS-09**: Integration failure alerts via Platform Events but no recipients specified
- **WS-02**: No production security monitoring (Event Monitoring not mentioned)

For a package installed in thousands of orgs, production observability is critical.

### Recommendation

Design a cross-cutting production monitoring strategy:
1. Replace all `System.debug`-based monitoring with Platform Events or custom objects
2. Define alerting thresholds and recipients for:
   - Batch job failures (>5% failure rate)
   - Integration callout failures (circuit breaker opens)
   - Governor limit warnings (>80% consumption in critical paths)
   - Security anomalies (via Event Monitoring)
3. Create an admin-facing monitoring dashboard

---

## Systemic Concern E: Broken Cross-References

Planning docs 01 and 02 both reference `../documentation/MODERNIZATION_BURNDOWN.md` which does not exist in the repository. This suggests either:
- A planned file that was never created
- A reference to a file that was moved or renamed

### Recommendation

Either create the file or remove the broken references.

---

## Systemic Concern F: TBD Baselines Undermine Measurability

Multiple workstreams have success metrics starting at "TBD":

| Workstream | TBD Metrics |
|-----------|-------------|
| WS-01 | Deprecated API usages |
| WS-02 | SOQL injection vectors, PMD security violations |
| WS-03 | `@future` count, Queueable count, async test coverage |
| WS-04 | SOQL/DML-in-loop violations, avg SOQL per Contact insert |
| WS-05 | PMD critical violations, ESLint errors |

These are all established during Sprint 1-2 audits, which is appropriate. However, there is no process for updating the success metrics tables once audits complete.

### Recommendation

Formalize a "baseline freeze" milestone at the end of Sprint 2 for each workstream. Update all success metrics tables with concrete numbers. Use these as the binding targets for quality gates.

---

## Summary of Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| **P0** | Create backwards compatibility policy | Define public API, breaking changes, deprecation timeline |
| **P1** | Make "existing tests pass" a global gate | Not just WS-07; applies to all workstreams |
| **P1** | Design production monitoring strategy | Replace System.debug; define alerting and recipients |
| **P1** | Fix broken MODERNIZATION_BURNDOWN.md refs | Create file or remove references |
| **P1** | Formalize baseline freeze process | Update TBD metrics after Sprint 2 audits |
| **P2** | Create consumer simulation test suite | Test public APIs from external perspective |
| **P3** | Add community impact assessment process | Template, feedback process, migration tooling |

---

*Assessment Version: 1.1*
*Last Updated: 2026-02-13*
