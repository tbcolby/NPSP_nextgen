# WS-08: Accessibility Compliance — Implementation Subplan

**Phase**: 3 (Experience & Integration)
**Primary Agent**: `lwc_agent`
**Supporting Agents**: `testing_agent`, `documentation_agent`
**Planning Doc**: [08-ACCESSIBILITY-COMPLIANCE.md](../08-ACCESSIBILITY-COMPLIANCE.md)
**Depends on**: WS-05 (Code Quality), WS-10 (Testing)

---

## Objective

Achieve WCAG 2.1 AA compliance across all 125+ LWC components: ARIA labels/roles, keyboard navigation, screen reader support, focus management, and color contrast. Integrate SA11Y automated testing into CI.

---

## Sprint Breakdown

### Sprint 1-2: Accessibility Audit

**Agent**: `lwc_agent`
**Tasks**:
1. Run automated SA11Y audit across all LWC components:
   ```bash
   npm run test:unit:a11y
   ```
2. Manual audit of high-complexity components:
   - `geFormRenderer` — Multi-section form with dynamic fields
   - `rd2EntryForm` — Recurring Donation form with schedule
   - `geTemplateBuilder` — Drag-and-drop template builder
   - `bdiObjectMappingModal` — Complex mapping modal
3. Categorize violations by WCAG criteria:
   - **1.1**: Text alternatives (images, icons)
   - **1.3**: Adaptable (semantic HTML, ARIA landmarks)
   - **1.4**: Distinguishable (color contrast, text resize)
   - **2.1**: Keyboard accessible (all functionality via keyboard)
   - **2.4**: Navigable (focus order, skip navigation)
   - **3.3**: Input assistance (error identification, labels)
   - **4.1**: Compatible (valid markup, ARIA usage)
4. Generate severity-ranked remediation backlog

**Deliverables**:
- `docs/accessibility-audit-report.md` — Full WCAG 2.1 AA audit
- Ranked remediation backlog (P0/P1/P2)
- Baseline violation count

### Sprint 3-4: ARIA & Semantic HTML Remediation

**Agent**: `lwc_agent`
**Tasks**:
1. Fix P0 violations (critical, affects usability):
   - Add `aria-label` to all interactive elements without visible text
   - Add `aria-describedby` to form fields with help text
   - Add `role` attributes to custom widgets:
     - Autocomplete → `role="combobox"` + `role="listbox"`
     - Modals → `role="dialog"` + `aria-modal="true"`
     - Tabs → `role="tablist"` + `role="tab"` + `role="tabpanel"`
   - Fix landmark structure (`<main>`, `<nav>`, `<header>`)
2. Fix P1 violations (important, affects compliance):
   - Add `aria-live="polite"` to dynamic content regions
   - Add `aria-expanded` to expandable sections
   - Add `aria-selected` to selectable items
   - Ensure all `<img>` and icons have alt text or `aria-hidden="true"`
3. Use `utilScreenReaderAnnouncer` for dynamic content updates

**Agent**: `testing_agent`
**Tasks**:
1. Add SA11Y assertions to all existing Jest tests
2. Create accessibility-specific test patterns:
   ```javascript
   it('should have accessible form fields', async () => {
       const element = createComponent();
       await flushPromises();

       const inputs = element.shadowRoot.querySelectorAll('input');
       inputs.forEach(input => {
           expect(input.getAttribute('aria-label') ||
                  input.labels.length > 0).toBeTruthy();
       });
   });
   ```

**Deliverables**:
- All P0 ARIA violations fixed
- All P1 ARIA violations fixed
- SA11Y tests added to existing test suites

### Sprint 5-6: Keyboard Navigation & Focus Management

**Agent**: `lwc_agent`
**Tasks**:
1. Implement keyboard navigation for all custom widgets:
   - **Modals**: Tab trap (focus stays within modal), Escape to close
   - **Autocomplete/Combobox**: Arrow keys to navigate, Enter to select, Escape to close
   - **Data tables**: Arrow keys for cell navigation
   - **Drag-and-drop** (geTemplateBuilder): Keyboard alternative with Arrow + Enter
   - **Tabs**: Arrow keys between tabs, Tab to content
2. Implement focus management patterns:
   - Focus first interactive element when modal opens
   - Return focus to trigger element when modal closes
   - Move focus to error summary on form validation failure
   - Announce loading states with `aria-busy="true"`
3. Ensure visible focus indicators:
   - All interactive elements have `:focus-visible` styles
   - Focus ring meets 3:1 contrast ratio
   - No `outline: none` without replacement focus style

**Agent**: `testing_agent`
**Tasks**:
1. Create keyboard navigation tests:
   ```javascript
   it('should trap focus within modal', async () => {
       const element = createComponent({ isOpen: true });
       await flushPromises();

       const focusable = element.shadowRoot.querySelectorAll(
           'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
       );
       const firstFocusable = focusable[0];
       const lastFocusable = focusable[focusable.length - 1];

       // Tab from last → should wrap to first
       lastFocusable.focus();
       lastFocusable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
       expect(document.activeElement).toBe(firstFocusable);
   });
   ```
2. Test keyboard alternatives for all drag-and-drop
3. Test Escape key behavior in all modals/popovers

**Deliverables**:
- Full keyboard navigation on all custom widgets
- Focus trap in all modals
- Focus management on form errors
- Keyboard navigation tests

### Sprint 7-8: Color Contrast, CI Integration & Documentation

**Agent**: `lwc_agent`
**Tasks**:
1. Fix color contrast violations (WCAG 1.4.3 — 4.5:1 ratio):
   - Audit all custom CSS color values
   - Replace low-contrast colors with SLDS design tokens
   - Ensure error/warning/success states meet contrast requirements
2. Fix P2 remaining violations:
   - Text resize support (content readable at 200% zoom)
   - No content conveyed by color alone (add icons/text)
   - Page titles on all Lightning pages
3. Create accessibility component utilities:
   - `c-screen-reader-only` — Visually hidden but announced
   - Enhanced `utilScreenReaderAnnouncer` with priority levels

**Agent**: `devops_agent`
**Tasks**:
1. Add SA11Y as blocking CI gate:
   ```yaml
   - name: Run Accessibility Tests
     run: npm run test:unit:a11y
     # Fail build on any SA11Y violation
   ```
2. Configure accessibility reporting in CI dashboard
3. Add Lighthouse accessibility score to PR checks

**Agent**: `documentation_agent`
**Tasks**:
1. Create accessibility patterns guide for contributors:
   - ARIA usage patterns for common widgets
   - Keyboard navigation requirements
   - Focus management patterns
   - Testing accessibility in development
2. Update component documentation with accessibility notes

**Deliverables**:
- All color contrast violations fixed
- SA11Y blocking in CI
- Accessibility contributor guide
- Zero critical/high a11y violations

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| SA11Y | All LWC tests pass SA11Y checks | `devops_agent` (CI) |
| Keyboard | All functionality accessible via keyboard | `testing_agent` |
| ARIA | All interactive elements have ARIA labels | `lwc_agent` review |
| Contrast | All text meets WCAG 4.5:1 ratio | `lwc_agent` audit |
| Focus | Modals trap focus, forms manage focus on error | `testing_agent` |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| SA11Y violations | TBD (audit) | -60% | -85% | 0 critical |
| ARIA labels coverage | TBD | 80% | 95% | 100% |
| Keyboard navigable widgets | TBD | 60% | 90% | 100% |
| Contrast violations | TBD | -70% | -90% | 0 |
| Lighthouse a11y score | TBD | >70 | >85 | >90 |

---

*Subplan Version: 1.0*
*Last Updated: 2026-02-09*
