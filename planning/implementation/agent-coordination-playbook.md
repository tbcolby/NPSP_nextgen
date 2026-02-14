# Agent Coordination Playbook

**Scope**: Cross-cutting coordination across all workstreams
**Owner**: Supervisor Agent (`.claude/agents/ARCHITECTURE.md`)
**Agents**: All 6 domain agents

---

## Overview

This playbook defines how the 6 domain agents coordinate across the 10 implementation workstreams. It covers communication patterns, handoff protocols, conflict resolution, quality gate enforcement, and escalation paths.

---

## Agent Roster

| Agent | Domain | Primary Workstreams | Supporting Workstreams |
|-------|--------|--------------------|-----------------------|
| `apex_agent` | Apex backend, TDTM, services | WS-01, WS-03, WS-04, WS-07, WS-09 | WS-02, WS-05, WS-06 |
| `lwc_agent` | LWC, Aura, frontend JS | WS-06, WS-08 | WS-02, WS-05 |
| `testing_agent` | Tests, coverage, quality | WS-10 | WS-01-09 (all) |
| `security_agent` | Security, CRUD/FLS, sharing | WS-02 | WS-01, WS-04, WS-09 |
| `devops_agent` | CI/CD, deployment, tooling | — | WS-01, WS-03, WS-05, WS-07, WS-08, WS-09, WS-10 |
| `documentation_agent` | Docs, ApexDoc, JSDoc | WS-05 | WS-06, WS-08 |

---

## Communication Protocols

### 1. Task Assignment (Supervisor → Agent)

```yaml
message_type: task_assignment
from: supervisor
to: <agent_id>
payload:
  workstream: "WS-XX"
  sprint: N
  task_id: "WS-XX-SN-TN"
  description: "Task description"
  acceptance_criteria:
    - "Criteria 1"
    - "Criteria 2"
  dependencies:
    - "WS-XX-SN-TN (completed)"
  supporting_agents:
    - agent_id: "testing_agent"
      role: "Create tests after implementation"
```

### 2. Consultation Request (Agent → Agent)

```yaml
message_type: consultation
from: lwc_agent
to: apex_agent
context:
  workstream: "WS-06"
  task: "Migrate HH_AutoComplete to LWC"
request: "What Apex controller methods are available for contact search?"
urgency: normal
```

### 3. Handoff (Agent → Agent)

```yaml
message_type: handoff
from: apex_agent
to: testing_agent
context:
  workstream: "WS-03"
  task: "Queueable migration for RD2_ProcessAsync"
payload:
  files_changed:
    - "force-app/main/default/classes/RD2_ProcessAsync.cls"
    - "force-app/main/default/classes/RD2_ProcessAsync.cls-meta.xml"
  what_changed: "Converted @future to Queueable with retry logic"
  test_requirements:
    - "Verify bulk processing (200+ records)"
    - "Verify retry on failure (simulate 3 retries)"
    - "Verify error logging to ERR_Handler"
```

### 4. Quality Gate Check (Agent → Supervisor)

```yaml
message_type: quality_gate_result
from: testing_agent
to: supervisor
context:
  workstream: "WS-03"
  sprint: 3
gate: "test_coverage"
result: "pass"
details:
  coverage: 87.2
  required: 85.0
  new_tests: 12
  regressions: 0
```

### 5. Escalation (Agent → Supervisor → Human)

```yaml
message_type: escalation
from: security_agent
to: supervisor
severity: high
context:
  workstream: "WS-02"
  finding: "CRLP_ApiService uses without sharing and processes user-supplied field names"
reason: "Potential SOQL injection + sharing bypass. Needs architectural decision."
recommended_action: "Block deployment until human architect reviews"
```

---

## Standard Workflow Patterns

### Pattern A: New Apex Implementation

Used for WS-01, WS-03, WS-04, WS-07, WS-09

```
1. supervisor → apex_agent: Task assignment
2. apex_agent: Implements change
3. apex_agent → security_agent: "Review sharing + CRUD/FLS"
4. security_agent: Reviews, returns findings
5. apex_agent: Addresses findings
6. apex_agent → testing_agent: "Create/update tests"
7. testing_agent: Creates tests, runs full suite
8. testing_agent → supervisor: Quality gate result
9. documentation_agent: Updates docs if needed
10. supervisor: Marks task complete
```

### Pattern B: LWC Component Work

Used for WS-06, WS-08

```
1. supervisor → lwc_agent: Task assignment
2. lwc_agent: Implements component
3. lwc_agent → apex_agent: "Need controller method?" (if applicable)
4. apex_agent: Creates controller (→ follows Pattern A for Apex part)
5. lwc_agent → testing_agent: "Create Jest tests"
6. testing_agent: Creates tests with SA11Y
7. security_agent: Reviews client-side security
8. testing_agent → supervisor: Quality gate result
9. supervisor: Marks task complete
```

### Pattern C: Cross-Cutting Infrastructure

Used for WS-05, WS-10

```
1. supervisor → lead_agent: Task assignment
2. lead_agent: Implements infrastructure
3. lead_agent → all_agents: "New standard/tool available"
4. devops_agent: Integrates into CI pipeline
5. testing_agent: Validates infrastructure
6. documentation_agent: Documents for contributors
7. supervisor: Marks task complete, notifies all agents
```

### Pattern D: Security Remediation

Used for WS-02

```
1. security_agent: Identifies vulnerability
2. security_agent → apex_agent (or lwc_agent): "Fix required"
3. implementing_agent: Makes fix
4. security_agent: Verifies fix
5. testing_agent: Adds security-specific test
6. devops_agent: Updates CI security scan
7. supervisor: Marks remediated
```

---

## Cross-Workstream Dependencies

### Dependency Matrix

```
        WS01 WS02 WS05 WS03 WS04 WS07 WS10 WS06 WS08 WS09
WS-01    -
WS-02         -
WS-05              -
WS-03   dep  dep        -
WS-04   dep  dep             -
WS-07   dep                       -
WS-10             dep                  -
WS-06        dep  dep                       -
WS-08             dep             dep             -
WS-09   dep  dep       dep                             -

dep = depends on (row depends on column)
```

### Supervisor Dependency Enforcement

The Supervisor blocks task assignment when dependencies are unmet:

```
Rule: Do not assign WS-03 Sprint 1 tasks until:
  - WS-01 Sprint 6 deliverables marked complete
  - WS-02 Sprint 4 deliverables marked complete (sharing audit done)

Rule: Do not assign WS-06 Sprint 3 tasks until:
  - WS-08 Sprint 2 deliverables marked complete (audit done)
  - WS-02 Sprint 6 deliverables marked complete (LWC security audit)
  - WS-05 Sprint 2 deliverables marked complete (ESLint active)
```

---

## Conflict Resolution

### Priority Rules

When agents disagree on approach:

1. **Security over functionality** — `security_agent` concerns always take priority
2. **Tests over speed** — `testing_agent` coverage requirements are non-negotiable
3. **Standards over convenience** — `documentation_agent` quality standards enforced
4. **Existing patterns over new patterns** — Unless explicitly modernizing

### Resolution Process

```
1. Agents present competing approaches to supervisor
2. Supervisor evaluates against:
   a. Security impact
   b. Test coverage impact
   c. Backwards compatibility
   d. Effort vs. value
3. Supervisor decides or escalates to human if:
   a. Architectural decision beyond agent scope
   b. Both approaches have equal merit
   c. Decision affects multiple future workstreams
```

---

## Sprint Ceremonies

### Sprint Start (Every 2 Weeks)

```
Supervisor:
1. Review completed tasks from previous sprint
2. Verify quality gates passed for all deliverables
3. Check dependency matrix for newly unblocked work
4. Assign next sprint tasks to agents
5. Notify supporting agents of expected handoffs
```

### Mid-Sprint Check

```
Supervisor:
1. Collect status from all active agents
2. Identify blockers
3. Re-route tasks if agent is blocked
4. Trigger early handoffs where possible
```

### Sprint End

```
Supervisor:
1. Collect all deliverables
2. Run quality gate checks:
   a. security_agent: Security review passed?
   b. testing_agent: Coverage >= 85%?
   c. devops_agent: CI pipeline green?
   d. documentation_agent: Docs updated?
3. Mark tasks complete or carry over
4. Update dependency matrix
5. Report to stakeholders
```

---

## Quality Gate Matrix

Every deliverable must pass these gates before being marked complete:

| Gate | Enforcing Agent | Applies To | Criteria |
|------|----------------|------------|----------|
| Security Review | `security_agent` | All code changes | No new vulnerabilities, sharing mode correct |
| Test Coverage | `testing_agent` | All code changes | Apex >= 85%, LWC >= 80% (Phase 3) |
| Code Quality | `devops_agent` | All code changes | PMD clean, ESLint clean |
| Documentation | `documentation_agent` | Public API changes | ApexDoc/JSDoc present |
| CI Green | `devops_agent` | All changes | Full CI pipeline passes |
| Accessibility | `lwc_agent` | All LWC changes | SA11Y passes |

### Gate Failure Protocol

```
If a gate fails:
1. Supervisor notifies implementing agent with failure details
2. Implementing agent addresses the issue
3. Gate is re-checked
4. If gate fails 3 times: escalate to human
```

---

## Agent Workload Balancing

### Capacity Model

| Agent | Max Concurrent Tasks | Primary Sprint Load |
|-------|---------------------|---------------------|
| `apex_agent` | 3 | High (5 primary workstreams) |
| `lwc_agent` | 2 | Medium (2 primary, support roles) |
| `testing_agent` | 4 | High (supports all workstreams) |
| `security_agent` | 2 | Medium (1 primary, review role) |
| `devops_agent` | 3 | Low-Medium (infrastructure support) |
| `documentation_agent` | 2 | Low-Medium (1 primary, updates) |

### Bottleneck Mitigation

**`apex_agent` is the most loaded agent** (5 primary workstreams). Mitigation:
- Phase workstreams so no more than 2 apex-primary workstreams run simultaneously
- Within Phase 2: WS-03 + WS-04 run in parallel, then WS-07 starts
- `testing_agent` handles test creation independently to reduce handoff wait

**`testing_agent` supports everything**. Mitigation:
- Test creation starts as soon as implementation is complete (no batching)
- Builder patterns and test utilities reduce per-test creation effort
- CI automation handles regression testing without agent involvement

---

## Escalation Path

```
Level 1: Agent self-resolves
  - Simple implementation decisions
  - Standard pattern application
  - Routine test creation

Level 2: Agent-to-agent consultation
  - Cross-domain technical questions
  - API design decisions
  - Test strategy for complex features

Level 3: Supervisor mediation
  - Inter-agent conflicts
  - Dependency deadlocks
  - Quality gate waiver requests

Level 4: Human escalation
  - Architectural decisions beyond agent scope
  - Security incidents
  - Breaking changes to public APIs
  - Community governance decisions
```

---

## Intake Integration

New issues from the Intake System (`.claude/INTAKE_SYSTEM.md`) are routed as follows:

1. Issue created → Intake classifies by feature area + component type
2. Supervisor checks if issue maps to an active workstream
3. If yes: Add as task to relevant workstream sprint
4. If no: Create standalone task, route to appropriate agent
5. All issues get `security_agent` review if touching code

---

---

## Version & Tooling References

All agents must use the following version baselines:

| Tool / Platform | Minimum Version |
|----------------|----------------|
| Salesforce API | 63.0 |
| CumulusCI | 4.6.0 |
| Salesforce CLI (`sf`) | >= 2.x |
| Node.js | >= 18 |
| Python | >= 3.11 |
| Package Format | 2GP Unlocked (namespace: `npsp2`) |

---

*Playbook Version: 1.1*
*Last Updated: 2026-02-13*
