# Integration Architecture Plan

## Executive Summary

This document outlines the integration modernization strategy for NPSP_nextgen, focusing on implementing Named Credentials, External Services, and secure callout patterns. The goal is to improve security, maintainability, and compliance for all external integrations.

**Core Decision**: Implement Named Credentials for all external endpoints with External Services for well-defined APIs.

---

## 1. Current State Analysis

### 1.1 Integration Inventory

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION INVENTORY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FILES WITH HTTP CALLOUTS: 47                                    │
│  NAMED CREDENTIALS USAGE: 0                                      │
│  EXTERNAL SERVICES: 0                                            │
│                                                                  │
│  INTEGRATION TYPES:                                              │
│  ├─ Payment Services (Elevate)    ████████░░░░░░  ~40%          │
│  ├─ Address Validation            ██████░░░░░░░░  ~30%          │
│  ├─ Metadata API                  ████░░░░░░░░░░  ~15%          │
│  └─ Other (YouTube, etc.)         ███░░░░░░░░░░░  ~15%          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Current Integration Patterns

**Elevate Payment Services**:
```apex
// Current pattern - credentials in custom settings
public class PS_Request {
    private static final String ENDPOINT = 'callout:Elevate';

    public HttpResponse send() {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(ENDPOINT + '/v1/payments');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + getToken());
        // ...
    }

    private String getToken() {
        // Retrieved from custom settings or API call
    }
}
```

**Address Validation (SmartyStreets)**:
```apex
// Current pattern - hardcoded in test classes
public class ADDR_SmartyStreets_Gateway {
    private static final String ENDPOINT =
        'https://us-street.api.smartystreets.com/street-address';

    public HttpResponse validateAddress(Address addr) {
        String url = ENDPOINT +
            '?auth-id=' + getAuthId() +
            '&auth-token=' + getAuthToken();
        // ...
    }
}
```

### 1.3 Security Concerns

| Concern | Current State | Risk |
|---------|---------------|------|
| Hardcoded endpoints | Some files | Medium |
| Credentials in settings | Custom Settings | High |
| No retry logic | Most callouts | Medium |
| No circuit breaker | All callouts | Medium |
| Limited monitoring | Basic logging | Low |

---

## 2. Target State Architecture

### 2.1 Integration Architecture Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                 TARGET INTEGRATION ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   APPLICATION LAYER                      │    │
│  │  Apex Services │ LWC │ Flows │ Platform Events          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                INTEGRATION SERVICE LAYER                 │    │
│  │  NPSP_IntegrationService                                 │    │
│  │  ├─ Retry logic                                         │    │
│  │  ├─ Circuit breaker                                     │    │
│  │  ├─ Error handling                                      │    │
│  │  └─ Monitoring/logging                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│            ┌─────────────────┼─────────────────┐                │
│            ▼                 ▼                 ▼                │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │    NAMED      │ │   EXTERNAL    │ │   PLATFORM    │         │
│  │  CREDENTIALS  │ │   SERVICES    │ │    EVENTS     │         │
│  │  (Auth)       │ │  (OpenAPI)    │ │  (Async)      │         │
│  └───────────────┘ └───────────────┘ └───────────────┘         │
│            │                 │                 │                │
│            └─────────────────┼─────────────────┘                │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   EXTERNAL SYSTEMS                       │    │
│  │  Elevate │ SmartyStreets │ Google │ Cicero │ etc.       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Named Credential Strategy

| Integration | Named Credential | Auth Type |
|-------------|------------------|-----------|
| Elevate Payment | Elevate_Payment_API | OAuth 2.0 |
| SmartyStreets | SmartyStreets_Address | API Key |
| Google Geocoding | Google_Geocoding_API | API Key |
| Cicero | Cicero_Address | API Key |
| Metadata API | Salesforce_Metadata | OAuth 2.0 |

---

## 3. Implementation Patterns

### 3.1 Integration Service Base Class

```apex
/**
 * @description Base class for all external integrations
 * Provides retry logic, circuit breaker, and monitoring
 */
public abstract inherited sharing class NPSP_IntegrationService {

    // Circuit breaker state
    private static Map<String, CircuitState> circuitStates =
        new Map<String, CircuitState>();

    // Configuration
    protected Integer maxRetries = 3;
    protected Integer retryDelayMs = 1000;
    protected Integer timeoutMs = 30000;

    /**
     * @description Execute callout with retry and circuit breaker
     */
    protected HttpResponse executeWithResilience(HttpRequest request) {
        String serviceName = getServiceName();

        // Check circuit breaker
        if (isCircuitOpen(serviceName)) {
            throw new IntegrationException(
                'Service temporarily unavailable: ' + serviceName
            );
        }

        HttpResponse response;
        Integer attempts = 0;

        while (attempts < maxRetries) {
            try {
                attempts++;

                // Execute callout
                Http http = new Http();
                response = http.send(request);

                // Check for success
                if (isSuccessResponse(response)) {
                    recordSuccess(serviceName);
                    return response;
                }

                // Retryable error?
                if (!isRetryable(response.getStatusCode())) {
                    recordFailure(serviceName);
                    break;
                }

            } catch (CalloutException ce) {
                recordFailure(serviceName);

                if (attempts >= maxRetries) {
                    throw new IntegrationException(
                        'Callout failed after ' + maxRetries + ' attempts',
                        ce
                    );
                }

                // Wait before retry
                sleep(retryDelayMs * attempts);
            }
        }

        return response;
    }

    /**
     * @description Check if response indicates success
     */
    protected virtual Boolean isSuccessResponse(HttpResponse response) {
        Integer status = response.getStatusCode();
        return status >= 200 && status < 300;
    }

    /**
     * @description Check if error is retryable
     */
    protected virtual Boolean isRetryable(Integer statusCode) {
        // Retry on server errors and rate limiting
        return statusCode >= 500 || statusCode == 429;
    }

    /**
     * @description Get service name for monitoring
     */
    protected abstract String getServiceName();

    // ============= CIRCUIT BREAKER =============

    private Boolean isCircuitOpen(String serviceName) {
        CircuitState state = circuitStates.get(serviceName);
        if (state == null) return false;

        if (state.isOpen && state.openUntil < System.now()) {
            // Half-open: allow one request through
            state.isOpen = false;
            return false;
        }

        return state.isOpen;
    }

    private void recordSuccess(String serviceName) {
        CircuitState state = getOrCreateState(serviceName);
        state.failureCount = 0;
        state.isOpen = false;
    }

    private void recordFailure(String serviceName) {
        CircuitState state = getOrCreateState(serviceName);
        state.failureCount++;

        if (state.failureCount >= 5) {
            state.isOpen = true;
            state.openUntil = System.now().addMinutes(5);

            // Log circuit open event
            UTIL_PerfLogger.log(
                'Integration',
                serviceName,
                null,
                'CIRCUIT_OPEN'
            );
        }
    }

    private CircuitState getOrCreateState(String serviceName) {
        if (!circuitStates.containsKey(serviceName)) {
            circuitStates.put(serviceName, new CircuitState());
        }
        return circuitStates.get(serviceName);
    }

    // ============= INNER CLASSES =============

    private class CircuitState {
        public Integer failureCount = 0;
        public Boolean isOpen = false;
        public DateTime openUntil;
    }

    public class IntegrationException extends Exception {}

    // ============= UTILITY =============

    private void sleep(Integer milliseconds) {
        Long startTime = System.currentTimeMillis();
        while (System.currentTimeMillis() - startTime < milliseconds) {
            // Busy wait (Apex doesn't have Thread.sleep)
        }
    }
}
```

### 3.2 Named Credential Implementation

```apex
/**
 * @description Elevate payment service using Named Credentials
 */
public inherited sharing class ElevatePaymentService
    extends NPSP_IntegrationService {

    private static final String NAMED_CREDENTIAL = 'callout:Elevate_Payment_API';

    @Override
    protected String getServiceName() {
        return 'Elevate_Payment';
    }

    /**
     * @description Create a payment commitment
     */
    public CommitmentResponse createCommitment(CommitmentRequest request) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + '/v1/commitments');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(request));
        req.setTimeout(timeoutMs);

        HttpResponse res = executeWithResilience(req);

        if (!isSuccessResponse(res)) {
            handleErrorResponse(res);
        }

        return (CommitmentResponse) JSON.deserialize(
            res.getBody(),
            CommitmentResponse.class
        );
    }

    /**
     * @description Capture a payment
     */
    public CaptureResponse capturePayment(String paymentId, Decimal amount) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + '/v1/payments/' + paymentId + '/capture');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(new Map<String, Object>{
            'amount' => amount
        }));
        req.setTimeout(timeoutMs);

        HttpResponse res = executeWithResilience(req);

        return (CaptureResponse) JSON.deserialize(
            res.getBody(),
            CaptureResponse.class
        );
    }

    private void handleErrorResponse(HttpResponse res) {
        ErrorResponse error = (ErrorResponse) JSON.deserialize(
            res.getBody(),
            ErrorResponse.class
        );

        throw new IntegrationException(
            'Elevate API Error: ' + error.message +
            ' (Code: ' + error.code + ')'
        );
    }

    // ============= REQUEST/RESPONSE CLASSES =============

    public class CommitmentRequest {
        public String donorId;
        public Decimal amount;
        public String frequency;
        public Date startDate;
    }

    public class CommitmentResponse {
        public String commitmentId;
        public String status;
    }

    public class CaptureResponse {
        public String transactionId;
        public String status;
        public Decimal capturedAmount;
    }

    public class ErrorResponse {
        public String code;
        public String message;
    }
}
```

### 3.3 Named Credential Metadata

```xml
<!-- force-app/main/default/namedCredentials/Elevate_Payment_API.namedCredential-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<NamedCredential xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Elevate_Payment_API</fullName>
    <label>Elevate Payment API</label>
    <endpoint>https://api.sfdo-elevate.org</endpoint>
    <principalType>NamedUser</principalType>
    <protocol>Oauth</protocol>
    <oauthScope>api payments</oauthScope>
    <calloutStatus>Enabled</calloutStatus>
    <generateAuthorizationHeader>true</generateAuthorizationHeader>
    <allowMergeFieldsInBody>false</allowMergeFieldsInBody>
    <allowMergeFieldsInHeader>false</allowMergeFieldsInHeader>
</NamedCredential>
```

### 3.4 External Service Definition

```yaml
# elevate-payment-api.yaml (OpenAPI 3.0)
openapi: 3.0.0
info:
  title: Elevate Payment API
  version: 1.0.0
  description: Payment processing API for Elevate

servers:
  - url: https://api.sfdo-elevate.org/v1

paths:
  /commitments:
    post:
      operationId: createCommitment
      summary: Create a recurring donation commitment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CommitmentRequest'
      responses:
        '201':
          description: Commitment created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommitmentResponse'

  /payments/{paymentId}/capture:
    post:
      operationId: capturePayment
      summary: Capture a payment
      parameters:
        - name: paymentId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Payment captured
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CaptureResponse'

components:
  schemas:
    CommitmentRequest:
      type: object
      properties:
        donorId:
          type: string
        amount:
          type: number
        frequency:
          type: string
          enum: [monthly, quarterly, annually]
        startDate:
          type: string
          format: date

    CommitmentResponse:
      type: object
      properties:
        commitmentId:
          type: string
        status:
          type: string

    CaptureResponse:
      type: object
      properties:
        transactionId:
          type: string
        status:
          type: string
        capturedAmount:
          type: number
```

---

## 4. Trade-off Analysis

### 4.1 Named Credentials vs Custom Settings

| Aspect | Named Credentials | Custom Settings |
|--------|-------------------|-----------------|
| **Security** | Encrypted, admin-only | Potentially exposed |
| **OAuth Support** | Built-in | Manual implementation |
| **Key Rotation** | Platform managed | Manual |
| **Deployment** | Metadata | Data |
| **Flexibility** | Limited | High |
| **Multi-endpoint** | One per NC | Easy |

**Decision**: Named Credentials for all integrations

### 4.2 External Services vs Manual Apex

| Aspect | External Services | Manual Apex |
|--------|-------------------|-------------|
| **Code Generation** | Automatic | Manual |
| **Type Safety** | Strong | Manual |
| **Maintenance** | Spec-driven | Code-driven |
| **Flexibility** | Limited | High |
| **Complexity** | Lower | Higher |

**Decision**: External Services where OpenAPI spec available

---

## 5. Implementation Plan

### Phase 1: Infrastructure (Sprint 1-2)

| Task | Description | Effort |
|------|-------------|--------|
| Create base service class | NPSP_IntegrationService | 8h |
| Add monitoring utilities | Logging, metrics | 6h |
| Create Named Credential framework | Templates, docs | 4h |

### Phase 2: Elevate Integration (Sprint 3-4)

| Task | Description | Effort |
|------|-------------|--------|
| Create Named Credential | Elevate_Payment_API | 4h |
| Migrate callout code | PS_* classes | 12h |
| Add retry/circuit breaker | All endpoints | 8h |
| Update tests | Mock Named Credentials | 6h |

### Phase 3: Address Validation (Sprint 5-6)

| Task | Description | Effort |
|------|-------------|--------|
| SmartyStreets Named Cred | Create and configure | 4h |
| Google Geocoding Named Cred | Create and configure | 4h |
| Cicero Named Cred | Create and configure | 4h |
| Migrate ADDR_* classes | Update to use NC | 10h |

### Phase 4: Documentation (Sprint 7)

| Task | Description | Effort |
|------|-------------|--------|
| Integration guide | For contributors | 6h |
| Setup documentation | Admin guide | 4h |
| Test patterns | Mock examples | 4h |

---

## 6. Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Named Credentials | 0 | 5+ | Q2 2027 |
| Hardcoded endpoints | Multiple | 0 | Q2 2027 |
| Callout retry coverage | 0% | 100% | Q3 2027 |
| Circuit breaker coverage | 0% | 100% | Q3 2027 |
| Integration test coverage | Unknown | 80%+ | Q3 2027 |

---

## 7. Appendix

### A. Callout Limits Reference

| Limit | Value |
|-------|-------|
| Callouts per transaction | 100 |
| Max timeout | 120 seconds |
| Max response size | 6 MB |
| Max callout time (total) | 120 seconds |

### B. Related Documents

- [02-SECURITY-ARCHITECTURE.md](02-SECURITY-ARCHITECTURE.md)
- [03-ASYNC-APEX-MODERNIZATION.md](03-ASYNC-APEX-MODERNIZATION.md)

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: NPSP_nextgen Architecture Team*
