# Integration & End-to-End Test Plan

**Scope**: Beyond unit tests — Robot Framework, scratch org E2E, cross-component integration
**Existing**: 107 Robot Framework `.robot` files in `robot/Cumulus/` (122 total including stashed in `robot/robot/stashed/`), performance tests in `perftests/`

---

## Test Pyramid

```
         /\
        /  \         E2E (Robot Framework) — 10%
       /    \        Validates user journeys in real org
      /──────\
     /        \      Integration (Scratch Org) — 20%
    /          \     Validates cross-component behavior
   /────────────\
  /              \   Unit (Jest + Apex @IsTest) — 70%
 /                \  Validates individual components
/──────────────────\
```

---

## Robot Framework Test Strategy

### Existing Test Organization

```
robot/Cumulus/
├── resources/          # Shared keywords (34 resource files)
│   ├── NPSP.robot      # Core NPSP keywords
│   ├── Data.robot       # Data creation keywords
│   └── BDI_API.robot    # BDI-specific keywords
├── tests/
│   └── browser/        # ~100 browser-based tests
│       ├── contacts_accounts/
│       ├── donations_payments/
│       ├── gift_entry/
│       ├── zrecurring_donations/
│       └── ... (10+ categories)
├── perftests/          # Performance tests
│   ├── BDI_Tests.robot
│   ├── Insert_Tests.robot
│   └── RD_Batch_Tests.robot

robot/robot/stashed/            # Disabled tests (Batch Gift Entry) — note: at robot/robot/stashed/, NOT under robot/Cumulus/
```

### New E2E Tests Needed (Per Workstream)

| Workstream | E2E Test | Priority |
|-----------|----------|----------|
| WS-02 | Sharing enforcement: restricted user cannot see records | High |
| WS-03 | Async job completes: trigger → Queueable → result visible | Medium |
| WS-06 | LWC component renders: new components functional in org | High |
| WS-07 | Settings migration: admin migrates CS to CMT via UI | High |
| WS-08 | Keyboard navigation: tab through form fields, submit | High |
| WS-09 | Integration health: health check shows green for configured endpoints | Medium |

### Robot Framework Execution

```bash
# Run specific test suite
cci task run robot --org qa \
  -o suites robot/Cumulus/tests/browser/contacts_accounts

# Run with specific tag
cci task run robot --org qa \
  -o include critical

# Run performance tests (persistent org with LDV data)
cci task run robot --org perf \
  -o suites robot/Cumulus/perftests
```

---

## Integration Test Scenarios

### Cross-Agent Integration Tests

These tests validate that changes from different agents work together:

#### 1. Contact Creation Full Chain
```
Trigger: Insert Contact
  → TDTM_Config_API dispatches handlers (WS-01)
  → HH_Households creates household (inherited sharing — WS-02)
  → CRLP rollups calculate (Platform Cache — WS-04)
  → Queueable async processing enqueues (WS-03)
  → Error handling captures failures (WS-03)
Verify: Household created, rollups correct, no governor limit warnings
```

#### 2. Donation Entry via Gift Entry LWC
```
UI: geFormRenderer LWC (WS-06)
  → Apex controller call (WS-01 base class)
  → CRUD/FLS check (WS-02)
  → Insert Opportunity → TDTM chain
  → Allocation created → Rollup recalculated
  → Platform Event published (WS-03)
Verify: UI shows success, records created, rollups updated
```

#### 3. Settings Migration
```
Admin: npspSettingsMigration LWC (to be created in WS-07)
  → Reads Custom Settings via UTIL_CustomSettingsFacade
  → Deploys CMT via Metadata API
  → ConfigurationService reads CMT (cache hit — WS-04)
  → Application behavior unchanged
Verify: Settings read correctly from CMT, fallback works if CMT empty
```

#### 4. Integration Callout with Circuit Breaker
```
Trigger: Address verification on Contact
  → ADDR_SmartyStreets_Validator implements ADDR_IValidator (WS-09)
  → Named Credential used for auth
  → Retry on 503 (exponential backoff)
  → Circuit breaker opens after 3 failures
  → Health check shows yellow status
Verify: Retry behavior correct, circuit breaker opens, UI reflects status
```

---

## CI Integration

### Current CI Pipeline (extend, don't replace)

```yaml
# Existing workflows to extend:
# - apex-tests.yml → Add integration test job
# - pr-validation.yml → Add E2E smoke job

# New workflow: e2e-tests.yml
name: E2E Tests
on:
  schedule:
    - cron: '0 2 * * 1-5'  # Nightly, weekdays
  workflow_dispatch:         # Manual trigger

jobs:
  robot-critical:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup CumulusCI
        # ... (same as apex-tests.yml)
      - name: Create QA Org
        run: cci org scratch dev e2e_org --days 1
      - name: Deploy
        run: cci flow run qa_org --org e2e_org
      - name: Run Critical Robot Tests
        run: |
          cci task run robot --org e2e_org \
            -o suites robot/Cumulus/tests/browser/contacts_accounts \
            -o suites robot/Cumulus/tests/browser/donations_payments \
            -o suites robot/Cumulus/tests/browser/zrecurring_donations
      - name: Cleanup
        if: always()
        run: cci org scratch_delete e2e_org
```

### Test Execution Schedule

| Test Type | Trigger | Duration | Environment |
|-----------|---------|----------|-------------|
| Unit (Jest) | Every push | ~2 min | CI runner |
| Unit (Apex) | PR with .cls changes | ~15 min | Scratch org |
| Integration (Robot critical) | Nightly | ~30 min | Scratch org |
| Integration (Robot full) | Weekly | ~2 hours | Scratch org |
| Performance | Pre-release | ~1 hour | Persistent org |
| E2E full + variants | Phase milestone | ~4 hours | Multiple orgs |

---

## Test Tagging Strategy

```robot
*** Settings ***
Force Tags    regression    contact    tier2

*** Test Cases ***
Create Contact And Verify Household
    [Tags]    critical    smoke    tier1
    ...

Verify Rollup After Bulk Insert
    [Tags]    performance    tier4    ldv
    ...
```

| Tag | Purpose |
|-----|---------|
| `critical` | Must pass for any release |
| `smoke` | Quick health check |
| `tier1`-`tier4` | Regression tier mapping |
| `performance` | Performance-related |
| `ldv` | Requires large data volume |
| Domain tags (`contact`, `donation`, etc.) | Feature area filtering |

---

*Document Version: 1.0*
*Last Updated: 2026-02-12*
