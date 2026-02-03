# Configuration Architecture Plan

## Executive Summary

This document outlines the strategy for modernizing NPSP_nextgen's configuration architecture, focusing on migrating from Custom Settings to Custom Metadata Types (CMT). This migration improves deployability, eliminates SOQL limits for configuration reads, and aligns with Salesforce best practices for ISV packaging.

**Core Decision**: Migrate all 14 Custom Settings to Custom Metadata Types with backwards-compatible migration utilities.

---

## 1. Current State Analysis

### 1.1 Custom Settings Inventory

```
┌─────────────────────────────────────────────────────────────────┐
│                  CUSTOM SETTINGS INVENTORY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HIERARCHY SETTINGS (11)                                         │
│  ├─ Allocations_Settings__c                                     │
│  ├─ Address_Verification_Settings__c                            │
│  ├─ Addr_Verification_Settings__c                               │
│  ├─ Batch_Data_Entry_Settings__c                                │
│  ├─ Customizable_Rollup_Settings__c                             │
│  ├─ Data_Import_Settings__c                                     │
│  ├─ Error_Settings__c                                           │
│  ├─ Gift_Entry_Settings__c                                      │
│  ├─ Household_Naming_Settings__c                                │
│  ├─ Levels_Settings__c                                          │
│  └─ Package_Settings__c                                         │
│                                                                  │
│  LIST SETTINGS (3)                                               │
│  ├─ Custom_Column_Header__c                                     │
│  ├─ Opportunity_Naming_Settings__c                              │
│  └─ Relationship_Sync_Excluded_Fields__c                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Custom Settings Usage Patterns

**UTIL_CustomSettingsFacade Analysis**:

```apex
// Current access pattern (SOQL-based for some, getInstance for others)
public class UTIL_CustomSettingsFacade {

    // Hierarchy settings - use getInstance() (no SOQL)
    public static Allocations_Settings__c getAllocationsSettings() {
        return Allocations_Settings__c.getInstance();
    }

    // List settings - require SOQL
    public static List<Opportunity_Naming_Settings__c> getOppNamingSettings() {
        return [SELECT Id, Name, ... FROM Opportunity_Naming_Settings__c];
    }
}
```

### 1.3 Current Configuration Challenges

| Challenge | Impact | Custom Settings | Custom Metadata |
|-----------|--------|-----------------|-----------------|
| SOQL Limits | High | Counts against limits | No SOQL required |
| Deployability | High | Not in change sets | Fully deployable |
| Version Control | Medium | Data, not metadata | Full metadata |
| Test Data | Medium | Requires DML in tests | Test.loadData or SOQL |
| Sandboxes | Medium | Not copied | Included in refresh |
| Managed Package | High | Post-install setup | Included in package |

---

## 2. Target State Architecture

### 2.1 Configuration Architecture Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                TARGET CONFIGURATION ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 APPLICATION LAYER                        │    │
│  │  Apex Classes │ LWC │ Flows │ Validation Rules          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              CONFIGURATION SERVICE LAYER                 │    │
│  │  NPSP_ConfigurationService (unified access)              │    │
│  │  ├─ getSettings(settingType)                            │    │
│  │  ├─ getSetting(settingType, name)                       │    │
│  │  └─ isFeatureEnabled(featureName)                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│            ┌─────────────────┼─────────────────┐                │
│            ▼                 ▼                 ▼                │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │  PLATFORM     │ │   CUSTOM      │ │   STATIC      │         │
│  │  CACHE        │ │   METADATA    │ │   DEFAULTS    │         │
│  │  (Hot data)   │ │   TYPES       │ │   (Fallback)  │         │
│  └───────────────┘ └───────────────┘ └───────────────┘         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MIGRATION/COMPATIBILITY LAYER               │    │
│  │  Legacy Custom Settings → CMT Migration Utilities       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Custom Metadata Type Design

**Naming Convention**: `NPSP_{SettingCategory}__mdt`

**Example: NPSP_Allocation_Settings__mdt**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Default Allocation Settings</label>
    <protected>false</protected>
    <values>
        <field>Default_Allocations_Enabled__c</field>
        <value xsi:type="xsd:boolean">true</value>
    </values>
    <values>
        <field>Default_GAU__c</field>
        <value xsi:type="xsd:string">a]00000000001</value>
    </values>
    <values>
        <field>Excluded_Opp_RecTypes__c</field>
        <value xsi:type="xsd:string"></value>
    </values>
</CustomMetadata>
```

---

## 3. Well-Architected Framework Alignment

### 3.1 Adaptable

| Principle | Implementation |
|-----------|----------------|
| **Configurable** | All behavior driven by metadata |
| **Deployable** | Configuration moves with code |
| **Versionable** | Full source control support |

### 3.2 Automated

| Principle | Implementation |
|-----------|----------------|
| **CI/CD Ready** | Deploy config with automation |
| **No Manual Steps** | No post-deployment data setup |
| **Testable** | Config available in test context |

### 3.3 Intentional

| Principle | Implementation |
|-----------|----------------|
| **Single Source of Truth** | One configuration layer |
| **Clear Defaults** | Documented default values |
| **Override Capability** | Org-specific customization |

---

## 4. Migration Design

### 4.1 Custom Metadata Type Mappings

| Custom Setting | Custom Metadata Type | Fields | Priority |
|----------------|---------------------|--------|----------|
| Allocations_Settings__c | NPSP_Allocation_Settings__mdt | 8 | High |
| Customizable_Rollup_Settings__c | NPSP_Rollup_Settings__mdt | 15 | High |
| Data_Import_Settings__c | NPSP_Data_Import_Settings__mdt | 12 | High |
| Error_Settings__c | NPSP_Error_Settings__mdt | 6 | Medium |
| Gift_Entry_Settings__c | NPSP_Gift_Entry_Settings__mdt | 10 | High |
| Household_Naming_Settings__c | NPSP_Household_Naming_Settings__mdt | 8 | Medium |
| Address_Verification_Settings__c | NPSP_Address_Settings__mdt | 10 | Low |
| Addr_Verification_Settings__c | (Merge with above) | - | Low |
| Batch_Data_Entry_Settings__c | NPSP_Batch_Entry_Settings__mdt | 5 | Low |
| Levels_Settings__c | NPSP_Level_Settings__mdt | 4 | Low |
| Package_Settings__c | NPSP_Package_Settings__mdt | 3 | Low |
| Custom_Column_Header__c | NPSP_Column_Header__mdt | 5 | Medium |
| Opportunity_Naming_Settings__c | NPSP_Opp_Naming__mdt | 6 | Medium |
| Relationship_Sync_Excluded_Fields__c | NPSP_Rel_Sync_Exclusion__mdt | 2 | Low |

### 4.2 Migration Service Design

```apex
/**
 * @description Service for migrating Custom Settings to Custom Metadata Types
 * Provides backwards-compatible access during transition period
 */
public inherited sharing class NPSP_ConfigurationService {

    // Singleton pattern for caching
    private static NPSP_ConfigurationService instance;
    private Map<String, Object> settingsCache;

    public static NPSP_ConfigurationService getInstance() {
        if (instance == null) {
            instance = new NPSP_ConfigurationService();
        }
        return instance;
    }

    private NPSP_ConfigurationService() {
        this.settingsCache = new Map<String, Object>();
    }

    /**
     * @description Get allocation settings (CMT with CS fallback)
     */
    public NPSP_Allocation_Settings__mdt getAllocationSettings() {
        String cacheKey = 'AllocationSettings';

        if (!settingsCache.containsKey(cacheKey)) {
            // Try CMT first
            List<NPSP_Allocation_Settings__mdt> cmtSettings =
                NPSP_Allocation_Settings__mdt.getAll().values();

            if (!cmtSettings.isEmpty()) {
                settingsCache.put(cacheKey, cmtSettings[0]);
            } else {
                // Fallback to Custom Setting (backwards compatibility)
                Allocations_Settings__c csSettings =
                    Allocations_Settings__c.getInstance();
                settingsCache.put(cacheKey, convertToCMT(csSettings));
            }
        }

        return (NPSP_Allocation_Settings__mdt) settingsCache.get(cacheKey);
    }

    /**
     * @description Convert legacy Custom Setting to CMT format
     */
    private NPSP_Allocation_Settings__mdt convertToCMT(
        Allocations_Settings__c cs
    ) {
        // Create in-memory CMT record from CS values
        // This allows code to work with CMT format during transition
        return new NPSP_Allocation_Settings__mdt(
            Default_Allocations_Enabled__c = cs.Default_Allocations_Enabled__c,
            Default_GAU__c = cs.Default__c,
            Excluded_Opp_RecTypes__c = cs.Excluded_Opp_RecTypes__c
            // ... map all fields
        );
    }

    /**
     * @description Clear cache (for testing)
     */
    @TestVisible
    private void clearCache() {
        settingsCache.clear();
    }
}
```

### 4.3 Migration Utility

```apex
/**
 * @description Utility to migrate Custom Settings data to Custom Metadata Types
 * Run once per org during upgrade process
 */
public class NPSP_SettingsMigrationUtility {

    /**
     * @description Migrate all settings to CMT
     * Creates deployment package with CMT records
     */
    public static void migrateAllSettings() {
        Metadata.DeployContainer container = new Metadata.DeployContainer();

        // Migrate each setting type
        container.addMetadata(migrateAllocationSettings());
        container.addMetadata(migrateRollupSettings());
        // ... add other migrations

        // Deploy
        if (!Test.isRunningTest()) {
            Metadata.Operations.enqueueDeployment(container, new DeployCallback());
        }
    }

    private static Metadata.CustomMetadata migrateAllocationSettings() {
        Allocations_Settings__c cs = Allocations_Settings__c.getInstance();

        Metadata.CustomMetadata cmt = new Metadata.CustomMetadata();
        cmt.fullName = 'NPSP_Allocation_Settings__mdt.Default';
        cmt.label = 'Default Allocation Settings';

        Metadata.CustomMetadataValue field1 = new Metadata.CustomMetadataValue();
        field1.field = 'Default_Allocations_Enabled__c';
        field1.value = cs.Default_Allocations_Enabled__c;
        cmt.values.add(field1);

        // ... add other fields

        return cmt;
    }

    public class DeployCallback implements Metadata.DeployCallback {
        public void handleResult(
            Metadata.DeployResult result,
            Metadata.DeployCallbackContext context
        ) {
            if (result.status == Metadata.DeployStatus.Succeeded) {
                // Mark migration complete
                markMigrationComplete();
            } else {
                // Log errors
                for (Metadata.DeployMessage msg : result.details.componentFailures) {
                    System.debug('Migration failed: ' + msg.problem);
                }
            }
        }
    }
}
```

---

## 5. Trade-off Analysis

### 5.1 Custom Settings vs Custom Metadata Types

| Aspect | Custom Settings | Custom Metadata Types |
|--------|-----------------|----------------------|
| **SOQL Limits** | Counts (List) / None (Hierarchy) | Never counts |
| **Deployability** | Data (not deployable) | Metadata (deployable) |
| **Change Sets** | Not included | Included |
| **Sandboxes** | Not refreshed | Included in refresh |
| **Version Control** | Not trackable | Full tracking |
| **Test Context** | Requires SeeAllData or DML | Available automatically |
| **Hierarchy Support** | Built-in | Requires custom logic |
| **User Preferences** | Supported | Not ideal |
| **Performance** | Fast (getInstance) | Fast (getAll) |

### 5.2 Migration Approach Options

**Option A: Big Bang Migration**
| Pros | Cons |
|------|------|
| Single effort | High risk |
| Clean codebase | Breaking change |
| No dual maintenance | Requires coordination |

**Option B: Gradual Migration (Recommended)**
| Pros | Cons |
|------|------|
| Lower risk | Longer timeline |
| Backwards compatible | Dual maintenance |
| Easy rollback | More code |

**Option C: Parallel Operation**
| Pros | Cons |
|------|------|
| No migration required | Permanent complexity |
| Zero risk | Technical debt |
| User choice | Confusion |

**Decision**: Option B - Gradual migration with compatibility layer

---

## 6. Implementation Plan

### Phase 1: Infrastructure (Sprint 1-2)

| Task | Description | Effort |
|------|-------------|--------|
| Create CMT objects | Define all CMT types | 8h |
| Create service layer | NPSP_ConfigurationService | 12h |
| Add caching | Platform Cache integration | 6h |
| Write tests | Unit tests for service | 8h |

### Phase 2: High-Priority Migrations (Sprint 3-4)

| Setting | CMT | Effort |
|---------|-----|--------|
| Allocations_Settings__c | NPSP_Allocation_Settings__mdt | 6h |
| Customizable_Rollup_Settings__c | NPSP_Rollup_Settings__mdt | 8h |
| Data_Import_Settings__c | NPSP_Data_Import_Settings__mdt | 6h |
| Gift_Entry_Settings__c | NPSP_Gift_Entry_Settings__mdt | 6h |

### Phase 3: Medium-Priority Migrations (Sprint 5-6)

| Setting | CMT | Effort |
|---------|-----|--------|
| Error_Settings__c | NPSP_Error_Settings__mdt | 4h |
| Household_Naming_Settings__c | NPSP_Household_Naming_Settings__mdt | 4h |
| Opportunity_Naming_Settings__c | NPSP_Opp_Naming__mdt | 4h |
| Custom_Column_Header__c | NPSP_Column_Header__mdt | 4h |

### Phase 4: Low-Priority Migrations (Sprint 7-8)

| Setting | CMT | Effort |
|---------|-----|--------|
| Address settings (merge) | NPSP_Address_Settings__mdt | 4h |
| Batch_Data_Entry_Settings__c | NPSP_Batch_Entry_Settings__mdt | 3h |
| Levels_Settings__c | NPSP_Level_Settings__mdt | 3h |
| Package_Settings__c | NPSP_Package_Settings__mdt | 2h |
| Relationship_Sync_Excluded_Fields__c | NPSP_Rel_Sync_Exclusion__mdt | 2h |

### Phase 5: Deprecation (Sprint 9+)

| Task | Description | Effort |
|------|-------------|--------|
| Add deprecation warnings | Log when CS accessed | 4h |
| Update documentation | Migration guide | 8h |
| Communication | Release notes | 2h |

---

## 7. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Custom Settings | 14 | 0 (deprecated) | Code inventory |
| Custom Metadata Types | 0 | 14 | Metadata count |
| SOQL for config | Variable | 0 | Debug logs |
| Deployment success | N/A | 100% | CI/CD |
| Test coverage | N/A | 90%+ | CI/CD |

---

## 8. Backwards Compatibility

### 8.1 Compatibility Guarantee

```
┌─────────────────────────────────────────────────────────────────┐
│              BACKWARDS COMPATIBILITY APPROACH                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: Dual Support                                          │
│  ├─ CMT is primary source                                       │
│  ├─ CS is fallback if CMT empty                                 │
│  └─ No breaking changes                                         │
│                                                                  │
│  PHASE 2: CMT Required                                          │
│  ├─ Migration utility provided                                  │
│  ├─ CS still read for migration                                 │
│  └─ Warnings logged for CS access                               │
│                                                                  │
│  PHASE 3: CS Deprecated                                         │
│  ├─ CS objects remain (no deletion)                             │
│  ├─ Code no longer reads CS                                     │
│  └─ Documentation updated                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Migration Guide for Adopters

```markdown
## Migrating Your NPSP Settings to Custom Metadata

### Automatic Migration
1. Go to NPSP Settings > System > Configuration Migration
2. Click "Migrate to Custom Metadata"
3. Review the deployment status
4. Verify settings in Setup > Custom Metadata Types

### Manual Migration
1. Export current Custom Setting values
2. Create CMT records with same values
3. Deploy CMT records to org
4. Verify NPSP functions correctly

### Rollback
If issues occur, NPSP will automatically fall back to Custom Settings
until CMT records are properly deployed.
```

---

## 9. Appendix

### A. Custom Metadata Type Field Mappings

**NPSP_Allocation_Settings__mdt**:
| Custom Setting Field | CMT Field | Type |
|---------------------|-----------|------|
| Default_Allocations_Enabled__c | Default_Allocations_Enabled__c | Checkbox |
| Default__c | Default_GAU__c | Text(18) |
| Excluded_Opp_RecTypes__c | Excluded_Opp_RecTypes__c | LongTextArea |
| Excluded_Opp_Types__c | Excluded_Opp_Types__c | LongTextArea |
| Payment_Allocations_Enabled__c | Payment_Allocations_Enabled__c | Checkbox |
| Rollup_N_Day_Value__c | Rollup_N_Day_Value__c | Number |

### B. Related Documents

- [01-FOUNDATION-API-MODERNIZATION.md](01-FOUNDATION-API-MODERNIZATION.md)
- [04-PERFORMANCE-OPTIMIZATION.md](04-PERFORMANCE-OPTIMIZATION.md)

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: NPSP_nextgen Architecture Team*
