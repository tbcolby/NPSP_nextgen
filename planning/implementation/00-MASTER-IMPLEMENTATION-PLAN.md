# NPSP_nextgen Master Implementation Plan

## Overview

This master plan translates the 10 architectural planning documents into agent-driven implementation workstreams. Each workstream maps to one or more specialized agents defined in `.claude/agents/domains/`, with the Supervisor Agent (`.claude/agents/ARCHITECTURE.md`) orchestrating cross-cutting coordination.

**Total Workstreams**: 10
**Total Phases**: 3 (Foundation → Core → Experience)
**Agent System**: 6 domain agents + 1 supervisor

---

## Phase Map

```
PHASE 0: PACKAGING & NAMESPACE (Pre-Phase 1)
├── Register npsp2 namespace
├── Configure 2GP unlocked package (sfdx-project.json)
├── Build namespace migration tooling (npsp__ → npsp2__)
└── Strip Elevate integration code

PHASE 1: FOUNDATION (Q1-Q2 2027)
├── WS-01: Foundation & API Modernization
├── WS-02: Security Architecture
└── WS-05: Code Quality & Standards

PHASE 2: CORE MODERNIZATION (Q2-Q3 2027)
├── WS-03: Async Apex Modernization
├── WS-04: Performance Optimization
├── WS-07: Configuration Architecture
└── WS-10: Testing Strategy

PHASE 3: EXPERIENCE & INTEGRATION (Q3-Q4 2027)
├── WS-06: UI Modernization Strategy
├── WS-08: Accessibility Compliance
└── WS-09: Integration Architecture
```

---

## Workstream → Agent Mapping

| Workstream | Primary Agent | Supporting Agents | Planning Doc |
|------------|--------------|-------------------|-------------|
| WS-01: Foundation & API | `apex_agent` | `devops_agent`, `testing_agent` | [01](../01-FOUNDATION-API-MODERNIZATION.md) |
| WS-02: Security | `security_agent` | `apex_agent`, `lwc_agent` | [02](../02-SECURITY-ARCHITECTURE.md) |
| WS-03: Async Apex | `apex_agent` | `testing_agent`, `devops_agent` | [03](../03-ASYNC-APEX-MODERNIZATION.md) |
| WS-04: Performance | `apex_agent` | `testing_agent`, `security_agent` | [04](../04-PERFORMANCE-OPTIMIZATION.md) |
| WS-05: Code Quality | `documentation_agent` | `apex_agent`, `lwc_agent`, `testing_agent` | [05](../05-CODE-QUALITY-STANDARDS.md) |
| WS-06: UI Modernization | `lwc_agent` | `apex_agent`, `testing_agent` | [06](../06-UI-MODERNIZATION-STRATEGY.md) |
| WS-07: Configuration | `apex_agent` | `devops_agent`, `testing_agent` | [07](../07-CONFIGURATION-ARCHITECTURE.md) |
| WS-08: Accessibility | `lwc_agent` | `testing_agent`, `documentation_agent` | [08](../08-ACCESSIBILITY-COMPLIANCE.md) |
| WS-09: Integration | `apex_agent` | `security_agent`, `devops_agent` | [09](../09-INTEGRATION-ARCHITECTURE.md) |
| WS-10: Testing | `testing_agent` | `apex_agent`, `lwc_agent`, `devops_agent` | [10](../10-TESTING-STRATEGY.md) |

---

## Phase 0: Packaging & Namespace (Pre-Phase 1)

**Goal**: Establish the package format, register the new namespace, strip proprietary integrations, and build data migration tooling before any code modernization begins.

### Packaging Setup
- **Lead**: `devops_agent`
- **Scope**: Register `npsp2` namespace (exact name TBD), configure namespaced 2GP unlocked package, update `sfdx-project.json` with package directory, namespace, and version settings
- **Key Deliverables**:
  - Registered `npsp2` namespace in a namespace org
  - `sfdx-project.json` configured for 2GP unlocked package with namespace
  - CI pipeline updated for `sf package version create` workflow
  - DevHub configured for package development

### Elevate Removal
- **Lead**: `apex_agent`
- **Scope**: Strip all Elevate payment processor integration code. Community forks cannot authenticate to Salesforce's proprietary Elevate service.
- **Key Deliverables**:
  - All `PS_*` (Payment Services) classes referencing Elevate removed or replaced with generic payment processor interface
  - `GE_PaymentServices` Elevate callouts stripped
  - Elevate Named Credential references removed
  - Elevate-specific Custom Metadata and Custom Settings removed
  - Generic `NPSP_PaymentProcessorInterface` created for community payment integrations

### Namespace Migration Tooling
- **Lead**: `apex_agent`, `devops_agent`
- **Scope**: Build tooling to help orgs migrate data from `npsp__` prefixed objects/fields to `npsp2__` equivalents
- **Key Deliverables**:
  - `NPSP2_NamespaceMigrationUtility` — Maps and migrates data from `npsp__` to `npsp2__` objects/fields
  - Field mapping configuration (Custom Metadata driven)
  - Pre-migration validation report (identifies orphaned references, formula fields, flows, etc.)
  - Post-migration verification tests
  - Admin-facing migration guide documentation

---

## Phase 1: Foundation (Q1-Q2 2027)

**Goal**: Establish the base layer that all other workstreams depend on. No code modernization can proceed safely without security baselines, code quality gates, and API foundations.

### WS-01: Foundation & API Modernization
- **Subplan**: [01-foundation-api.md](01-foundation-api.md)
- **Lead**: `apex_agent`
- **Scope**: API version uplift (53.0 → 63.0), deprecated API replacement, namespace hygiene, 2GP package setup
- **Key Deliverables**:
  - API version audit and upgrade path
  - Deprecated method inventory and replacement map
  - Foundation Apex base classes
- **Blocks**: WS-03, WS-04, WS-07, WS-09

### WS-02: Security Architecture
- **Subplan**: [02-security.md](02-security.md)
- **Lead**: `security_agent`
- **Scope**: Sharing mode audit (54 `without sharing` classes), CRUD/FLS enforcement, vulnerability scanning
- **Key Deliverables**:
  - Sharing mode remediation for all 54 classes
  - CRUD/FLS check framework using fflib_SecurityUtils
  - Security scanning pipeline integration
- **Blocks**: WS-03, WS-04, WS-06, WS-09

### WS-05: Code Quality & Standards
- **Subplan**: [05-code-quality.md](05-code-quality.md)
- **Lead**: `documentation_agent`
- **Scope**: PMD rulesets, ESLint config, ApexDoc/JSDoc coverage, naming conventions enforcement
- **Key Deliverables**:
  - PMD ruleset for NPSP patterns
  - ESLint configuration for LWC
  - Pre-commit hooks (PMD, ESLint, compile validation)
  - Code review checklist automation
- **Blocks**: All subsequent workstreams (quality gates)

### Phase 1 Dependencies
```
WS-05 (Code Quality) ──┐
                        ├──> Phase 2 can begin
WS-02 (Security) ──────┤
                        │
WS-01 (Foundation) ─────┘
```

---

## Phase 2: Core Modernization (Q2-Q3 2027)

**Goal**: Modernize the core backend patterns, test infrastructure, and configuration system. These changes are primarily backend and don't affect UX directly.

### WS-03: Async Apex Modernization
- **Subplan**: [03-async-apex.md](03-async-apex.md)
- **Lead**: `apex_agent`
- **Scope**: Migrate `@future` to Queueable, implement Platform Events, modernize batch patterns
- **Key Deliverables**:
  - `@future` → Queueable migration (all instances)
  - Platform Event infrastructure for async processing
  - Batch job monitoring framework
- **Depends on**: WS-01, WS-02

### WS-04: Performance Optimization
- **Subplan**: [04-performance.md](04-performance.md)
- **Lead**: `apex_agent`
- **Scope**: SOQL optimization, trigger bulkification audit, Platform Cache, LDV support
- **Key Deliverables**:
  - SOQL-in-loop elimination
  - Platform Cache layer for hot paths
  - Governor limit monitoring framework
  - LDV-safe batch patterns
- **Depends on**: WS-01, WS-02

### WS-07: Configuration Architecture
- **Subplan**: [07-configuration.md](07-configuration.md)
- **Lead**: `apex_agent`
- **Scope**: Migrate 14 Custom Settings → Custom Metadata Types with backward-compat layer
- **Key Deliverables**:
  - NPSP_ConfigurationService (unified config access)
  - CMT definitions for all 14 settings
  - Migration utility with metadata API deployment
  - Backwards-compatible facade
- **Depends on**: WS-01

### WS-10: Testing Strategy
- **Subplan**: [10-testing.md](10-testing.md)
- **Lead**: `testing_agent`
- **Scope**: Modernize test patterns, increase coverage, add test quality gates
- **Key Deliverables**:
  - `testMethod` → `@IsTest` migration (644 instances)
  - Test builder pattern expansion
  - CI test pipeline with coverage gates
  - LWC Jest test coverage baseline
- **Depends on**: WS-05

### Phase 2 Dependencies
```
WS-01 ──> WS-03 (Async)
WS-01 ──> WS-04 (Performance)
WS-01 ──> WS-07 (Configuration)
WS-02 ──> WS-03 (Async)
WS-02 ──> WS-04 (Performance)
WS-05 ──> WS-10 (Testing)

WS-03 + WS-04 can run in parallel
WS-07 + WS-10 can run in parallel
```

---

## Phase 3: Experience & Integration (Q3-Q4 2027)

**Goal**: Modernize the user-facing experience and external integrations. These are the highest-visibility changes.

### WS-06: UI Modernization Strategy
- **Subplan**: [06-ui-modernization.md](06-ui-modernization.md)
- **Lead**: `lwc_agent`
- **Scope**: Aura → LWC migration (35 components), VF page assessment, component library
- **Key Deliverables**:
  - Tier 1 Aura migration (10 simple components)
  - Tier 2 Aura migration (9 medium components)
  - Tier 3 Aura migration planning (16 complex components)
  - NPSP component library (base components)
- **Depends on**: WS-02, WS-05, WS-08

### WS-08: Accessibility Compliance
- **Subplan**: [08-accessibility.md](08-accessibility.md)
- **Lead**: `lwc_agent`
- **Scope**: WCAG 2.1 AA compliance, ARIA implementation, keyboard navigation, screen reader support
- **Key Deliverables**:
  - Accessibility audit of all 125 LWC components
  - ARIA label/role remediation
  - Keyboard navigation implementation
  - SA11Y test integration
- **Depends on**: WS-05, WS-10

### WS-09: Integration Architecture
- **Subplan**: [09-integration.md](09-integration.md)
- **Lead**: `apex_agent`
- **Scope**: Named Credentials migration, External Services, retry/circuit breaker patterns
- **Key Deliverables**:
  - NPSP_IntegrationService base class
  - Named Credentials for all integrations (SmartyStreets, Google, Cicero, generic payment processors)
  - Circuit breaker and retry framework
  - Integration monitoring dashboard
- **Depends on**: WS-01, WS-02, WS-03

### Phase 3 Dependencies
```
WS-02 + WS-05 + WS-08 ──> WS-06 (UI)
WS-05 + WS-10 ──> WS-08 (Accessibility)
WS-01 + WS-02 + WS-03 ──> WS-09 (Integration)

WS-08 must start before WS-06 (accessibility informs UI migration)
WS-06 Tier 1 can begin as soon as WS-08 audit completes
```

---

## Agent Execution Model

### Supervisor Orchestration

The Supervisor Agent coordinates all workstreams by:

1. **Sprint Planning**: Breaking workstream milestones into 2-week sprint tasks
2. **Agent Assignment**: Routing tasks to primary agents, notifying supporting agents
3. **Dependency Tracking**: Blocking downstream tasks until prerequisites complete
4. **Quality Gates**: Requiring `security_agent` review on all WS-02-dependent work
5. **Progress Reporting**: Aggregating agent status into workstream dashboards

### Agent Collaboration Patterns

```
PATTERN: Sequential Handoff (e.g., new Apex class)
  apex_agent → creates implementation
  security_agent → reviews sharing/CRUD/FLS
  testing_agent → creates tests
  documentation_agent → updates docs

PATTERN: Parallel Execution (e.g., Aura → LWC migration)
  lwc_agent → creates new LWC component     ─┐
  apex_agent → creates/updates controller    ─┼─> testing_agent → tests both
  security_agent → reviews both              ─┘

PATTERN: Consultation (e.g., performance fix)
  apex_agent → proposes optimization
  testing_agent → validates no regression
  apex_agent → finalizes change
```

### Quality Gate Protocol

Every deliverable passes through:
1. **Primary Agent**: Implements the change
2. **Security Agent**: Reviews security implications (WS-02 gate)
3. **Testing Agent**: Validates test coverage >= 85% (WS-10 gate)
4. **Code Quality Gate**: PMD + ESLint clean (WS-05 gate)
5. **Documentation Agent**: Updates relevant docs

---

## Risk Matrix

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Namespace migration (npsp__ → npsp2__) breaks subscriber automations | Critical | High | Migration tooling with pre-migration validation, field mapping config |
| API version upgrade breaks custom code | High | Medium | Incremental upgrade with per-class testing |
| Sharing mode changes break user access | Critical | Medium | Test with multiple profiles, gradual rollout |
| Custom Settings → CMT migration loses data | High | Low | Migration utility with validation + rollback |
| Aura → LWC migration breaks existing pages | High | Medium | Side-by-side deployment, feature flags |
| Test coverage drops during refactoring | Medium | High | Coverage-gated CI pipeline, no-regression tests |
| Agent coordination deadlocks | Medium | Low | Supervisor timeout + escalation to human |

---

## Success Metrics (Overall)

| Metric | Baseline | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|----------|---------------|---------------|---------------|
| API Version | 53.0 | 63.0 | 63.0 | 63.0 |
| `without sharing` classes | 54 | <10 | <5 | 0 |
| CRUD/FLS coverage | 16 checks | 50%+ | 80%+ | 100% |
| PMD critical violations | Unknown | 0 | 0 | 0 |
| Apex test coverage | 85% | 85% | 88% | 90%+ |
| LWC test coverage | Unknown | Baseline | 60%+ | 80%+ |
| Aura components | 35 | 35 | 25 | <10 |
| Custom Settings | 14 | 14 | 7 | 0 |
| Named Credentials | 0 | 0 | 2+ | 4+ |
| Accessibility violations | Unknown | Audit done | 50% fixed | 0 critical |

---

## Subplan Index

| File | Workstream | Phase |
|------|-----------|-------|
| [01-foundation-api.md](01-foundation-api.md) | WS-01: Foundation & API | 1 |
| [02-security.md](02-security.md) | WS-02: Security Architecture | 1 |
| [03-async-apex.md](03-async-apex.md) | WS-03: Async Apex | 2 |
| [04-performance.md](04-performance.md) | WS-04: Performance | 2 |
| [05-code-quality.md](05-code-quality.md) | WS-05: Code Quality | 1 |
| [06-ui-modernization.md](06-ui-modernization.md) | WS-06: UI Modernization | 3 |
| [07-configuration.md](07-configuration.md) | WS-07: Configuration | 2 |
| [08-accessibility.md](08-accessibility.md) | WS-08: Accessibility | 3 |
| [09-integration.md](09-integration.md) | WS-09: Integration | 3 |
| [10-testing.md](10-testing.md) | WS-10: Testing Strategy | 2 |
| [agent-coordination-playbook.md](agent-coordination-playbook.md) | Cross-cutting | All |

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
*Author: NPSP_nextgen Implementation Team*
