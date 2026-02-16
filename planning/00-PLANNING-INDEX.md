# NPSP_nextgen Modernization Planning Index

This directory contains CTA-level architectural planning documents for the NPSP_nextgen modernization initiative. Each document addresses a specific modernization domain with detailed analysis, trade-offs, and implementation guidance aligned with Salesforce Well-Architected Framework principles.

## Document Index

| # | Document | Domain | Status |
|---|----------|--------|--------|
| 01 | [Foundation & API Modernization](01-FOUNDATION-API-MODERNIZATION.md) | Platform Foundation | **Complete** |
| 02 | [Security Architecture](02-SECURITY-ARCHITECTURE.md) | Security & Trust | Draft |
| 03 | [Async Apex Modernization](03-ASYNC-APEX-MODERNIZATION.md) | Performance & Scalability | Draft |
| 04 | [Performance Optimization](04-PERFORMANCE-OPTIMIZATION.md) | Performance & Scalability | Draft |
| 05 | [Code Quality & Standards](05-CODE-QUALITY-STANDARDS.md) | Maintainability | Draft |
| 06 | [UI Modernization Strategy](06-UI-MODERNIZATION-STRATEGY.md) | User Experience | Draft |
| 07 | [Configuration Architecture](07-CONFIGURATION-ARCHITECTURE.md) | Flexibility & Maintainability | Draft |
| 08 | [Accessibility Compliance](08-ACCESSIBILITY-COMPLIANCE.md) | User Experience & Compliance | Draft |
| 09 | [Integration Architecture](09-INTEGRATION-ARCHITECTURE.md) | Integration & Extensibility | Draft |
| 10 | [Testing Strategy](10-TESTING-STRATEGY.md) | Quality & Reliability | Draft |

## Implementation Progress

| Phase | PR | Status | Key Changes |
|-------|-----|--------|-------------|
| Phase 0 | [PR #1](https://github.com/tbcolby/NPSP_nextgen/pull/1) (merged) | **Complete** | Namespace npsp→npsp2, API 53→63, Elevate removal, CCI 4.6.0, CI fixes |
| Phase 1 | [PR #2](https://github.com/tbcolby/NPSP_nextgen/pull/2) (merged) | **Complete** | testMethod→@IsTest (648), @track cleanup (90), deps update, ESLint fixes |
| Phase 2a | [PR #3](https://github.com/tbcolby/NPSP_nextgen/pull/3) (merged) | **Complete** | SOQL injection fixes (8 files), sharing declarations (46 classes), hardcoded ID docs |
| Phase 2b | [PR #4](https://github.com/tbcolby/NPSP_nextgen/pull/4) (merged) | **Complete** | GE_LookupController injection fix, sharing complete (112 classes), hardcoded IDs audit |
| Phase 2c | [PR #5](https://github.com/tbcolby/NPSP_nextgen/pull/5) (merged) | **Complete** | CRUD/FLS enforcement (7 controller methods), DML wrapping (31 bare DML in 11 controllers) |
| Phase 2d | [PR #6](https://github.com/tbcolby/NPSP_nextgen/pull/6) (merged) | **Complete** | DML wrapping complete: services (8 files), TDTM (5 files), batch (6 files), utilities (8 files) — 55 bare DML converted |
| Phase 2e | PR #7 | **In Progress** | Selector FLS hardening (5 selectors), controller read-access guards (2 controllers), item 2.4 complete |
| Phase 2f+ | — | Not started | Input validation, remaining security items (2.6-2.12) |

## Salesforce Well-Architected Framework Alignment

These planning documents are structured around the five pillars of the Salesforce Well-Architected Framework:

### 1. Trusted
- Security best practices and patterns
- Data protection and privacy
- Compliance considerations

### 2. Easy
- User experience optimization
- Accessibility standards
- Intuitive configuration

### 3. Adaptable
- Flexible architecture patterns
- Configuration-driven behavior
- Extensibility points

### 4. Intentional
- Purpose-driven design decisions
- Clear trade-off documentation
- Measurable outcomes

### 5. Automated
- CI/CD integration
- Automated testing
- Self-healing patterns

## CTA Review Criteria

Each planning document addresses:

1. **Current State Analysis**: Detailed assessment of existing implementation
2. **Target State Architecture**: Vision for modernized state
3. **Gap Analysis**: Specific gaps between current and target
4. **Trade-off Analysis**: Pros, cons, and alternatives for each decision
5. **Risk Assessment**: Technical, operational, and adoption risks
6. **Migration Strategy**: Phased approach with rollback capabilities
7. **Success Metrics**: Measurable KPIs for each initiative
8. **Dependencies**: Cross-cutting concerns and sequencing

## Cross-Cutting Concerns

Several themes apply across all planning documents:

### Backwards Compatibility
All modernization efforts must maintain backwards compatibility for the thousands of existing NPSP orgs. This means:
- No breaking changes to public APIs
- Graceful degradation for older configurations
- Data migration paths that preserve existing data

### Incremental Delivery
Changes should be deliverable in small, testable increments that can be:
- Deployed independently
- Rolled back without data loss
- Tested in isolation

### Community Governance
As a community project, decisions must consider:
- Contributor accessibility
- Documentation requirements
- Review process scalability

## How to Use These Documents

1. **For Contributors**: Review relevant planning docs before implementing changes
2. **For Reviewers**: Use as reference for architectural review of PRs
3. **For Adopters**: Understand the direction and rationale of changes
4. **For Architects**: Evaluate trade-offs and provide feedback

## Implementation Plans

Detailed implementation subplans with sprint breakdowns, agent assignments, and quality gates:

| File | Workstream | Phase |
|------|-----------|-------|
| [Master Implementation Plan](implementation/00-MASTER-IMPLEMENTATION-PLAN.md) | All | All |
| [01-foundation-api.md](implementation/01-foundation-api.md) | WS-01: Foundation & API | 1 |
| [02-security.md](implementation/02-security.md) | WS-02: Security Architecture | 1 |
| [03-async-apex.md](implementation/03-async-apex.md) | WS-03: Async Apex | 2 |
| [04-performance.md](implementation/04-performance.md) | WS-04: Performance | 2 |
| [05-code-quality.md](implementation/05-code-quality.md) | WS-05: Code Quality | 1 |
| [06-ui-modernization.md](implementation/06-ui-modernization.md) | WS-06: UI Modernization | 3 |
| [07-configuration.md](implementation/07-configuration.md) | WS-07: Configuration | 2 |
| [08-accessibility.md](implementation/08-accessibility.md) | WS-08: Accessibility | 3 |
| [09-integration.md](implementation/09-integration.md) | WS-09: Integration | 3 |
| [10-testing.md](implementation/10-testing.md) | WS-10: Testing Strategy | 2 |
| [Agent Coordination Playbook](implementation/agent-coordination-playbook.md) | Cross-cutting | All |

## Assessment Reports

Each plan has been audited for accuracy, Salesforce Well-Architected alignment, and NPSP backwards compatibility:

| Assessment | Overall Rating | Key Risk |
|-----------|---------------|----------|
| [Consolidated Assessment](assessments/00-CONSOLIDATED-ASSESSMENT.md) | **Approved with Conditions** | 7 P0 items before Sprint 1 |
| [WS-01 Assessment](assessments/01-foundation-api-assessment.md) | Adequate | API version target inconsistency |
| [WS-02 Assessment](assessments/02-security-assessment.md) | Adequate+ | Sharing mode conversion is CRITICAL risk |
| [WS-03 Assessment](assessments/03-async-apex-assessment.md) | Adequate | Platform Event payload security |
| [WS-04 Assessment](assessments/04-performance-assessment.md) | Adequate- | System.debug monitoring not production-viable |
| [WS-05 Assessment](assessments/05-code-quality-assessment.md) | Adequate+ | No secrets scanning |
| [WS-06 Assessment](assessments/06-ui-modernization-assessment.md) | Adequate | Aura event subscribers will break |
| [WS-07 Assessment](assessments/07-configuration-assessment.md) | Strong- | `$Setup` references in automation unaddressed |
| [WS-08 Assessment](assessments/08-accessibility-assessment.md) | Strong | Highest-rated plan; shadow DOM test patterns need update |
| [WS-09 Assessment](assessments/09-integration-assessment.md) | Strong- | Named Credential with no fallback is CRITICAL |
| [WS-10 Assessment](assessments/10-testing-assessment.md) | Adequate | No flaky test detection |
| [Playbook Assessment](assessments/agent-coordination-playbook-assessment.md) | Adequate | Dependency matrix gaps; agent roster incomplete |
| [Cross-Cutting Assessment](assessments/cross-cutting-assessment.md) | Requires Attention | No formal backwards compatibility contract |

## DevOps Procedures

Operational procedures for branching, releases, environments, deployments, hotfixes, and monitoring:

| File | Topic | Scope |
|------|-------|-------|
| [01-branching-strategy.md](devops/01-branching-strategy.md) | Branching Strategy | Branch naming, agent ownership, merge order, protection rules |
| [02-release-management.md](devops/02-release-management.md) | Release Management | Semantic versioning, release cadence, CumulusCI flows, rollback |
| [03-environment-strategy.md](devops/03-environment-strategy.md) | Environment Strategy | 5-tier model, variant testing, scratch org limits, secrets |
| [04-deployment-runbook.md](devops/04-deployment-runbook.md) | Deployment Runbook | Pre-deployment checks, deployment order, rollback procedures |
| [05-hotfix-procedure.md](devops/05-hotfix-procedure.md) | Hotfix Procedure | Severity classification, hotfix workflow, isolation rules |
| [06-monitoring-alerting-strategy.md](devops/06-monitoring-alerting-strategy.md) | Monitoring & Alerting | 3-layer monitoring, alert rules, CI/CD health dashboard |

## Testing Strategies

Detailed testing plans covering test data, regression, E2E, performance, backwards compatibility, and UAT:

| File | Topic | Scope |
|------|-------|-------|
| [01-test-data-strategy.md](testing/01-test-data-strategy.md) | Test Data Strategy | 5-tier data model, builder patterns, JSON fixtures, LDV datasets |
| [02-regression-test-suite.md](testing/02-regression-test-suite.md) | Regression Test Suite | 4-tier regression (Smoke→Core→Full→Extended), failure protocol |
| [03-e2e-test-plan.md](testing/03-e2e-test-plan.md) | E2E Test Plan | Test pyramid, Robot Framework, cross-agent integration scenarios |
| [04-performance-load-testing.md](testing/04-performance-load-testing.md) | Performance & Load Testing | Governor budgets, bulk processing, LDV, data skew, concurrency |
| [05-backwards-compatibility-tests.md](testing/05-backwards-compatibility-tests.md) | BC Test Suite | Public API contract, sharing comparison, CS compat, waiver process |
| [06-uat-process.md](testing/06-uat-process.md) | UAT Process | UAT roles, environment setup, test scripts per phase, defect mgmt |

## Policies & Guides

Cross-cutting policies and contributor documentation:

| File | Topic | Scope |
|------|-------|-------|
| [backwards-compatibility-policy.md](backwards-compatibility-policy.md) | Backwards Compatibility Policy | Public API tiers, deprecation process, sharing/CS/Aura rules |
| [incident-response-plan.md](incident-response-plan.md) | Incident Response Plan | SEV-1 through SEV-4, response workflow, escalation matrix |
| [contributor-guide.md](contributor-guide.md) | Contributor Guide | Setup, coding standards, PR process, CumulusCI reference |

## Key Architectural Decisions

The following decisions were made during the NPPatch best practices review (2026-02-13) and apply across all planning documents:

### Decision 1: 2GP Unlocked Package

| | |
|---|---|
| **Decision** | NPSP_nextgen ships as a namespaced second-generation (2GP) unlocked package |
| **Rationale** | 2GP unlocked packages provide versioned releases, subscriber upgrade management, namespace isolation, and alignment with Salesforce's recommended packaging model. Unlocked (vs. managed) allows source transparency for the open-source community while still supporting namespace encapsulation. |
| **Impact** | WS-01 (package setup), WS-07 (CMTs included in package), WS-10 (75% minimum coverage for package creation), DevOps (hotfixes require new package versions) |

### Decision 2: New Namespace `npsp2`

| | |
|---|---|
| **Decision** | Use a new namespace `npsp2` (placeholder, exact name TBD) instead of the legacy `npsp__` namespace |
| **Rationale** | A clean break avoids metadata conflicts with existing NPSP installations, simplifies the public API surface definition, and eliminates the risk of collisions with subscriber customizations referencing `npsp__` API names. Orgs can run both packages side-by-side during migration. |
| **Impact** | All workstreams (all metadata uses the new namespace), backwards compatibility policy (new namespace means no implicit breaking changes to `npsp__` references) |

### Decision 3: Remove Elevate

| | |
|---|---|
| **Decision** | Strip all proprietary Elevate payment processor integration code |
| **Rationale** | Community forks cannot authenticate to Salesforce's proprietary Elevate service. Retaining this code adds complexity, test burden, and maintenance cost with no benefit to the open-source community. A generic payment processor interface can be provided for community-built integrations. |
| **Impact** | WS-09 (Elevate sprint removed, integration scope reduced), WS-06 (RD2_EntryForm Elevate dependency removed), assessments (Named Credential risk downgraded) |

### Decision 4: API 63.0 / CCI 4.6.0

| | |
|---|---|
| **Decision** | Target Salesforce API version 63.0 and CumulusCI 4.6.0 across all documents |
| **Rationale** | Resolves the API version target inconsistency (previously 60.0 vs 62.0+). API 63.0 is the current stable release, and targeting it provides access to the latest platform features. CCI 4.6.0 provides the latest build tooling and 2GP support. |
| **Impact** | WS-01 (primary), all workstreams (consistent version baseline), P0 #7 in consolidated assessment resolved |

---

## Feedback and Updates

These are living documents. To propose changes:
1. Open an issue with the `architecture` label
2. Reference the specific planning document
3. Provide rationale aligned with Well-Architected principles

---

*Last Updated: 2026-02-16*
