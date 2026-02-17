# WS-10: Testing Strategy — Implementation Subplan

**Phase**: 2 (Core Modernization)
**Primary Agent**: `testing_agent`
**Planning Doc**: [10-TESTING-STRATEGY.md](../10-TESTING-STRATEGY.md)
**Status**: Sprint 1-2 substantially complete

---

## Objective

Modernize test infrastructure, expand builder patterns, enforce assertion quality, and establish LWC Jest coverage baseline.

---

## Completed Work

### Sprint 1-2: Test Modernization & Baseline — ✅ COMPLETE (PR #2)

- **testMethod→@IsTest**: 648 conversions across 81 files. Zero `testMethod` keywords remaining.
- **LWC Jest baseline**: 45 test suites, 279 tests, all passing.
- **CI pipeline**: `npm run test:unit` runs on every push. `cci task run run_tests` with 85% coverage gate.
- **Dependencies updated**: Jest 27.5.1, ESLint 8.57.1, @lwc/eslint-plugin-lwc 1.8.2

---

## Remaining Work

### Sprint 3-4: Builder Pattern Expansion & Test Utilities (~15-20h)

1. **Expand test builder pattern**:
   - Existing: `TEST_ContactBuilder`, `TEST_OpportunityBuilder`, `TEST_RecurringDonationBuilder`
   - Create: `TEST_AccountBuilder`, `TEST_AllocationBuilder`, `TEST_DataImportBuilder`, `TEST_PaymentBuilder`
   - Fluent pattern:
     ```apex
     TEST_AccountBuilder.dummyAccount()
         .withName('Test Org')
         .withRecordType('Organization')
         .build();
     ```

2. **Security test utilities**:
   ```apex
   public class TEST_SecurityHelper {
       public static User createMinimalAccessUser() { ... }
       public static User createStandardUser() { ... }
       public static void runAsMinimalAccess(TestAction action) { ... }
   }
   ```

3. **HTTP mock factory** (consolidate existing mocks):
   ```apex
   public class TEST_HttpMockFactory {
       public static HttpCalloutMock success(String body) { ... }
       public static HttpCalloutMock error(Integer code, String msg) { ... }
       public static HttpCalloutMock timeout() { ... }
   }
   ```

### Sprint 5-6: Assertion Quality (~10-15h)

1. Add assertion messages to `System.assertEquals`/`System.assert` calls without messages
2. Identify and fix assertion-less test methods
3. Priority: Test classes for domains being modified in WS-03/WS-04

### Sprint 7-8: Performance Tests & CI Gates (~10-15h)

1. Add governor limit assertions to trigger handler tests:
   ```apex
   Test.startTest();
   insert createTestRecords(200);
   Test.stopTest();
   System.assert(Limits.getQueries() < 50, 'SOQL usage: ' + Limits.getQueries());
   ```
2. Enable CI assertion quality gate (fail if test has 0 assertions)
3. Create Jest tests for top 3 untested complex LWC components

---

## 2GP Test Coverage Requirements

Since NPSP_nextgen ships as 2GP unlocked package (`npsp2` namespace), Salesforce enforces **minimum 75% Apex code coverage** for `sf package version create`. Project targets 85%.

- `sf package version create --codecoverage` validates coverage
- Test classes must execute successfully in clean scratch org
- Coverage calculated across entire package namespace

---

## Quality Gates

| Gate | Criteria |
|------|----------|
| Coverage | Apex >= 85%, 2GP minimum 75% |
| Annotation | Zero `testMethod` keyword ✅ |
| Bulk | All trigger handler tests use 200+ records |
| A11y | All new LWC tests include SA11Y checks |

---

## Success Metrics

| Metric | Start | Current | Target |
|--------|-------|---------|--------|
| `testMethod` remaining | 644 | **0** ✅ | 0 |
| Test builder classes | 3 | 3 | 7+ |
| LWC test suites | 45 | 45 | 60+ |
| LWC tests | 279 | 279 | 350+ |
| Apex coverage | 85% | 85%+ | 88%+ |

---

*Subplan Version: 2.0*
*Last Updated: 2026-02-16*
