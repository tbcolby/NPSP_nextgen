# WS-04: Performance Optimization — Assessment

**Review Date**: 2026-02-12
**Implementation Plan**: [04-performance.md](../implementation/04-performance.md)
**Planning Doc**: [04-PERFORMANCE-OPTIMIZATION.md](../04-PERFORMANCE-OPTIMIZATION.md)
**Overall Rating**: **Adequate-**

---

## Well-Architected Alignment

| Pillar | Score | Notes |
|--------|-------|-------|
| Trusted | Adequate | `security_agent` listed but no specific security tasks defined |
| Easy | N/A | Backend-only workstream |
| Adaptable | Adequate | `NPSP_CacheService` is generic; no cache fallback for non-cache orgs |
| Intentional | Adequate | 80% governor limit threshold arbitrary; no load-testing justification |
| Automated | Weak | `System.debug` monitoring is development-only, not production-viable |

---

## Accuracy Findings

### Minor: Agent Roster Gap

`devops_agent` performs Sprint 5-6 work (Platform Cache partition metadata, scratch org configuration) but is not listed as a Supporting Agent. Should be added.

### Verified Correct
- `Cache.Org.getPartition(PARTITION)` is valid Salesforce Platform Cache API
- `'local.npsp'` is valid partition name format for org-level cache
- PMD rules `AvoidDmlStatementsInLoops` and `AvoidSoqlInLoops` are standard rules
- Performance test pattern using `Limits.getQueries()` is valid

---

## Backwards Compatibility Risks

### Risk 1: Platform Cache Availability — LOW-MEDIUM

Some org editions have limited or no Platform Cache allocation. The `NPSP_CacheService` does not handle `Cache.CacheException` for orgs without cache.

**Mitigation**: Add cache-miss-to-database fallback pattern:
```apex
public static Object get(String key) {
    try {
        return Cache.Org.getPartition(PARTITION).get(key);
    } catch (Cache.Org.OrgCacheException e) {
        return null; // Graceful degradation
    }
}
```

### Risk 2: Governor Limit Budget Sharing — MEDIUM

NPSP shares governor limits with customer org code (custom triggers, flows, process builders). The 80% threshold for monitoring doesn't account for the fact that NPSP operations may only get 50-60% of the actual budget in practice.

**Mitigation**: Define governor limit budgets per operation (e.g., "Contact insert with household creation should use <30 SOQL queries to leave room for customer triggers").

---

## Well-Architected Detail

### Trusted — Platform Cache Security Model (P0)

The cache architecture stores `UserPermissions` in **Org Cache** with a 15-minute TTL. Org Cache is visible to all users in the org. This creates two security concerns:

1. **Permission staleness**: A user whose access is revoked can continue operating under cached permissions for up to 15 minutes.
2. **Cross-user leakage**: User-specific permission data stored in shared Org Cache means one user's permission state could theoretically be read by another user's code context.

**Required Fix**: Use **Session Cache** (not Org Cache) for `UserPermissions`. Org Cache should only contain user-agnostic data (TDTM config, RecordType mappings, Schema describes).

### Automated — Production Monitoring Gap (Weakest Area)

`NPSP_LimitsMonitor` uses `System.debug(LoggingLevel.WARN, ...)` for monitoring. `System.debug` is:
- Not visible in production without active debug log tracing
- Not alertable
- Not queryable
- Not dashboardable

This is a development-time tool, not a production monitoring solution.

**Required Fix**: Replace with `NPSP_Performance_Event__e` Platform Event that can trigger alerts, or log to a custom object for dashboard visibility.

Additionally missing:
- No Event Monitoring or Performance Assistant integration
- No load/stress testing (only 200-record bulk tests; no 10K/50K/100K scenarios)
- No cache hit/miss ratio monitoring

### Adaptable — Cache Fallback

No mention of graceful degradation when Platform Cache is unavailable. The service should return `null` and let callers fall through to database queries.

---

## Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| **P0** | Fix cache security model | Move UserPermissions to Session Cache; Org Cache for user-agnostic data only |
| **P1** | Replace System.debug monitoring | Use Platform Events or custom object for production alerting |
| **P1** | Add cache fallback | Handle `CacheException` gracefully for orgs without cache |
| **P2** | Define governor limit budgets | Per-operation budgets accounting for customer code sharing |
| **P2** | Add LDV stress tests | 10K+ record scenarios beyond standard 200-record bulk |
| **P2** | Add cache diagnostics | Hit/miss ratio, partition usage monitoring |
| **P2** | Add `devops_agent` to supporting agents | Currently unlisted despite doing Sprint 5-6 work |

---

*Assessment Version: 1.0*
*Last Updated: 2026-02-12*
