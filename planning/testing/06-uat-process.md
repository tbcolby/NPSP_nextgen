# UAT Process

**Scope**: User Acceptance Testing before each phase release
**Environment**: Persistent scratch org or sandbox with realistic data

---

## UAT Roles

| Role | Responsibility | Persona |
|------|---------------|---------|
| **UAT Lead** | Coordinates testing, tracks results | Supervisor agent |
| **Functional Tester** | Executes test scripts, reports issues | Testing agent |
| **Admin Tester** | Tests admin flows (settings, migration) | Human admin |
| **End User Tester** | Tests donor management workflows | Human fundraiser |
| **Accessibility Tester** | Tests with assistive technology | Human + LWC agent |

---

## UAT Environment Setup

```bash
# Create UAT org with full configuration
cci org scratch beta uat_phase_N --days 30
cci flow run qa_org --org uat_phase_N

# Load realistic dataset (load_uat_data does not currently exist; use existing task)
cci task run test_data_qa_org --org uat_phase_N

# Configure integrations (manual)
# - Named Credentials (sandbox endpoints)
# - CMT settings (via migration utility — npspSettingsMigration LWC, to be created in WS-07)
# - Permission sets assigned to test users
```

### Test User Profiles

| Profile | Purpose | Permissions |
|---------|---------|-------------|
| System Administrator | Full access baseline | All NPSP permissions |
| NPSP Standard User | Typical fundraiser | Standard NPSP permission sets |
| Read Only | Restricted access | View only, no edit |
| Minimal Access | Security testing | Base profile, no permission sets |
| Integration User | API/callout testing | Named Credential access |

---

## UAT Test Scripts

### Phase 1 UAT (Foundation, Security, Code Quality)

| # | Scenario | Steps | Expected Result | Tester |
|---|----------|-------|-----------------|--------|
| 1.1 | Contact creation | Create Contact → verify Household | Household auto-created | Functional |
| 1.2 | Donation entry | Create Opportunity → verify rollup | Rollup calculated correctly | Functional |
| 1.3 | Restricted user access | Login as Standard User → verify record visibility | Correct sharing enforcement | Admin |
| 1.4 | Settings access | Open NPSP Settings → modify setting | Setting saves and applies | Admin |
| 1.5 | Error handling | Trigger known error → verify error log | Error logged, user-friendly message | Functional |

### Phase 2 UAT (Async, Performance, Configuration, Testing)

| # | Scenario | Steps | Expected Result | Tester |
|---|----------|-------|-----------------|--------|
| 2.1 | Batch processing | Run Data Import batch → verify results | All records processed, no errors | Functional |
| 2.2 | Async job monitoring | Trigger async operation → check monitoring | Job visible in monitoring dashboard | Admin |
| 2.3 | Settings migration | Run CS → CMT migration utility (npspSettingsMigration LWC — to be created in WS-07) | Settings migrated, application works | Admin |
| 2.4 | CMT settings | Modify CMT setting → verify behavior change | Application reads new CMT value | Admin |
| 2.5 | Performance | Create 200 contacts in bulk → verify timing | Completes within governor budgets | Functional |
| 2.6 | Recurring Donation | Create RD → verify schedule + opportunities | Schedule created, opportunities generated | End User |

### Phase 3 UAT (UI, Accessibility, Integration)

| # | Scenario | Steps | Expected Result | Tester |
|---|----------|-------|-----------------|--------|
| 3.1 | LWC components | Use new LWC components → verify function | All components render, function correctly | End User |
| 3.2 | Keyboard navigation | Tab through Gift Entry form → submit | Form navigable and submittable via keyboard | Accessibility |
| 3.3 | Screen reader | Navigate form with VoiceOver/NVDA | All fields announced, errors announced | Accessibility |
| 3.4 | Integration health | Check integration status component | All endpoints show green | Admin |
| 3.5 | Payment processing | Process test donation via Elevate | Payment succeeds via Named Credential | Functional |
| 3.6 | Address verification | Enter address → verify validation | Address validated via Named Credential | End User |

---

## UAT Acceptance Criteria

### Per Phase
- All UAT test scripts pass
- No P0 or P1 defects open
- P2 defects documented with workarounds
- Admin documentation reviewed and accurate
- Performance within governor budgets

### Sign-Off

```yaml
phase_sign_off:
  testing_agent: "All automated tests pass, UAT scripts verified"
  security_agent: "Security review complete, no critical findings"
  supervisor: "All agent sign-offs received"
  human_admin: "Admin workflows tested and documented"
  human_user: "End user workflows functional and intuitive"
```

---

## Defect Management

### During UAT

| Severity | Action | Deadline |
|----------|--------|----------|
| P0 Critical | Block release, fix immediately | Before UAT sign-off |
| P1 High | Fix required before release | Before UAT sign-off |
| P2 Medium | Fix or document workaround | Before release |
| P3 Low | Add to backlog | Next sprint |

### Defect Tracking

```bash
# Create GitHub issue for UAT defect
gh issue create \
  --title "UAT: [Brief description]" \
  --label "uat,bug,phase-N" \
  --body "## Steps to Reproduce\n...\n## Expected\n...\n## Actual\n..."
```

---

*Document Version: 1.0*
*Last Updated: 2026-02-12*
