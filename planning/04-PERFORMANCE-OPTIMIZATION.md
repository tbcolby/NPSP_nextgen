# Performance Optimization Plan

## Executive Summary

This document outlines the performance optimization strategy for NPSP_nextgen, addressing governor limit issues, caching opportunities, query optimization, and CPU-intensive patterns. The goal is to ensure NPSP performs well at scale while maintaining the 85%+ test coverage requirement.

**Core Principle**: Optimize for large data volumes (LDV) while maintaining simplicity for typical nonprofit use cases.

---

## 1. Current State Analysis

### 1.1 Performance Issue Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                 PERFORMANCE ISSUES BY CATEGORY                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SOQL in Loops            ████████░░░░░░░░░░░░  7 instances     │
│  Nested Loops (3+)        ████░░░░░░░░░░░░░░░░  3 instances     │
│  Uncached Describe        ██████░░░░░░░░░░░░░░  5 instances     │
│  O(n²) Operations         ██░░░░░░░░░░░░░░░░░░  2 instances     │
│  Collection Accumulation  ████░░░░░░░░░░░░░░░░  3 instances     │
│  String Ops in Loops      ████░░░░░░░░░░░░░░░░  2 instances     │
│                                                                  │
│  Total Critical Issues: 22                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Governor Limit Violations - Detailed

#### SOQL in Loops (7 instances)

| File | Line | Pattern | Severity |
|------|------|---------|----------|
| OPP_OpportunityContactRoles_TDTM.cls | 122 | SOQL inside for loop | Critical |
| OPP_OpportunityContactRoles_TDTM.cls | 242 | SOQL in for-each | High |
| OPP_OpportunityContactRoles_TDTM.cls | 407 | SOQL in for-each | High |
| RD_RecurringDonations.cls | 215 | Dynamic SOQL in loop | High |
| GE_LookupController.cls | 67 | Dynamic SOQL in loop | Medium |
| GE_LookupController.cls | 116 | Dynamic SOQL in loop | Medium |
| BGE_DataImportBatchEntry_CTRL.cls | 239 | Dynamic SOQL in loop | Medium |

#### Nested Loops (3 instances)

| File | Lines | Depth | Operations |
|------|-------|-------|------------|
| OPP_OpportunityContactRoles_TDTM.cls | 170-212 | 3 | String + Map |
| BGE_BatchGiftEntry_UTIL.cls | 112-141 | 3 | getDescribe() |
| GE_Template.cls | 158-173 | 2 | Map lookups |

#### Uncached Describe Calls (5 instances)

| File | Line | Call Type |
|------|------|-----------|
| BGE_BatchGiftEntry_UTIL.cls | 135 | getDescribe() in triple loop |
| BDI_ManageAdvancedMappingCtrl.cls | 457 | getGlobalDescribe() |
| BDI_ManageAdvancedMappingCtrl.cls | 724 | getGlobalDescribe() |
| BDI_ManageAdvancedMappingCtrl.cls | 739 | describeSObjects() |
| ADV_PackageInfo_SVC.cls | 82 | describeSObjects() in loop |

### 1.3 Critical File: OPP_OpportunityContactRoles_TDTM.cls

This file contains 12 performance issues and is a priority for refactoring:

```
┌─────────────────────────────────────────────────────────────────┐
│           OPP_OpportunityContactRoles_TDTM Analysis              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Line 98-128:   SOQL inside nested loop context                 │
│  Line 170-212:  Triple nested loop with string operations       │
│  Line 242-245:  SOQL in for-each loop                           │
│  Line 407-410:  SOQL in for-each loop                           │
│  Line 836-850:  O(n²) List.contains() check                     │
│  Line 98-213:   Multiple collection accumulations               │
│                                                                  │
│  Trigger Context: AFTER INSERT/UPDATE on Opportunity            │
│  Called: Every opportunity save                                  │
│  Impact: High - affects all donation entry                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Target State Architecture

### 2.1 Performance Design Principles

```
┌─────────────────────────────────────────────────────────────────┐
│               PERFORMANCE DESIGN PRINCIPLES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. QUERY OPTIMIZATION                                           │
│     ├─ Never query in loops                                     │
│     ├─ Use selective queries with indexed fields                │
│     ├─ Limit result sets appropriately                          │
│     └─ Use relationship queries to reduce query count           │
│                                                                  │
│  2. COLLECTION EFFICIENCY                                        │
│     ├─ Use Set for contains() operations                        │
│     ├─ Use Map for O(1) lookups                                 │
│     ├─ Pre-size collections when possible                       │
│     └─ Avoid collection copying in loops                        │
│                                                                  │
│  3. CPU OPTIMIZATION                                             │
│     ├─ Cache describe results                                   │
│     ├─ Minimize string operations in loops                      │
│     ├─ Flatten nested loops where possible                      │
│     └─ Use formula fields over Apex calculation                 │
│                                                                  │
│  4. CACHING STRATEGY                                             │
│     ├─ Platform Cache for cross-transaction data                │
│     ├─ Static variables for same-transaction caching            │
│     └─ Custom Metadata for configuration                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Caching Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CACHING ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    PLATFORM CACHE                        │    │
│  │  TTL: 1-12 hours │ Scope: Org/Session │ Size: 10MB      │    │
│  │                                                          │    │
│  │  npsp.settings    - Custom Settings (1 hour)            │    │
│  │  npsp.describe    - Schema Describe (12 hours)          │    │
│  │  npsp.metadata    - Custom Metadata (1 hour)            │    │
│  │  npsp.rollupDefs  - Rollup definitions (30 min)         │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  STATIC VARIABLE CACHE                   │    │
│  │  Scope: Single Transaction │ No persistence             │    │
│  │                                                          │    │
│  │  UTIL_Describe.gd         - getGlobalDescribe()         │    │
│  │  UTIL_Describe.objectMap  - DescribeSObjectResult       │    │
│  │  UTIL_Describe.fieldMap   - DescribeFieldResult         │    │
│  │  CRLP_Rollup_SEL.rollups  - Rollup configurations       │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 CUSTOM METADATA CACHE                    │    │
│  │  No SOQL limits │ Deployable │ Cached by platform       │    │
│  │                                                          │    │
│  │  Trigger_Handler__mdt    - TDTM configuration           │    │
│  │  Rollup__mdt             - Rollup definitions           │    │
│  │  Field_Mapping__mdt      - BDI mappings                 │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Well-Architected Framework Alignment

### 3.1 Intentional

| Principle | Implementation |
|-----------|----------------|
| **Measured Performance** | Benchmark before/after each optimization |
| **Data-Driven** | Use debug logs and Query Plan tool |
| **Purposeful Optimization** | Fix actual issues, not theoretical ones |

### 3.2 Adaptable

| Principle | Implementation |
|-----------|----------------|
| **Scalability** | Patterns that work at 200 and 200,000 records |
| **Configuration** | Tunable batch sizes and chunk limits |
| **Degradation** | Graceful handling when limits approached |

---

## 4. Detailed Optimization Patterns

### 4.1 SOQL-in-Loop Fix Pattern

**Before (Problematic)**:
```apex
public void processOpportunities(List<Opportunity> opps) {
    for (Opportunity opp : opps) {
        // SOQL IN LOOP - will fail at 101 records!
        List<OpportunityContactRole> ocrs = [
            SELECT Id, ContactId
            FROM OpportunityContactRole
            WHERE OpportunityId = :opp.Id
        ];
        processRoles(opp, ocrs);
    }
}
```

**After (Optimized)**:
```apex
public void processOpportunities(List<Opportunity> opps) {
    // Collect all IDs first
    Set<Id> oppIds = new Set<Id>();
    for (Opportunity opp : opps) {
        oppIds.add(opp.Id);
    }

    // Single query outside loop
    Map<Id, List<OpportunityContactRole>> ocrsByOppId =
        new Map<Id, List<OpportunityContactRole>>();

    for (OpportunityContactRole ocr : [
        SELECT Id, ContactId, OpportunityId
        FROM OpportunityContactRole
        WHERE OpportunityId IN :oppIds
    ]) {
        if (!ocrsByOppId.containsKey(ocr.OpportunityId)) {
            ocrsByOppId.put(ocr.OpportunityId, new List<OpportunityContactRole>());
        }
        ocrsByOppId.get(ocr.OpportunityId).add(ocr);
    }

    // Process with pre-fetched data
    for (Opportunity opp : opps) {
        List<OpportunityContactRole> ocrs =
            ocrsByOppId.containsKey(opp.Id)
                ? ocrsByOppId.get(opp.Id)
                : new List<OpportunityContactRole>();
        processRoles(opp, ocrs);
    }
}
```

### 4.2 O(n²) to O(n) Fix Pattern

**Before (O(n²))**:
```apex
// List.contains() is O(n), in a loop becomes O(n²)
List<OpportunityContactRole> ocrsToDelete = new List<OpportunityContactRole>();
for (OpportunityContactRole ocr : allOCRs) {
    if (!ocrsToDelete.contains(ocr)) {  // O(n) lookup!
        ocrsToDelete.add(ocr);
    }
}
```

**After (O(n))**:
```apex
// Set.contains() is O(1), in a loop stays O(n)
Set<Id> processedIds = new Set<Id>();
List<OpportunityContactRole> ocrsToDelete = new List<OpportunityContactRole>();
for (OpportunityContactRole ocr : allOCRs) {
    if (!processedIds.contains(ocr.Id)) {  // O(1) lookup!
        processedIds.add(ocr.Id);
        ocrsToDelete.add(ocr);
    }
}
```

### 4.3 Describe Caching Pattern

**Current UTIL_Describe Pattern (Good Foundation)**:
```apex
public class UTIL_Describe {
    // Static cache - persists for transaction
    private static Map<String, Schema.SObjectType> gd;
    private static Map<String, Schema.DescribeSObjectResult> objectDescribes;
    private static Map<String, Map<String, Schema.DescribeFieldResult>> fieldDescribes;

    public static Schema.DescribeSObjectResult getObjectDescribe(String objectName) {
        if (objectDescribes == null) {
            objectDescribes = new Map<String, Schema.DescribeSObjectResult>();
        }

        if (!objectDescribes.containsKey(objectName)) {
            objectDescribes.put(objectName, getGlobalDescribe().get(objectName).getDescribe());
        }

        return objectDescribes.get(objectName);
    }

    public static Map<String, Schema.SObjectType> getGlobalDescribe() {
        if (gd == null) {
            gd = Schema.getGlobalDescribe();
        }
        return gd;
    }
}
```

**Enhanced with Platform Cache**:
```apex
public class UTIL_Describe {
    private static final String CACHE_PARTITION = 'local.npsp';
    private static final Integer CACHE_TTL_SECONDS = 43200; // 12 hours

    public static Schema.DescribeSObjectResult getObjectDescribe(String objectName) {
        // Try static cache first (fastest)
        if (objectDescribes?.containsKey(objectName)) {
            return objectDescribes.get(objectName);
        }

        // Try Platform Cache (cross-transaction)
        String cacheKey = 'describe_' + objectName;
        Cache.OrgPartition partition = Cache.Org.getPartition(CACHE_PARTITION);

        Schema.DescribeSObjectResult result =
            (Schema.DescribeSObjectResult) partition.get(cacheKey);

        if (result == null) {
            // Cache miss - do describe and cache
            result = getGlobalDescribe().get(objectName).getDescribe();
            partition.put(cacheKey, result, CACHE_TTL_SECONDS);
        }

        // Also populate static cache
        if (objectDescribes == null) {
            objectDescribes = new Map<String, Schema.DescribeSObjectResult>();
        }
        objectDescribes.put(objectName, result);

        return result;
    }
}
```

### 4.4 Nested Loop Flattening

**Before (Triple Nested)**:
```apex
for (GE_Template.Section section : template.layout.sections) {
    for (GE_Template.Element element : section.elements) {
        for (String fieldMapping : element.dataImportFieldMappingDevNames) {
            // getDescribe() called here - very expensive!
            SObjectField field = DataImport__c.SObjectType.getDescribe()
                .fields.getMap().get(fieldMapping);
        }
    }
}
```

**After (Flattened with Pre-caching)**:
```apex
// Pre-cache the field map ONCE outside all loops
Map<String, Schema.SObjectField> fieldMap =
    DataImport__c.SObjectType.getDescribe().fields.getMap();

// Collect all field mappings first (flatten loops)
Set<String> allFieldMappings = new Set<String>();
for (GE_Template.Section section : template.layout.sections) {
    for (GE_Template.Element element : section.elements) {
        allFieldMappings.addAll(element.dataImportFieldMappingDevNames);
    }
}

// Process with cached data
Map<String, Schema.SObjectField> relevantFields = new Map<String, Schema.SObjectField>();
for (String fieldMapping : allFieldMappings) {
    if (fieldMap.containsKey(fieldMapping)) {
        relevantFields.put(fieldMapping, fieldMap.get(fieldMapping));
    }
}
```

---

## 5. Trade-off Analysis

### 5.1 Caching Trade-offs

| Approach | Pros | Cons | Use When |
|----------|------|------|----------|
| **No Caching** | Simplest, always fresh | Governor limit risk | Low-volume operations |
| **Static Variables** | Fast, simple | Transaction-only | Most Apex scenarios |
| **Platform Cache** | Cross-transaction | Complexity, cost | High-frequency reads |
| **Custom Metadata** | No SOQL limits | Deployment required | Configuration data |

### 5.2 Query Optimization Trade-offs

| Approach | Pros | Cons | Use When |
|----------|------|------|----------|
| **Eager Loading** | Fewer queries | Memory usage | Related data always needed |
| **Lazy Loading** | Lower memory | More queries | Related data rarely needed |
| **Selective Queries** | Performance | Index requirements | Large data volumes |

---

## 6. Implementation Plan

### Phase 1: Critical Fixes (Sprint 1-2)

| File | Issue | Fix | Effort |
|------|-------|-----|--------|
| OPP_OpportunityContactRoles_TDTM.cls | SOQL in loops | Bulk pattern | 8h |
| OPP_OpportunityContactRoles_TDTM.cls | O(n²) contains | Use Set | 2h |
| BGE_BatchGiftEntry_UTIL.cls | Nested loops | Flatten + cache | 4h |

### Phase 2: Caching Infrastructure (Sprint 3-4)

| Task | Description | Effort |
|------|-------------|--------|
| Platform Cache setup | Create partition, utilities | 8h |
| Enhance UTIL_Describe | Add Platform Cache layer | 6h |
| Add cache monitoring | Track hit/miss rates | 4h |

### Phase 3: Query Optimization (Sprint 5-6)

| Area | Tasks | Effort |
|------|-------|--------|
| CRLP Queries | Add selectivity, reduce fields | 12h |
| BDI Queries | Optimize mapping lookups | 8h |
| RD Queries | Optimize schedule queries | 6h |

### Phase 4: Monitoring & Tuning (Sprint 7-8)

| Task | Description | Effort |
|------|-------------|--------|
| Performance test suite | Create LDV tests | 12h |
| Monitoring dashboard | Track key metrics | 8h |
| Documentation | Best practices guide | 4h |

---

## 7. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| SOQL-in-loop instances | 7 | 0 | Code scan |
| Avg queries per transaction | Unknown | <50 | Debug logs |
| CPU time (bulk operations) | Unknown | <5000ms | Debug logs |
| Cache hit rate | N/A | >80% | Monitoring |
| LDV test pass rate | Unknown | 100% | CI/CD |

---

## 8. Performance Testing Strategy

### 8.1 LDV Test Data Sets

| Scenario | Accounts | Contacts | Opportunities | Allocations |
|----------|----------|----------|---------------|-------------|
| Small | 100 | 200 | 500 | 1,000 |
| Medium | 1,000 | 2,000 | 10,000 | 20,000 |
| Large | 10,000 | 20,000 | 100,000 | 200,000 |
| Stress | 50,000 | 100,000 | 500,000 | 1,000,000 |

### 8.2 Performance Test Template

```apex
@IsTest
private class Performance_TEST {

    @IsTest
    static void testBulkOpportunityInsert() {
        // Setup: Create accounts and contacts
        List<Account> accounts = TEST_AccountBuilder.createBulk(200);
        List<Contact> contacts = TEST_ContactBuilder.createBulkForAccounts(accounts);

        // Create 200 opportunities (trigger context limit)
        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < 200; i++) {
            opps.add(new Opportunity(
                Name = 'Test ' + i,
                AccountId = accounts[Math.mod(i, accounts.size())].Id,
                Amount = 100,
                CloseDate = Date.today(),
                StageName = 'Closed Won'
            ));
        }

        Test.startTest();
        Integer queriesBefore = Limits.getQueries();
        Integer cpuBefore = Limits.getCpuTime();

        insert opps;

        Integer queriesUsed = Limits.getQueries() - queriesBefore;
        Integer cpuUsed = Limits.getCpuTime() - cpuBefore;
        Test.stopTest();

        // Assert performance bounds
        System.assert(queriesUsed < 50,
            'Too many queries: ' + queriesUsed + '. Expected < 50');
        System.assert(cpuUsed < 5000,
            'Too much CPU: ' + cpuUsed + 'ms. Expected < 5000ms');
    }
}
```

---

## 9. Appendix

### A. Governor Limits Reference

| Limit | Synchronous | Asynchronous |
|-------|-------------|--------------|
| SOQL Queries | 100 | 200 |
| Query Rows | 50,000 | 50,000 |
| DML Statements | 150 | 150 |
| DML Rows | 10,000 | 10,000 |
| CPU Time | 10,000ms | 60,000ms |
| Heap Size | 6MB | 12MB |
| Callouts | 100 | 100 |

### B. Query Selectivity Guidelines

For queries to be selective (use indexes efficiently):
- Filter on indexed fields (Id, Name, Owner, RecordType, foreign keys)
- Return < 10% of total records (or < 333,333 for large objects)
- Use equals (=) or IN rather than LIKE or NOT

### C. Related Documents

- [03-ASYNC-APEX-MODERNIZATION.md](03-ASYNC-APEX-MODERNIZATION.md)
- [10-TESTING-STRATEGY.md](10-TESTING-STRATEGY.md)

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: NPSP_nextgen Architecture Team*
