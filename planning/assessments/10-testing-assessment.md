# WS-10: Testing Strategy — Assessment

**Review Date**: 2026-02-12
**Implementation Plan**: [10-testing.md](../implementation/10-testing.md)
**Planning Doc**: [10-TESTING-STRATEGY.md](../10-TESTING-STRATEGY.md)
**Overall Rating**: **Adequate**

---

## Well-Architected Alignment

| Pillar | Score | Notes |
|--------|-------|-------|
| Trusted | Adequate | Security test utilities well-designed; no pen testing/IDOR tests |
| Easy | N/A | Infrastructure workstream |
| Adaptable | Adequate | Builder pattern extensible; mock factory reusable |
| Intentional | Adequate | testMethod migration is low-value but correctly acknowledged |
| Automated | Adequate | CI pipeline, coverage gates, nightly runs; no flaky test detection |

---

## Accuracy Findings

### Minor: Agent Roster Gap

`documentation_agent` performs Sprint 7-8 work (documenting test utilities and patterns) but is not listed as a Supporting Agent. Should be added.

### Verified Correct
- 644 `testMethod` count consistent with planning doc (644 + 132 `@IsTest` = 776 total)
- Migration arithmetic correct: 200 + 200 + 244 = 644
- 336+ test classes count consistent with agent definition
- `@IsTest` annotation and `static testMethod void` are functionally identical
- Builder pattern code examples are valid Apex
- `TEST_SecurityHelper` and `TEST_HttpMockFactory` patterns are sound
- Sprint numbering internally consistent

---

## Backwards Compatibility Risks

### Risk 1: CI Coverage Gate Enforcement — MEDIUM

The plan introduces a blocking CI gate failing builds below 85% coverage. Community contributors working on features that temporarily drop coverage will be blocked from merging.

**Mitigation**: Document the coverage gate. Provide a process for temporary waivers for community contributors. Consider a per-PR delta check ("this PR doesn't decrease coverage") rather than absolute threshold.

### Risk 2: Test Classes Inserting Custom Settings Directly — MEDIUM

Many test classes directly insert Custom Settings (`insert new Allocations_Settings__c(...)`) rather than using `UTIL_CustomSettingsFacade.getSettingsForTests()`. When WS-07 switches to CMT-primary, these tests will insert Custom Settings that are ignored by application code.

Tests will pass (CS fallback works), but they stop validating the correct code path.

**Mitigation**: Audit all test classes for direct Custom Setting DML. Plan migration to `setTestCMTSettings()` pattern alongside WS-07.

### Risk 3: testMethod to @IsTest — LOW

Purely syntactic change. `static testMethod void` and `@IsTest static void` are functionally identical. The 644 migrations will not change any test behavior.

### Risk 4: Performance Test Threshold Flakiness — LOW

Performance tests asserting specific governor limits (e.g., `System.assert(queriesUsed < 50)`) can become flaky if other changes in the transaction affect limit consumption.

**Mitigation**: Use relative thresholds ("within 120% of baseline") rather than absolute values.

---

## Well-Architected Detail

### Automated — Flaky Test Detection

No flaky test detection or quarantine process. Flaky tests are common in Salesforce CI and undermine gate trust. The `retry_failures True` CumulusCI flag masks flaky tests rather than addressing root causes.

**Recommendation**:
1. Track tests that fail intermittently and flag for investigation
2. Remove `retry_failures True` or limit to 1 retry
3. Require investigation when retries are needed

### Automated — Test Data Management

No test data management strategy for CI. Scratch org test data setup can be slow with no optimization mentioned.

**Recommendation**: Define strategy: use test factories for unit tests, CumulusCI data tasks for integration tests.

### Intentional — Robot Framework Timing

Robot Framework E2E tests appear in Sprint 7-8 as a late addition. No justification for why E2E tests are introduced at the end rather than incrementally throughout.

**Recommendation**: Introduce Robot Framework tests earlier (Sprint 5-6) for critical paths, then expand.

### Trusted — Security Testing Depth

Security test utilities (`TEST_SecurityHelper`) are well-designed for CRUD/FLS testing. However, no mention of:
- Horizontal privilege escalation tests
- Insecure Direct Object Reference (IDOR) tests
- Penetration testing scenarios

These are higher-order security tests beyond CRUD/FLS.

---

## Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| **P1** | Audit test classes for direct CS DML | Count `insert new *_Settings__c(...)` patterns |
| **P2** | Add flaky test detection | Track intermittent failures; limit `retry_failures` |
| **P2** | Make performance thresholds relative | "Within 120% of baseline" not absolute values |
| **P2** | Define test data management strategy | Factories for unit, CumulusCI tasks for integration |
| **P3** | Move Robot Framework earlier | Sprint 5-6 for critical paths, expand from there |
| **P3** | Document coverage gate waiver process | For community contributors |
| **P3** | Add `documentation_agent` to supporting agents | Currently unlisted despite Sprint 7-8 work |

---

*Assessment Version: 1.0*
*Last Updated: 2026-02-12*
