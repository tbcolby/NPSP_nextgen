# WS-03: Async Apex Modernization — Implementation Subplan

**Phase**: 2 (Core Modernization)
**Primary Agent**: `apex_agent`
**Supporting Agents**: `testing_agent`, `devops_agent`
**Planning Doc**: [03-ASYNC-APEX-MODERNIZATION.md](../03-ASYNC-APEX-MODERNIZATION.md)
**Depends on**: WS-01 (Foundation), WS-02 (Security)

---

## Objective

Migrate all `@future` methods to Queueable Apex, implement Platform Events for async processing, modernize batch job patterns with monitoring, and establish a Queueable chaining framework.

---

## Sprint Breakdown

### Sprint 1-2: Async Inventory & Queueable Framework

**Agent**: `apex_agent`
**Tasks**:
1. Inventory all async patterns in codebase:
   - `@future` methods (count, locations, callout usage)
   - Existing `Queueable` implementations
   - `Schedulable` classes
   - `Batchable` classes and their base classes
   - Platform Event usage (if any)
2. Create Queueable base framework:
   ```apex
   public abstract class NPSP_QueueableBase implements Queueable, Database.AllowsCallouts {
       protected String jobName;
       protected Integer retryCount = 0;
       protected static final Integer MAX_RETRIES = 3;

       public void execute(QueueableContext context) {
           try {
               doExecute(context);
           } catch (Exception e) {
               handleError(e, context);
           }
       }

       protected abstract void doExecute(QueueableContext context);

       protected void handleError(Exception e, QueueableContext context) {
           ERR_Handler.processError(e, ERR_Handler_API.Context.QUEUEABLE);
           if (retryCount < MAX_RETRIES) {
               retryCount++;
               System.enqueueJob(this);
           }
       }

       protected void chainJob(NPSP_QueueableBase nextJob) {
           if (!Test.isRunningTest()) {
               System.enqueueJob(nextJob);
           }
       }
   }
   ```
3. Create async monitoring utility:
   - Track job start/end times
   - Log errors with context
   - Alert on repeated failures

**Deliverables**:
- Async pattern inventory document
- `NPSP_QueueableBase` with tests
- `NPSP_AsyncMonitor` utility

### Sprint 3-4: @future → Queueable Migration

**Agent**: `apex_agent`
**Tasks**:
1. Migrate `@future` methods in priority order:
   - **Batch 1**: Simple fire-and-forget (no callouts)
     - State update methods
     - Cache invalidation methods
     - Logging methods
   - **Batch 2**: Callout methods (`@future(callout=true)`)
     - Address verification callouts
     - Payment service callouts
     - External API integrations
   - **Batch 3**: Complex chained operations
     - Multi-step async workflows
     - Dependent async calls
2. For each migration:
   - Create new Queueable class extending `NPSP_QueueableBase`
   - Update callers to use `System.enqueueJob()` instead of `@future`
   - Remove old `@future` method
   - Ensure `inherited sharing` on new class

**Agent**: `testing_agent`
**Tasks**:
1. For each migrated method:
   - Update existing tests from `@future` pattern to Queueable pattern
   - Add bulk testing (verify Queueable handles 200+ records)
   - Add error/retry testing
   - Verify `Test.stopTest()` executes Queueable
2. Create Queueable test utilities:
   ```apex
   @IsTest
   static void shouldProcessRecordsAsync() {
       // Arrange
       List<Account> accounts = createTestAccounts(200);
       insert accounts;

       // Act
       Test.startTest();
       System.enqueueJob(new MyQueueableJob(accounts));
       Test.stopTest();

       // Assert
       List<Account> updated = [SELECT Status__c FROM Account WHERE Id IN :accounts];
       System.assertEquals(200, updated.size(), 'All records should be processed');
   }
   ```

**Deliverables**:
- All `@future` methods migrated to Queueable
- Zero `@future` annotations remaining in codebase
- Full test coverage for all Queueable classes

### Sprint 5-6: Platform Events Infrastructure

**Agent**: `apex_agent`
**Tasks**:
1. Create Platform Event definitions:
   - `NPSP_Async_Event__e` — General async processing trigger
   - `NPSP_Error_Event__e` — Error notification event
   - `NPSP_Rollup_Event__e` — Rollup recalculation trigger
2. Create event publisher utility:
   ```apex
   public class NPSP_EventPublisher {
       public static void publishAsync(String eventType, Map<String, Object> payload) {
           NPSP_Async_Event__e event = new NPSP_Async_Event__e(
               Event_Type__c = eventType,
               Payload__c = JSON.serialize(payload)
           );
           EventBus.publish(event);
       }
   }
   ```
3. Create event subscriber framework:
   ```apex
   public class NPSP_AsyncEventSubscriber {
       // Trigger handler for NPSP_Async_Event__e
       public void onAfterInsert(List<NPSP_Async_Event__e> events) {
           for (NPSP_Async_Event__e event : events) {
               routeEvent(event);
           }
       }
   }
   ```
4. Identify candidates for Platform Event conversion:
   - Rollup recalculation triggers
   - Cross-object update notifications
   - Error logging events

**Agent**: `devops_agent`
**Tasks**:
1. Deploy Platform Event metadata
2. Configure event monitoring in scratch orgs
3. Add Platform Event limits to CI monitoring

**Deliverables**:
- Platform Event definitions deployed
- Publisher and subscriber framework
- 2-3 initial Platform Event conversions

### Sprint 7-8: Batch Modernization & Monitoring

**Agent**: `apex_agent`
**Tasks**:
1. Audit existing batch classes against `CRLP_Batch_Base`:
   - Identify batches not using base class
   - Identify batches with hardcoded batch sizes
   - Identify batches without error handling
2. Create enhanced batch base:
   ```apex
   public abstract class NPSP_BatchBase implements Database.Batchable<SObject>,
       Database.Stateful, Database.AllowsCallouts {

       protected Integer totalRecords = 0;
       protected Integer successCount = 0;
       protected Integer failureCount = 0;
       protected List<String> errors = new List<String>();

       public void finish(Database.BatchableContext bc) {
           logBatchResults(bc);
           onFinish(bc);
       }

       protected abstract void onFinish(Database.BatchableContext bc);

       private void logBatchResults(Database.BatchableContext bc) {
           // Log to NPSP_Async_Monitor custom object or Platform Event
       }
   }
   ```
3. Migrate high-priority batches to new base:
   - `CRLP_Batch_Base` subclasses (rollup batches)
   - `BDI_DataImport_BATCH`
   - `RD2_OpportunityEvaluation_BATCH`
4. Add batch monitoring dashboard metadata

**Agent**: `testing_agent`
**Tasks**:
1. Create batch test utilities
2. Add LDV tests for batch classes (verify behavior with large datasets)
3. Test batch monitoring logging

**Deliverables**:
- `NPSP_BatchBase` with monitoring
- High-priority batches on new base
- Batch monitoring dashboard
- LDV batch tests

---

## Agent Coordination Protocol

```
@future Migration (per method):
  apex_agent: Creates Queueable replacement
  apex_agent → security_agent: "Verify inherited sharing on new Queueable"
  security_agent: Quick review
  apex_agent → testing_agent: "Migrate tests for OLD_METHOD to new Queueable"
  testing_agent: Updates tests, runs full suite
  apex_agent: Removes old @future method

Platform Event Setup:
  apex_agent: Defines event schema
  apex_agent → devops_agent: "Deploy Platform Event metadata to scratch org"
  devops_agent: Deploys and configures
  apex_agent: Implements publisher/subscriber
  testing_agent: Creates Platform Event tests
```

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| No @future | Zero `@future` annotations in production code | `devops_agent` (CI grep) |
| Queueable base | All Queueables extend NPSP_QueueableBase | `apex_agent` review |
| Error handling | All async code has error handling + retry | `security_agent` review |
| Tests | All async classes have bulk + error tests | `testing_agent` |
| Monitoring | All batch jobs log to monitoring | `devops_agent` |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| `@future` methods | TBD | 50% migrated | 100% migrated | 0 remaining |
| Queueable classes | TBD | +N new | +N new | All on base |
| Platform Events | 0 | 0 | 3 defined | 3+ active |
| Batch monitoring | None | Framework | Dashboard | Full coverage |
| Async test coverage | TBD | 80% | 85% | 90%+ |

---

*Subplan Version: 1.0*
*Last Updated: 2026-02-09*
