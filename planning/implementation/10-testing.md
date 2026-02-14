# WS-10: Testing Strategy — Implementation Subplan

**Phase**: 2 (Core Modernization)
**Primary Agent**: `testing_agent`
**Supporting Agents**: `apex_agent`, `lwc_agent`, `devops_agent`
**Planning Doc**: [10-TESTING-STRATEGY.md](../10-TESTING-STRATEGY.md)
**Depends on**: WS-05 (Code Quality)

---

## Objective

Modernize the test infrastructure: migrate 644 `testMethod` instances to `@IsTest`, expand builder pattern, enforce assertion messages, establish LWC Jest coverage baseline, and build CI test pipeline with coverage gates.

---

## Sprint Breakdown

### Sprint 1-2: Test Modernization & Baseline

**Agent**: `testing_agent`
**Tasks**:
1. Audit current test state:
   - Count `testMethod` keyword usage (644 known)
   - Count `@IsTest` annotation usage (132 known)
   - Identify tests without any assertions
   - Identify tests without assertion messages
   - Identify tests without `Test.startTest()`/`Test.stopTest()`
2. Begin `testMethod` → `@IsTest` migration (batch 1: 200 classes):
   - Replace `static testMethod void` with `@IsTest static void`
   - No functional changes, purely syntactic
   - Priority: Classes most likely to be modified in other workstreams
3. Establish LWC Jest test baseline:
   - Run `npm run test:unit -- --coverage`
   - Catalog all 52 existing test files
   - Identify untested LWC components

**Agent**: `devops_agent`
**Tasks**:
1. Configure CI test pipeline:
   ```yaml
   jobs:
     apex-tests:
       - cci task run run_tests --org dev
         -o retry_failures True
         -o required_org_code_coverage_percent 85
     lwc-tests:
       - npm run test:unit -- --coverage
       - npm run test:unit:a11y
   ```
2. Set up coverage reporting (Codecov or similar)
3. Configure test result caching for faster re-runs

**Deliverables**:
- Test audit report (baselines for all metrics)
- 200 classes migrated from `testMethod` to `@IsTest`
- LWC coverage baseline established
- CI test pipeline operational

### Sprint 3-4: Builder Pattern Expansion & Test Utilities

**Agent**: `testing_agent`
**Tasks**:
1. Expand test builder pattern:
   - Audit existing builders: `TEST_ContactBuilder`, `TEST_OpportunityBuilder`, `TEST_RecurringDonationBuilder`
   - Create new builders for commonly-tested objects:
     - `TEST_AccountBuilder` — Account creation with household logic
     - `TEST_AllocationBuilder` — Allocation with GAU
     - `TEST_DataImportBuilder` — BDI records
     - `TEST_PaymentBuilder` — Payment records
   - Each builder follows fluent pattern:
     ```apex
     TEST_AccountBuilder.dummyAccount()
         .withName('Test Org')
         .withRecordType('Organization')
         .build();
     ```
2. Create security test utilities:
   ```apex
   public class TEST_SecurityHelper {
       public static User createMinimalAccessUser() { ... }
       public static User createStandardUser() { ... }
       public static void runAsMinimalAccess(TestAction action) { ... }
   }
   ```
3. Create HTTP mock factory (consolidate existing mocks):
   ```apex
   public class TEST_HttpMockFactory {
       public static HttpCalloutMock success(String body) { ... }
       public static HttpCalloutMock error(Integer code, String msg) { ... }
       public static HttpCalloutMock timeout() { ... }
       public static HttpCalloutMock sequence(List<HttpResponse> responses) { ... }
   }
   ```

**Agent**: `apex_agent`
**Tasks**:
1. Continue `testMethod` → `@IsTest` migration (batch 2: 200 classes)
2. Help testing_agent understand domain-specific test patterns

**Deliverables**:
- 4+ new test builder classes
- Security test utilities
- HTTP mock factory
- 400 total classes migrated to `@IsTest`

### Sprint 5-6: Assertion Quality & LWC Test Coverage

**Agent**: `testing_agent`
**Tasks**:
1. Add assertion messages to all `System.assertEquals` / `System.assert` calls:
   - Scan for assertions without message parameter
   - Add descriptive messages: `System.assertEquals(expected, actual, 'Description of what this checks')`
   - Priority: Test classes for domains being modified in Phase 2 workstreams
2. Identify and fix assertion-less tests:
   - Find test methods that only call code without asserting results
   - Add meaningful assertions
3. Continue `testMethod` → `@IsTest` migration (batch 3: remaining ~244 classes)

**Agent**: `lwc_agent`
**Tasks**:
1. Create Jest tests for highest-priority untested components:
   - `geFormRenderer` (3,079 lines — needs comprehensive tests)
   - `rd2EntryForm` (1,093 lines)
   - `geTemplateBuilder` (1,430 lines)
2. Establish patterns for:
   - Wire adapter mocking
   - Apex method mocking
   - Event handling tests
   - Loading/error state tests
3. Add SA11Y accessibility tests to all new Jest tests

**Deliverables**:
- All `testMethod` → `@IsTest` migration complete (644/644)
- Assertion messages on majority of assertions
- Jest tests for top 3 complex components
- SA11Y integration in new tests

### Sprint 7-8: CI Gates & Performance Tests

**Agent**: `devops_agent`
**Tasks**:
1. Enable coverage gate in CI: fail if coverage < 85%
2. Enable test quality gate: fail if any test class has 0 assertions
3. Configure parallel test execution for faster CI
4. Set up nightly full test run (all Apex + all Jest)

**Agent**: `testing_agent`
**Tasks**:
1. Create performance test suite:
   - Governor limit tests for all trigger handlers (200+ records)
   - Batch job completion tests
   - Queueable execution tests
2. Add Robot Framework tests for critical user flows:
   - Create Contact → verify Household creation
   - Create Opportunity → verify Allocation + Rollup
   - Create Recurring Donation → verify Schedule + Opportunities
3. Document test patterns in CONTRIBUTING.md:
   - How to use test builders
   - How to write bulk tests
   - How to mock callouts
   - How to test with different user profiles

**Agent**: `documentation_agent`
**Tasks**:
1. Document all test utilities and patterns
2. Add test examples to code standards doc

**Deliverables**:
- CI coverage gate active (85% minimum)
- CI assertion quality gate active
- Performance test suite
- Robot Framework tests for critical paths
- Test pattern documentation

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| Coverage | Apex >= 85%, LWC >= 60% (Phase 2), 80% (Phase 3) | `devops_agent` (CI) |
| 2GP Coverage | Apex >= 75% minimum for package version creation (Salesforce requirement) | `devops_agent` (CI) |
| Assertions | No test methods without assertions | `devops_agent` (CI) |
| Annotation | Zero `testMethod` keyword usage | `devops_agent` (CI grep) |
| Bulk | All trigger handler tests use 200+ records | `testing_agent` review |
| A11y | All new LWC tests include SA11Y checks | `testing_agent` review |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| `testMethod` remaining | 644 | 244 | 0 | 0 |
| Test builder classes | 3 | 7+ | 7+ | 7+ |
| Assertions with messages | Unknown | +40% | +70% | +90% |
| LWC test files | 52 | 55 | 60+ | 70+ |
| LWC coverage | Unknown | Baseline | 60%+ | 70%+ |
| CI test time | Unknown | Baselined | -10% | -20% |

---

---

## 2GP Test Coverage Requirements (NPPatch Decision, 2026-02-13)

Since the project ships as a 2GP unlocked package (`npsp2` namespace), Salesforce enforces a **minimum 75% Apex code coverage** for package version creation (`sf package version create`). The project targets 85%, which exceeds this requirement, but the 75% floor is a hard gate that cannot be waived. Key implications:

- Every `sf package version create --codecoverage` run validates coverage
- Test classes must be included in the package and execute successfully in a clean scratch org
- Coverage is calculated across the entire package namespace, not per-class
- CI pipeline should run `sf package version create --codecoverage --installationkey <key>` as a validation step before merging to release branches

---

*Subplan Version: 1.1*
*Last Updated: 2026-02-13*
