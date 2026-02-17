# WS-04: Performance Optimization — Implementation Subplan

**Phase**: 2 (Core Modernization)
**Primary Agent**: `apex_agent`
**Planning Doc**: [04-PERFORMANCE-OPTIMIZATION.md](../04-PERFORMANCE-OPTIMIZATION.md)
**Dependencies**: WS-01 ✅, WS-02 ✅ — **Ready to start**

---

## Objective

Fix critical governor limit violations (SOQL-in-loops, nested loops), cache schema describe calls, and establish performance monitoring patterns.

---

## Sprint Breakdown

### Sprint 1: SOQL-in-Loop Fixes (~12-16h)

**Known violations** (7 files, audit complete):

| File | Issue | Impact | Fix Pattern |
|------|-------|--------|-------------|
| OPP_OpportunityContactRoles_TDTM | 3 SOQL-in-loop | **CRITICAL** — every Opp insert/update | Collect IDs → single query → Map lookup |
| RD_RecurringDonations | 1 SOQL-in-loop | HIGH — RD evaluation | Pre-query + Map |
| GE_LookupController | 2 SOQL-in-loop | MEDIUM — Gift Entry UI | Pre-query + Map |
| BGE_DataImportBatchEntry_CTRL | 1 SOQL-in-loop | MEDIUM — Batch Gift Entry | Pre-query + Map |
| PSC_Opportunity_TDTM | 2 SOQL-in-loop | MEDIUM — Partial Soft Credit | Pre-query + Map |

**Standard fix pattern**:
```apex
// BEFORE (SOQL in loop):
for (Opportunity opp : opps) {
    Contact c = [SELECT Name FROM Contact WHERE Id = :opp.ContactId];
}

// AFTER (bulk query + map):
Set<Id> contactIds = new Set<Id>();
for (Opportunity opp : opps) {
    contactIds.add(opp.ContactId);
}
Map<Id, Contact> contactMap = new Map<Id, Contact>(
    [SELECT Name FROM Contact WHERE Id IN :contactIds]
);
for (Opportunity opp : opps) {
    Contact c = contactMap.get(opp.ContactId);
}
```

**Priority**: Start with OPP_OpportunityContactRoles_TDTM — it fires on every Opportunity save and has 3 violations + the worst nested loop problems (Sprint 2).

### Sprint 2: Nested Loop & Collection Fixes (~8-12h)

**Known violations** (4 files):

| File | Issue | Fix |
|------|-------|-----|
| OPP_OpportunityContactRoles_TDTM | Triple nested loop + O(n²) `List.contains()` | Flatten to 2 levels, replace List with Set |
| OPP_OpportunityContactRoles_TDTM | 3-level nesting with string operations | Extract to helper method, pre-compute Maps |
| BGE_BatchGiftEntry_UTIL | Triple nested loop with getDescribe() | Cache describe results, flatten loops |
| GE_Template | Nested loops with map operations | Pre-compute lookup maps |

**OPP_OpportunityContactRoles_TDTM** is the #1 priority file — it has 12 combined governor issues. Fixing this one file has the highest impact of any single change in the modernization.

**Collection optimization pattern**:
```apex
// BEFORE (O(n²) with List.contains):
for (Contact c : contacts) {
    if (existingList.contains(c.Id)) { ... }
}

// AFTER (O(n) with Set):
Set<Id> existingSet = new Set<Id>(existingList);
for (Contact c : contacts) {
    if (existingSet.contains(c.Id)) { ... }
}
```

### Sprint 3: Schema Describe Caching (~6-10h)

**Known violations** (3 files):

| File | Issue | Fix |
|------|-------|-----|
| BGE_BatchGiftEntry_UTIL | getDescribe() in loop | Cache in static variable |
| BDI_ManageAdvancedMappingCtrl | Multiple getGlobalDescribe() calls | Single call, reuse result |
| ADV_PackageInfo_SVC | describeSObjects() in loop | Batch describe, cache results |

**Caching pattern** (use existing UTIL_Describe where possible):
```apex
// UTIL_Describe already provides cached describe:
DescribeFieldResult dfr = UTIL_Describe.getFieldDescribe(
    UTIL_Namespace.StrTokenNSPrefix('Opportunity'),
    UTIL_Namespace.StrTokenNSPrefix('Amount__c')
);
```

Where UTIL_Describe doesn't cover the use case, add static variable caching:
```apex
private static Map<String, Schema.SObjectType> cachedGlobalDescribe;
private static Map<String, Schema.SObjectType> getGlobalDescribe() {
    if (cachedGlobalDescribe == null) {
        cachedGlobalDescribe = Schema.getGlobalDescribe();
    }
    return cachedGlobalDescribe;
}
```

### Sprint 4: Platform Cache (Conditional, ~15-20h)

**Only implement if Sprints 1-3 show remaining performance bottlenecks.** Platform Cache adds complexity (partition management, TTL tuning, cache invalidation) that may not be justified.

If needed:
- Cache TDTM trigger handler configuration (most impactful — read every trigger)
- Cache Custom Settings facade results
- Use Org cache partition `local.npsp` with 1-hour TTL
- Add cache invalidation when config changes

**Decision point**: After Sprints 1-3, measure governor limit usage on key operations. If within budget, skip Platform Cache.

---

## NOT Doing (Deferred)

- `NPSP_CacheService` utility class — if caching is needed, use Platform Cache directly
- `NPSP_LimitsMonitor` utility — System.debug monitoring is not production-viable; use standard Salesforce Event Monitoring
- LDV test suite — add performance assertions to existing tests instead of separate suite
- Skew detection enhancements — CRLP_Batch_Base_Skew already handles this

---

## Quality Gates

| Gate | Criteria |
|------|----------|
| No SOQL-in-loops | PMD `AvoidSoqlInLoops` clean |
| No DML-in-loops | PMD `AvoidDmlStatementsInLoops` clean |
| Bulk safe | All trigger handlers tested with 200+ records |
| No regression | All existing tests pass after optimization |

---

## Success Metrics

| Metric | Start | Sprint 2 | Sprint 3 | Sprint 4 |
|--------|-------|----------|----------|----------|
| SOQL-in-loop files | 7+ | 0 | 0 | 0 |
| Nested loop violations | 4 | 0 | 0 | 0 |
| Uncached describe calls | 3+ | 3+ | 0 | 0 |
| OPP_OpportunityContactRoles issues | 12 | 0 | 0 | 0 |

---

*Subplan Version: 2.0*
*Last Updated: 2026-02-16*
