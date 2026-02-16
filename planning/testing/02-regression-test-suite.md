# Regression Test Suite Definition

**Scope**: Critical paths that must pass before any release
**Existing**: 336+ Apex test classes, 52 Jest test files, 122 Robot Framework files

---

## Regression Suite Tiers

```
TIER 1: Smoke Tests (5 min)
  Run on: Every PR merge to main
  Scope: Core functionality health check

TIER 2: Core Regression (30 min)
  Run on: Sprint end, release candidate
  Scope: All critical business flows

TIER 3: Full Regression (2+ hours)
  Run on: Phase milestone, pre-release
  Scope: Complete test matrix including variants

TIER 4: Extended (4+ hours)
  Run on: Major release only
  Scope: Full + LDV + performance + all variants
```

---

## Tier 1: Smoke Tests

### Apex Smoke (Run after every merge)

| # | Test | Domain | Validates |
|---|------|--------|-----------|
| 1 | Contact insert → Household created | HH_ | Core TDTM chain |
| 2 | Opportunity insert → Allocation created | ALLO_ | Allocation engine |
| 3 | Opportunity insert → Rollup calculated | CRLP_ | Rollup engine |
| 4 | Recurring Donation → Schedule created | RD2_ | RD2 engine |
| 5 | Data Import → Records created | BDI_ | Batch import engine |
| 6 | Error handling → Error logged | ERR_ | Error framework |

### LWC Smoke

```bash
npm run test:unit -- --testPathPattern="(geFormRenderer|rd2EntryForm|geTemplateBuilderFormSection)"
```

### CI Configuration (Proposed)

> **Note**: The `SMOKE_*_TEST` classes listed below do not currently exist. They are to be created as part of this testing strategy.

```yaml
# Proposed: Triggered on merge to main
smoke_tests:
  apex:
    - SMOKE_ContactHousehold_TEST      # (to be created)
    - SMOKE_OpportunityAllocation_TEST # (to be created)
    - SMOKE_OpportunityRollup_TEST     # (to be created)
    - SMOKE_RecurringDonation_TEST     # (to be created)
    - SMOKE_DataImport_TEST            # (to be created)
    - SMOKE_ErrorHandling_TEST         # (to be created)
  lwc:
    - geFormRenderer.test.js
    - rd2EntryForm.test.js
```

---

## Tier 2: Core Regression

### Contact & Household Domain

| Test Class | Validates |
|-----------|-----------|
| `ADDR_*_TEST` | Address verification, geocoding |
| `HH_*_TEST` | Household creation, naming, merging |
| `CON_*_TEST` | Contact management, duplicate detection |
| `AFFL_*_TEST` | Affiliations |
| `REL_*_TEST` | Relationships |

### Donation Domain

| Test Class | Validates |
|-----------|-----------|
| `OPP_*_TEST` | Opportunity lifecycle |
| `PMT_*_TEST` | Payment processing |
| `ALLO_*_TEST` | Allocation engine |
| `CRLP_*_TEST` | Customizable rollups |
| `RD2_*_TEST` | Recurring donations |

### Data Processing Domain

| Test Class | Validates |
|-----------|-----------|
| `BDI_*_TEST` | Batch Data Import |
| `GE_*_TEST` | Gift Entry |
| `BGE_*_TEST` | Batch Gift Entry |

### Framework Domain

| Test Class | Validates |
|-----------|-----------|
| `TDTM_*_TEST` | Trigger framework |
| `ERR_*_TEST` | Error handling |
| `STG_*_TEST` | Settings management |
| `UTIL_*_TEST` | Utility classes |

### LWC Regression

```bash
# All 52 Jest test files
npm run test:unit -- --coverage
npm run test:unit:a11y
```

---

## Tier 3: Full Regression

Everything in Tier 2 plus:

### Robot Framework Critical Paths

| Suite | Path | Validates |
|-------|------|-----------|
| Contact Creation | `tests/browser/contacts_accounts/` | UI contact flow |
| Donation Entry | `tests/browser/donations_payments/` | UI donation flow |
| Gift Entry | `tests/browser/gift_entry/` | Gift Entry app |
| Recurring Donations | `tests/browser/zrecurring_donations/` | RD2 UI flow |
| Batch Data Import | `tests/browser/2_batch_data_imports/` | BDI UI flow |
| Settings | `tests/browser/npsp_settings/` | NPSP settings |

### Variant Testing Matrix

| Variant | Org Config | Critical Areas |
|---------|-----------|---------------|
| Multi-currency | `beta_multicurrency.json` | Donations, rollups, allocations |
| Person Accounts | `beta_personaccounts.json` | Contact/Account model |
| Platform Encryption | `beta_platformencryption.json` | CRUD/FLS, data access |
| Non-English | `beta_nonenglish.json` | Labels, date formats |
| State/Country | `beta_statecountry.json` | Address fields |

---

## Tier 4: Extended Regression

Everything in Tier 3 plus:

### Performance Tests

```bash
# Robot Framework performance suite
cci task run robot --org perf \
  -o suites robot/Cumulus/perftests/
```

| Test | Dataset | Validates |
|------|---------|-----------|
| BDI batch performance | 10K imports | Batch throughput |
| RD2 batch performance | 10K RDs | Schedule evaluation |
| Insert performance | 200 records | Trigger chain governor limits |
| Rollup performance | Skew account (50K opps) | Skew handling |

### LDV Tests
- All trigger handlers with 200+ records
- Batch classes with 10K+ record datasets
- Rollup calculations on skew accounts

### Backwards Compatibility Tests
- All existing test classes pass unmodified
- External consumer simulation tests (see [Backwards Compatibility Test Suite](05-backwards-compatibility-tests.md))

---

## Regression Ownership

| Suite | Owner | Trigger |
|-------|-------|---------|
| Tier 1 Smoke | `devops_agent` (CI) | Every merge to main |
| Tier 2 Core | `testing_agent` | Sprint end |
| Tier 3 Full | `testing_agent` + `devops_agent` | Phase milestone |
| Tier 4 Extended | `testing_agent` + all agents | Major release |

---

## Failure Protocol

```
If Tier 1 fails:
  → Block further merges to main
  → Primary agent fixes within 4 hours
  → If not fixed: revert the merge

If Tier 2 fails:
  → Sprint deliverable blocked
  → Testing agent investigates + assigns to responsible agent
  → Fix required before sprint sign-off

If Tier 3 fails:
  → Release candidate blocked
  → Supervisor triages severity
  → Fix or documented known issue required

If Tier 4 fails:
  → Release decision point
  → Supervisor + human evaluate impact
  → May release with known issue if non-critical
```

---

*Document Version: 1.0*
*Last Updated: 2026-02-12*
