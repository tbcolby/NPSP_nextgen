# Async Apex Modernization Plan

## Executive Summary

This document outlines the strategy for modernizing NPSP_nextgen's asynchronous Apex patterns, focusing on converting legacy `@future` methods to Queueable, implementing the Finalizer pattern for error recovery, and establishing consistent async patterns across 45+ batch classes.

**Core Decision**: Adopt Queueable as the primary async pattern with Finalizer support for error recovery.

---

## 1. Current State Analysis

### 1.1 Async Apex Inventory

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASYNC APEX DISTRIBUTION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  @future Methods          ████████████████░░░░  13 methods      │
│  Batch Classes            ████████████████████  45 classes      │
│  Queueable Classes        ██████░░░░░░░░░░░░░░  6 classes       │
│  Schedulable Classes      ████████░░░░░░░░░░░░  8 classes       │
│  Platform Events          █░░░░░░░░░░░░░░░░░░░  Limited         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 @future Methods Inventory

| Class | Method | Purpose | Callout? | Priority |
|-------|--------|---------|----------|----------|
| TDTM_Runnable | runFuture() | Async trigger handler | No | High |
| HouseholdNamingService | updateHouseholdNameAsync() | HH name updates | No | High |
| USER_UserService | handleDeactivatedSysAdminFuture() | Admin deactivation | No | Medium |
| RD_RecurringDonations | updateRecurringDonationOnOppChangeFuture() | RD sync | No | High |
| RD_RecurringDonations | insertOppsOnRecurringDonationInsertFuture() | Opp creation | No | High |
| RD_RecurringDonations | oppContactRolesFuture() | OCR creation | No | Low |
| RD_RecurringDonations | updateExistingOppsFuture() | Opp updates | No | High |
| ERR_Notifier | notifyOnFailure() | Error notification | No | Medium |
| CRLP_RecalculateBTN_CTRL | recalculateRollupsFuture() | Manual rollups | No | Medium |
| STG_PanelDataImportAdvancedMapping_CTRL | (async method) | Settings update | No | Low |
| RLLP_OppRollup | rollupAccountsFuture() | Legacy rollups | No | Low |
| RLLP_OppRollup | rollupContactsFuture() | Legacy rollups | No | Low |
| RLLP_OppRollup | rollupHouseholdsFuture() | Legacy rollups | No | Low |

### 1.3 Batch Class Analysis

**By Pattern**:

| Pattern | Count | Examples |
|---------|-------|----------|
| Database.Stateful | 23 | CRLP_*, RD2_* batches |
| Non-Stateful | 22 | RLLP_*, utility batches |
| With Schedulable | 15 | Most CRLP batches |
| With Chaining | 8 | CRLP_SkewDispatcher, chunking batches |

**By Domain**:

```
┌─────────────────────────────────────────────────────────────────┐
│                  BATCH CLASSES BY DOMAIN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CRLP (Customizable Rollups)    ████████████████  18 classes    │
│  RD (Recurring Donations)       ██████░░░░░░░░░░  5 classes     │
│  RLLP (Legacy Rollups)          ████░░░░░░░░░░░░  4 classes     │
│  Data Import                    ███░░░░░░░░░░░░░  3 classes     │
│  Utilities                      ██████████░░░░░░  10 classes    │
│  Other                          █████░░░░░░░░░░░  5 classes     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Existing Modern Patterns

**Queueable with Finalizer** (GiftEntryProcessorQueue):
```apex
public class GiftEntryProcessorQueue implements Queueable, Database.AllowsCallouts {
    public void execute(QueueableContext context) {
        // Attach finalizer for cleanup
        System.attachFinalizer(new GiftEntryProcessorQueueFinalizer(this.giftBatchId));

        // Process work
        processGifts();

        // Chain next job if more work
        if (hasMoreChunks()) {
            System.enqueueJob(new GiftEntryProcessorQueue(nextChunk));
        }
    }
}
```

This is the modern pattern we want to standardize on.

---

## 2. Target State Architecture

### 2.1 Async Pattern Decision Tree

```
                    ┌─────────────────────────────┐
                    │   CHOOSING ASYNC PATTERN    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ How much data to process?   │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
   ┌───────────┐           ┌─────────────┐           ┌─────────────┐
   │ Small     │           │ Medium      │           │ Large       │
   │ (<1000)   │           │ (1K-50K)    │           │ (>50K)      │
   └─────┬─────┘           └──────┬──────┘           └──────┬──────┘
         │                        │                         │
         ▼                        ▼                         ▼
   ┌───────────┐           ┌─────────────┐           ┌─────────────┐
   │ Queueable │           │ Queueable   │           │ Batch Apex  │
   │           │           │ w/ Chaining │           │             │
   └─────┬─────┘           └──────┬──────┘           └──────┬──────┘
         │                        │                         │
         │         ┌──────────────┴──────────────┐         │
         │         │                             │         │
         ▼         ▼                             ▼         ▼
   ┌─────────────────┐                   ┌─────────────────────┐
   │ Need callouts?  │                   │ Need progress       │
   │ Yes → AllowsCallouts                │ tracking? → Stateful│
   └─────────────────┘                   └─────────────────────┘
```

### 2.2 Standard Queueable Pattern

```apex
/**
 * @description Standard Queueable pattern for NPSP
 * Includes Finalizer, error handling, and optional chaining
 */
public inherited sharing class NPSP_StandardQueueable
    implements Queueable, Database.AllowsCallouts {

    private List<Id> recordIds;
    private Integer chunkIndex;
    private static final Integer CHUNK_SIZE = 200;

    public NPSP_StandardQueueable(List<Id> recordIds) {
        this(recordIds, 0);
    }

    private NPSP_StandardQueueable(List<Id> recordIds, Integer chunkIndex) {
        this.recordIds = recordIds;
        this.chunkIndex = chunkIndex;
    }

    public void execute(QueueableContext context) {
        // Attach finalizer for guaranteed cleanup
        System.attachFinalizer(new NPSP_QueueableFinalizer(
            context.getJobId(),
            this.getClass().getName()
        ));

        try {
            // Process current chunk
            List<Id> currentChunk = getChunk();
            processRecords(currentChunk);

            // Chain next chunk if more work remains
            if (hasMoreChunks()) {
                if (Limits.getQueueableJobs() < Limits.getLimitQueueableJobs()) {
                    System.enqueueJob(new NPSP_StandardQueueable(
                        this.recordIds,
                        this.chunkIndex + 1
                    ));
                } else {
                    // Fallback: schedule for later
                    scheduleRetry();
                }
            }
        } catch (Exception ex) {
            // Log error but don't re-throw (let Finalizer handle)
            ERR_Handler.processError(ex, ERR_Handler_API.Context.NPSP);
        }
    }

    private List<Id> getChunk() {
        Integer startIndex = chunkIndex * CHUNK_SIZE;
        Integer endIndex = Math.min(startIndex + CHUNK_SIZE, recordIds.size());
        List<Id> chunk = new List<Id>();
        for (Integer i = startIndex; i < endIndex; i++) {
            chunk.add(recordIds[i]);
        }
        return chunk;
    }

    private Boolean hasMoreChunks() {
        return (chunkIndex + 1) * CHUNK_SIZE < recordIds.size();
    }

    private void processRecords(List<Id> ids) {
        // Override in subclass
    }

    private void scheduleRetry() {
        // Schedule job to retry later
    }
}
```

### 2.3 Standard Finalizer Pattern

```apex
/**
 * @description Standard Finalizer for NPSP Queueables
 * Handles cleanup, error recovery, and monitoring
 */
public class NPSP_QueueableFinalizer implements Finalizer {

    private Id jobId;
    private String className;

    public NPSP_QueueableFinalizer(Id jobId, String className) {
        this.jobId = jobId;
        this.className = className;
    }

    public void execute(FinalizerContext context) {
        ParentJobResult result = context.getResult();

        switch on result {
            when SUCCESS {
                handleSuccess(context);
            }
            when UNHANDLED_EXCEPTION {
                handleException(context);
            }
        }
    }

    private void handleSuccess(FinalizerContext context) {
        // Log completion metrics
        UTIL_PerfLogger.log(
            'Queueable',
            className,
            context.getAsyncApexJobId(),
            'SUCCESS'
        );
    }

    private void handleException(FinalizerContext context) {
        Exception ex = context.getException();

        // Log error
        ERR_Handler.processError(ex, ERR_Handler_API.Context.NPSP);

        // Attempt recovery based on error type
        if (isRetryableError(ex)) {
            scheduleRetry();
        } else {
            // Send notification for non-retryable errors
            ERR_Notifier.notifyErrorEmail(
                ERR_Handler_API.Context.NPSP,
                new List<Error__c>{ createErrorRecord(ex) }
            );
        }
    }

    private Boolean isRetryableError(Exception ex) {
        // Retry on transient errors
        return ex instanceof AsyncException
            || ex instanceof CalloutException
            || ex.getMessage().contains('UNABLE_TO_LOCK_ROW');
    }

    private void scheduleRetry() {
        // Re-queue with delay
    }

    private Error__c createErrorRecord(Exception ex) {
        return new Error__c(
            Full_Message__c = ex.getMessage(),
            Stack_Trace__c = ex.getStackTraceString(),
            Context_Type__c = className
        );
    }
}
```

---

## 3. Well-Architected Framework Alignment

### 3.1 Trusted

| Principle | Implementation |
|-----------|----------------|
| **Reliability** | Finalizer guarantees cleanup even on failure |
| **Fault Tolerance** | Retry logic for transient errors |
| **Monitoring** | Error logging and notifications |

### 3.2 Adaptable

| Principle | Implementation |
|-----------|----------------|
| **Scalability** | Chunking and chaining handle any data volume |
| **Flexibility** | Configuration-driven chunk sizes |
| **Future-Ready** | Platform Events ready for cross-boundary needs |

### 3.3 Automated

| Principle | Implementation |
|-----------|----------------|
| **Self-Healing** | Automatic retry on retryable errors |
| **Monitoring** | AsyncApexJob tracking via ERR_AsyncErrors |
| **Alerting** | Automatic notifications on failures |

---

## 4. Trade-off Analysis

### 4.1 @future vs Queueable

| Aspect | @future | Queueable |
|--------|---------|-----------|
| **Simplicity** | Simpler syntax | More code required |
| **Chaining** | Not supported | Supported |
| **Parameters** | Primitives only | Any serializable type |
| **Monitoring** | Limited | Full AsyncApexJob access |
| **Error Handling** | No Finalizer | Finalizer support |
| **Testing** | Test.startTest() | Test.startTest() + Test.stopTest() |
| **Limits** | 50 per transaction | 50 per transaction |

**Decision**: Queueable is superior for all cases. Convert all @future methods.

### 4.2 Queueable Chaining vs Batch Apex

| Aspect | Queueable Chain | Batch Apex |
|--------|-----------------|------------|
| **Data Volume** | <50K records | Unlimited |
| **State** | Easy (class members) | Database.Stateful required |
| **Granularity** | Custom chunk size | Scope parameter |
| **Real-time** | Near real-time | Queued execution |
| **Complexity** | Lower | Higher |
| **Governor Limits** | Per-chunk | Per-batch |

**Decision**: Use Queueable chaining for < 50K records; Batch for larger volumes.

### 4.3 Batch Modernization Options

**Option A: Keep Existing Batches, Add Finalizer Pattern**
- Add Database.RaisesPlatformEvents where beneficial
- Wrap finish() with error handling
- Minimal code changes

**Option B: Convert to Queueable Where Appropriate**
- Convert smaller batches to Queueable
- Keep large-volume batches as Batch Apex
- Standardize patterns

**Decision**: Option B - Selective conversion with standardized patterns

---

## 5. Migration Strategy

### 5.1 Phase 1: @future to Queueable (Sprint 1-3)

**Priority Order**:

| Priority | Method | Rationale |
|----------|--------|-----------|
| 1 | RD_RecurringDonations methods (4) | High usage, critical path |
| 2 | HouseholdNamingService | Frequently called |
| 3 | TDTM_Runnable.runFuture() | Framework-level |
| 4 | ERR_Notifier.notifyOnFailure() | Error handling |
| 5 | CRLP_RecalculateBTN_CTRL | User-triggered |
| 6 | USER_UserService | Admin operations |
| 7 | RLLP_OppRollup methods (3) | Legacy, low priority |

**Conversion Template**:

```apex
// BEFORE: @future method
public class RD_RecurringDonations {
    @future
    public static void updateRecurringDonationOnOppChangeFuture(Set<Id> rdIds) {
        updateRecurringDonationOnOppChange(rdIds);
    }

    private static void updateRecurringDonationOnOppChange(Set<Id> rdIds) {
        // Implementation
    }
}

// AFTER: Queueable
public class RD_RecurringDonations {
    // Keep static method for sync calls
    public static void updateRecurringDonationOnOppChange(Set<Id> rdIds) {
        // Implementation
    }

    // New Queueable for async
    public static void updateRecurringDonationOnOppChangeAsync(Set<Id> rdIds) {
        if (System.isBatch() || System.isFuture() || System.isQueueable()) {
            // Already in async context, run sync
            updateRecurringDonationOnOppChange(rdIds);
        } else if (Limits.getQueueableJobs() < Limits.getLimitQueueableJobs()) {
            System.enqueueJob(new RD_UpdateOnOppChangeQueueable(rdIds));
        } else {
            // Fallback to sync if no queue capacity
            updateRecurringDonationOnOppChange(rdIds);
        }
    }

    public class RD_UpdateOnOppChangeQueueable implements Queueable {
        private Set<Id> rdIds;

        public RD_UpdateOnOppChangeQueueable(Set<Id> rdIds) {
            this.rdIds = rdIds;
        }

        public void execute(QueueableContext context) {
            System.attachFinalizer(new NPSP_QueueableFinalizer(
                context.getJobId(),
                'RD_UpdateOnOppChangeQueueable'
            ));

            updateRecurringDonationOnOppChange(rdIds);
        }
    }
}
```

### 5.2 Phase 2: Batch Modernization (Sprint 4-6)

**Batch Classes to Add Finalizer Pattern**:

| Batch Class | Current State | Target |
|-------------|---------------|--------|
| CRLP_Contact_BATCH | Stateful | Add Platform Events |
| CRLP_Account_BATCH | Stateful | Add Platform Events |
| RD2_OpportunityEvaluation_BATCH | Stateful + AllowsCallouts | Add better error recovery |
| BDI_DataImport_BATCH | Non-Stateful | Add progress tracking |

### 5.3 Phase 3: Platform Events (Sprint 7-8)

**Proposed Events**:

| Event | Purpose | Publisher | Subscriber |
|-------|---------|-----------|------------|
| BatchJobComplete__e | Batch completion notification | Batch finish() | Monitoring, UI |
| DataProcessingError__e | Error notification | Any async | Error handler |
| RollupComplete__e | Rollup calculation done | CRLP batches | UI refresh |

---

## 6. Risk Assessment

### 6.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing integrations | Medium | High | Keep old methods, deprecate |
| Queue exhaustion | Low | Medium | Fallback to sync execution |
| Test failures | Medium | Low | Update test patterns |
| Performance regression | Low | Medium | Benchmark before/after |

### 6.2 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Monitoring gaps | Medium | Medium | Add ERR_AsyncErrors coverage |
| Increased complexity | Medium | Low | Clear documentation |
| Training needs | High | Low | Developer guide |

---

## 7. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| @future methods | 13 | 0 | Code scan |
| Queueable with Finalizer | 17% | 100% | Code scan |
| Async job failure rate | Unknown | <1% | ERR_AsyncErrors |
| Retry success rate | N/A | >80% | Monitoring |

---

## 8. Testing Strategy

### 8.1 Queueable Test Pattern

```apex
@IsTest
private class RD_UpdateOnOppChangeQueueable_TEST {

    @TestSetup
    static void setup() {
        // Create test data
    }

    @IsTest
    static void testQueueableExecution() {
        Set<Id> rdIds = new Set<Id>{/* test IDs */};

        Test.startTest();
        System.enqueueJob(new RD_RecurringDonations.RD_UpdateOnOppChangeQueueable(rdIds));
        Test.stopTest();

        // Verify results
        List<npe03__Recurring_Donation__c> rds = [
            SELECT Id, npe03__Next_Payment_Date__c
            FROM npe03__Recurring_Donation__c
            WHERE Id IN :rdIds
        ];
        System.assertEquals(expected, rds[0].npe03__Next_Payment_Date__c);
    }

    @IsTest
    static void testFinalizerOnException() {
        // Test that Finalizer handles exceptions properly
    }

    @IsTest
    static void testChaining() {
        // Test that job chains correctly for large datasets
    }
}
```

---

## 9. Appendix

### A. Async Apex Limits Reference

| Limit | Value |
|-------|-------|
| Queueable jobs per transaction | 50 |
| Batch Apex jobs (active) | 5 concurrent |
| @future calls per transaction | 50 |
| Platform Event publishes | 2,000 per transaction |

### B. Related Documents

- [04-PERFORMANCE-OPTIMIZATION.md](04-PERFORMANCE-OPTIMIZATION.md)
- [10-TESTING-STRATEGY.md](10-TESTING-STRATEGY.md)

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: NPSP_nextgen Architecture Team*
