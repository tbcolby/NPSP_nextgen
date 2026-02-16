# Testing Strategy Plan

## Executive Summary

This document outlines the comprehensive testing strategy for NPSP_nextgen, covering Apex unit tests, LWC Jest tests, integration tests, and end-to-end testing. The goal is to maintain 85%+ code coverage while ensuring high-quality, reliable test suites that catch regressions early.

**Core Principle**: Tests are first-class code - they should be maintainable, fast, and meaningful.

---

## 1. Current State Analysis

### 1.1 Test Coverage Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     TEST COVERAGE SUMMARY                        │
│              (Updated 2026-02-15 after Phase 1)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  APEX COVERAGE                                                   │
│  ├─ Target: 85%                                                 │
│  ├─ Current: ~85%                                               │
│  └─ Test Classes: 336+                                          │
│                                                                  │
│  LWC TEST COVERAGE                                               │
│  ├─ Target: 80%                                                 │
│  ├─ Current: 52 test suites, 422 tests (all passing)           │
│  └─ Jest Test Files: 52                                         │
│                                                                  │
│  TEST PATTERNS                                                   │
│  ├─ @TestSetup usage: 48 classes (good)                         │
│  ├─ testMethod keyword: 0 ✅ (648 converted in Phase 1)         │
│  ├─ @IsTest annotation: 780+ (all test methods now use this)    │
│  └─ System.runAs usage: 140 (good)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Test Infrastructure

**Test Data Factories**:
- `UTIL_UnitTestData_TEST` - 1,162 lines, primary factory
- `CMT_UnitTestData_TEST` - 721 lines, Custom Metadata testing
- `TEST_*Builder` classes - Builder pattern for complex objects

**Test Utilities**:
- `UTIL_UnitTestData_TEST.createMultipleTestContacts()`
- `UTIL_UnitTestData_TEST.createMultipleTestOpportunities()`
- Various domain-specific test utilities

### 1.3 Test Quality Issues

| Issue | Count | Impact |
|-------|-------|--------|
| Missing assertion messages | Unknown | Low |
| Tests without assertions | Unknown | High |
| Non-bulk tests (<200 records) | Unknown | Medium |
| Hardcoded test data | Unknown | Medium |
| Missing negative tests | Unknown | High |

---

## 2. Testing Architecture

### 2.1 Test Pyramid

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEST PYRAMID                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         ┌───────┐                               │
│                         │  E2E  │  5%                           │
│                         │ Tests │  Robot Framework              │
│                       ┌─┴───────┴─┐                             │
│                       │Integration│  15%                        │
│                       │   Tests   │  Cross-object, callouts     │
│                     ┌─┴───────────┴─┐                           │
│                     │  Component    │  20%                      │
│                     │    Tests      │  LWC Jest                 │
│                   ┌─┴───────────────┴─┐                         │
│                   │    Unit Tests      │  60%                   │
│                   │    Apex Classes    │  Fast, isolated        │
│                   └────────────────────┘                        │
│                                                                  │
│  Execution Time:  Unit < Component < Integration < E2E          │
│  Isolation:       Unit > Component > Integration > E2E          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Test Categories

| Category | Purpose | Tools | Coverage Target |
|----------|---------|-------|-----------------|
| Unit | Individual class/method | Apex Test Framework | 85%+ |
| Component | LWC behavior | Jest + LWC Test Utils | 80%+ |
| Integration | Cross-object | Apex + Test.startTest() | Key flows |
| E2E | Full workflows | Robot Framework | Critical paths |
| Performance | Governor limits | Custom LDV tests | All triggers |

---

## 3. Apex Testing Standards

### 3.1 Test Class Structure

```apex
/**
 * @description Test class for ALLO_AllocationsService
 * Tests allocation creation, validation, and rollup calculations
 *
 * @group Allocations
 * @see ALLO_AllocationsService
 */
@IsTest
private class ALLO_AllocationsService_TEST {

    // ============= TEST SETUP =============

    @TestSetup
    static void setup() {
        // Create test data shared across all tests
        UTIL_CustomSettingsFacade.getSettingsForTests(
            new Allocations_Settings__c(
                Default_Allocations_Enabled__c = true
            )
        );

        Account acc = UTIL_UnitTestData_TEST.createAccount();
        insert acc;

        Contact con = UTIL_UnitTestData_TEST.createContact(acc.Id);
        insert con;

        General_Accounting_Unit__c gau = new General_Accounting_Unit__c(
            Name = 'Test GAU'
        );
        insert gau;
    }

    // ============= POSITIVE TESTS =============

    @IsTest
    static void shouldCreateDefaultAllocationsForNewOpportunities() {
        // Arrange
        Account acc = [SELECT Id FROM Account LIMIT 1];
        General_Accounting_Unit__c gau = [SELECT Id FROM General_Accounting_Unit__c LIMIT 1];

        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < 200; i++) {
            opps.add(new Opportunity(
                Name = 'Test Opp ' + i,
                AccountId = acc.Id,
                Amount = 100,
                CloseDate = Date.today(),
                StageName = 'Closed Won'
            ));
        }

        // Act
        Test.startTest();
        insert opps;
        Test.stopTest();

        // Assert
        List<Allocation__c> allocations = [
            SELECT Id, Amount__c, General_Accounting_Unit__c
            FROM Allocation__c
            WHERE Opportunity__c IN :opps
        ];

        System.assertEquals(
            200,
            allocations.size(),
            'Should create one allocation per opportunity'
        );

        for (Allocation__c alloc : allocations) {
            System.assertEquals(
                100,
                alloc.Amount__c,
                'Allocation amount should match opportunity amount'
            );
            System.assertEquals(
                gau.Id,
                alloc.General_Accounting_Unit__c,
                'Allocation should use default GAU'
            );
        }
    }

    // ============= NEGATIVE TESTS =============

    @IsTest
    static void shouldThrowExceptionWhenGAUNotConfigured() {
        // Arrange
        UTIL_CustomSettingsFacade.getSettingsForTests(
            new Allocations_Settings__c(
                Default_Allocations_Enabled__c = true,
                Default__c = null  // No default GAU
            )
        );

        Account acc = [SELECT Id FROM Account LIMIT 1];
        Opportunity opp = new Opportunity(
            Name = 'Test Opp',
            AccountId = acc.Id,
            Amount = 100,
            CloseDate = Date.today(),
            StageName = 'Closed Won'
        );

        // Act & Assert
        Test.startTest();
        try {
            insert opp;
            System.assert(false, 'Should have thrown exception');
        } catch (DmlException e) {
            System.assert(
                e.getMessage().contains('Default GAU'),
                'Exception should mention default GAU'
            );
        }
        Test.stopTest();
    }

    // ============= BULK TESTS =============

    @IsTest
    static void shouldHandleBulkInsertOf200Opportunities() {
        // This test verifies trigger bulkification
        Account acc = [SELECT Id FROM Account LIMIT 1];

        List<Opportunity> opps = UTIL_UnitTestData_TEST.createMultipleTestOpportunities(
            200,
            acc.Id
        );

        Test.startTest();
        Integer queriesBefore = Limits.getQueries();

        insert opps;

        Integer queriesUsed = Limits.getQueries() - queriesBefore;
        Test.stopTest();

        // Verify no SOQL in loops (should be well under 100 queries)
        System.assert(
            queriesUsed < 50,
            'Bulk insert used too many queries: ' + queriesUsed
        );

        // Verify data integrity
        List<Allocation__c> allocations = [
            SELECT Id FROM Allocation__c
            WHERE Opportunity__c IN :opps
        ];
        System.assertEquals(200, allocations.size(), 'All allocations should be created');
    }

    // ============= PERMISSION TESTS =============

    @IsTest
    static void shouldRespectSharingRulesForStandardUser() {
        // Create standard user
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        User standardUser = new User(
            FirstName = 'Test',
            LastName = 'User',
            Email = 'test@test.npsp.org',
            Username = 'test@test.npsp.org' + System.currentTimeMillis(),
            Alias = 'tuser',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'en_US'
        );
        insert standardUser;

        Test.startTest();
        System.runAs(standardUser) {
            // Test that sharing rules are respected
            List<Allocation__c> accessibleAllocations = [
                SELECT Id FROM Allocation__c
            ];
            // Standard user should only see allocations they have access to
        }
        Test.stopTest();
    }
}
```

### 3.2 Test Data Builder Pattern

```apex
/**
 * @description Builder pattern for creating test Opportunities
 * Provides fluent API for test data creation
 */
@IsTest
public class TEST_OpportunityBuilder {

    private Opportunity opp;

    public TEST_OpportunityBuilder() {
        this.opp = new Opportunity(
            Name = 'Test Opportunity',
            Amount = 100,
            CloseDate = Date.today(),
            StageName = 'Prospecting'
        );
    }

    public TEST_OpportunityBuilder withName(String name) {
        this.opp.Name = name;
        return this;
    }

    public TEST_OpportunityBuilder withAmount(Decimal amount) {
        this.opp.Amount = amount;
        return this;
    }

    public TEST_OpportunityBuilder withAccount(Id accountId) {
        this.opp.AccountId = accountId;
        return this;
    }

    public TEST_OpportunityBuilder withContact(Id contactId) {
        this.opp.Primary_Contact__c = contactId;
        return this;
    }

    public TEST_OpportunityBuilder asClosed() {
        this.opp.StageName = 'Closed Won';
        return this;
    }

    public TEST_OpportunityBuilder asRecurring(Id recurringDonationId) {
        this.opp.npe03__Recurring_Donation__c = recurringDonationId;
        return this;
    }

    public Opportunity build() {
        return this.opp;
    }

    public Opportunity buildAndInsert() {
        insert this.opp;
        return this.opp;
    }

    // Bulk builder
    public static List<Opportunity> createBulk(Integer count, Id accountId) {
        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < count; i++) {
            opps.add(new TEST_OpportunityBuilder()
                .withName('Test Opp ' + i)
                .withAccount(accountId)
                .asClosed()
                .build()
            );
        }
        return opps;
    }
}
```

### 3.3 Mock Pattern for Callouts

```apex
/**
 * @description Mock HTTP response generator for integration tests
 */
@IsTest
public class TEST_HttpMock implements HttpCalloutMock {

    private Integer statusCode;
    private String responseBody;
    private Map<String, String> headers;

    public TEST_HttpMock(Integer statusCode, String responseBody) {
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.headers = new Map<String, String>();
    }

    public TEST_HttpMock withHeader(String key, String value) {
        this.headers.put(key, value);
        return this;
    }

    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(statusCode);
        res.setBody(responseBody);

        for (String key : headers.keySet()) {
            res.setHeader(key, headers.get(key));
        }

        return res;
    }

    // Factory methods for common scenarios
    public static TEST_HttpMock success(String body) {
        return new TEST_HttpMock(200, body);
    }

    public static TEST_HttpMock error(Integer code, String message) {
        return new TEST_HttpMock(code, '{"error": "' + message + '"}');
    }

    public static TEST_HttpMock timeout() {
        return new TEST_HttpMock(504, 'Gateway Timeout');
    }
}

// Usage in test
@IsTest
static void shouldHandlePaymentServiceSuccess() {
    String mockResponse = '{"commitmentId": "123", "status": "active"}';
    Test.setMock(HttpCalloutMock.class, TEST_HttpMock.success(mockResponse));

    Test.startTest();
    CommitmentResponse response = paymentService.createCommitment(request);
    Test.stopTest();

    System.assertEquals('123', response.commitmentId);
}
```

---

## 4. LWC Testing Standards

### 4.1 Jest Test Structure

```javascript
// geFormRenderer.test.js
import { createElement } from 'lwc';
import GeFormRenderer from 'c/geFormRenderer';
import { registerApexTestWireAdapter } from '@salesforce/sfdx-lwc-jest';
import getFormTemplate from '@salesforce/apex/GE_FormController.getFormTemplate';

// Register wire adapter mock
const getFormTemplateAdapter = registerApexTestWireAdapter(getFormTemplate);

describe('c-ge-form-renderer', () => {
    // ============= SETUP =============

    afterEach(() => {
        // Clean up DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        // Reset mocks
        jest.clearAllMocks();
    });

    // Helper to create component
    function createComponent(props = {}) {
        const element = createElement('c-ge-form-renderer', {
            is: GeFormRenderer
        });
        Object.assign(element, props);
        document.body.appendChild(element);
        return element;
    }

    // Helper to wait for async operations
    async function flushPromises() {
        return Promise.resolve();
    }

    // ============= RENDERING TESTS =============

    describe('rendering', () => {
        it('should render loading spinner initially', () => {
            const element = createComponent({ templateId: 'test123' });

            const spinner = element.shadowRoot.querySelector('lightning-spinner');
            expect(spinner).not.toBeNull();
        });

        it('should render form fields when data loads', async () => {
            const element = createComponent({ templateId: 'test123' });

            // Emit mock data
            getFormTemplateAdapter.emit({
                sections: [
                    {
                        label: 'Donor Info',
                        fields: [
                            { apiName: 'FirstName', label: 'First Name' },
                            { apiName: 'LastName', label: 'Last Name' }
                        ]
                    }
                ]
            });

            await flushPromises();

            const fields = element.shadowRoot.querySelectorAll('c-ge-form-field');
            expect(fields.length).toBe(2);
        });

        it('should render error state on wire error', async () => {
            const element = createComponent({ templateId: 'test123' });

            getFormTemplateAdapter.error();

            await flushPromises();

            const error = element.shadowRoot.querySelector('.error-message');
            expect(error).not.toBeNull();
        });
    });

    // ============= INTERACTION TESTS =============

    describe('interactions', () => {
        it('should handle field value changes', async () => {
            const element = createComponent({ templateId: 'test123' });
            getFormTemplateAdapter.emit(mockTemplate);
            await flushPromises();

            const field = element.shadowRoot.querySelector('c-ge-form-field');
            field.dispatchEvent(new CustomEvent('valuechange', {
                detail: { field: 'FirstName', value: 'John' }
            }));

            await flushPromises();

            // Verify internal state updated
            expect(element.formData.FirstName).toBe('John');
        });

        it('should dispatch submit event with form data', async () => {
            const element = createComponent({ templateId: 'test123' });
            getFormTemplateAdapter.emit(mockTemplate);
            await flushPromises();

            const submitHandler = jest.fn();
            element.addEventListener('formsubmit', submitHandler);

            const submitButton = element.shadowRoot.querySelector('[data-id="submit"]');
            submitButton.click();

            await flushPromises();

            expect(submitHandler).toHaveBeenCalled();
            expect(submitHandler.mock.calls[0][0].detail).toHaveProperty('formData');
        });
    });

    // ============= VALIDATION TESTS =============

    describe('validation', () => {
        it('should validate required fields before submit', async () => {
            const element = createComponent({ templateId: 'test123' });
            getFormTemplateAdapter.emit(mockTemplateWithRequired);
            await flushPromises();

            const submitButton = element.shadowRoot.querySelector('[data-id="submit"]');
            submitButton.click();

            await flushPromises();

            const errorMessages = element.shadowRoot.querySelectorAll('.field-error');
            expect(errorMessages.length).toBeGreaterThan(0);
        });
    });

    // ============= ACCESSIBILITY TESTS =============

    describe('accessibility', () => {
        it('should have no accessibility violations', async () => {
            const element = createComponent({ templateId: 'test123' });
            getFormTemplateAdapter.emit(mockTemplate);
            await flushPromises();

            // Using sa11y or axe
            await expect(element).toHaveNoA11yViolations();
        });

        it('should manage focus correctly', async () => {
            const element = createComponent({ templateId: 'test123' });
            getFormTemplateAdapter.emit(mockTemplate);
            await flushPromises();

            const firstField = element.shadowRoot.querySelector('input');
            expect(document.activeElement).toBe(firstField);
        });
    });
});

// Mock data
const mockTemplate = {
    sections: [
        {
            label: 'Donor Info',
            fields: [
                { apiName: 'FirstName', label: 'First Name', required: false },
                { apiName: 'LastName', label: 'Last Name', required: false }
            ]
        }
    ]
};

const mockTemplateWithRequired = {
    sections: [
        {
            label: 'Donor Info',
            fields: [
                { apiName: 'FirstName', label: 'First Name', required: true },
                { apiName: 'LastName', label: 'Last Name', required: true }
            ]
        }
    ]
};
```

---

## 5. Test Execution

### 5.1 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: NPSP Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  apex-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install CumulusCI
        run: pip install cumulusci

      - name: Run Apex Tests
        run: |
          cci task run run_tests \
            --org dev \
            -o retry_failures True \
            -o required_org_code_coverage_percent 85

  lwc-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Dependencies
        run: yarn install

      - name: Run LWC Tests
        run: npm run test:unit -- --coverage

      - name: Run Accessibility Tests
        run: npm run test:unit:a11y

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

### 5.2 Local Test Commands

```bash
# Apex Tests
cci task run run_tests --org dev -o retry_failures True

# Single Apex Test Class
sf apex test run -n ALLO_AllocationsService_TEST -o DevOrg -r human

# LWC Tests
npm run test:unit

# LWC Tests with Coverage
npm run test:unit -- --coverage

# LWC Tests Watch Mode
npm run test:unit:watch

# Accessibility Tests
npm run test:unit:a11y
```

---

## 6. Success Metrics

| Metric | Baseline | After Phase 1 | Target | Timeline |
|--------|----------|---------------|--------|----------|
| Apex coverage | 85% | 85%+ | 90%+ | Q4 2027 |
| LWC coverage | Unknown | 52 suites / 422 tests | 80%+ | Q3 2027 |
| testMethod → @IsTest | 648/780 | **0/780** ✅ | 0 | ✅ Done |
| Tests with assertions | Unknown | Unknown | 100% | Q2 2027 |
| Bulk tests (200+) | Partial | Partial | All triggers | Q2 2027 |
| Test execution time | Unknown | Unknown | <30 min | Q3 2027 |

---

## 7. Appendix

### A. Apex Test Limits

| Limit | Value |
|-------|-------|
| Test execution time | 10 minutes per class |
| SOQL queries | 100 (200 async) |
| DML statements | 150 |
| Test.startTest/stopTest | Resets governors |

### B. Related Documents

- [05-CODE-QUALITY-STANDARDS.md](05-CODE-QUALITY-STANDARDS.md)
- [04-PERFORMANCE-OPTIMIZATION.md](04-PERFORMANCE-OPTIMIZATION.md)

---

*Document Version: 1.1*
*Last Updated: 2026-02-15*
*Author: NPSP_nextgen Architecture Team*
