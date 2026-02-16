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
│              (Updated 2026-02-15 after Phase 0)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FILES WITH HTTP CALLOUTS: ~28 (was 47; Elevate removed)         │
│  NAMED CREDENTIALS USAGE: 0                                      │
│  EXTERNAL SERVICES: 0                                            │
│                                                                  │
│  INTEGRATION TYPES:                                              │
│  ├─ Payment Services (Elevate)    ░░░░░░░░░░░░░░  REMOVED       │
│  ├─ Address Validation            ██████████░░░░  ~50%          │
│  ├─ Metadata API                  ██████░░░░░░░░  ~25%          │
│  └─ Other (YouTube, etc.)         ██████░░░░░░░░  ~25%          │
│                                                                  │
│  NOTE: Elevate payment integration (~120 classes, ~19 callout   │
│  files) was fully removed in Phase 0 (PR #1, 2026-02-14).       │
│  A generic payment processor interface may replace it later.     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Current Integration Patterns

**Elevate Payment Services**: ~~Removed in Phase 0 (PR #1, 2026-02-14).~~ All PS_* classes, Elevate LWC components, and related test classes were deleted. A generic payment processor interface may be implemented in the future.

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
│  │  SmartyStreets │ Google │ Cicero │ Metadata API │ etc.  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Named Credential Strategy

| Integration | Named Credential | Auth Type | Status |
|-------------|------------------|-----------|--------|
| ~~Elevate Payment~~ | ~~Elevate_Payment_API~~ | ~~OAuth 2.0~~ | Removed (Phase 0) |
| SmartyStreets | SmartyStreets_Address | API Key | Planned |
| Google Geocoding | Google_Geocoding_API | API Key | Planned |
| Cicero | Cicero_Address | API Key | Planned |
| Metadata API | Salesforce_Metadata | OAuth 2.0 | Planned |

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

### 3.2 Named Credential Implementation Example

> **Note**: The original Elevate-specific example has been replaced with a generic pattern.
> Elevate was removed in Phase 0. Future payment integrations should follow this template.

```apex
/**
 * @description Address validation service using Named Credentials
 */
public inherited sharing class AddressValidationService
    extends NPSP_IntegrationService {

    private static final String NAMED_CREDENTIAL = 'callout:SmartyStreets_Address';

    @Override
    protected String getServiceName() {
        return 'SmartyStreets_Address';
    }

    /**
     * @description Validate a street address
     */
    public ValidationResponse validate(ValidationRequest request) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + '/street-address');
        req.setMethod('GET');
        req.setTimeout(timeoutMs);

        HttpResponse res = executeWithResilience(req);

        if (!isSuccessResponse(res)) {
            handleErrorResponse(res);
        }

        return (ValidationResponse) JSON.deserialize(
            res.getBody(),
            ValidationResponse.class
        );
    }

    private void handleErrorResponse(HttpResponse res) {
        throw new IntegrationException(
            'Address validation failed: ' + res.getStatusCode()
        );
    }

    public class ValidationRequest {
        public String street;
        public String city;
        public String state;
        public String zipCode;
    }

    public class ValidationResponse {
        public String deliveryLine;
        public String lastLine;
        public Boolean isValid;
    }
}
```

### 3.3 Named Credential Metadata

```xml
<!-- force-app/main/default/namedCredentials/SmartyStreets_Address.namedCredential-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<NamedCredential xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>SmartyStreets_Address</fullName>
    <label>SmartyStreets Address Validation</label>
    <endpoint>https://us-street.api.smartystreets.com</endpoint>
    <principalType>NamedUser</principalType>
    <protocol>Password</protocol>
    <calloutStatus>Enabled</calloutStatus>
    <generateAuthorizationHeader>false</generateAuthorizationHeader>
    <allowMergeFieldsInBody>false</allowMergeFieldsInBody>
    <allowMergeFieldsInHeader>false</allowMergeFieldsInHeader>
</NamedCredential>
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

### ~~Phase 2: Elevate Integration~~ (Removed)

> Elevate payment integration was fully removed in Phase 0. This phase is no longer applicable.
> If a generic payment processor is added in the future, it should follow the Named Credential
> pattern defined in this document from the start.

### Phase 3: Address Validation (Sprint 3-4, renumbered)

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

*Document Version: 1.1*
*Last Updated: 2026-02-15*
*Author: NPSP_nextgen Architecture Team*
