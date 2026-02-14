# Environment Strategy

**Scope**: All workstreams
**Existing Config**: 15 scratch org definitions in `orgs/` (including `trial.json`), CumulusCI flows for dev/qa/trial/regression. Note: `qa_org` is a built-in CumulusCI flow, not project-defined.

---

## Environment Tiers

```
┌─────────────────────────────────────────────────────────┐
│ TIER 0: Build (DevHub — package creation)               │
│  DevHub org for sf package version create               │
│  CumulusCI >= 4.6.0, API 63.0                           │
├─────────────────────────────────────────────────────────┤
│ TIER 1: Development (Scratch Orgs — per developer)      │
│  dev.json, dev_multicurrency.json, feature.json,        │
│  trial.json (all namespaced with npsp2)                 │
├─────────────────────────────────────────────────────────┤
│ TIER 2: Integration (Shared Scratch — per workstream)   │
│  QA orgs for cross-agent integration testing            │
├─────────────────────────────────────────────────────────┤
│ TIER 3: QA / Regression (Persistent Scratch or Sandbox) │
│  regression_org flow, variant testing                   │
├─────────────────────────────────────────────────────────┤
│ TIER 4: UAT / Beta (Persistent — pre-release)          │
│  beta.json variants, qa_org_namespaced flow             │
│  Package install testing (install via 04t URL)          │
├─────────────────────────────────────────────────────────┤
│ TIER 5: Release (Persistent — staging for production)   │
│  release.json (note: enterprise.json is only used by    │
│  metecho_trial org; the `enterprise` scratch org name   │
│  maps to orgs/dev.json in cumulusci.yml)                │
└─────────────────────────────────────────────────────────┘
```

---

## Tier 0: Build Org (DevHub)

**Purpose**: Package version creation and promotion
**Org Type**: Production or Developer Edition with DevHub enabled
**Provisioning**: One-time setup by project admin

### Requirements
- DevHub feature enabled
- `npsp2` namespace linked to DevHub
- Sufficient package version creation limits
- CumulusCI >= 4.6.0 configured to target this DevHub

### Package Build Workflow
```bash
# Create a beta package version (run in CI or locally)
sf package version create --package "NPSP_nextgen" \
  --installation-key-bypass --wait 30 \
  --code-coverage --target-dev-hub DevHub

# Promote for release
sf package version promote --package "NPSP_nextgen@4.0.0-1" \
  --target-dev-hub DevHub
```

---

## Tier 1: Development Scratch Orgs

**Purpose**: Individual developer/agent work
**Lifetime**: 7 days (default), 30 days (extended for complex features)
**Provisioning**: `cci org scratch dev <name>`

### Standard Development
```bash
cci org scratch dev my_feature --days 30
cci flow run dev_org --org my_feature
```

### Per-Workstream Org Definitions

| Workstream | Org Definition | Special Features |
|-----------|---------------|-----------------|
| WS-01 | `dev.json` | Standard |
| WS-02 | `dev.json` + sharing rules | Restricted profiles for testing |
| WS-03 | `dev.json` | Platform Event subscriptions |
| WS-04 | `dev.json` + cache partition | Platform Cache enabled |
| WS-05 | `dev.json` | Standard |
| WS-06 | `dev.json` | Standard |
| WS-07 | `dev.json` | CMT deployment permissions |
| WS-08 | `dev.json` | Standard |
| WS-09 | `dev.json` | Named Credential setup |
| WS-10 | `dev.json` | Standard |

### New Org Definitions Needed

```json
// orgs/dev_cache.json — For WS-04 Platform Cache work
{
  "orgName": "NPSP Dev (Cache)",
  "edition": "Developer",
  "features": ["PlatformCache"],
  "settings": {
    "cachePartition": {
      "orgPartition": "npsp"
    }
  }
}
```

---

## Tier 2: Integration Scratch Orgs

**Purpose**: Cross-agent integration testing within a workstream
**Lifetime**: 14 days
**Provisioning**: `devops_agent` creates at sprint start

### When to Use
- `apex_agent` completes implementation, `testing_agent` needs to validate
- `lwc_agent` creates component, `apex_agent` creates controller — test together
- Security review requires deployed code in an org context

### Workflow
```bash
# DevOps agent provisions integration org at sprint start
cci org scratch dev ws01_integration --days 14
cci flow run dev_org --org ws01_integration

# Agents deploy their changes
cci task run deploy --org ws01_integration --path force-app

# Testing agent runs full suite
cci task run run_tests --org ws01_integration
```

---

## Tier 3: QA / Regression

**Purpose**: Full regression testing across all workstreams
**Lifetime**: 30 days (persistent scratch org or sandbox)
**Provisioning**: `cci flow run regression_org`

### Variant Testing Matrix

The existing scratch org definitions cover critical Salesforce variants:

| Variant | Org Definition | Tests |
|---------|---------------|-------|
| Standard | `beta.json` | Full suite |
| Multi-currency | `beta_multicurrency.json` | Currency-related features |
| Non-English | `beta_nonenglish.json` | Localization, label rendering |
| Person Accounts | `beta_personaccounts.json` | Contact/Account model differences |
| Platform Encryption | `beta_platformencryption.json` | Shield encryption compatibility |
| State/Country Picklists | `beta_statecountry.json` | Address-related features |
| Middle Name/Suffix | `beta_middlesuffix.json` | Name formatting |

### Regression Test Cadence

```
Per Sprint:     Standard regression on main changes
Per Phase:      Full variant matrix (all 7 variants)
Pre-Release:    Full variant matrix + LDV testing + Robot Framework
```

---

## Tier 4: UAT / Beta

**Purpose**: Pre-release validation with realistic data
**Provisioning**: `cci flow run qa_org --org beta` (note: `qa_org` is a built-in CumulusCI flow, not project-defined)

### UAT Environment Setup
```bash
# Create UAT org
cci org scratch beta uat_v4 --days 30

# Deploy with full configuration
cci flow run qa_org --org uat_v4

# Load realistic test data
# NOTE: datasets/uat does not exist yet and needs to be created.
# For now, use the existing dataset path:
cci task run deploy --org uat_v4 --path datasets/qa_org

# Configure Named Credentials (manual step)
# Configure CMT settings (via migration utility)
```

---

## Tier 5: Release Staging

**Purpose**: Final pre-production validation
**Org**: `release.json` or `enterprise.json`

### Release Staging Checklist
- [ ] Full `dev_org` flow succeeds
- [ ] All Apex tests pass with 85%+ coverage
- [ ] All LWC Jest tests pass
- [ ] All Robot Framework critical paths pass
- [ ] Named Credentials configurable
- [ ] CMT migration utility works
- [ ] Package builds successfully

---

## Scratch Org DevHub Limits

| Resource | Limit | Monitoring |
|----------|-------|-----------|
| Active scratch orgs | 200 (Enterprise DevHub) | `sfdx force:org:list` |
| Daily scratch org creates | 80 | Track in CI logs |
| Scratch org expiration | 30 days max | Auto-cleanup in CI |

### Conservation Strategy
- Agents share integration orgs within a workstream
- CI scratch orgs are auto-deleted after test run
- Stale orgs cleaned weekly by `devops_agent`
- Use `cci org scratch_delete` for expired orgs

---

## Secrets Management

| Secret | Storage | Used By |
|--------|---------|---------|
| `DEVHUB_SFDX_AUTH_URL` | GitHub Secrets | CI Apex tests |
| Named Credential OAuth tokens | Salesforce org | WS-09 integration tests |
| API keys (SmartyStreets, etc.) | Named Credentials | WS-09 integration tests |

**Rules**:
- No secrets in code (enforced by WS-05 secrets scanning)
- No secrets in scratch org definitions
- CI secrets managed via GitHub repository secrets
- Per-developer secrets via local `.sfdx` auth files (git-ignored)

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
