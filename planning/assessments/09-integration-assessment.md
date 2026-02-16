# WS-09: Integration Architecture — Assessment

**Review Date**: 2026-02-12
**Implementation Plan**: [09-integration.md](../implementation/09-integration.md)
**Planning Doc**: [09-INTEGRATION-ARCHITECTURE.md](../09-INTEGRATION-ARCHITECTURE.md)
**Overall Rating**: **Strong-**

---

## Well-Architected Alignment

| Pillar | Score | Notes |
|--------|-------|-------|
| Trusted | Strong | Named Credentials, HTTPS, response sanitization, credential-free code |
| Easy | Adequate | Integration status LWC; no guided setup wizard for Named Credentials |
| Adaptable | Strong | Generic `NPSP_IntegrationService` base; easy to add new integrations |
| Intentional | Strong | Clear migration path; endpoint-by-endpoint plan |
| Automated | Adequate | Health check; no automated integration testing against live/staging endpoints |

---

## Accuracy Findings

### Minor: Named Credential XML Protocol Casing

`<protocol>Oauth</protocol>` should be `<protocol>OAuth</protocol>` (capital 'A'). Salesforce metadata API is case-sensitive for this value.

### Minor: Agent Roster Gaps

`lwc_agent` (Sprint 7-8 integration status component) and `documentation_agent` (Sprint 7-8 contributor guide) perform work but are not listed as Supporting Agents. Both should be added.

### Minor: Dead Code in sendWithRetry

The `return null;` at the end of `sendWithRetry` is dead code — the loop always sets `response` before reaching it.

### Minor: Retry Count Semantics

`maxRetries = 3` with loop `for (Integer i = 0; i <= maxRetries; i++)` gives 4 total attempts. If "3 retries" means 3 retries after the initial attempt (4 total), this is correct. If it means 3 total attempts, the loop should be `i < maxRetries`.

### Verified Correct
- `NPSP_IntegrationService` code is syntactically valid
- Circuit breaker timing logic is correct (`addMinutes(5) > Datetime.now()` = still open)
- Named Credential `callout:` prefix pattern is correct
- `HttpCalloutMock` interface usage is standard
- Platform Event alerting approach is valid

---

## Backwards Compatibility Risks

### Risk 1: Named Credential Requirement — ~~CRITICAL~~ MEDIUM (revised)

> **Update (2026-02-13)**: The NPPatch best practices review decided to **remove all Elevate payment processor code**. This eliminates the highest-risk integration path (revenue-critical payment processing). The remaining integrations (address verification, geocoding) are non-revenue-critical but still require the dual-path approach.

Current integrations use credentials stored in Custom Settings. After migration to Named Credentials:

- If an org upgrades and has NOT configured Named Credentials, address verification callouts fail
- The integration health check is scheduled for Sprint 7-8, far too late
- No runtime graceful degradation when Named Credentials are absent

**Required Fix**: Implement dual-path integration service for remaining (non-Elevate) integrations:
```apex
if (hasNamedCredential('SmartyStreets_API')) {
    // Use Named Credential
} else {
    // Fall back to legacy Custom Setting pattern
    logDeprecationWarning();
}
```

### Risk 2: Address Verification Disruption — HIGH

SmartyStreets, Google Geocoding, and Cicero callouts will fail if Named Credentials are not configured. This affects real-time address validation during data entry.

### Risk 3: Address Settings Consolidation — MEDIUM

Merging `Address_Verification_Settings__c` and `Addr_Verification_Settings__c` into single CMT. Code referencing either original by API name will break if originals are removed.

---

## Well-Architected Detail

### Trusted — Named Credential Auth Type

> **Update (2026-02-13)**: Elevate integration has been removed per NPPatch decision. This concern now applies only to remaining integrations (address verification, geocoding).

The plan uses `PrincipalType: NamedUser` for integrations. No discussion of whether `PerUser` auth is appropriate for any integration. Per-user auth provides better audit trails.

**Recommendation**: Evaluate per-user auth for integrations where audit trails matter.

### Easy — No Guided Setup

Named Credential setup requires admin configuration in Salesforce Setup. The documentation is deferred to Sprint 7-8. No in-app guided experience.

**Recommendation**: Build a guided setup wizard (similar to NPSP's existing Settings page patterns) that walks admins through Named Credential configuration.

### Adaptable — Inbound Integration Missing

The plan is entirely outbound (NPSP calling external services). Future integrations may need inbound handling (webhook receivers for external payment processors, etc.).

**Recommendation**: Add a brief section on inbound integration architecture (Platform Events, Connected Apps, or REST endpoints).

### Adaptable — Circuit Breaker Half-Open State

The circuit breaker opens after failures but has no automatic reset mechanism. It stays open for 5 minutes then presumably closes. A proper circuit breaker pattern includes a "half-open" state that automatically retries with a health check probe.

**Recommendation**: Implement half-open state with automatic health check after cooldown.

### Automated — Alert Recipients

Platform Event alerts for integration failures are created but no recipients are specified. Who receives the alert? Via what channel?

**Recommendation**: Specify alert recipients and channels (email, Chatter, admin notification).

---

## Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| **P0** | Implement dual-path integration service | Named Credential + Custom Setting fallback for zero-downtime migration (scope reduced: Elevate removed per NPPatch decision) |
| **P0** | Move health check to Sprint 1 | Not Sprint 7-8; admins need it before migration |
| **P1** | Create pre-upgrade Named Credential check | Warn admins; block upgrade for payment integrations if not configured |
| **P1** | Build one-click credential migration | Read CS credentials, create Named Credentials automatically where possible |
| **P2** | Add inbound integration patterns | Webhook/callback architecture |
| **P2** | Implement half-open circuit breaker | Auto-retry health check after cooldown |
| **P2** | Specify alert recipients | Who gets Platform Event alerts and via what channel |
| **P3** | Fix protocol casing | `OAuth` not `Oauth` in Named Credential XML |
| **P3** | Clean dead code | Remove `return null;` from `sendWithRetry` |
| **P3** | Add `lwc_agent` and `documentation_agent` to supporting agents | Both do Sprint 7-8 work |

---

*Assessment Version: 1.1*
*Last Updated: 2026-02-13*
