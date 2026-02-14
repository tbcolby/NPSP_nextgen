# WS-07: Configuration Architecture — Assessment

**Review Date**: 2026-02-12
**Implementation Plan**: [07-configuration.md](../implementation/07-configuration.md)
**Planning Doc**: [07-CONFIGURATION-ARCHITECTURE.md](../07-CONFIGURATION-ARCHITECTURE.md)
**Overall Rating**: **Strong-**

---

## Well-Architected Alignment

| Pillar | Score | Notes |
|--------|-------|-------|
| Trusted | Adequate | `Metadata.Operations.enqueueDeployment()` needs permission checks |
| Easy | Strong | One-click migration UI; validation and rollback |
| Adaptable | Strong | CMT is metadata-deployable; `NPSP_ConfigurationService` extensible |
| Intentional | Strong | Dual-source backwards compatibility; clear consolidation rationale |
| Automated | Adequate | CMT deployment validation in CI; no post-deploy CMT record verification |

---

## Accuracy Findings

### Minor: Agent Roster Gap

`lwc_agent` performs Sprint 5-6 work (admin migration UI component) but is not listed as a Supporting Agent. Should be added.

### Verified Correct
- 14 Custom Settings count correct (11 Hierarchy + 3 List)
- `Metadata.DeployContainer` and `Metadata.Operations.enqueueDeployment` are valid Salesforce APIs
- `NPSP_ConfigurationService` singleton pattern is valid
- `inherited sharing` on service class is correct
- Sprint numbering internally consistent
- Dual-source pattern (CMT-first, CS-fallback) is architecturally sound

---

## Backwards Compatibility Risks

### Risk 1: Hierarchy Settings Lose Hierarchy — HIGH

11 of 14 Custom Settings are Hierarchy type, resolving values via User > Profile > Org hierarchy. CMT has no such hierarchy. If an org has per-user or per-profile overrides, these will be **silently lost** when CMT becomes primary.

The plan does not address hierarchy resolution replication.

**Mitigation**: Design a hierarchy resolution layer in `NPSP_ConfigurationService` that replicates User > Profile > Org behavior, OR explicitly document that per-user/per-profile overrides will be lost and require admin reconfiguration.

### Risk 2: `$Setup` References in Automation — CRITICAL

The plan does NOT address external automation that references Custom Settings:
- **Process Builders** with Custom Setting criteria
- **Flows** that read Custom Setting records via Get Records
- **Validation Rules** referencing `$Setup.SettingName__c.FieldName__c`
- **Formula Fields** referencing `$Setup` merge fields
- **Workflow Rules** with Custom Setting criteria

These will continue reading from Custom Settings even after application code migrates to CMT. If migration clears Custom Settings, automations break. If values are preserved, they become stale.

**Mitigation**: Audit all `$Setup` references across the entire codebase. Keep Custom Settings populated (not cleared) with synchronization until all automation references are updated.

### Risk 3: Direct Custom Setting Access Outside Facade — MEDIUM

Sprint 7-8 acknowledges this: "Search for `*.getInstance()` calls outside of facade." Existing orgs or custom code directly querying Custom Settings will still work via the fallback path, but values may diverge from what the application reads (split brain).

### Risk 4: Migration Utility Safety — MEDIUM

`NPSP_SettingsMigrationUtility` uses asynchronous `Metadata.Operations.enqueueDeployment()`:
- No validation step comparing source (CS) to deployed (CMT) values
- No reverse migration (CMT to CS) for emergency rollback
- Requires "Modify All Data" permission — no explicit check before execution

### Risk 5: Address Settings Consolidation — MEDIUM

Merging `Address_Verification_Settings__c` and `Addr_Verification_Settings__c` into one CMT. Code referencing either original Custom Setting by API name will break if the originals are removed.

---

## Well-Architected Detail

### Trusted — Migration Permissions

`Metadata.Operations.enqueueDeployment()` requires "Modify All Data" permission. No permission check exists before the migration utility executes. If a non-admin accesses the admin UI component, the deployment will fail with an unhelpful error.

**Recommendation**: Add explicit permission checks before execution; ensure the admin UI has permission-based visibility.

### Easy — Migration UI Feedback

The migration UI uses asynchronous `Metadata.Operations.enqueueDeployment()`. No feedback mechanism shows the admin that migration is in progress, succeeded, or failed. The `DeployCallback` is mentioned but not specified.

**Recommendation**: Design the UI to show real-time status (poll for deployment status, show progress, surface errors with actionable messages).

### Adaptable — Feature Flags

The `isFeatureEnabled(String featureName)` method is mentioned but not specified. What backs it? This is a critical extensibility mechanism.

**Recommendation**: Specify the backing store — recommend `NPSP_Feature_Flag__mdt` with fields: `Feature_Name__c`, `Is_Enabled__c`, `Enabled_For__c` (Global/Profile/User).

### Automated — Post-Deploy Verification

No automated validation of CMT records after deployment (verify all expected records exist with correct values).

**Recommendation**: Add a CI validation step that queries CMT records after deployment and compares against expected values.

---

## Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| **P0** | Audit all `$Setup` references | Flows, PBs, VRs, Formula Fields across entire codebase |
| **P1** | Design hierarchy resolution for CMT | Replicate User > Profile > Org behavior, or document the loss |
| **P1** | Specify feature flag backing store | `NPSP_Feature_Flag__mdt` design |
| **P1** | Keep Custom Settings populated during transition | With synchronization until automation refs updated |
| **P2** | Add pre-migration validation | Compare CS source values to deployed CMT values |
| **P2** | Build reverse migration utility | CMT to CS for emergency rollback |
| **P2** | Add permission checks to migration utility | Explicit check before `Metadata.Operations.enqueueDeployment()` |
| **P2** | Design migration UI feedback | Real-time status, progress, and error surfacing |
| **P2** | Add `lwc_agent` to supporting agents | Currently unlisted despite Sprint 5-6 work |

---

*Assessment Version: 1.0*
*Last Updated: 2026-02-12*
