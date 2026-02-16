# Branching & Merge Strategy

**Scope**: All workstreams, all agents
**Existing Config**: `cumulusci.yml` defines `prefix_beta: uat/`, `prefix_release: rel/` (under `project.git`)

---

## Branch Hierarchy

```
main                                    # Production-ready; protected
├── rel/<version>                       # Release branches (from CumulusCI config)
├── uat/<version>                       # Beta/UAT branches (from CumulusCI config)
├── feature/ws-XX/<description>         # Workstream feature branches
│   ├── feature/ws-01/api-upgrade-utils
│   ├── feature/ws-02/sharing-remediation-batch1
│   └── feature/ws-06/lwc-tier1-modal
├── hotfix/<ticket>-<description>       # Urgent production fixes
└── spike/<description>                 # Exploratory/research branches
```

---

## Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Workstream feature | `feature/ws-XX/<sprint>-<description>` | `feature/ws-03/s1-queueable-base` |
| Cross-workstream | `feature/cross/<description>` | `feature/cross/monitoring-strategy` |
| Hotfix | `hotfix/<ticket>-<description>` | `hotfix/GH-142-rollup-null-check` |
| Release | `rel/<major>.<minor>` | `rel/4.0` |
| Beta/UAT | `uat/<major>.<minor>-beta.<n>` | `uat/4.0-beta.1` |
| Spike | `spike/<description>` | `spike/platform-cache-perf` |

---

## Agent Branch Ownership

Each agent creates branches within their workstream scope:

| Agent | Branch Pattern | Concurrent Limit |
|-------|---------------|-----------------|
| `apex_agent` | `feature/ws-{01,03,04,07,09}/*` | 3 branches |
| `lwc_agent` | `feature/ws-{06,08}/*` | 2 branches |
| `security_agent` | `feature/ws-02/*` | 2 branches |
| `testing_agent` | `feature/ws-10/*` | 4 branches |
| `devops_agent` | `feature/ws-05/*`, `feature/cross/*` | 3 branches |
| `documentation_agent` | `feature/ws-05/*` (docs only) | 2 branches |

---

## Merge Strategy

### Feature to Main

1. **Squash merge** for single-sprint features (<5 commits)
2. **Merge commit** for multi-sprint workstream branches (preserve history)
3. All merges require:
   - PR approval from primary + supporting agent
   - All CI checks green (Jest, Apex tests, PMD security, ESLint)
   - Quality gate sign-off from `testing_agent`

### Merge Order Within Phases

```
Phase 1 (parallel workstreams):
  WS-01 branches merge independently
  WS-02 branches merge independently
  WS-05 branches merge independently
  Order: WS-05 first (quality gates needed by others), then WS-01/WS-02

Phase 2 (dependency-ordered):
  WS-07 + WS-10 merge first (fewer downstream deps)
  WS-03 + WS-04 merge after (depend on WS-01/WS-02)

Phase 3 (dependency-ordered):
  WS-08 merges before WS-06 (a11y informs UI)
  WS-09 merges independently
```

### Conflict Resolution Protocol

1. **Same-file conflicts between workstreams**: Supervisor agent mediates; primary agent of the file's domain resolves
2. **Cross-domain conflicts**: Both primary agents review; `apex_agent` resolves Apex, `lwc_agent` resolves LWC
3. **Base class conflicts**: `apex_agent` has final authority on foundation classes
4. **Test conflicts**: `testing_agent` resolves all test file conflicts

---

## Branch Protection Rules

### `main`
- Require PR review (minimum 1 approval)
- Require status checks: `lint`, `jest`, `security`, `validation-complete`
- Require Apex tests when `.cls`/`.trigger` files changed
- No direct pushes
- No force pushes
- Require linear history (no merge commits from unrelated branches)

### `rel/*` and `uat/*`
- Same protections as `main`
- Additional: require `testing_agent` sign-off
- Cherry-pick only from `main` (no direct feature merges)

---

## Stale Branch Cleanup

- Feature branches merged: delete immediately after merge
- Feature branches inactive >30 days: `devops_agent` flags for review
- Spike branches: auto-delete after 14 days
- Hotfix branches: delete after merge to `main` and backport to `rel/*`

---

*Document Version: 1.0*
*Last Updated: 2026-02-12*
