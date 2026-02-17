# WS-03: Async Apex Modernization — Implementation Subplan

**Phase**: 2 (Core Modernization)
**Primary Agent**: `apex_agent`
**Planning Doc**: [03-ASYNC-APEX-MODERNIZATION.md](../03-ASYNC-APEX-MODERNIZATION.md)
**Dependencies**: WS-01 ✅, WS-02 ✅ — **Ready to start**

---

## Objective

Migrate 13 `@future` methods to Queueable Apex with Finalizer support for error recovery. Modernize batch job patterns selectively.

---

## Sprint Breakdown

### Sprint 1: @future Inventory & Simple Migrations (~10-15h)

**Inventory** (13 @future methods identified):

| Class | Method | Callout? | Complexity |
|-------|--------|----------|-----------|
| TDTM_Runnable | runFuture() | No | Low |
| HouseholdNamingService | updateHouseholdNameAsync() | No | Low |
| USER_UserService | updateUserEmails() | No | Low |
| ERR_Notifier | notifyOnFailure() | No | Low |
| CRLP_RecalculateBTN_CTRL | recalculate() | No | Medium |
| STG_PanelDataImportAdvancedMapping_CTRL | deployMappings() | No | Medium |
| RD_RecurringDonations | method1() | No | Medium |
| RD_RecurringDonations | method2() | No | Medium |
| RD_RecurringDonations | method3() | No | Medium |
| RD_RecurringDonations | method4() | No | Medium |
| RLLP_OppRollup | rollupAll() | No | Medium |
| RLLP_OppRollup | rollupContacts() | No | Medium |

**Migration pattern** (per method):
1. Create Queueable inner class or standalone class
2. Move `@future` method body into `execute(QueueableContext ctx)`
3. Add `implements Database.AllowsCallouts` if callout needed
4. Update callers: `MyClass.myFuture(ids)` → `System.enqueueJob(new MyQueueable(ids))`
5. Add try/catch with `ERR_Handler.processError()` in execute
6. Ensure `inherited sharing` on new class
7. Remove old `@future` method

**Sprint 1 targets** (simple, fire-and-forget):
- TDTM_Runnable.runFuture()
- HouseholdNamingService.updateHouseholdNameAsync()
- USER_UserService.updateUserEmails()
- ERR_Notifier.notifyOnFailure()

**Tests**: Update existing tests from `@future` pattern to Queueable. `Test.stopTest()` executes Queueable synchronously — same test pattern works.

### Sprint 2: Complex @future Migrations (~15-20h)

**Targets**:
- RD_RecurringDonations (4 methods) — highest priority, most used
- CRLP_RecalculateBTN_CTRL.recalculate()
- STG_PanelDataImportAdvancedMapping_CTRL.deployMappings()
- RLLP_OppRollup (2 methods)

**RD_RecurringDonations approach**:
- These 4 methods share common patterns (query RDs, evaluate schedules, create opportunities)
- Consider consolidating into 1-2 Queueable classes with enum for operation type
- Add Finalizer for error recovery:
  ```apex
  public class RD2_ScheduleQueueable implements Queueable, Finalizer {
      public void execute(QueueableContext ctx) {
          // ... RD schedule evaluation
      }
      public void execute(FinalizerContext ctx) {
          if (ctx.getResult() == ParentJobResult.UNHANDLED_EXCEPTION) {
              ERR_Handler.processError(ctx.getException(),
                  ERR_Handler_API.Context.RD);
          }
      }
  }
  ```

**Quality gate**: Zero `@future` methods remaining after Sprint 2.

### Sprint 3: Batch Modernization (Selective, ~15-25h)

**NOT a full rewrite.** The existing batch infrastructure (CRLP_Batch_Base, CRLP_Batch_Base_NonSkew, CRLP_Batch_Base_Skew) works well for rollups. Changes are targeted:

1. **Add Finalizer to existing batch bases** (~5h):
   - CRLP_Batch_Base.finish() → also attach Finalizer for error recovery
   - Pattern: `System.attachFinalizer(new NPSP_BatchFinalizer(this.getClass().getName()))`

2. **Add Database.RaisesPlatformEvents** to key batches (~3h):
   - `BDI_DataImport_BATCH`
   - `RD2_OpportunityEvaluation_BATCH`
   - `LVL_LevelAssign_BATCH`
   - Enables standard Batch Apex error events without custom code

3. **Standardize error handling in non-CRLP batches** (~7-12h):
   - Audit 45 batch classes for consistent try/catch + ERR_Handler in execute()
   - Add batch monitoring: log start/finish/record counts to Error__c

**NOT doing** (deferred):
- Platform Events (NPSP_Async_Event__e etc.) — Queueable+Finalizer handles error recovery
- NPSP_QueueableBase abstract class — unnecessary infrastructure; each Queueable is simple enough standalone
- NPSP_BatchBase abstract class — existing CRLP_Batch_Base hierarchy is established
- Batch monitoring dashboard — log to Error__c, use standard reports

---

## Quality Gates

| Gate | Criteria |
|------|----------|
| No @future | Zero `@future` annotations in production code |
| Error handling | All Queueables have try/catch + ERR_Handler |
| Sharing | All new Queueable classes use `inherited sharing` |
| Tests | All Queueable classes have bulk tests (200+ records) |
| DML | All DML in new code uses UTIL_DMLService |

---

## Success Metrics

| Metric | Start | Sprint 2 | Sprint 3 |
|--------|-------|----------|----------|
| `@future` methods | 13 | **0** | 0 |
| Queueable classes (new) | 0 | ~8 | ~8 |
| Batches with Finalizer | 0 | 0 | 5+ |
| Batches with RaisesPlatformEvents | 0 | 0 | 3+ |

---

*Subplan Version: 2.0*
*Last Updated: 2026-02-16*
