# Backwards Compatibility Policy

**Scope**: Formal policy governing what constitutes a breaking change and how to manage it
**Applies To**: All agents, all workstreams, all phases

---

## Policy Statement

NPSP_nextgen is a community fork of the Salesforce Nonprofit Success Pack. Because NPSP is widely deployed across thousands of nonprofit organizations — many with custom triggers, flows, validation rules, and integrations built on top of it — **backwards compatibility is a first-class requirement**, not an afterthought.

Every change must be evaluated against this policy before merge.

---

## Public API Definition

### Tier 1: Hard Contract (NEVER break without deprecation cycle)

| Surface | Examples | Rule |
|---------|----------|------|
| `global` Apex classes and methods | Any class/method with `global` access modifier | Cannot remove or change signature |
| Custom Object API names | `npe03__Recurring_Donation__c`, `DataImport__c` | Cannot rename or remove |
| Custom Field API names | `npo02__TotalOppAmount__c` | Cannot rename or remove |
| Custom Settings API names | `Allocations_Settings__c` | Cannot remove until CMT migration complete + 2 releases |
| Custom Object API names (TDTM) | `Trigger_Handler__c` (Custom Object, not a CMT) | Cannot rename or remove |
| Custom Metadata Type API names | `Rollup__mdt`, `Filter_Group__mdt`, `Filter_Rule__mdt`, `Data_Import_Object_Mapping__mdt` | Cannot rename or remove |
| Platform Event API names | `DeploymentEvent__e` | Cannot rename or remove |
| TDTM handler registration | `Trigger_Handler__c` default records | Cannot remove handlers without deprecation |

### Tier 2: Soft Contract (Avoid breaking; document if unavoidable)

| Surface | Examples | Rule |
|---------|----------|------|
| `public` `@AuraEnabled` methods | Controller methods called by LWC/Aura | Maintain signatures; add overloads for new params |
| Aura application events | `HH_HouseholdSavedEvent`, `RD2_EnhancementEnabledEvent` | Keep firing even after LWC migration |
| `public` Apex class signatures | Non-global but documented classes | Maintain where feasible |
| Sharing behavior | `without sharing` → `inherited sharing` | Must not reduce data visibility |
| Batch job schedules | Default CRON expressions | Maintain or document change |

### Tier 3: Internal (Free to change)

| Surface | Reason |
|---------|--------|
| `private` / `protected` methods | Internal implementation |
| Test classes (`*_TEST`) | Not consumed externally |
| Internal utility classes (non-global) | Implementation detail |
| CSS class names in LWC | Styling detail |
| Jest/Robot test implementation | Test infrastructure |
| Internal constants and enums | Implementation detail |

---

## Deprecation Process

### Standard Deprecation (Tier 1 and Tier 2)

```
Release N:   Deprecation announced
             - @deprecated annotation added to Apex
             - Console warning added to LWC/Aura
             - Release notes document the deprecation
             - Migration guide published

Release N+1: Deprecation reminder
             - Warning log emitted on usage
             - Documentation updated to recommend replacement

Release N+2: Removal eligible
             - Supervisor + human architect approval required
             - Removal executed
             - Release notes document the removal
```

**Minimum deprecation window: 2 releases (approximately 8-12 weeks)**

### Emergency Deprecation (Security vulnerabilities only)

```
Release N:   Immediate removal with security advisory
             - Requires: supervisor + security_agent + human approval
             - CVE or equivalent documentation
             - Hotfix released to supported versions
```

---

## Breaking Change Evaluation Checklist

Every PR must pass this checklist before merge:

```markdown
### Backwards Compatibility Checklist

- [ ] No `global` method signatures changed or removed
- [ ] No Custom Object/Field API names changed or removed
- [ ] No Custom Setting fields removed (unless CMT migration complete + 2 releases)
- [ ] No `@AuraEnabled` method signatures changed (new params have defaults)
- [ ] No Aura events removed (LWC components still fire bridge events)
- [ ] No sharing behavior changes that reduce data visibility
- [ ] No TDTM handler removed from default set
- [ ] All existing test classes still compile and pass
- [ ] Platform Event schema only has additive changes
- [ ] Custom Metadata Type schema only has additive changes
```

---

## Sharing Mode Change Policy

The migration from `without sharing` to `inherited sharing` is the highest-risk backwards compatibility concern in this project.

### Rules

1. **System-context operations** (rollups, batch processing, data import) MUST use `without sharing` or explicit `with sharing` — NOT `inherited sharing`
2. **User-context operations** (UI controllers, user-facing services) SHOULD use `inherited sharing`
3. **Every sharing mode change** requires:
   - Before/after query result comparison test (see [BC Tests](testing/05-backwards-compatibility-tests.md))
   - Documentation of which user profiles are affected
   - Review by `security_agent`
4. **If a sharing change reduces data visibility**: it is a breaking change and requires deprecation cycle

### Classification Reference

| Class Pattern | Current Mode | Target Mode | Risk |
|--------------|-------------|-------------|------|
| `*_BATCH`, `*_Batch_SVC` | `without sharing` | Keep `without sharing` | None |
| `*_CTRL`, `*Controller` | `without sharing` | `inherited sharing` | HIGH — test thoroughly |
| `*_SVC` (system services) | `without sharing` | Keep `without sharing` | None |
| `*_SVC` (user services) | `without sharing` | `inherited sharing` | MEDIUM — evaluate per class |
| `UTIL_*` | Varies | `inherited sharing` | LOW — typically stateless |

---

## Custom Settings Migration Compatibility

### Dual-Source Period

During the Custom Settings → Custom Metadata Types migration:

1. **Both sources must work**: Application reads CMT first, falls back to CS
2. **CS fields cannot be removed** until:
   - CMT equivalent deployed for ≥ 2 releases
   - Migration utility available and documented
   - Telemetry shows < 5% of active orgs still using CS
3. **`$Setup` references in formulas**: Must be rewritten to use Apex-backed alternatives before CS removal
4. **Hierarchy CS behavior**: CMT replacement must support equivalent org/profile/user override patterns

### Migration Timeline per Setting

```
Sprint 1:  CMT equivalent created, dual-source facade deployed
Sprint 2:  Migration utility available, documentation published
Sprint 3:  Deprecation notice on CS fields
Sprint 4+: CS removal eligible (minimum 2 releases after CMT deployment)
```

---

## Aura → LWC Migration Compatibility

### Event Bridge Requirement

When replacing an Aura component with LWC:

1. **Fire equivalent Aura events** from the LWC wrapper for ≥ 2 releases
2. **Maintain same `@AuraEnabled` controller methods** — do not rename or remove
3. **Preserve URL parameters and navigation** — same page references must work
4. **Document any behavioral differences** in release notes

### Component Replacement Pattern

```
Release N:   LWC component deployed alongside Aura component
             Aura component marked as deprecated
             Feature flag controls which is active (default: Aura)

Release N+1: Default switches to LWC
             Aura component still available via feature flag

Release N+2: Aura component removal eligible
```

---

## Enforcement

### Automated

- **CI gate**: All existing test classes must pass (no modifications allowed to make them pass)
- **PMD rule**: Flag removal of `global` methods
- **PR template**: BC checklist required for all PRs

### Manual

- **Code review**: `security_agent` reviews all sharing mode changes
- **Supervisor review**: Any Tier 1 contract change requires supervisor sign-off
- **Human approval**: Any breaking change waiver requires human architect approval

### Waiver Process

1. Agent documents why the break is unavoidable (with alternatives considered)
2. Supervisor reviews and confirms no alternative exists
3. Human architect approves with explicit written approval
4. Migration guide written and linked in PR
5. Deprecation notice added to release notes
6. Existing test updated to reflect new expected behavior
7. Waiver logged in `planning/bc-waivers.log` (create this file from the template when the first waiver is issued)

---

## Namespace Migration (npsp__ to npsp2__)

### Context

NPSP_nextgen ships as a namespaced 2GP unlocked package with namespace `npsp2` (exact name TBD). Orgs migrating from the original managed NPSP (`npsp__` namespace) will need data and metadata migration tooling.

### Migration Scope

All subscriber org artifacts referencing the `npsp__` prefix must be mapped to `npsp2__` equivalents:

| Artifact Type | Example (Old) | Example (New) | Migration Method |
|--------------|--------------|--------------|-----------------|
| Custom Objects | `npsp__General_Accounting_Unit__c` | `npsp2__General_Accounting_Unit__c` | Data migration utility |
| Custom Fields | `npsp__Amount__c` | `npsp2__Amount__c` | Data migration utility |
| Custom Settings | `npsp__Contacts_And_Orgs_Settings__c` | `npsp2__` CMT equivalent | Settings migration utility |
| Custom Metadata | `npsp__Rollup__mdt` | `npsp2__Rollup__mdt` | Metadata API deployment |
| Formula Fields | References to `npsp__` fields | Must be rewritten | Pre-migration audit report |
| Flows / Process Builder | References to `npsp__` objects/fields | Must be rebuilt | Pre-migration audit report |
| Validation Rules | References to `npsp__` fields | Must be rewritten | Pre-migration audit report |
| Apex Triggers (subscriber) | References to `npsp__` objects | Must be updated | Pre-migration audit report |
| Reports / Dashboards | References to `npsp__` fields | Must be updated | Pre-migration audit report |

### Migration Tooling

1. **`NPSP2_NamespaceMigrationUtility`** — Apex utility that:
   - Reads all `npsp__` object/field data
   - Maps to corresponding `npsp2__` equivalents via `Namespace_Field_Mapping__mdt`
   - Copies data in bulk-safe batches
   - Generates a post-migration validation report
2. **Pre-migration audit** — Scans the subscriber org for:
   - Flows referencing `npsp__` objects/fields
   - Formula fields with `npsp__` references
   - Validation rules with `npsp__` references
   - Custom Apex triggers on `npsp__` objects
   - Reports/dashboards using `npsp__` fields
3. **Post-migration verification** — Validates:
   - Record counts match between old and new objects
   - Lookup relationships correctly remapped
   - Rollup summary fields recalculated
   - No orphaned records

### Migration Policy

- The migration utility MUST be available before the first GA release of NPSP_nextgen
- Documentation MUST include step-by-step admin guide
- A "dual-namespace" compatibility period is NOT supported (orgs run either `npsp__` or `npsp2__`, not both simultaneously)
- The migration is one-way (npsp__ to npsp2__); rollback requires restoring from backup

---

## Versioning Implications

NPSP_nextgen uses 2GP package versioning. Each package version is immutable once promoted.

| Change Type | Version Bump | Example | 2GP Behavior |
|------------|-------------|---------|-------------|
| Additive (new class, field, event) | Minor | 4.1.0 → 4.2.0 | New package version, backwards compatible |
| Behavioral (performance, sharing fix) | Patch | 4.1.0 → 4.1.1 | New package version, backwards compatible |
| Deprecation announced | Minor | 4.1.0 → 4.2.0 | New package version with `@deprecated` annotations |
| Breaking removal (post deprecation) | Major | 4.x → 5.0.0 | New package version, may require uninstall/reinstall |

### 2GP Package Versioning Notes

- Each `sf package version create` produces an immutable version
- Beta versions (not promoted) can be installed for testing
- Promoted versions are considered released and cannot be deleted
- Subscribers can install specific versions via installation URL
- Package upgrade paths are validated by Salesforce automatically

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
