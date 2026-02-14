# WS-09: Integration Architecture — Implementation Subplan

**Phase**: 3 (Experience & Integration)
**Primary Agent**: `apex_agent`
**Supporting Agents**: `security_agent`, `devops_agent`
**Planning Doc**: [09-INTEGRATION-ARCHITECTURE.md](../09-INTEGRATION-ARCHITECTURE.md)
**Depends on**: WS-01 (Foundation), WS-02 (Security), WS-03 (Async)

---

## Objective

Migrate all external integrations to Named Credentials, create a base integration service with retry/circuit breaker patterns, implement External Services where OpenAPI specs exist, and add integration monitoring.

---

## Sprint Breakdown

### Sprint 1-2: Integration Service Framework

**Agent**: `apex_agent`
**Tasks**:
1. Create `NPSP_IntegrationService` base class:
   ```apex
   public virtual inherited sharing class NPSP_IntegrationService {
       protected String namedCredentialName;
       protected Integer maxRetries = 3;
       protected Integer timeoutMs = 30000;

       // Retry with exponential backoff
       public HttpResponse sendWithRetry(HttpRequest request) {
           for (Integer i = 0; i <= maxRetries; i++) {
               try {
                   HttpResponse response = new Http().send(request);
                   if (isRetryableStatus(response.getStatusCode())) {
                       if (i < maxRetries) { continue; }
                   }
                   return response;
               } catch (CalloutException e) {
                   if (i == maxRetries) { throw e; }
               }
           }
           return null;
       }

       // Circuit breaker
       protected Boolean isCircuitOpen(String endpoint) {
           NPSP_Circuit_State__mdt state = getCircuitState(endpoint);
           return state != null && state.Is_Open__c &&
                  state.Opened_At__c.addMinutes(5) > Datetime.now();
       }

       private Boolean isRetryableStatus(Integer code) {
           return code == 429 || code == 503 || code == 504;
       }
   }
   ```
2. Create circuit breaker state tracking:
   - `NPSP_Circuit_State__mdt` — Custom Metadata for circuit state
   - Or use Platform Cache for transient circuit state
3. Create integration monitoring:
   - `NPSP_Integration_Log__c` custom object (or Platform Event)
   - Fields: Endpoint, Status, Duration, Error Message, Timestamp
   - Log all callout attempts with timing

**Agent**: `security_agent`
**Tasks**:
1. Review integration service for security:
   - Verify no credentials in code
   - Verify HTTPS enforcement
   - Verify response data sanitization
   - Review error messages for data leakage

**Deliverables**:
- `NPSP_IntegrationService` base class with tests
- Circuit breaker mechanism
- Integration monitoring infrastructure

### Sprint 3-4: Generic Payment Processor Interface

> **Note**: Elevate integration has been removed. Community forks cannot authenticate to Salesforce's proprietary Elevate payment processor. Instead, this sprint creates a generic payment processor interface that community integrators can extend for their preferred payment provider (Stripe, PayPal, Square, etc.).

**Agent**: `apex_agent`
**Tasks**:
1. Remove all Elevate-specific code:
   - Delete or gut `PS_IntegrationService` Elevate callout logic
   - Remove `GE_PaymentServices` Elevate-specific references
   - Remove Elevate Named Credential metadata
   - Remove Elevate-specific Custom Metadata and Custom Settings
2. Create generic `NPSP_PaymentProcessorInterface`:
   ```apex
   public interface NPSP_PaymentProcessorInterface {
       // Process a one-time payment
       NPSP_PaymentResult processPayment(NPSP_PaymentRequest request);
       // Process a recurring payment schedule
       NPSP_PaymentResult processRecurringPayment(NPSP_RecurringPaymentRequest request);
       // Refund a payment
       NPSP_PaymentResult refundPayment(String transactionId, Decimal amount);
       // Check payment status
       NPSP_PaymentStatus getPaymentStatus(String transactionId);
   }
   ```
3. Create `NPSP_PaymentProcessorService` that extends `NPSP_IntegrationService`:
   - Uses Named Credentials for authentication
   - Delegates to a registered `NPSP_PaymentProcessorInterface` implementation
   - Includes retry and circuit breaker from base class
4. Create `Payment_Processor_Config__mdt` for configuring which processor implementation to use

**Agent**: `security_agent`
**Tasks**:
1. Verify no card data logging in generic interface
2. Review that tokenization patterns are enforced
3. Review Named Credential configuration security
4. Ensure PCI-relevant data never reaches debug logs

**Agent**: `testing_agent`
**Tasks**:
1. Create mock payment processor implementation for testing
2. Test retry behavior (server errors, timeouts)
3. Test circuit breaker (opens after failures, closes after cooldown)
4. Test with invalid credentials (graceful error handling)

**Deliverables**:
- `NPSP_PaymentProcessorInterface` — generic interface for any payment provider
- `NPSP_PaymentProcessorService` — base service with Named Credential + retry + circuit breaker
- `Payment_Processor_Config__mdt` — Custom Metadata for processor configuration
- Mock payment processor for testing
- All Elevate-specific code removed

### Sprint 5-6: Address Verification & Geocoding (Named Credentials)

**Agent**: `apex_agent`
**Tasks**:
1. Create Named Credentials for address services:
   - `SmartyStreets_API` — Address verification
   - `Google_Geocoding_API` — Geocoding
   - `Cicero_API` — Legislative district lookup
2. Migrate `ADDR_*` classes:
   - `ADDR_SmartyStreets_Validator` → extend `NPSP_IntegrationService`
   - `ADDR_Google_Geocoder` → extend `NPSP_IntegrationService`
   - `ADDR_Cicero_Validator` → extend `NPSP_IntegrationService`
   - Replace hardcoded endpoints
   - Replace manual API key handling
3. Add retry and circuit breaker to all address callouts
4. Consolidate duplicate address verification settings (merge `Address_Verification_Settings__c` + `Addr_Verification_Settings__c`)

**Agent**: `devops_agent`
**Tasks**:
1. Deploy Named Credential metadata
2. Configure Named Credential setup in scratch org flow
3. Document Named Credential setup for contributors

**Deliverables**:
- 3 Named Credentials for address services
- ADDR_* classes migrated to integration service pattern
- Address settings consolidated

### Sprint 7-8: Monitoring Dashboard & Documentation

**Agent**: `apex_agent`
**Tasks**:
1. Create integration monitoring dashboard:
   - Callout success/failure rates per endpoint
   - Average response times
   - Circuit breaker state visibility
   - Error trend analysis
2. Create integration health check:
   ```apex
   public class NPSP_IntegrationHealthCheck {
       public static Map<String, String> checkAllEndpoints() {
           Map<String, String> results = new Map<String, String>();
           results.put('PaymentProcessor', checkPaymentProcessor());
           results.put('SmartyStreets', checkSmartyStreets());
           results.put('Google', checkGoogle());
           results.put('Cicero', checkCicero());
           return results;
       }
   }
   ```
3. Add Platform Event alerts for integration failures
4. Create admin-facing integration status LWC component

**Agent**: `lwc_agent`
**Tasks**:
1. Create `c-npsp-integration-status` component:
   - Shows status of all configured integrations
   - Green/yellow/red health indicators
   - Last successful callout timestamp
   - Circuit breaker state

**Agent**: `documentation_agent`
**Tasks**:
1. Create integration contributor guide:
   - How to add a new integration
   - Named Credential setup instructions
   - Testing patterns for callout mocking
   - Circuit breaker configuration
2. Create admin setup documentation:
   - Named Credential configuration
   - OAuth setup per integration
   - Monitoring dashboard usage

**Deliverables**:
- Integration monitoring dashboard
- Health check utility
- Integration status LWC component
- Contributor and admin documentation
- Zero hardcoded endpoints remaining

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| Named Credentials | All callouts use Named Credentials | `security_agent` |
| No hardcoded URLs | Zero hardcoded endpoint URLs | `devops_agent` (CI grep) |
| Retry | All callouts have retry with backoff | `apex_agent` review |
| Circuit breaker | All endpoints have circuit breaker | `apex_agent` review |
| Monitoring | All callouts log to integration monitor | `devops_agent` |
| Security | No credentials in code, HTTPS only | `security_agent` |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| Named Credentials | 0 | 1 (Payment Processor) | 4 | 4+ |
| Hardcoded endpoints | Multiple | -1 | -4 | 0 |
| Retry coverage | 0% | 30% | 80% | 100% |
| Circuit breaker coverage | 0% | 30% | 80% | 100% |
| Integration test coverage | Unknown | 60% | 80% | 90%+ |
| Monitoring coverage | 0% | 30% | 80% | 100% |

---

*Subplan Version: 1.1*
*Last Updated: 2026-02-13*
