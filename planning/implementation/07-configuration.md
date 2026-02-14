# WS-07: Configuration Architecture — Implementation Subplan

**Phase**: 2 (Core Modernization)
**Primary Agent**: `apex_agent`
**Supporting Agents**: `devops_agent`, `testing_agent`
**Planning Doc**: [07-CONFIGURATION-ARCHITECTURE.md](../07-CONFIGURATION-ARCHITECTURE.md)
**Depends on**: WS-01 (Foundation)

---

## Objective

Migrate all 14 Custom Settings to Custom Metadata Types (CMT) with a unified configuration service, backwards-compatible facade, and metadata API migration utility.

---

## Sprint Breakdown

### Sprint 1-2: Configuration Service & CMT Definitions

**Agent**: `apex_agent`
**Tasks**:
1. Create `NPSP_ConfigurationService` — unified configuration access layer:
   ```apex
   public inherited sharing class NPSP_ConfigurationService {
       private static NPSP_ConfigurationService instance;
       private Map<String, Object> settingsCache;

       public static NPSP_ConfigurationService getInstance() { ... }

       // Typed accessor methods
       public NPSP_Allocation_Settings__mdt getAllocationSettings() { ... }
       public NPSP_Rollup_Settings__mdt getRollupSettings() { ... }
       // ... one method per setting category

       // Feature flags
       public Boolean isFeatureEnabled(String featureName) { ... }

       @TestVisible
       private void clearCache() { settingsCache.clear(); }
   }
   ```
2. Design and create CMT definitions for high-priority settings:
   - `NPSP_Allocation_Settings__mdt` (from Allocations_Settings__c, 8 fields)
   - `NPSP_Rollup_Settings__mdt` (from Customizable_Rollup_Settings__c, 15 fields)
   - `NPSP_Data_Import_Settings__mdt` (from Data_Import_Settings__c, 12 fields)
   - `NPSP_Gift_Entry_Settings__mdt` (from Gift_Entry_Settings__c, 10 fields)
3. Create CMT default records with current default values

**Agent**: `devops_agent`
**Tasks**:
1. Deploy CMT metadata to scratch org
2. Validate CMT deployment in CI pipeline
3. Create CumulusCI task for settings migration

**Deliverables**:
- `NPSP_ConfigurationService` class with tests
- 4 high-priority CMT definitions
- CMT default records

### Sprint 3-4: Backwards-Compatible Facade

**Agent**: `apex_agent`
**Tasks**:
1. Update `UTIL_CustomSettingsFacade` to use dual-source pattern:
   ```apex
   public static Allocations_Settings__c getAllocationsSettings() {
       // Try CMT first
       NPSP_Allocation_Settings__mdt cmtSettings =
           NPSP_ConfigurationService.getInstance().getAllocationSettings();
       if (cmtSettings != null) {
           return convertToCustomSetting(cmtSettings);
       }
       // Fall back to Custom Setting
       return Allocations_Settings__c.getInstance();
   }
   ```
   This ensures zero breaking changes — all existing code calling `UTIL_CustomSettingsFacade` continues to work.
2. Create conversion utilities (CMT ↔ Custom Setting) for each type
3. Add deprecation notices to old Custom Setting accessor methods
4. Create remaining CMT definitions:
   - `NPSP_Error_Settings__mdt` (from Error_Settings__c, 6 fields)
   - `NPSP_Household_Naming_Settings__mdt` (8 fields)
   - `NPSP_Opp_Naming__mdt` (from Opportunity_Naming_Settings__c, 6 fields)
   - `NPSP_Column_Header__mdt` (from Custom_Column_Header__c, 5 fields)

**Agent**: `testing_agent`
**Tasks**:
1. Update all test classes that use `UTIL_CustomSettingsFacade.getSettingsForTests()`:
   - Ensure they still work with dual-source pattern
   - Add tests for CMT-first path
   - Add tests for Custom Setting fallback path
2. Create test helper for CMT testing:
   ```apex
   @TestVisible
   public static void setTestCMTSettings(NPSP_Allocation_Settings__mdt settings) {
       NPSP_ConfigurationService.getInstance().setTestOverride('AllocationSettings', settings);
   }
   ```

**Deliverables**:
- Updated `UTIL_CustomSettingsFacade` with dual-source
- 8 CMT definitions total (4 high + 4 medium priority)
- All existing tests still passing
- CMT test helper utilities

### Sprint 5-6: Migration Utility & Remaining CMTs

**Agent**: `apex_agent`
**Tasks**:
1. Create `NPSP_SettingsMigrationUtility`:
   ```apex
   public class NPSP_SettingsMigrationUtility {
       public static void migrateAllSettings() {
           Metadata.DeployContainer container = new Metadata.DeployContainer();
           container.addMetadata(migrateAllocationSettings());
           container.addMetadata(migrateRollupSettings());
           // ... all settings
           Metadata.Operations.enqueueDeployment(container, new DeployCallback());
       }
   }
   ```
2. Create remaining CMT definitions:
   - `NPSP_Address_Settings__mdt` (merge Address + Addr verification, 10 fields)
   - `NPSP_Batch_Entry_Settings__mdt` (5 fields)
   - `NPSP_Level_Settings__mdt` (4 fields)
   - `NPSP_Package_Settings__mdt` (3 fields)
   - `NPSP_Rel_Sync_Exclusion__mdt` (2 fields)
3. Merge duplicate settings (`Address_Verification_Settings__c` + `Addr_Verification_Settings__c`)
4. Create admin-facing migration UI (LWC component):
   - Show current Custom Settings vs CMT status
   - One-click migration button
   - Validation and rollback

**Agent**: `lwc_agent`
**Tasks**:
1. Create `npspSettingsMigration` LWC component for admin UI
2. Wire to `NPSP_SettingsMigrationUtility` Apex controller

**Deliverables**:
- Migration utility with Metadata API deployment
- All 14 Custom Settings mapped to CMTs (consolidated to ~12)
- Admin migration UI component
- Validation and rollback support

### Sprint 7-8: Cutover & Cleanup

**Agent**: `apex_agent`
**Tasks**:
1. Switch `NPSP_ConfigurationService` to CMT-primary (Custom Setting fallback only)
2. Update all direct Custom Setting references to use `NPSP_ConfigurationService`:
   - Search for `*.getInstance()` calls outside of facade
   - Search for direct SOQL on Custom Settings
   - Route everything through the service
3. Mark old Custom Settings as deprecated (but don't remove yet)
4. Add Platform Cache layer to `NPSP_ConfigurationService` for performance

**Agent**: `testing_agent`
**Tasks**:
1. Full regression test suite
2. Verify all CMT records deploy correctly in clean scratch org
3. Test migration utility end-to-end
4. Performance test: verify CMT reads don't count against SOQL limits

**Agent**: `documentation_agent`
**Tasks**:
1. Document new configuration architecture
2. Create admin guide for settings migration
3. Update CONTRIBUTING.md with CMT patterns

**Deliverables**:
- All configuration reads through `NPSP_ConfigurationService`
- CMT as primary source, Custom Settings as fallback
- Migration documentation for admins
- Contributor guide for new settings

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| Backwards compat | All existing tests pass without modification | `testing_agent` |
| Dual source | CMT-first, Custom Setting fallback works | `testing_agent` |
| Migration | Migration utility deploys all settings correctly | `testing_agent` |
| No direct access | No direct Custom Setting access outside facade | `apex_agent` review |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| CMT definitions | 0 | 4 | 12 | 12 |
| Settings via CMT | 0% | 30% | 80% | 100% |
| Direct CS access | Many | Reduced | Minimal | 0 (all via service) |
| Test compatibility | 100% | 100% | 100% | 100% |

---

---

## 2GP Packaging Note (NPPatch Decision, 2026-02-13)

Custom Metadata Types can be included directly in 2GP unlocked packages. This means CMT definitions and default records created in this workstream will be deployed as part of the `npsp2` 2GP package, simplifying distribution. Key implications:

- CMT definitions are packaged and versioned with the 2GP package
- Default CMT records ship with the package and can be overridden by subscribers
- The `NPSP_SettingsMigrationUtility` (Sprint 5-6) should account for 2GP deployment behavior: subscriber CMT records created via Metadata API are separate from packaged defaults
- No separate metadata deployment step is needed for CMTs -- they are part of the package install

---

*Subplan Version: 1.1*
*Last Updated: 2026-02-13*
