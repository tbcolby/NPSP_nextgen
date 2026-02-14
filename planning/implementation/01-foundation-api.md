# WS-01: Foundation & API Modernization — Implementation Subplan

**Phase**: 1 (Foundation)
**Primary Agent**: `apex_agent`
**Supporting Agents**: `devops_agent`, `testing_agent`
**Planning Doc**: [01-FOUNDATION-API-MODERNIZATION.md](../01-FOUNDATION-API-MODERNIZATION.md)
**Blocks**: WS-03, WS-04, WS-07, WS-09

---

## Objective

Upgrade the NPSP codebase from API version 53.0 to 63.0, replace all deprecated API calls, establish foundation base classes that other workstreams build upon, and configure the 2GP unlocked package with the `npsp2` namespace.

---

## Sprint Breakdown

### Sprint 1-2: 2GP Package Setup & API Version Audit

**Agent**: `devops_agent`
**Tasks (2GP Setup)**:
1. Register `npsp2` namespace in a namespace org (exact name TBD)
2. Configure `sfdx-project.json` for 2GP unlocked package:
   ```json
   {
     "packageDirectories": [
       {
         "path": "force-app",
         "default": true,
         "package": "NPSP_nextgen",
         "versionName": "ver 4.0",
         "versionNumber": "4.0.0.NEXT"
       }
     ],
     "namespace": "npsp2",
     "sfdcLoginUrl": "https://login.salesforce.com",
     "sourceApiVersion": "63.0"
   }
   ```
3. Create package in DevHub: `sf package create --name "NPSP_nextgen" --package-type Unlocked --path force-app --namespace npsp2`
4. Set up CI pipeline for `sf package version create` workflow
5. Configure scratch org definitions to use namespace

**Agent**: `apex_agent`
**Tasks (API Audit)**:
1. Scan all 1,689 Apex classes for `apiVersion` in `-meta.xml` files
2. Identify classes still on API versions < 53.0
3. Catalog all deprecated API usages:
   - Deprecated Apex methods (`Database.query` patterns, old `Test` methods)
   - Deprecated SOAP/REST endpoints
   - Removed field references
4. Generate risk-ranked upgrade plan (classes with fewest dependencies first)

**Agent**: `devops_agent`
**Tasks**:
1. Create scratch org definition with API 63.0
2. Set up automated compile validation pipeline for version bumps
3. Configure CumulusCI task for batch API version updates

**Deliverables**:
- `docs/api-audit-report.md` — Full inventory of current versions and deprecated usages
- Updated `sfdx-project.json` with target API version
- CI job: `validate-api-version`

### Sprint 3-4: Incremental API Version Upgrade

**Agent**: `apex_agent`
**Tasks**:
1. Upgrade low-risk classes first (utilities, helpers, selectors):
   - `UTIL_*` classes (~50 classes)
   - `*_SEL` / `*Selector` classes
   - `ERR_*` classes
2. Fix compile errors from deprecated API removals
3. Update `@AuraEnabled` method signatures for API 63.0 compatibility
4. Replace deprecated `Test.startTest()`/`Test.stopTest()` patterns if any

**Agent**: `testing_agent`
**Tasks**:
1. Run full Apex test suite after each batch upgrade
2. Track coverage delta per batch
3. Flag any test failures for `apex_agent` remediation

**Deliverables**:
- All utility/helper/selector classes on API 63.0
- Zero test regressions from upgrades
- Updated compile validation passing

### Sprint 5-6: Core Domain Class Upgrades

**Agent**: `apex_agent`
**Tasks**:
1. Upgrade domain service classes (highest risk):
   - `RD2_*` (Recurring Donations) — 30+ classes
   - `CRLP_*` (Customizable Rollups) — 40+ classes
   - `BDI_*` (Batch Data Import) — 20+ classes
   - `ALLO_*` (Allocations) — 10+ classes
   - `GE_*` (Gift Entry) — 15+ classes
   - `HH_*` (Households) — 15+ classes
2. Update TDTM trigger handler metadata for new API version
3. Replace any `Database.query()` string-based SOQL with typed queries where possible

**Agent**: `security_agent` (consulting)
**Tasks**:
1. Review upgraded classes for security regression
2. Flag any new `without sharing` exposure from API changes

**Deliverables**:
- All core domain classes on API 63.0
- Full test suite green
- Security review sign-off on domain classes

### Sprint 7-8: Foundation Base Classes & Cleanup

**Agent**: `apex_agent`
**Tasks**:
1. Create foundation base classes:
   - `NPSP_BaseService` — Standard service layer base with error handling
   - `NPSP_BaseSelector` — Selector base with CRUD/FLS checks built in
   - `NPSP_BaseBatch` — Batch base with monitoring and retry
   - `NPSP_BaseTriggerHandler` — Enhanced TDTM handler base
2. Update `sfdx-project.json` sourceApiVersion to 63.0
3. Remove all deprecated API workarounds

**Agent**: `testing_agent`
**Tasks**:
1. Create tests for all new base classes
2. Validate 85%+ coverage on base classes
3. Create test utilities for base class testing

**Agent**: `documentation_agent`
**Tasks**:
1. Document base class APIs and usage patterns
2. Create migration guide for contributors

**Deliverables**:
- 4 foundation base classes with full test coverage
- `sourceApiVersion: "63.0"` in project config
- Migration guide for contributors

---

## Agent Coordination Protocol

```
Sprint Start:
  supervisor → apex_agent: "Begin Sprint N tasks for WS-01"
  supervisor → testing_agent: "Prepare regression test baseline"

During Sprint:
  apex_agent → testing_agent: "Batch X upgraded, run tests"
  testing_agent → apex_agent: "3 failures in CRLP_Rollup_TEST, details attached"
  apex_agent → testing_agent: "Fixes applied, re-run"
  testing_agent → supervisor: "All green, coverage at 86%"

Sprint End:
  apex_agent → security_agent: "Sprint N classes ready for security review"
  security_agent → supervisor: "Review complete, 2 medium findings, details in report"
  supervisor → apex_agent: "Address security findings before Sprint N+1"
```

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| Compile | All classes compile on API 63.0 | `devops_agent` (CI) |
| Tests | Full test suite passes, coverage >= 85% | `testing_agent` |
| Security | No new `without sharing` without justification | `security_agent` |
| Quality | PMD clean (no critical/high violations) | `devops_agent` (CI) |

---

## Rollback Plan

- Each sprint's changes are in a separate branch
- If API upgrade causes unfixable issues in a domain, that domain can remain on prior version temporarily
- `sfdx-project.json` version bump is the final step (Sprint 7-8), only after all classes pass

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| Classes on API 63.0 | 0% | 30% | 80% | 100% |
| Deprecated API usages | TBD | -50% | -90% | 0 |
| Base classes created | 0 | 0 | 0 | 4 |
| 2GP package configured | No | Yes | Yes | Yes |
| Test coverage | 85% | 85% | 85% | 86%+ |

---

*Subplan Version: 1.1*
*Last Updated: 2026-02-13*
