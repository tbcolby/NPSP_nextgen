# Release Management

**Scope**: All workstreams
**Existing Config**: CumulusCI flows (`regression_org`, `build_unlocked_test_package`), `qa_org` (built-in CumulusCI flow, not project-defined), git prefixes (`rel/`, `uat/`)

---

## Versioning

### Semantic Versioning

```
<major>.<minor>.<patch>

major: Breaking changes or major feature milestone (Phase completion)
minor: Feature additions within a phase (workstream sprint deliverables)
patch: Bug fixes, security patches, documentation
```

### Version Milestones

| Version | Trigger | Content |
|---------|---------|---------|
| 4.0-beta.1 | Phase 1 complete | API 63.0, security remediation, code quality gates, 2GP package |
| 4.0-beta.2 | Phase 2 complete | Async modernization, performance, CMT, test infrastructure |
| 4.0-rc.1 | Phase 3 complete | UI migration, accessibility, integration architecture |
| 4.0.0 | All quality gates green | Full modernization release |
| 4.0.x | Post-release | Patches and bug fixes |

---

## Release Cadence

```
Sprint (2 weeks)    → Feature branches merged to main
Monthly             → Beta release (uat/ branch cut)
Phase milestone     → Release candidate (rel/ branch cut)
Quality gate pass   → Production release
```

---

## Release Process

### 1. Release Candidate Preparation

```bash
# DevOps agent initiates
git checkout main
git pull origin main
git checkout -b rel/4.0

# Run full regression
cci flow run regression_org --org release
cci task run run_tests --org release \
  -o retry_failures True \
  -o required_org_code_coverage_percent 85

# Run LWC tests with coverage
npm run test:unit -- --coverage
npm run test:unit:a11y

# Build 2GP unlocked package version
sf package version create --package "NPSP_nextgen" \
  --installation-key-bypass --wait 30 \
  --code-coverage --target-dev-hub DevHub

# Verify package version was created
sf package version list --packages "NPSP_nextgen" \
  --target-dev-hub DevHub --verbose
```

### 2. Quality Gate Verification

All gates must pass before release:

| Gate | Check | Owner |
|------|-------|-------|
| Apex coverage | >= 85% | `testing_agent` |
| LWC coverage | >= 80% | `testing_agent` |
| PMD security | 0 critical violations | `security_agent` |
| ESLint | 0 errors | `devops_agent` |
| SA11Y | 0 critical a11y violations | `lwc_agent` |
| Robot Framework | Critical paths pass | `testing_agent` |
| Backwards compat | All existing tests pass unmodified | `testing_agent` |
| Performance | Key operations within governor budgets | `testing_agent` |

### 3. Beta Deployment

```bash
# Cut beta branch
git checkout -b uat/4.0-beta.1 rel/4.0

# Deploy to beta scratch orgs
cci flow run qa_org --org beta
cci flow run qa_org_namespaced --org beta_namespaced

# Variant testing
cci org scratch beta_multicurrency beta_multi
cci org scratch beta_personaccounts beta_pa
cci org scratch beta_platformencryption beta_enc

# Run full test suite in each variant
cci task run run_tests --org beta
cci task run run_tests --org beta_namespaced
cci task run run_tests --org beta_multi
```

### 4. Release Sign-Off

```yaml
sign_off:
  security_agent: "Security review complete, no critical findings"
  testing_agent: "All quality gates pass, regression suite green"
  devops_agent: "CI pipeline green, package builds successfully"
  supervisor: "All agent sign-offs received, release approved"
```

### 5. Package Promotion & Release Tagging

```bash
# Promote the package version (marks as released — irreversible)
sf package version promote --package "NPSP_nextgen@4.0.0-1" \
  --target-dev-hub DevHub

# Tag in git
git tag -a v4.0.0 -m "NPSP_nextgen v4.0.0 - Full modernization release"
git push origin v4.0.0

# Generate installation URL for subscribers
# Use the SubscriberPackageVersionId (04t...) from:
sf package version list --packages "NPSP_nextgen" \
  --target-dev-hub DevHub --verbose
# Installation URL: https://login.salesforce.com/packaging/installPackage.apexp?p0=04tXXXXXXXXXXXXXXX
```

---

## Release Notes Generation

### Automated Changelog

`devops_agent` generates release notes from PR metadata:

```bash
# Generate changelog from merged PRs since last release
gh pr list --state merged --base main \
  --search "merged:>=$(git log --format=%aI v3.x.x -1)" \
  --json title,labels,number,body \
  --jq '.[] | "- #\(.number) \(.title) [\(.labels | map(.name) | join(", "))]"'
```

### Release Note Structure

```markdown
## NPSP_nextgen v4.0.0

### Breaking Changes
- [List any changes requiring admin action]

### New Features
- [Features grouped by workstream]

### Security Improvements
- [Sharing mode changes, CRUD/FLS, vulnerability fixes]

### Performance Improvements
- [Cache, SOQL optimization, bulk safety]

### Deprecations
- [Aura components deprecated, Custom Settings deprecated]

### Known Issues
- [Known limitations or workarounds]

### Upgrade Instructions
- [Step-by-step admin upgrade guide]
- [Named Credential configuration requirements]
- [Settings migration steps]
```

---

## Rollback Procedure

### Minor Release Rollback
```bash
# Revert to previous release
git checkout rel/4.0
git revert <commit-range>
git push origin rel/4.0

# Deploy previous version
cci task run deploy --org production
```

### Major Version Rollback
- Requires data migration rollback (see [Deployment Runbook](04-deployment-runbook.md))
- Custom Metadata Type rollback via `NPSP_SettingsMigrationUtility` (to be created in WS-07) reverse path
- Named Credential rollback to Custom Setting credentials

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
