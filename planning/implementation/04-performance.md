# WS-04: Performance Optimization — Implementation Subplan

**Phase**: 2 (Core Modernization)
**Primary Agent**: `apex_agent`
**Supporting Agents**: `testing_agent`, `security_agent`
**Planning Doc**: [04-PERFORMANCE-OPTIMIZATION.md](../04-PERFORMANCE-OPTIMIZATION.md)
**Depends on**: WS-01 (Foundation), WS-02 (Security)

---

## Objective

Eliminate SOQL/DML in loops, implement Platform Cache for hot paths, establish governor limit monitoring, and ensure all trigger handlers are bulk-safe for 200+ records.

---

## Sprint Breakdown

### Sprint 1-2: Performance Audit & Hotspot Identification

**Agent**: `apex_agent`
**Tasks**:
1. Run PMD `AvoidDmlStatementsInLoops` and `AvoidSoqlInLoops` scans
2. Identify top performance hotspots by domain:
   - CRLP rollup calculation paths
   - BDI batch processing paths
   - RD2 schedule calculation paths
   - Trigger handler chains (TDTM cascade)
3. Profile governor limit usage for key operations:
   - Contact insert with household creation
   - Opportunity insert with rollup + allocation
   - Recurring Donation schedule evaluation
   - Batch Data Import processing
4. Identify candidates for Platform Cache:
   - Custom Settings reads (frequent, rarely changed)
   - Trigger Handler configuration
   - Schema describe calls
   - RecordType mappings

**Agent**: `testing_agent`
**Tasks**:
1. Create performance test framework:
   ```apex
   @IsTest
   static void shouldHandleBulkInsertWithinGovernorLimits() {
       Integer queriesBefore = Limits.getQueries();
       Integer dmlBefore = Limits.getDmlStatements();

       Test.startTest();
       insert createTestRecords(200);
       Test.stopTest();

       Integer queriesUsed = Limits.getQueries() - queriesBefore;
       Integer dmlUsed = Limits.getDmlStatements() - dmlBefore;

       System.assert(queriesUsed < 50, 'SOQL usage: ' + queriesUsed);
       System.assert(dmlUsed < 20, 'DML usage: ' + dmlUsed);
   }
   ```
2. Run baseline performance tests for all trigger handlers

**Deliverables**:
- Performance audit report with hotspot rankings
- Governor limit baseline per key operation
- Performance test framework

### Sprint 3-4: SOQL/DML-in-Loop Elimination

**Agent**: `apex_agent`
**Tasks**:
1. Fix all SOQL-in-loop violations:
   - Collect IDs in sets, query once outside loop
   - Use selector pattern for bulk queries
   - Replace inline queries with selector class methods
2. Fix all DML-in-loop violations:
   - Collect records in lists, perform single DML outside loop
   - Use Unit of Work pattern for complex DML sequences
3. Priority order:
   - **Critical**: Trigger handlers (affect every DML on object)
   - **High**: Batch execute methods (called per batch of 200)
   - **Medium**: Service methods called from UI
   - **Low**: Utility/helper methods called infrequently

**Agent**: `testing_agent`
**Tasks**:
1. Run performance tests after each fix batch
2. Verify governor limit improvement
3. Add bulk tests where missing (200+ records)

**Deliverables**:
- Zero SOQL-in-loop violations (PMD clean)
- Zero DML-in-loop violations (PMD clean)
- Performance test results showing improvement

### Sprint 5-6: Platform Cache Implementation

**Agent**: `apex_agent`
**Tasks**:
1. Design cache architecture:
   ```
   Platform Cache (Org partition: "npsp")
   ├── TriggerHandlerConfig (TTL: 1 hour)
   ├── RecordTypeMappings (TTL: 1 hour)
   ├── CustomSettings (TTL: 30 min)
   ├── SchemaDescribe (TTL: 2 hours)
   └── UserPermissions (TTL: 15 min)
   ```
2. Create cache service:
   ```apex
   public class NPSP_CacheService {
       private static final String PARTITION = 'local.npsp';

       public static Object get(String key) {
           return Cache.Org.getPartition(PARTITION).get(key);
       }

       public static void put(String key, Object value, Integer ttlSeconds) {
           Cache.Org.getPartition(PARTITION).put(key, value, ttlSeconds);
       }

       public static void invalidate(String key) {
           Cache.Org.getPartition(PARTITION).remove(key);
       }
   }
   ```
3. Implement caching for hot paths:
   - TDTM trigger handler configuration (most impactful — read every trigger)
   - RecordType mappings
   - Custom Settings facade (add cache layer before getInstance())
   - Schema describe results
4. Add cache invalidation triggers (when config changes, invalidate cache)

**Agent**: `devops_agent`
**Tasks**:
1. Create Platform Cache partition metadata
2. Configure cache allocation in scratch org definitions
3. Add cache monitoring to CI

**Deliverables**:
- `NPSP_CacheService` utility
- Platform Cache partition configured
- 4+ hot paths cached
- Cache invalidation on config changes

### Sprint 7-8: Trigger Bulkification & LDV Safety

**Agent**: `apex_agent`
**Tasks**:
1. Audit all TDTM trigger handlers for bulk safety:
   - Verify each handles `Trigger.new` of 200+ records
   - Verify no per-record SOQL/DML
   - Verify efficient collection handling (maps vs nested loops)
2. Implement skew detection for rollup batches:
   - Large account detection (>10K opps)
   - Separate processing path for skew accounts
   - Align with CRLP_Batch_Base_Skew pattern
3. Add governor limit monitoring utility:
   ```apex
   public class NPSP_LimitsMonitor {
       public static void checkAndWarn(String context) {
           if (Limits.getQueries() > Limits.getLimitQueries() * 0.8) {
               System.debug(LoggingLevel.WARN, context + ': SOQL at 80%');
           }
           // Similar for DML, heap, CPU
       }
   }
   ```

**Agent**: `testing_agent`
**Tasks**:
1. Create LDV test suite:
   - Test with 200 records per trigger (standard bulk)
   - Test with skew accounts (1000+ children)
   - Verify governor limits stay within 80% thresholds
2. Add performance regression tests to CI

**Deliverables**:
- All trigger handlers verified bulk-safe
- Skew detection and handling for rollups
- Governor limit monitoring utility
- LDV test suite in CI

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| No loops | Zero SOQL/DML in loops (PMD) | `devops_agent` (CI) |
| Bulk safe | All triggers handle 200+ records | `testing_agent` |
| Cache | Hot paths use Platform Cache | `apex_agent` review |
| Limits | Key operations stay under 80% governor limits | `testing_agent` |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| SOQL-in-loop violations | TBD | 0 | 0 | 0 |
| DML-in-loop violations | TBD | 0 | 0 | 0 |
| Platform Cache items | 0 | 0 | 4+ | 6+ |
| Trigger bulk tests | Partial | 80% | 100% | 100% |
| Avg SOQL per Contact insert | TBD | -20% | -40% | -50%+ |

---

*Subplan Version: 1.0*
*Last Updated: 2026-02-09*
