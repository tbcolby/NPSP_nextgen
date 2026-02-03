# UI Modernization Strategy

## Executive Summary

This document outlines the strategy for modernizing NPSP_nextgen's user interface, focusing on the migration from Aura components to Lightning Web Components (LWC) and the long-term plan for Visualforce page replacement. The goal is to improve user experience, performance, and maintainability while ensuring backwards compatibility.

**Core Decision**: Prioritize Aura-to-LWC migration over Visualforce replacement; migrate in tiers based on complexity and business value.

---

## 1. Current State Analysis

### 1.1 UI Technology Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    UI TECHNOLOGY INVENTORY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Lightning Web Components  ████████████████████  125 components │
│  Aura Components           ███████░░░░░░░░░░░░░  35 components  │
│  Visualforce Pages         ████████████████░░░░  79 pages       │
│                                                                  │
│  Total UI Components: 239                                        │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              MODERNIZATION READINESS                       │  │
│  │                                                            │  │
│  │  LWC:  ████████████████████  Modern (52%)                 │  │
│  │  Aura: ███████░░░░░░░░░░░░░  Migration Target (15%)       │  │
│  │  VF:   ████████████████░░░░  Long-term Target (33%)       │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Aura Components Inventory

**By Complexity Tier**:

| Tier | Complexity | Count | Components |
|------|------------|-------|------------|
| 1 | Simple | 10 | svg, modalHeader, modalFooter, notificationRedirecter, HH_ContactCard, autocompleteOption, HH_AutoCompleteOption, progressMarker, pageNotification, CRLP_Tooltip |
| 2 | Medium | 9 | HH_AutoComplete, autocomplete, RD2_EnablementDelegate, RD2_EnablementDelegateSimple, CRLP_FilterGroup, CRLP_SelectField, ERR_RecordLog, HH_AutoCompleteDataProvider, RD2_PauseForm |
| 3 | Complex | 16 | GE_GiftEntry, GE_GiftEntryForm, GE_TemplateBuilder, HH_AddressMgr, HH_Container, HH_Canvas, RD2_EntryForm, BGE_DonationSelector, BGE_DataImportBatchEntry, BGE_ConfigurationWizard, BGE_EntryForm, BGE_BatchGiftEntryTab, BDI_ManageAdvancedMapping, CRLP_Rollup, CRLP_RollupsContainer, REL_RelationshipsContainer |

### 1.3 Visualforce Pages Inventory

**By Category**:

| Category | Count | Examples |
|----------|-------|----------|
| Settings Panels | 35 | STG_Panel*.page |
| Button Actions | 15 | *BTN.page |
| Data Entry | 12 | HH_ManageHH, PMT_PaymentWizard |
| Batch Operations | 8 | BDI_DataImport, ALLO_ManageAllocations |
| Viewers | 5 | REL_RelationshipsViewer |
| Other | 4 | Misc utilities |

### 1.4 Current LWC Architecture

**Component Categories**:

```
┌─────────────────────────────────────────────────────────────────┐
│                   LWC COMPONENT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    PAGE COMPONENTS                       │    │
│  │  geFormRenderer, rd2RecurringDonation, bdiObjectMappings │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  FEATURE COMPONENTS                      │    │
│  │  geTemplateBuilder, rd2EntryForm, geBatchWizard         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  SHARED COMPONENTS                       │    │
│  │  utilInput, utilPrompt, modal, accordionSection         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   SERVICE MODULES                        │    │
│  │  geFormService, rd2Service, utilTemplateBuilder         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Target State Architecture

### 2.1 UI Technology Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                    TARGET UI ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      100% Lightning Web Components               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    APP LAYER                             │    │
│  │  Lightning App Builder │ Experience Builder │ Mobile     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    PAGE COMPONENTS                       │    │
│  │  Full-page experiences with routing                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 FEATURE COMPONENTS                       │    │
│  │  Domain-specific functionality (Gift Entry, RD, etc.)   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    BASE COMPONENTS                       │    │
│  │  NPSP Component Library (inputs, modals, tables, etc.)  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   SERVICE LAYER                          │    │
│  │  Apex Controllers │ Wire Adapters │ State Management    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Design Principles

| Principle | Description |
|-----------|-------------|
| **Composition over Inheritance** | Build complex UIs from simple components |
| **Single Responsibility** | Each component does one thing well |
| **Declarative Templates** | Logic in JS, presentation in HTML |
| **Reactive Data Binding** | Use @wire and reactive properties |
| **SLDS Compliance** | Use Lightning Design System exclusively |
| **Accessibility First** | WCAG 2.1 AA compliance built-in |

---

## 3. Well-Architected Framework Alignment

### 3.1 Easy

| Principle | Implementation |
|-----------|----------------|
| **Intuitive Design** | Consistent patterns across all components |
| **Clear Feedback** | Loading states, error messages, success indicators |
| **Efficient Workflows** | Minimize clicks, smart defaults |
| **Responsive** | Works on all screen sizes |

### 3.2 Trusted

| Principle | Implementation |
|-----------|----------------|
| **Security** | No client-side security logic |
| **Data Integrity** | Server-side validation |
| **Error Handling** | Graceful degradation |

### 3.3 Adaptable

| Principle | Implementation |
|-----------|----------------|
| **Configurable** | Expose public properties for customization |
| **Extensible** | Support for custom components |
| **Themeable** | SLDS design tokens |

---

## 4. Migration Strategy

### 4.1 Migration Decision Framework

```
                    ┌─────────────────────────────┐
                    │  Should we migrate this     │
                    │  component?                 │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ Is it actively used?        │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │ YES                │                    │ NO
              ▼                    │                    ▼
    ┌─────────────────┐           │          ┌─────────────────┐
    │ Is it blocking  │           │          │ Deprecate and   │
    │ other work?     │           │          │ remove          │
    └────────┬────────┘           │          └─────────────────┘
             │                    │
       ┌─────┴─────┐             │
       │YES    │NO │             │
       ▼       ▼   │             │
┌──────────┐ ┌─────▼────┐        │
│ Priority │ │ What's   │        │
│ migrate  │ │ the ROI? │        │
└──────────┘ └────┬─────┘        │
                  │              │
    ┌─────────────┴─────────────┐
    │ High ROI    │ Low ROI     │
    ▼             ▼             │
┌──────────┐ ┌──────────┐       │
│ Schedule │ │ Defer to │       │
│ migration│ │ later    │       │
└──────────┘ └──────────┘       │
```

### 4.2 Tier 1 Migration: Simple Components

**Timeline**: Q2 2027 (Release v2.1)
**Effort**: 20-30 hours total
**Risk**: Low

| Component | Current | LWC Equivalent | Effort | Status |
|-----------|---------|----------------|--------|--------|
| svg | SVG wrapper | c-svg | 2h | ⬜ |
| modalHeader | Modal header | c-modal-header | 2h | ⬜ |
| modalFooter | Modal footer | c-modal-footer | 2h | ⬜ |
| notificationRedirecter | Nav utility | c-notification-redirecter | 2h | ⬜ |
| HH_ContactCard | Display card | c-contact-card | 3h | ⬜ |
| autocompleteOption | List item | c-autocomplete-option | 2h | ⬜ |
| HH_AutoCompleteOption | List item | c-hh-autocomplete-option | 2h | ⬜ |
| progressMarker | Progress UI | c-progress-marker | 2h | ⬜ |
| pageNotification | Toast wrapper | c-page-notification | 2h | ⬜ |
| CRLP_Tooltip | Tooltip | c-tooltip | 2h | ⬜ |

**Migration Pattern for Simple Components**:

```html
<!-- Aura: svg.cmp -->
<aura:component>
    <aura:attribute name="svgPath" type="String"/>
    <aura:attribute name="category" type="String" default="utility"/>
    <aura:attribute name="size" type="String" default="small"/>
    <aura:attribute name="class" type="String"/>

    <lightning:icon iconName="{!v.category + ':' + v.svgPath}"
                    size="{!v.size}"
                    class="{!v.class}"/>
</aura:component>
```

```html
<!-- LWC: svg.html -->
<template>
    <lightning-icon icon-name={iconName}
                    size={size}
                    class={iconClass}>
    </lightning-icon>
</template>
```

```javascript
// LWC: svg.js
import { LightningElement, api } from 'lwc';

export default class Svg extends LightningElement {
    @api svgPath;
    @api category = 'utility';
    @api size = 'small';
    @api iconClass;

    get iconName() {
        return `${this.category}:${this.svgPath}`;
    }
}
```

### 4.3 Tier 2 Migration: Medium Components

**Timeline**: Q3 2027 (Release v2.2)
**Effort**: 40-60 hours total
**Risk**: Medium

| Component | Complexity | Dependencies | Effort | Status |
|-----------|------------|--------------|--------|--------|
| HH_AutoComplete | Medium | Search, selection | 6h | ⬜ |
| autocomplete | Medium | Generic search | 6h | ⬜ |
| CRLP_FilterGroup | Medium | Filter logic | 8h | ⬜ |
| CRLP_SelectField | Medium | Field picker | 6h | ⬜ |
| ERR_RecordLog | Medium | Error display | 5h | ⬜ |
| RD2_PauseForm | Medium | Form + logic | 8h | ⬜ |
| RD2_EnablementDelegate | Medium | Settings UI | 6h | ⬜ |

### 4.4 Tier 3 Migration: Complex Components

**Timeline**: Q4 2027+ (Release v2.3+)
**Effort**: 80-120 hours total
**Risk**: High

These require careful analysis and may warrant redesign rather than direct migration:

| Component | Complexity | Consideration |
|-----------|------------|---------------|
| GE_GiftEntry | Very High | Core gift entry - needs careful planning |
| HH_AddressMgr | High | Google Maps integration |
| HH_Canvas | High | D3.js visualization |
| RD2_EntryForm | High | Elevate integration |
| BGE_* components | High | Batch gift entry workflow |

**Recommendation**: Create new LWC implementations alongside Aura, allowing gradual migration rather than big-bang replacement.

---

## 5. Trade-off Analysis

### 5.1 Migration Approach Options

**Option A: Replace Inline**
| Pros | Cons |
|------|------|
| Single codebase | Breaking changes |
| Clean history | All-or-nothing |
| Simpler testing | Higher risk |

**Option B: Side-by-Side (Recommended)**
| Pros | Cons |
|------|------|
| Gradual rollout | Dual maintenance |
| Easy rollback | Larger codebase |
| User choice | Complexity |

**Option C: Wrapper Pattern**
| Pros | Cons |
|------|------|
| Non-breaking | Performance overhead |
| Incremental | Technical debt |
| Safe | Complexity |

### 5.2 Visualforce Strategy Options

**Option A: Full LWC Replacement**
- High effort, best long-term
- Recommended for high-use pages

**Option B: LWC in VF (iframe)**
- Medium effort, compromise
- Good for gradual transition

**Option C: Maintain VF**
- Low effort, technical debt
- Acceptable for low-use pages

---

## 6. LWC Component Standards

### 6.1 File Structure

```
force-app/main/default/lwc/
├── npspComponentName/
│   ├── npspComponentName.html        # Template
│   ├── npspComponentName.js          # Controller
│   ├── npspComponentName.css         # Styles (optional)
│   ├── npspComponentName.js-meta.xml # Metadata
│   └── __tests__/
│       └── npspComponentName.test.js # Jest tests
```

### 6.2 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component folder | camelCase with prefix | geFormField |
| HTML file | Same as folder | geFormField.html |
| JS file | Same as folder | geFormField.js |
| CSS class | BEM with c- prefix | c-ge-form-field__label |
| Public property | camelCase | fieldLabel |
| Private property | _ prefix | _internalState |
| Handler method | handle prefix | handleInputChange |

### 6.3 Component Template

```javascript
/**
 * @description Brief description of component purpose
 * @author NPSP_nextgen
 */
import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRecords from '@salesforce/apex/Controller.getRecords';

// Custom labels
import labelSave from '@salesforce/label/c.Save';
import labelCancel from '@salesforce/label/c.Cancel';

export default class NpspComponentName extends LightningElement {
    // ================== PUBLIC API ==================
    @api recordId;
    @api objectApiName;

    // ================== PRIVATE REACTIVE ==================
    records = [];
    isLoading = false;
    error;

    // ================== LABELS ==================
    labels = {
        save: labelSave,
        cancel: labelCancel
    };

    // ================== LIFECYCLE ==================
    connectedCallback() {
        // Component mounted
    }

    disconnectedCallback() {
        // Component unmounted - cleanup
    }

    // ================== WIRE ==================
    @wire(getRecords, { recordId: '$recordId' })
    wiredRecords({ error, data }) {
        if (data) {
            this.records = data;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.records = [];
        }
    }

    // ================== GETTERS ==================
    get hasRecords() {
        return this.records && this.records.length > 0;
    }

    // ================== HANDLERS ==================
    handleSave() {
        // Handle save action
    }

    handleCancel() {
        // Handle cancel action
    }

    // ================== PRIVATE METHODS ==================
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant
        }));
    }
}
```

---

## 7. Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Aura components | 35 | 0 | Q4 2027 |
| LWC coverage | 52% | 85%+ | Q4 2027 |
| Lighthouse score | Unknown | >80 | Q2 2027 |
| Component test coverage | Unknown | 80%+ | Q2 2027 |
| a11y violations | Unknown | 0 critical | Q3 2027 |

---

## 8. Appendix

### A. LWC vs Aura Performance Comparison

| Metric | Aura | LWC | Improvement |
|--------|------|-----|-------------|
| Initial load | ~2s | ~0.5s | 4x faster |
| Re-render | ~100ms | ~20ms | 5x faster |
| Memory usage | Higher | Lower | ~40% less |
| Bundle size | Larger | Smaller | ~30% less |

### B. Related Documents

- [08-ACCESSIBILITY-COMPLIANCE.md](08-ACCESSIBILITY-COMPLIANCE.md)
- [05-CODE-QUALITY-STANDARDS.md](05-CODE-QUALITY-STANDARDS.md)

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: NPSP_nextgen Architecture Team*
