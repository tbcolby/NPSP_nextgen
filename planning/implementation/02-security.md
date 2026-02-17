# WS-02: Security Architecture — Implementation Subplan

**Phase**: 1 (Foundation)
**Primary Agent**: `security_agent`
**Planning Doc**: [02-SECURITY-ARCHITECTURE.md](../02-SECURITY-ARCHITECTURE.md)
**Status**: ✅ Core items complete (5/12 burndown items)

---

## Objective

Remediate sharing declarations, SOQL injection, CRUD/FLS enforcement, and DML wrapping. Establish security patterns that all future code follows.

---

## Completed Work

### Sprint 1-2: Security Audit — ✅ COMPLETE (PRs #3-4)

**SOQL Injection** (8 files fixed):
- RD2_ERecurringDonationsSelector, RD_AddDonationsBTN_CTRL, BDE_BatchEntry_CTRL, HH_OppContactRoles_TDTM — bind variables
- ALLO_Multicurrency_TDTM, CRLP_RollupBatch_SVC, STG_PanelOppBatch_CTRL — schema validation guards
- GE_LookupController — sObjectType schema validation

**Hardcoded IDs**: RP_Constants.cls documented (YouTube, Heroku URLs). Zero Salesforce IDs or credentials in production code.

### Sprint 3-4: Sharing Mode Remediation — ✅ COMPLETE (PRs #3-4)

158 public/global classes now have explicit sharing declarations:
- Phase 2a: 46 classes (TDTM handlers, services, utilities, DTOs)
- Phase 2b: 112 additional classes (TDTM framework, batch bases, rollup handlers, adapters)

**Justified `without sharing` exceptions** (~14 classes):
- `STG_InstallScript` — Install scripts need elevated access
- `UTIL_CustomSettingsFacade` — Custom settings require system context
- `TDTM_Config_API` — Framework config
- Various batch/system classes that require full data access

### Sprint 5-6: CRUD/FLS & DML — ✅ COMPLETE (PRs #5-7)

**CRUD/FLS Enforcement** (ISV security review pattern — controller boundary only):
- 7 @AuraEnabled controller methods: GE_GiftEntryController (3), BGE_ConfigurationWizard_CTRL (2), BGE_DataImportBatchEntry_CTRL (2)
- 2 read-only controllers: DonationHistoryController, RD2_ChangeLogController
- 5 selectors with `WITH SECURITY_ENFORCED`: PaymentSelector, OpportunitySelector, AllocationSelector, RD2_ChangeLogSelector, CON_DeleteContactOverrideSelector

**Why NOT services/batch**: Per Salesforce ISV security review guidance, CRUD/FLS belongs at the controller boundary. Services run multi-object transactions (Contact+Account+Opportunity+Payment). CRUD failure mid-transaction leaves partial data. Thousands of NPSP orgs would break if automation users lack explicit field permissions.

**DML Wrapping** (86 operations across 38 files):
- Controllers (PR #5): 31 bare DML in 11 files
- Services/TDTM/batch/utilities (PR #6): 55 bare DML in 27 files
- Pattern: `UTIL_DMLService.insertRecord(s)`/`updateRecord(s)` for insert/update, `Database.delete(records, true)` for deletes
- Custom Settings upserts (~69 instances) excluded — idiomatic convention

---

## Remaining Work (Items 2.6-2.12)

### Input Validation (Item 2.9) — 8h, RECOMMENDED NEXT

Add input validation to @AuraEnabled controller entry points:
- Validate IDs are correct SObject type before queries
- Validate string lengths before DML
- Sanitize user-provided filter/sort parameters

### Other Remaining Items

| Item | Description | Est. Hours | Priority |
|------|------------|-----------|----------|
| 2.6 | Audit permission set assignments | 4h | P2 |
| 2.7 | Review field-level security on objects | 6h | P2 |
| 2.8 | Content Security Policy headers | 3h | P3 |
| 2.10 | Review sharing rules configuration | 4h | P2 |
| 2.11 | Audit remote site settings | 2h | P3 |
| 2.12 | Document security model | 4h | P2 |

### Permission Set Strategy (2GP Packaging)

The project ships as 2GP unlocked package — profiles cannot be included. All access via permission sets:

| Permission Set | Purpose |
|---------------|---------|
| `NPSP2_Admin` | Full CRUD on all package objects/fields |
| `NPSP2_User` | Standard nonprofit operations access |
| `NPSP2_ReadOnly` | Reporting access |
| `NPSP2_DataImport` | BDI operations |
| `NPSP2_IntegrationUser` | API/integration access |

---

## Established Security Patterns

All new code must follow:

1. **Sharing**: `inherited sharing` unless system-context required (document why)
2. **SOQL**: Bind variables only, never string concatenation. `WITH SECURITY_ENFORCED` on selectors serving controller paths
3. **DML**: `UTIL_DMLService.insertRecord(s)`/`updateRecord(s)` for insert/update; `Database.delete(records, true)` for deletes
4. **CRUD/FLS**: Enforce at controller boundary via `UTIL_Permissions`. Services/batch are internal — no CRUD/FLS
5. **Custom Settings**: Idiomatic bare upsert (~69 instances, established convention)

---

## Success Metrics

| Metric | Start | Current | Notes |
|--------|-------|---------|-------|
| `without sharing` (unjustified) | 54 | **~14** ✅ | All justified with documentation |
| SOQL injection vectors | 8+ | **0** ✅ | All fixed with bind variables/schema validation |
| CRUD/FLS checks (controllers) | 16 | **23** ✅ | ISV pattern: controller boundary only |
| DML wrapped | 0 | **86 operations** ✅ | 38 files |
| Selector FLS hardening | 0 | **5** ✅ | Controller-serving selectors |

---

*Subplan Version: 2.0*
*Last Updated: 2026-02-16*
