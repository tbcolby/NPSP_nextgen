# Hotfix Procedure

**Scope**: Urgent production fixes during active modernization sprints
**Goal**: Ship critical fixes without destabilizing in-flight workstream work

---

## Hotfix Classification

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|---------|
| **P0 — Critical** | Data loss, security vulnerability, critical feature down | < 4 hours | SOQL injection exploit, rollup calculation data corruption |
| **P1 — High** | Major feature broken, significant user impact | < 24 hours | Rollup calculations wrong, household naming broken |
| **P2 — Medium** | Feature degraded, workaround available | Next sprint | UI component rendering error, non-critical batch failure |
| **P3 — Low** | Minor issue, cosmetic | Backlog | Label typo, non-blocking warning |

**Rule**: Only P0 and P1 qualify for the hotfix procedure. P2/P3 go into the normal sprint backlog.

---

## Hotfix Workflow

### Step 1: Triage (Supervisor Agent)

```yaml
trigger: Issue reported with severity >= P1
actions:
  - Classify severity (P0/P1)
  - Identify affected workstream(s)
  - Assign to appropriate agent
  - Notify all agents of hotfix in progress
  - PAUSE affected workstream sprint work if conflict risk
```

### Step 2: Branch & Fix

```bash
# Branch from main (or rel/ branch if mid-release)
git checkout main
git pull origin main
git checkout -b hotfix/GH-<number>-<description>

# Agent makes minimal fix (smallest change possible)
# NO refactoring, NO modernization, NO scope creep
```

### Step 3: Validate

```bash
# Run targeted tests
cci task run run_tests --org hotfix_org \
  -o test_name_match "<affected_test_classes>"

# Run full regression (P0 only — can't skip for critical)
cci task run run_tests --org hotfix_org \
  -o required_org_code_coverage_percent 85

# LWC tests if frontend affected
npm run test:unit

# Security scan
# PMD on changed files only
```

### Step 4: Review & Merge

```yaml
review_requirements:
  P0:
    - Primary agent: code review
    - Security agent: security impact assessment
    - Fast-track: Single approval sufficient
    - CI: Must pass (no gate waivers)
  P1:
    - Primary agent: code review
    - Testing agent: regression confirmation
    - Standard PR process (expedited)
```

### Step 5: Backport

```bash
# Merge hotfix to main
gh pr merge --squash

# Backport to active release branch (if exists)
git checkout rel/4.0
git cherry-pick <hotfix-commit-sha>
git push origin rel/4.0

# Backport to active workstream branches (if affected)
# DevOps agent notifies affected agents to rebase
```

---

## Hotfix Isolation Rules

### What a Hotfix Branch MUST NOT Include
- Workstream feature code
- Refactoring or modernization changes
- New dependencies or package updates
- Changes to CI/CD pipeline
- Documentation updates (except inline code comments for the fix)

### What a Hotfix Branch MUST Include
- The minimal fix
- Test(s) proving the fix works
- Test(s) proving the original bug existed (regression test)

---

## Sprint Impact Protocol

When a hotfix lands during an active sprint:

1. `devops_agent`: Notifies all agents of hotfix merge to `main`
2. All agents with active feature branches: **Rebase onto updated main**
   ```bash
   git checkout feature/ws-XX/my-branch
   git fetch origin
   git rebase origin/main
   ```
3. If rebase conflicts: Primary agent resolves; `testing_agent` re-validates
4. Sprint timeline: Supervisor assesses if sprint deadline needs adjustment

---

## Hotfix Tracking

All hotfixes must be tracked:

```markdown
## Hotfix Log

| Date | Ticket | Severity | Fix | Root Cause | Prevented By |
|------|--------|----------|-----|------------|-------------|
| YYYY-MM-DD | GH-XXX | P0/P1 | Description | Why it happened | What gate should have caught it |
```

The "Prevented By" column feeds back into quality gate improvements. If a hotfix could have been caught by an existing gate that was bypassed or missing, the gate is strengthened.

---

---

## 2GP Hotfix Packaging (NPPatch Decision, 2026-02-13)

Since NPSP_nextgen ships as a 2GP unlocked package, hotfixes require creating a new package version:

1. After the hotfix is merged to `main` (or `rel/` branch), create a new patch version:
   ```bash
   sf package version create --package "NPSP_nextgen" --path force-app \
     --installation-key <key> --code-coverage --wait 30
   ```
2. The new package version must pass the 75% minimum coverage gate.
3. Subscribers install the new package version to receive the hotfix.
4. Patch versions follow the `4.0.X.0` pattern (increment the patch segment).
5. For P0 hotfixes, consider using `--skip-validation` for faster turnaround, then follow up with a validated version.

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
