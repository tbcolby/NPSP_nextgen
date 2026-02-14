# Monitoring & Alerting Strategy

**Scope**: Cross-cutting — addresses the weakest area identified in assessments
**Assessment Finding**: Production monitoring rated "Weak" across all workstreams; `System.debug` not production-viable

---

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────┐
│                  MONITORING LAYERS                    │
├─────────────────┬───────────────────────────────────┤
│ Application     │ NPSP-specific monitoring           │
│ Layer           │ • Governor limit tracking          │
│                 │ • Batch job health                 │
│                 │ • Integration callout health       │
│                 │ • Error rate tracking              │
├─────────────────┼───────────────────────────────────┤
│ Platform        │ Salesforce native monitoring       │
│ Layer           │ • Event Monitoring (Shield)        │
│                 │ • Debug Logs (dev only)            │
│                 │ • Apex Exception Email             │
│                 │ • Flow Error Email                 │
├─────────────────┼───────────────────────────────────┤
│ CI/CD           │ Pipeline monitoring                │
│ Layer           │ • GitHub Actions status            │
│                 │ • Test coverage trends             │
│                 │ • Build success rate               │
│                 │ • Deployment history               │
└─────────────────┴───────────────────────────────────┘
```

---

## Application Monitoring

### 1. Error Monitoring

Replace `System.debug` error logging with structured error tracking:

```apex
// EXISTING (not production-viable):
System.debug(LoggingLevel.ERROR, 'Something failed: ' + e.getMessage());

// NEW PATTERN (production-viable):
// Note: NPSP_MonitoringService is a proposed class (to be created)
NPSP_MonitoringService.logError(
    'CRLP_Batch_Base_NonSkew',  // actual class name (not CRLP_RollupBatch)
    'execute',
    e,
    NPSP_MonitoringService.Severity.HIGH
);
```

**Implementation**: `NPSP_MonitoringService` (proposed -- to be created) publishes to `NPSP_Error_Event__e` (proposed -- to be created) Platform Event:
- Subscribers: Error dashboard, admin notification, integration with external logging
- Fields: Component, Method, Error Message, Severity, Stack Trace (sanitized), Timestamp
- Retention: Custom object (`NPSP_Error_Log__c`, proposed -- to be created) for queryable history

### 2. Governor Limit Monitoring

Replace `System.debug`-based monitoring (WS-04) with alerting via `NPSP_LimitsMonitor` (proposed -- to be created):

```apex
public class NPSP_LimitsMonitor {  // proposed -- to be created
    public static void checkAndAlert(String context) {
        if (Limits.getQueries() > Limits.getLimitQueries() * 0.8) {
            NPSP_MonitoringService.logWarning(
                context,
                'SOQL at ' + getPercentUsed('SOQL') + '%',
                NPSP_MonitoringService.Severity.MEDIUM
            );
        }
        // Similar for DML, Heap, CPU
    }

    private static Integer getPercentUsed(String limitType) {
        // Return percentage of limit consumed
    }
}
```

### 3. Batch Job Health

Monitor all batch and Queueable jobs (WS-03):

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Batch failure rate | > 2% | > 10% | Investigate / pause batch |
| Batch duration | > 2x baseline | > 5x baseline | Performance investigation |
| Queueable retry count | > 1 average | > 2 average | Review error patterns |
| Queueable queue depth | > 30 jobs | > 45 jobs | Throttle submissions |

### 4. Integration Health (WS-09)

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Callout failure rate | > 5% | > 20% | Check endpoint / circuit breaker |
| Callout latency | > 5s average | > 15s average | Performance investigation |
| Circuit breaker opens | Any | 2+ in 1 hour | Alert admin + investigate |
| Named Credential errors | Any | > 3 in 1 hour | Configuration check |

---

## Alerting

### Alert Recipients

| Severity | Recipients | Channel |
|----------|-----------|---------|
| Critical | Org admin + dev team | Email + Chatter post + Platform Event |
| High | Org admin | Email + Chatter post |
| Medium | Dev team | Chatter post |
| Low | Monitoring dashboard only | Dashboard |

### Alert Deduplication

- Same error + same component within 15 minutes: Suppress duplicates, increment count
- Same circuit breaker open within 1 hour: Single alert with count
- Batch failure in same job: Single alert per batch execution, not per chunk

### Platform Event Alert Pattern

```apex
public class NPSP_AlertPublisher {  // proposed -- to be created
    public static void alert(String component, String message,
                             NPSP_MonitoringService.Severity severity) {
        NPSP_Error_Event__e event = new NPSP_Error_Event__e(
            Component__c = component,
            Message__c = message.left(255),
            Severity__c = severity.name(),
            Timestamp__c = Datetime.now()
        );
        EventBus.publish(event);
    }
}
```

---

## CI/CD Monitoring

### Pipeline Health Dashboard

| Metric | Source | Target |
|--------|--------|--------|
| Build success rate | GitHub Actions | > 95% |
| Average build time | GitHub Actions | < 30 min |
| Apex test pass rate | CumulusCI | 100% |
| Jest test pass rate | npm test | 100% |
| PMD violation trend | Code quality workflow | Decreasing |
| Coverage trend | Codecov / CI reports | Increasing |

### Flaky Test Detection

```yaml
# Track tests that fail intermittently
flaky_test_policy:
  detection: Test fails > 1 of last 10 runs
  action: Flag for investigation, add to quarantine list
  quarantine: Move to separate test suite, do not block CI
  resolution: Fix within 1 sprint or delete test
  tracking: GitHub issue with label "flaky-test"
```

---

## Monitoring Dashboard Metadata

### Admin-Facing Dashboard Components

1. **Error Trend** — Last 30 days error count by severity
2. **Integration Status** — Green/yellow/red per endpoint (from `NPSP_IntegrationHealthCheck`, proposed -- to be created)
3. **Batch Job Health** — Success/failure rate per batch class
4. **Governor Limit Hotspots** — Operations approaching limits
5. **Async Queue Depth** — Current Queueable/Batch jobs pending

### Developer-Facing Dashboard

1. **CI Pipeline Status** — Build pass/fail rate
2. **Coverage Trends** — Apex and LWC coverage over time
3. **PMD Violation Trends** — By rule category
4. **Test Execution Time** — Trend and outliers
5. **PR Metrics** — Time to merge, review turnaround

---

*Document Version: 1.0*
*Last Updated: 2026-02-12*
