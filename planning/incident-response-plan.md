# Incident Response Plan

**Scope**: Procedures for handling production incidents, regressions, and critical bugs
**Applies To**: All agents, DevOps team, human administrators

---

## Incident Severity Classification

| Severity | Definition | Examples | Response Time | Resolution Target |
|----------|-----------|----------|--------------|-------------------|
| **SEV-1** | Complete loss of core functionality | All triggers failing, data corruption, security breach | 15 min | 4 hours |
| **SEV-2** | Major feature broken, no workaround | Recurring Donations not creating Opportunities, rollups not calculating | 1 hour | 24 hours |
| **SEV-3** | Feature degraded, workaround available | Gift Entry slow but functional, non-critical LWC rendering issue | 4 hours | 1 sprint |
| **SEV-4** | Minor issue, cosmetic or edge case | Label typo, rare edge case, non-blocking UI glitch | Next standup | 2 sprints |

---

## Incident Response Workflow

```
DETECT → TRIAGE → CONTAIN → INVESTIGATE → FIX → VERIFY → CLOSE → REVIEW
```

### Phase 1: Detection

Incidents can be detected via:

| Source | Detection Method | Escalation |
|--------|-----------------|------------|
| CI pipeline failure | GitHub Actions alert | Automatic — blocks merge |
| Regression test failure | Tier 1-4 suite results | `testing_agent` triages |
| Production error spike | NPSP_MonitoringService alerts (proposed — to be created in WS-04) | `devops_agent` triages |
| Batch job failure | Async Apex monitoring | `apex_agent` triages |
| User report | GitHub Issue with `bug` label | Supervisor triages |
| Security scan | PMD / CodeQL findings | `security_agent` triages |

### Phase 2: Triage

**Triage Owner**: Supervisor agent (or human if agents unavailable)

```markdown
### Triage Checklist
1. Confirm the issue is reproducible
2. Determine severity (SEV-1 through SEV-4)
3. Identify affected workstream(s)
4. Assign incident commander (primary agent)
5. Determine if hotfix is needed (SEV-1, SEV-2)
6. Notify stakeholders
```

**Triage Decision Matrix**:

| Affects | Data Loss? | Workaround? | Severity |
|---------|-----------|-------------|----------|
| All users | Yes | No | SEV-1 |
| All users | No | No | SEV-2 |
| All users | No | Yes | SEV-3 |
| Some users | No | Yes | SEV-3 |
| Edge case | No | Yes | SEV-4 |

### Phase 3: Containment

**SEV-1 / SEV-2 Containment Actions**:

| Action | Owner | When |
|--------|-------|------|
| Disable affected TDTM handler | `apex_agent` | If trigger is causing data corruption |
| Pause affected batch job | `devops_agent` | If batch is processing incorrectly |
| Revert last deployment | `devops_agent` | If incident started after deployment |
| Enable feature flag bypass | `apex_agent` | If new feature is causing regression |
| Communicate status | Supervisor | Immediately after containment |

```bash
# Emergency: Disable a TDTM handler via CumulusCI
# NOTE: NPSP_nextgen ships as a 2GP unlocked package with namespace npsp2.
# In subscriber orgs, all custom objects/fields are prefixed with npsp2__
# (e.g., npsp2__Trigger_Handler__c, npsp2__Active__c, npsp2__Class__c).
# In development scratch orgs (source deployment), no prefix is needed.
cci task run execute_anon --org production -o apex "
    List<npsp2__Trigger_Handler__c> handlers = [
        SELECT Id, npsp2__Active__c
        FROM npsp2__Trigger_Handler__c
        WHERE npsp2__Class__c = 'AFFECTED_CLASS_NAME'
    ];
    for (npsp2__Trigger_Handler__c h : handlers) {
        h.npsp2__Active__c = false;
    }
    update handlers;
"

# Emergency: Abort a running batch job
cci task run execute_anon --org production -o apex "
    List<AsyncApexJob> jobs = [
        SELECT Id FROM AsyncApexJob
        WHERE ApexClass.Name = 'AFFECTED_BATCH_CLASS'
        AND Status IN ('Queued', 'Preparing', 'Processing')
    ];
    for (AsyncApexJob j : jobs) {
        System.abortJob(j.Id);
    }
"
```

### Phase 4: Investigation

**Root Cause Analysis Template**:

```markdown
### Incident: [Brief Description]
**Severity**: SEV-X
**Detected**: YYYY-MM-DD HH:MM UTC
**Contained**: YYYY-MM-DD HH:MM UTC

#### Timeline
- HH:MM — [Event description]
- HH:MM — [Event description]

#### Root Cause
[Description of the underlying cause]

#### Contributing Factors
- [Factor 1]
- [Factor 2]

#### Affected Components
- [Class/Component name]
- [Workstream]
```

**Investigation Tools**:

| Tool | Purpose | Command |
|------|---------|---------|
| Debug logs | Trace execution path | Setup → Debug Logs |
| Error__c records | Application-level errors | `SELECT * FROM Error__c ORDER BY CreatedDate DESC LIMIT 50` |
| AsyncApexJob | Batch/Queueable failures | `SELECT Id, Status, ExtendedStatus FROM AsyncApexJob WHERE Status = 'Failed'` |
| Event log files | Platform-level events | EventLogFile queries via API |
| Git blame | Identify change source | `git log --oneline --since="2 weeks ago" -- path/to/file` |

### Phase 5: Fix

Follow the [Hotfix Procedure](devops/05-hotfix-procedure.md) for SEV-1 and SEV-2 incidents.

**Fix Requirements by Severity**:

| Severity | Branch From | Review Required | Test Required |
|----------|-----------|----------------|---------------|
| SEV-1 | `main` (hotfix/) | 1 agent + supervisor | Smoke tests + regression for affected area |
| SEV-2 | `main` (hotfix/) | 1 agent + supervisor | Tier 2 regression |
| SEV-3 | `feature/` branch | Standard PR review | Standard PR tests |
| SEV-4 | `feature/` branch | Standard PR review | Standard PR tests |

### Phase 6: Verification

```bash
# Deploy fix to QA org (qa_org is a built-in CumulusCI flow, not project-defined)
cci flow run qa_org --org incident_qa

# Run targeted regression
cci task run run_tests --org incident_qa \
  -o test_name_match "AFFECTED_DOMAIN_*_TEST"

# Run Tier 1 smoke tests
cci task run run_tests --org incident_qa \
  -o test_name_match "SMOKE_*_TEST"

# If SEV-1/SEV-2: Run Tier 2 core regression
cci task run run_tests --org incident_qa \
  -o required_org_code_coverage_percent 85
```

### Phase 7: Closure

**Closure Checklist**:

```markdown
- [ ] Fix deployed and verified
- [ ] Monitoring confirms issue resolved
- [ ] Containment measures reversed (handlers re-enabled, etc.)
- [ ] Affected users notified
- [ ] GitHub issue updated and closed
- [ ] Incident log entry created
```

### Phase 8: Post-Incident Review

**Required for SEV-1 and SEV-2. Optional for SEV-3.**

```markdown
### Post-Incident Review: [Incident Title]
**Date**: YYYY-MM-DD
**Participants**: [Agent names, human reviewers]

#### Summary
[1-2 sentence summary]

#### What Went Well
- [Item]

#### What Could Be Improved
- [Item]

#### Action Items
| Action | Owner | Deadline |
|--------|-------|----------|
| [Action] | [Agent/Human] | [Date] |

#### Prevention Measures
- [ ] New test added to regression suite: [test name]
- [ ] Monitoring rule added: [rule description]
- [ ] Documentation updated: [doc link]
- [ ] Process change: [description]
```

---

## Communication Protocol

### Internal (Agent-to-Agent)

| Event | Channel | Template |
|-------|---------|----------|
| Incident declared | Supervisor notification | `INCIDENT SEV-X: [brief description]. Assigned to [agent].` |
| Containment complete | Supervisor notification | `CONTAINED: [action taken]. Investigation in progress.` |
| Fix ready | PR comment | Standard PR with `hotfix` label |
| Incident resolved | Supervisor notification | `RESOLVED: [brief description]. Post-incident review scheduled.` |

### External (User-Facing)

| Severity | Communication | Channel |
|----------|--------------|---------|
| SEV-1 | Immediate advisory | GitHub Issue + Release Notes |
| SEV-2 | Status update within 4 hours | GitHub Issue |
| SEV-3 | Included in next release notes | Release Notes |
| SEV-4 | No external communication needed | — |

---

## Incident Log

Maintain a running incident log at `planning/incident-log.md`:

```markdown
| Date | Severity | Description | Root Cause | Resolution | Time to Resolve | Prevented By |
|------|----------|-------------|-----------|------------|----------------|-------------|
| YYYY-MM-DD | SEV-X | Brief description | Root cause | Fix description | Xh Ym | [Test/Monitor added] |
```

---

## Escalation Matrix

```
SEV-4 → Assigned agent handles autonomously
  ↓ (if not resolved in 2 sprints)
SEV-3 → Assigned agent + supervisor review
  ↓ (if not resolved in 1 sprint)
SEV-2 → Supervisor coordinates, hotfix branch created
  ↓ (if not contained in 4 hours)
SEV-1 → All agents available, human architect notified
  ↓ (if not contained in 1 hour)
EMERGENCY → Human takes direct control, agents assist
```

---

## Runbook Quick Reference

### SEV-1 Quick Actions

```bash
# 1. Identify the problem
cci task run execute_anon --org production -o apex "
    System.debug([SELECT Id, Context_Type__c, Object_Type__c,
        Full_Message__c, CreatedDate
        FROM Error__c
        ORDER BY CreatedDate DESC LIMIT 10]);
"

# 2. Check for failed async jobs
cci task run execute_anon --org production -o apex "
    System.debug([SELECT ApexClass.Name, Status, ExtendedStatus,
        NumberOfErrors, CreatedDate
        FROM AsyncApexJob
        WHERE Status = 'Failed'
        AND CreatedDate = TODAY
        ORDER BY CreatedDate DESC LIMIT 10]);
"

# 3. If deployment caused it — identify last deployment
git log --oneline -10 main

# 4. Revert if needed (see hotfix procedure)
# git revert <commit-hash>
# cci flow run deploy --org production
```

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
