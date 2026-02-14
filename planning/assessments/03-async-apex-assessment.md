# WS-03: Async Apex Modernization — Assessment

**Review Date**: 2026-02-12
**Implementation Plan**: [03-async-apex.md](../implementation/03-async-apex.md)
**Planning Doc**: [03-ASYNC-APEX-MODERNIZATION.md](../03-ASYNC-APEX-MODERNIZATION.md)
**Overall Rating**: **Adequate**

---

## Well-Architected Alignment

| Pillar | Score | Notes |
|--------|-------|-------|
| Trusted | Adequate | `security_agent` verifies sharing but Platform Event payload security unaddressed |
| Easy | N/A | Backend-only workstream |
| Adaptable | Strong | `NPSP_QueueableBase` is abstract and extensible; event framework is generic |
| Intentional | Adequate | Multiple "TBD" baselines; no Queueable vs Platform Event decision tree |
| Automated | Adequate | CI grep for `@future`; batch monitoring dashboard metadata only |

---

## Accuracy Findings

### Minor: Agent Roster Gap

`security_agent` performs sharing verification in the coordination protocol ("Verify inherited sharing on new Queueable") but is not listed as a Supporting Agent in the subplan header. Should be added.

### Verified Correct
- `NPSP_QueueableBase` code is syntactically valid Apex
- `System.enqueueJob(this)` re-enqueue pattern preserves state correctly (serialized instance)
- `EventBus.publish()` API usage is correct
- Sprint numbering is internally consistent

### Minor: Dead Code in Integration Service

The `return null;` at the end of `sendWithRetry` in the integration service code example is dead code — the loop will always set `response` before reaching it. Not a bug but worth cleaning up.

---

## Backwards Compatibility Risks

### Risk 1: Queueable Job Slot Consumption — MEDIUM

`@future` and `Queueable` have different governor limit profiles. Queueable consumes 1 of the org's 50 Queueable job slots per transaction (100 in async context). Orgs near Queueable limits from other packages could hit `System.LimitException`.

The plan migrates 13 `@future` methods. If a single transaction triggers multiple operations each enqueuing a Queueable, the org could hit the 50-job limit.

**Mitigation**: Measure maximum Queueable jobs per NPSP transaction. Add slot availability check:
```apex
if (Limits.getQueueableJobs() < Limits.getLimitQueueableJobs()) {
    System.enqueueJob(job);
} else {
    // Fallback to @future
}
```

### Risk 2: Queueable Chaining Depth — MEDIUM

`chainJob()` in `NPSP_QueueableBase` uses `System.enqueueJob(nextJob)`. Salesforce limits chaining to 1 child job per Queueable execution in production (unlimited in Developer edition). Multiple NPSP operations chaining simultaneously compete for the single chaining slot.

Additionally, chained Queueables do NOT execute during `Test.stopTest()`, making test coverage of chained behavior require different patterns.

### Risk 3: Platform Event Delivery Limits — MEDIUM

The 3 new Platform Events (`NPSP_Async_Event__e`, `NPSP_Error_Event__e`, `NPSP_Rollup_Event__e`) count against delivery allocations:
- Enterprise Edition: 2,000 standard events per hour
- Unlimited Edition: 2,000,000 per hour

High-volume NPSP operations (batch rollup recalculation, bulk data import) could exceed these limits.

**Mitigation**: Document expected event volume per operation; validate against org edition limits.

### Risk 4: Test Pattern Compatibility — LOW

`Test.startTest()`/`Test.stopTest()` executes both `@future` and Queueable synchronously. Migration should be transparent to tests.

---

## Well-Architected Detail

### Trusted — Platform Event Payload Security (P0)

Platform Events are visible to anyone with "Subscribe" permission. The `NPSP_Async_Event__e` with a generic `Payload__c` field containing `JSON.serialize(payload)` could leak sensitive information.

**Rule Required**: No PII in Platform Event payloads. Pass only record IDs and re-query in subscribers.

The retry mechanism in `NPSP_QueueableBase` calls `System.enqueueJob(this)`, re-enqueuing with the same state including any sensitive data in instance fields. No data sanitization before retry is mentioned.

### Adaptable — Event Routing

The `NPSP_AsyncEventSubscriber.routeEvent()` method is not specified. The routing mechanism should be configuration-driven (CMT mapping of event type to handler class) rather than hardcoded switch/if blocks.

**Recommendation**: Design event routing to use Custom Metadata Type mapping so new handlers can be registered without code changes.

### Intentional — Decision Framework Missing

The plan creates both Queueable and Platform Event patterns but doesn't document when to use which. A decision tree is needed:
- **Queueable**: When you need state, retry, chaining, or callouts
- **Platform Event**: When you need decoupled pub/sub, cross-transaction communication, or external subscribers
- **Batch**: When processing >50K records or needing queryLocator

---

## Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| **P0** | Define PE payload security rules | No PII in payloads; pass record IDs only |
| **P1** | Measure Queueable slot consumption | Max jobs per typical NPSP transaction; stay under 10 |
| **P1** | Implement @future fallback | If Queueable limits reached, fall back gracefully |
| **P1** | Document async decision tree | When to use Queueable vs PE vs Batch |
| **P2** | Design config-driven event routing | CMT mapping of event type to handler class |
| **P2** | Address chained Queueable testing | Test each chunk independently; document limitation |
| **P2** | Document PE volume expectations | Validate against org edition limits |
| **P2** | Add `security_agent` to supporting agents | Currently unlisted despite doing work |

---

*Assessment Version: 1.0*
*Last Updated: 2026-02-12*
