# Accessibility Compliance Plan

## Executive Summary

This document outlines the accessibility (a11y) compliance strategy for NPSP_nextgen, ensuring all user interfaces meet WCAG 2.1 AA standards. Accessibility is essential for nonprofit organizations that serve diverse communities and may have legal compliance requirements.

**Core Principle**: Accessibility is not optional - every user interface must be usable by people with disabilities.

---

## 1. Current State Analysis

### 1.1 Accessibility Coverage

```
┌─────────────────────────────────────────────────────────────────┐
│                 ACCESSIBILITY COVERAGE ANALYSIS                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ARIA Attributes                                                 │
│  ├─ Components with ARIA: 33 of 125 LWC (26%)                   │
│  ├─ Total ARIA instances: 85                                    │
│  └─ Coverage: ██████░░░░░░░░░░░░░░ ~30%                         │
│                                                                  │
│  Keyboard Navigation                                             │
│  ├─ Components with handlers: Unknown                           │
│  └─ Coverage: ████░░░░░░░░░░░░░░░░ ~20% (estimated)             │
│                                                                  │
│  Form Accessibility                                              │
│  ├─ Inputs with labels: Partial                                 │
│  └─ Coverage: ████████░░░░░░░░░░░░ ~40% (estimated)             │
│                                                                  │
│  Color Contrast                                                  │
│  ├─ SLDS components: Compliant                                  │
│  ├─ Custom CSS: Not audited                                     │
│  └─ Coverage: ████████████░░░░░░░░ ~60% (estimated)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Components with ARIA (Current)

| Component | ARIA Attributes | Status |
|-----------|-----------------|--------|
| rd2EntryForm | 11 | Good coverage |
| rd2RecurringDonation | 9 | Good coverage |
| utilInput | 5 | Partial |
| gsChecklistItem | 4 | Partial |
| geTemplateBuilder | 4 | Partial |
| modal | 2 | Needs improvement |
| Others (27) | 1-3 each | Varies |

### 1.3 WCAG 2.1 AA Gap Analysis

| WCAG Criterion | Level | Current Status | Gap |
|----------------|-------|----------------|-----|
| 1.1.1 Non-text Content | A | Partial | Images missing alt |
| 1.3.1 Info and Relationships | A | Partial | Form labels |
| 1.4.3 Contrast (Minimum) | AA | Unknown | Needs audit |
| 1.4.11 Non-text Contrast | AA | Unknown | Needs audit |
| 2.1.1 Keyboard | A | Partial | Many gaps |
| 2.1.2 No Keyboard Trap | A | Unknown | Needs audit |
| 2.4.3 Focus Order | A | Partial | Modal issues |
| 2.4.7 Focus Visible | AA | Partial | Custom components |
| 4.1.2 Name, Role, Value | A | Partial | ARIA gaps |

---

## 2. Target State

### 2.1 WCAG 2.1 AA Compliance Target

```
┌─────────────────────────────────────────────────────────────────┐
│                    WCAG 2.1 AA COMPLIANCE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PERCEIVABLE                                                     │
│  □ All images have alt text                                     │
│  □ Color is not sole indicator                                  │
│  □ Contrast ratio ≥ 4.5:1 (text)                                │
│  □ Contrast ratio ≥ 3:1 (UI components)                         │
│  □ Text can be resized to 200%                                  │
│                                                                  │
│  OPERABLE                                                        │
│  □ All functionality via keyboard                               │
│  □ No keyboard traps                                            │
│  □ Skip navigation links                                        │
│  □ Focus order is logical                                       │
│  □ Focus indicator visible                                      │
│                                                                  │
│  UNDERSTANDABLE                                                  │
│  □ Page language specified                                      │
│  □ Consistent navigation                                        │
│  □ Error identification                                         │
│  □ Labels and instructions                                      │
│                                                                  │
│  ROBUST                                                          │
│  □ Valid HTML                                                   │
│  □ Name, role, value for components                             │
│  □ Status messages announced                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Patterns

### 3.1 ARIA Attributes Pattern

```html
<!-- Interactive Button -->
<button
    class="slds-button slds-button_brand"
    aria-label={buttonLabel}
    aria-describedby="button-help"
    aria-disabled={isDisabled}
    onclick={handleClick}>
    <lightning-icon
        icon-name="utility:save"
        aria-hidden="true">
    </lightning-icon>
    {buttonText}
</button>
<span id="button-help" class="slds-assistive-text">
    {helpText}
</span>
```

```html
<!-- Data Table with ARIA -->
<table
    class="slds-table"
    role="grid"
    aria-label="Donation History"
    aria-describedby="table-description">
    <caption id="table-description" class="slds-assistive-text">
        List of donations with date, amount, and status
    </caption>
    <thead>
        <tr>
            <th scope="col" aria-sort={dateSortDirection}>Date</th>
            <th scope="col">Amount</th>
            <th scope="col">Status</th>
        </tr>
    </thead>
    <tbody>
        <template for:each={donations} for:item="donation">
            <tr key={donation.id} aria-rowindex={donation.index}>
                <td role="gridcell">{donation.date}</td>
                <td role="gridcell">{donation.amount}</td>
                <td role="gridcell">{donation.status}</td>
            </tr>
        </template>
    </tbody>
</table>
```

### 3.2 Keyboard Navigation Pattern

```javascript
/**
 * @description Keyboard navigation handler for list components
 */
export default class AccessibleList extends LightningElement {
    @track focusedIndex = 0;
    @api items = [];

    handleKeyDown(event) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.moveFocus(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.moveFocus(-1);
                break;
            case 'Home':
                event.preventDefault();
                this.setFocus(0);
                break;
            case 'End':
                event.preventDefault();
                this.setFocus(this.items.length - 1);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.selectItem(this.focusedIndex);
                break;
            case 'Escape':
                this.handleEscape();
                break;
        }
    }

    moveFocus(delta) {
        const newIndex = this.focusedIndex + delta;
        if (newIndex >= 0 && newIndex < this.items.length) {
            this.setFocus(newIndex);
        }
    }

    setFocus(index) {
        this.focusedIndex = index;
        const item = this.template.querySelector(
            `[data-index="${index}"]`
        );
        if (item) {
            item.focus();
        }
    }
}
```

### 3.3 Modal Focus Trap Pattern

```javascript
/**
 * @description Modal with focus trapping for accessibility
 */
export default class AccessibleModal extends LightningElement {
    @api isOpen = false;

    _previousFocus = null;
    _firstFocusable = null;
    _lastFocusable = null;

    connectedCallback() {
        this.template.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    renderedCallback() {
        if (this.isOpen) {
            this.setupFocusTrap();
        }
    }

    setupFocusTrap() {
        // Store previous focus to restore later
        this._previousFocus = document.activeElement;

        // Find all focusable elements
        const focusableElements = this.template.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            this._firstFocusable = focusableElements[0];
            this._lastFocusable = focusableElements[focusableElements.length - 1];

            // Focus first element
            this._firstFocusable.focus();
        }
    }

    handleKeyDown(event) {
        if (!this.isOpen) return;

        if (event.key === 'Escape') {
            this.closeModal();
            return;
        }

        if (event.key === 'Tab') {
            // Trap focus within modal
            if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === this._firstFocusable) {
                    event.preventDefault();
                    this._lastFocusable.focus();
                }
            } else {
                // Tab
                if (document.activeElement === this._lastFocusable) {
                    event.preventDefault();
                    this._firstFocusable.focus();
                }
            }
        }
    }

    closeModal() {
        this.isOpen = false;

        // Restore focus to previous element
        if (this._previousFocus) {
            this._previousFocus.focus();
        }

        this.dispatchEvent(new CustomEvent('close'));
    }
}
```

### 3.4 Form Accessibility Pattern

```html
<!-- Accessible Form Field -->
<div class="slds-form-element">
    <label
        class="slds-form-element__label"
        for={inputId}>
        <template if:true={required}>
            <abbr class="slds-required" title="required">*</abbr>
        </template>
        {label}
    </label>

    <div class="slds-form-element__control">
        <input
            type="text"
            id={inputId}
            class={inputClass}
            value={value}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={helpTextId}
            onchange={handleChange}
            onblur={handleBlur}>
    </div>

    <template if:true={helpText}>
        <div id={helpTextId} class="slds-form-element__help">
            {helpText}
        </div>
    </template>

    <template if:true={hasError}>
        <div
            class="slds-form-element__help slds-text-color_error"
            role="alert"
            aria-live="polite">
            {errorMessage}
        </div>
    </template>
</div>
```

### 3.5 Live Region Pattern

```html
<!-- Status announcements for screen readers -->
<div
    class="slds-assistive-text"
    role="status"
    aria-live="polite"
    aria-atomic="true">
    {statusMessage}
</div>

<!-- Error announcements (more urgent) -->
<div
    class="slds-assistive-text"
    role="alert"
    aria-live="assertive">
    {errorMessage}
</div>
```

```javascript
// Announcing status changes
announceStatus(message) {
    this.statusMessage = message;
    // Clear after screen reader announces
    setTimeout(() => {
        this.statusMessage = '';
    }, 1000);
}

announceError(message) {
    this.errorMessage = message;
}
```

---

## 4. Testing Strategy

### 4.1 Automated Testing with SA11Y

```javascript
// Jest test with SA11Y
import { createElement } from 'lwc';
import { axe, toHaveNoViolations } from '@sa11y/jest';
import GeFormRenderer from 'c/geFormRenderer';

expect.extend(toHaveNoViolations);

describe('c-ge-form-renderer accessibility', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('should have no accessibility violations', async () => {
        const element = createElement('c-ge-form-renderer', {
            is: GeFormRenderer
        });
        element.templateId = 'testTemplate';
        document.body.appendChild(element);

        // Wait for component to render
        await Promise.resolve();

        // Run accessibility audit
        const results = await axe(element);
        expect(results).toHaveNoViolations();
    });

    it('should have proper focus management', async () => {
        const element = createElement('c-ge-form-renderer', {
            is: GeFormRenderer
        });
        document.body.appendChild(element);

        await Promise.resolve();

        // Test focus order
        const focusableElements = element.shadowRoot.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        expect(focusableElements.length).toBeGreaterThan(0);

        // First focusable should be reachable
        focusableElements[0].focus();
        expect(document.activeElement).toBe(focusableElements[0]);
    });
});
```

### 4.2 Manual Testing Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│              MANUAL ACCESSIBILITY TESTING CHECKLIST              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  KEYBOARD TESTING                                                │
│  □ Can reach all interactive elements with Tab                  │
│  □ Can activate buttons/links with Enter/Space                  │
│  □ Can navigate lists with arrow keys                           │
│  □ Can close modals with Escape                                 │
│  □ Focus visible at all times                                   │
│  □ No keyboard traps                                            │
│                                                                  │
│  SCREEN READER TESTING (NVDA/VoiceOver)                         │
│  □ All content is announced                                     │
│  □ Form labels are associated                                   │
│  □ Error messages are announced                                 │
│  □ Status changes are announced                                 │
│  □ Tables have proper structure                                 │
│  □ Headings create logical outline                              │
│                                                                  │
│  VISUAL TESTING                                                  │
│  □ Text readable at 200% zoom                                   │
│  □ No horizontal scrolling at 320px width                       │
│  □ Color contrast passes (use browser tools)                    │
│  □ Focus indicator visible                                      │
│  □ No flashing content                                          │
│                                                                  │
│  COGNITIVE TESTING                                               │
│  □ Error messages are clear                                     │
│  □ Instructions are provided                                    │
│  □ Consistent navigation                                        │
│  □ Timeouts can be extended                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Plan

### Phase 1: Foundation (Sprint 1-2)

| Task | Description | Effort |
|------|-------------|--------|
| Accessibility audit | Run automated scan on all components | 8h |
| Document violations | Categorize by severity | 4h |
| Create utility components | Accessible base components | 12h |
| Add SA11Y to CI/CD | Automated a11y testing | 4h |

### Phase 2: Critical Fixes (Sprint 3-4)

| Task | Components | Effort |
|------|------------|--------|
| Add ARIA to forms | utilInput, geFormField | 8h |
| Fix keyboard navigation | modal, dropdown | 12h |
| Add focus management | All modals | 8h |
| Add live regions | Error/status messages | 6h |

### Phase 3: Component Updates (Sprint 5-6)

| Task | Components | Effort |
|------|------------|--------|
| Update data tables | donationHistoryTable, relationshipsTreeGrid | 10h |
| Fix form validation | All form components | 8h |
| Add skip navigation | Page-level components | 4h |
| Improve focus indicators | Custom CSS | 6h |

### Phase 4: Documentation (Sprint 7)

| Task | Description | Effort |
|------|-------------|--------|
| Accessibility guide | For contributors | 8h |
| Component patterns | Documented examples | 6h |
| Testing guide | Manual testing procedures | 4h |

---

## 6. Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| SA11Y violations | Unknown | 0 critical | Q2 2027 |
| ARIA coverage | ~30% | 100% | Q3 2027 |
| Keyboard navigable | ~20% | 100% | Q2 2027 |
| Screen reader tested | 0% | 100% | Q3 2027 |
| WCAG 2.1 AA compliance | Partial | Full | Q4 2027 |

---

## 7. Resources

### Screen Reader Testing

| Platform | Screen Reader | Browser |
|----------|---------------|---------|
| Windows | NVDA | Firefox |
| Windows | JAWS | Chrome |
| macOS | VoiceOver | Safari |
| iOS | VoiceOver | Safari |
| Android | TalkBack | Chrome |

### Tools

| Tool | Purpose |
|------|---------|
| axe DevTools | Browser extension for auditing |
| WAVE | Browser extension for visualization |
| Colour Contrast Analyser | Desktop app for contrast |
| SA11Y | Jest integration for LWC |

---

*Document Version: 1.0*
*Last Updated: 2026-02-03*
*Author: NPSP_nextgen Architecture Team*
