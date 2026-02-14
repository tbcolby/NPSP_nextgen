# Deployment Runbook

**Scope**: All workstreams — pre-deployment, deployment, post-deployment, rollback
**Existing Config**: CumulusCI flows (`dev_org`, `qa_org` (built-in CumulusCI flow, not project-defined), `regression_org`), GitHub Actions CI

---

## Pre-Deployment Checklist

### Automated (CI enforces)
- [ ] All Apex tests pass (85%+ coverage)
- [ ] All LWC Jest tests pass
- [ ] PMD security scan clean (0 critical)
- [ ] ESLint clean (0 errors)
- [ ] SA11Y accessibility clean (0 critical)
- [ ] Package compiles on target API version (63.0)
- [ ] 2GP package version builds successfully

### Manual (Agent sign-off)
- [ ] `security_agent`: Security review complete
- [ ] `testing_agent`: Regression suite green
- [ ] `devops_agent`: CI pipeline green, no infrastructure blockers
- [ ] Supervisor: Dependency check — all prerequisite workstreams complete

### Pre-Install Requirements (Subscriber Orgs)

Before installing the NPSP_nextgen package, subscriber orgs must have the following metadata in place. These cannot be included in the 2GP package and must exist beforehand.

| Requirement | Type | Details |
|------------|------|---------|
| Account Record Types | Record Type | At least one active Account Record Type (e.g., "Organization", "Household") |
| Opportunity Record Types | Record Type | At least one active Opportunity Record Type (e.g., "Donation", "Grant") |
| Contact Record Types | Record Type | (Optional) Record Types for Contact if using multiple models |
| Business Processes | Business Process | Opportunity Sales Process that matches the org's donation workflow |
| Currency settings | Org Setting | Multi-currency enabled if required (cannot be changed after install) |
| Person Accounts | Org Feature | Enabled if the org uses Person Accounts (cannot be enabled later easily) |

**Pre-install validation script** (run by admin before install):
```bash
# Verify record types exist
sf data query --query "SELECT DeveloperName FROM RecordType WHERE SObjectType = 'Account' AND IsActive = true" --target-org <target>
sf data query --query "SELECT DeveloperName FROM RecordType WHERE SObjectType = 'Opportunity' AND IsActive = true" --target-org <target>
```

### Pre-Upgrade Validation (for existing NPSP orgs migrating from npsp__)
- [ ] Pre-migration audit run (identifies flows, formulas, triggers referencing `npsp__`)
- [ ] Full org backup taken
- [ ] Named Credentials configured (if WS-09 changes included)
- [ ] Platform Cache partition exists (if WS-04 changes included)
- [ ] Sufficient Queueable job headroom (if WS-03 changes included)
- [ ] Admin notified of sharing mode changes (if WS-02 changes included)
- [ ] Custom Settings backup taken (if WS-07 changes included)

---

## Deployment Steps

There are two deployment paths depending on the audience:

### Path A: Package Installation (End Users / Subscriber Orgs)

```bash
# Install the 2GP unlocked package via CLI
sf package install --package "NPSP_nextgen@4.0.0-1" \
  --target-org <target> --wait 20 --installation-key-bypass

# Or install via URL in a browser:
# https://login.salesforce.com/packaging/installPackage.apexp?p0=04tXXXXXXXXXXXXXXX
# (Get the 04t ID from: sf package version list --packages "NPSP_nextgen" --target-dev-hub DevHub --verbose)
```

### Path B: Source Deployment (Contributors / Development)

```bash
# Standard CumulusCI deployment
cci flow run dev_org --org <target>

# Or granular deployment
cci task run deploy --org <target> --path force-app/main/default/classes
cci task run deploy --org <target> --path force-app/main/default/lwc
cci task run deploy --org <target> --path force-app/main/default/objects
cci task run deploy --org <target> --path force-app/main/default/customMetadata
```

### Post-Install Metadata Deployment

After package installation (Path A), subscriber orgs must deploy additional unpackaged metadata that cannot be included in the 2GP package:

```bash
# Deploy post-install metadata (record type assignments, page layouts, etc.)
sf project deploy start --source-dir unpackaged/post/ --target-org <target>
```

The `unpackaged/post/` directory contains:
- **Record Type assignments** for package objects
- **Page Layout assignments** for profiles
- **Default TDTM trigger handler records** (`Trigger_Handler__c` data)
- **Default Custom Metadata records** (settings, rollup definitions)
- **Permission Set assignments** for admin users
- **App / Tab visibility** settings

### Step 2: Post-Deploy Configuration

```bash
# Assign permission sets
cci task run assign_permission_sets --org <target>

# Run NPSP settings configuration
cci task run npsp_default_settings --org <target>

# If CMT migration included (WS-07):
# Admin runs migration utility from Setup > NPSP Settings
```

### Step 3: Post-Deploy Validation

```bash
# Run full Apex test suite
cci task run run_tests --org <target> \
  -o required_org_code_coverage_percent 85

# Run smoke tests (critical paths)
cci task run robot --org <target> \
  -o suites robot/Cumulus/tests/browser/contacts_accounts

# Verify Named Credential connectivity (WS-09)
# Verify CMT records exist (WS-07)
# Verify Platform Cache operational (WS-04)
```

---

## Deployment Order

When deploying changes from multiple workstreams simultaneously:

```
1. Custom Metadata Types (WS-07)         — Schema first
2. Custom Objects / Fields               — Data model
3. Platform Events (WS-03)               — Event infrastructure
4. Named Credentials (WS-09)             — Integration infra
5. Apex Classes (WS-01, WS-02, WS-03)   — Backend logic
6. Apex Triggers                          — Event handlers
7. LWC Components (WS-06, WS-08)        — Frontend
8. Aura Components (deprecated wrappers)  — Legacy compatibility
9. Permission Sets                        — Access control
10. Layouts / Flexipages                  — UI assembly
```

---

## Rollback Procedures

### Level 1: Component Rollback (Single Workstream)

```bash
# Identify the pre-deployment commit
git log --oneline -10

# Revert specific workstream changes
git revert <commit-sha>

# Redeploy
cci task run deploy --org <target> --path force-app
```

### Level 2: Sprint Rollback (Full Sprint)

```bash
# Revert to sprint start tag
git checkout v4.0-sprint-N-start

# Redeploy entire source
cci flow run dev_org --org <target>

# Run validation
cci task run run_tests --org <target>
```

### Level 3: Phase Rollback (Emergency)

For catastrophic failures requiring full phase rollback:

1. **Apex rollback**: Redeploy previous version Apex classes
2. **CMT rollback**: Run reverse migration utility (CMT → Custom Settings)
3. **Integration rollback**: Fall back to Custom Setting credentials (dual-path pattern)
4. **LWC rollback**: Restore Aura component references in flexipages
5. **Validate**: Run full regression suite

### Rollback Decision Matrix

| Symptom | Level | Owner | Max Time |
|---------|-------|-------|----------|
| Single test failure | 1 | Primary agent | 1 hour |
| Multiple test failures in one WS | 1 | Primary + testing agents | 4 hours |
| Cross-workstream failures | 2 | Supervisor | 1 day |
| Production data issues | 3 | Supervisor + human | 2 days |
| Security vulnerability | 3 | Security agent + human | Immediate |

---

## Deployment Monitoring

### During Deployment
- Monitor CumulusCI deploy output for errors
- Watch for `AsyncApexJobId` completion on metadata deploys
- Check deployment status in Setup > Deployment Status

### Post-Deployment (First 24 Hours)
- Monitor error logs (Setup > Debug Logs or custom error object)
- Monitor batch job health (WS-03 async monitor)
- Monitor integration health (WS-09 health check)
- Monitor governor limit consumption in key operations
- Check user-reported issues in community channels

### Alerting Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Apex test failures | >0 | >5 | Investigate / Level 1 rollback |
| Error log spike | 2x baseline | 5x baseline | Investigate / Level 2 rollback |
| Integration failures | >5% | >20% | Check Named Credentials / Level 1 |
| Batch job failures | >2% | >10% | Investigate async patterns |
| Governor limit warnings | >80% | >95% | Performance investigation |

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
