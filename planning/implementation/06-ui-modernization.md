# WS-06: UI Modernization Strategy — Implementation Subplan

**Phase**: 3 (Experience & Integration)
**Primary Agent**: `lwc_agent`
**Supporting Agents**: `apex_agent`, `testing_agent`
**Planning Doc**: [06-UI-MODERNIZATION-STRATEGY.md](../06-UI-MODERNIZATION-STRATEGY.md)
**Depends on**: WS-02 (Security), WS-05 (Code Quality), WS-08 (Accessibility)

---

## Objective

Migrate all 35 Aura components to Lightning Web Components in three tiers (simple → medium → complex), establish an NPSP component library, and create migration patterns for Visualforce pages.

---

## Sprint Breakdown

### Sprint 1-2: Component Library Foundation & Tier 1 Prep

**Agent**: `lwc_agent`
**Tasks**:
1. Create NPSP base component library:
   - `c-npsp-modal` — Standardized modal (replaces modalHeader + modalFooter Aura)
   - `c-npsp-toast` — Standardized notifications (replaces pageNotification)
   - `c-npsp-icon` — SVG icon wrapper (replaces svg Aura)
   - `c-npsp-data-table` — Reusable data table with SLDS
   - `c-npsp-form-field` — Standard form field wrapper
2. Establish component standards:
   - File structure conventions
   - Event naming conventions
   - Public API (@api) documentation requirements
   - CSS class naming (BEM with `c-` prefix)
3. Analyze Tier 1 Aura components for migration:
   - Map each component's public API
   - Identify parent component dependencies
   - Document all Aura events being used

**Agent**: `testing_agent`
**Tasks**:
1. Create Jest tests for all base library components
2. Include SA11Y accessibility tests
3. Establish snapshot testing pattern

**Deliverables**:
- 5 base library components with tests
- Component standards documentation
- Tier 1 migration analysis

### Sprint 3-4: Tier 1 Migration (10 Simple Components)

**Agent**: `lwc_agent`
**Tasks**:
1. Migrate Tier 1 components (side-by-side, not replacing):

| Aura Component | New LWC | Effort |
|----------------|---------|--------|
| `svg` | `c-npsp-icon` | 2h |
| `modalHeader` | `c-npsp-modal` (part of) | 2h |
| `modalFooter` | `c-npsp-modal` (part of) | 2h |
| `notificationRedirecter` | `c-npsp-notification-redirecter` | 2h |
| `HH_ContactCard` | `c-contact-card` | 3h |
| `autocompleteOption` | `c-autocomplete-option` | 2h |
| `HH_AutoCompleteOption` | `c-hh-autocomplete-option` | 2h |
| `progressMarker` | `c-progress-marker` | 2h |
| `pageNotification` | `c-npsp-toast` (part of) | 2h |
| `CRLP_Tooltip` | `c-npsp-tooltip` | 2h |

2. For each migration:
   - Create LWC with equivalent functionality
   - Match public API (@api) to Aura attributes
   - Replace Aura events with LWC CustomEvents
   - Update parent components to reference new LWC
3. Deprecate Aura components (add deprecation comment, keep for rollback)

**Agent**: `testing_agent`
**Tasks**:
1. Create Jest tests for each new LWC component
2. Ensure 80%+ coverage on each
3. Include interaction tests + accessibility tests

**Deliverables**:
- 10 Tier 1 LWC components
- 10 Jest test suites
- Parent references updated
- Aura originals deprecated (not removed)

### Sprint 5-6: Tier 2 Migration (9 Medium Components)

**Agent**: `lwc_agent`
**Tasks**:
1. Migrate Tier 2 components:

| Aura Component | Complexity | Key Challenges |
|----------------|------------|----------------|
| `HH_AutoComplete` | Medium | Search + selection logic |
| `autocomplete` | Medium | Generic search patterns |
| `CRLP_FilterGroup` | Medium | Filter creation UI |
| `CRLP_SelectField` | Medium | Dynamic field picker |
| `ERR_RecordLog` | Medium | Error display + pagination |
| `RD2_PauseForm` | Medium | Form + schedule logic |
| `RD2_EnablementDelegate` | Medium | Settings management UI |
| `RD2_EnablementDelegateSimple` | Medium | Simplified settings |
| `HH_AutoCompleteDataProvider` | Medium | Data provider pattern |

2. Key patterns for Tier 2:
   - Autocomplete → LWC with `@wire` for search + debounce
   - Filter components → LWC with reactive state management
   - Settings components → LWC with `@wire(getRecord)` pattern

**Agent**: `apex_agent`
**Tasks**:
1. Create/update Apex controllers for new LWC wire adapters where needed
2. Ensure controllers use `@AuraEnabled(cacheable=true)` for read operations
3. Add `inherited sharing` to all new controllers

**Agent**: `testing_agent`
**Tasks**:
1. Jest tests for all Tier 2 components
2. Wire adapter mock tests
3. Integration tests for Apex controller interactions

**Deliverables**:
- 9 Tier 2 LWC components with tests
- Updated Apex controllers
- Aura originals deprecated

### Sprint 7-8: Tier 3 Planning & VF Assessment

**Agent**: `lwc_agent`
**Tasks**:
1. Analyze Tier 3 complex components for migration feasibility:

| Component | Lines | Decision |
|-----------|-------|----------|
| GE_GiftEntry / GE_GiftEntryForm | 1000+ | Redesign (too complex for direct port) |
| HH_Container / HH_Canvas | 900+ | Redesign (D3.js dependency) |
| BGE_DataImportBatchEntry | 789 | Phased migration |
| BGE_ConfigurationWizard | 562 | Phased migration |
| CRLP_Rollup / CRLP_RollupsContainer | 2100+ | Redesign |
| RD2_EntryForm | 1093 | Phased migration (Elevate dep removed per NPPatch decision; simplifies migration) |

2. Create detailed migration plans for each Tier 3 component:
   - Architecture of new LWC equivalent
   - Subcomponent decomposition
   - State management approach
   - Apex API changes needed
3. Begin Tier 3 prototyping for simplest candidate

**Agent**: `lwc_agent` + `apex_agent`
**Tasks**:
1. Assess 79 Visualforce pages:
   - Categorize: High use / Low use / Candidate for removal
   - Identify VF pages that can be replaced with LWC App Page
   - Identify VF pages that need "LWC in VF" iframe approach
   - Create VF migration priority list for future phase

**Deliverables**:
- Tier 3 migration architecture documents (per component)
- VF assessment and priority list
- 1 Tier 3 prototype component
- Roadmap for Phase 4 (if needed)

---

## Agent Coordination Protocol

```
Tier 1/2 Migration (per component):
  lwc_agent: Creates new LWC component
  lwc_agent → apex_agent: "Need controller method for X" (if needed)
  apex_agent: Creates/updates controller
  lwc_agent → testing_agent: "Component ready for testing"
  testing_agent: Creates Jest tests + a11y tests
  lwc_agent: Updates parent references
  security_agent: Reviews for XSS / data handling

Tier 3 Architecture:
  lwc_agent: Proposes decomposed architecture
  lwc_agent → apex_agent: "Proposed API surface for new components"
  apex_agent: Reviews and adjusts controller design
  lwc_agent → testing_agent: "Testing strategy for complex component"
  supervisor: Reviews architecture before implementation begins
```

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| Tests | Each new LWC has 80%+ Jest coverage | `testing_agent` |
| A11y | Each new LWC passes SA11Y | `testing_agent` |
| SLDS | No custom CSS where SLDS utility works | `lwc_agent` review |
| Security | No innerHTML, no client-side storage of sensitive data | `security_agent` |
| Backward compat | Old Aura components still functional during transition | `testing_agent` |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| Aura components | 35 | 25 | 16 | 16 (Tier 3 remaining) |
| LWC components | 125 | 140 | 149+ | 150+ |
| Base library components | 0 | 5 | 5 | 5+ |
| LWC Jest coverage | Unknown | +10 tests | +19 tests | +20 tests |
| Tier 3 plans complete | 0 | 0 | 0 | 6 documents |

---

*Subplan Version: 1.0*
*Last Updated: 2026-02-09*
