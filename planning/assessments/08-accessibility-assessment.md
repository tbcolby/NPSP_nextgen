# WS-08: Accessibility Compliance — Assessment

**Review Date**: 2026-02-12
**Implementation Plan**: [08-accessibility.md](../implementation/08-accessibility.md)
**Planning Doc**: [08-ACCESSIBILITY-COMPLIANCE.md](../08-ACCESSIBILITY-COMPLIANCE.md)
**Overall Rating**: **Strong**

---

## Well-Architected Alignment

| Pillar | Score | Notes |
|--------|-------|-------|
| Trusted | Strong | No security concerns identified |
| Easy | Strong | WCAG 2.1 AA first-class target; comprehensive remediation |
| Adaptable | Adequate | No WCAG 2.2 forward compatibility; patterns documented for reuse |
| Intentional | Strong | WCAG criteria mapped to tasks; severity-ranked (P0/P1/P2) |
| Automated | Strong | SA11Y blocking CI gate; Lighthouse in PR checks; accessibility dashboard |

This is the highest-rated plan across all workstreams.

---

## Accuracy Findings

### Minor: Agent Roster Gap

`devops_agent` performs Sprint 7-8 work (SA11Y as blocking CI gate, Lighthouse in PR checks, accessibility reporting) but is not listed as a Supporting Agent. Should be added.

### Minor: Outdated `@track` Usage

Planning doc uses `@track focusedIndex = 0`. In modern LWC (API 50+), `@track` is unnecessary for primitive values — they are reactive by default. Technically valid but considered deprecated for primitives.

### Minor: Shadow DOM Testing Limitations

Two test code examples have limitations in LWC shadow DOM context:

1. **`input.labels` check** (Sprint 3-4): `input.labels` returns associated `<label>` elements, which may not cross shadow boundaries in LWC. More reliable: check `input.getAttribute('aria-label') || input.getAttribute('aria-labelledby')`.

2. **`document.activeElement` assertion** (Sprint 5-6): In LWC testing, `document.activeElement` refers to the host element, not elements within shadow root. The focus trap test relies on the component's event handler calling `.focus()`, but the assertion may not work in JSDOM.

**Recommendation**: Update test patterns to use shadow-DOM-compatible assertions.

### Verified Correct
- WCAG 2.1 AA criteria categorization (1.1, 1.3, 1.4, 2.1, 2.4, 3.3, 4.1) is accurate
- ARIA role assignments (combobox, listbox, dialog, tablist) follow WAI-ARIA authoring practices
- SA11Y (`@sa11y/jest`) is the correct Salesforce accessibility testing library
- `aria-live="polite"` for dynamic content is correct
- Focus trap pattern is conceptually correct
- Lighthouse accessibility scoring is applicable

---

## Backwards Compatibility Risks

### Risk: Minimal

Accessibility improvements are additive — adding ARIA labels, roles, keyboard handlers, and focus management does not change existing component behavior. The only potential risk is if CSS changes for focus indicators or color contrast inadvertently change the visual appearance of components.

**Mitigation**: Visual regression testing (recommended in WS-06 assessment) would catch inadvertent visual changes.

---

## Well-Architected Detail

### Easy — Manual Assistive Technology Testing

Automated tools (SA11Y, Lighthouse) catch approximately 30% of accessibility issues. Manual testing with actual screen readers is necessary for full WCAG compliance.

**Recommendation**: Add at least one manual accessibility testing cycle per sprint with real screen reader validation (NVDA, JAWS, or VoiceOver), especially for complex widgets:
- Autocomplete/combobox
- Drag-and-drop (geTemplateBuilder)
- Modal focus traps
- Dynamic form rendering (geFormRenderer)

### Adaptable — WCAG 2.2 Forward Compatibility

The plan targets WCAG 2.1 AA. WCAG 2.2 is now a W3C Recommendation and includes additional success criteria (e.g., 2.4.11 Focus Not Obscured, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication).

**Recommendation**: Add a brief note on WCAG 2.2 new criteria and identify which are relevant to NPSP components. This future-proofs the accessibility work.

### Automated — Lighthouse Score Variability

Lighthouse accessibility scores can vary between runs due to rendering timing. No mention of threshold tolerance or averaging strategy.

**Recommendation**: Use 3-run averaging for Lighthouse scores with a tolerance band (e.g., target >90 with >=88 acceptable).

---

## Required Actions

| Priority | Action | Detail |
|----------|--------|--------|
| **P2** | Add manual assistive technology testing | Screen reader validation per sprint for complex widgets |
| **P2** | Update shadow DOM test patterns | Use `aria-label`/`aria-labelledby` instead of `input.labels` |
| **P3** | Note WCAG 2.2 forward compatibility | Identify relevant new criteria |
| **P3** | Define Lighthouse score tolerance | 3-run averaging with tolerance band |
| **P3** | Remove `@track` from primitive examples | Update to modern LWC reactive patterns |
| **P3** | Add `devops_agent` to supporting agents | Currently unlisted despite Sprint 7-8 work |

---

*Assessment Version: 1.0*
*Last Updated: 2026-02-12*
