# WS-05: Code Quality & Standards — Implementation Subplan

**Phase**: 1 (Foundation)
**Primary Agent**: `documentation_agent`
**Supporting Agents**: `apex_agent`, `lwc_agent`, `testing_agent`, `devops_agent`
**Planning Doc**: [05-CODE-QUALITY-STANDARDS.md](../05-CODE-QUALITY-STANDARDS.md)
**Blocks**: All subsequent workstreams (quality gates)

---

## Objective

Establish and enforce code quality standards across the codebase: PMD for Apex, ESLint for LWC, ApexDoc/JSDoc coverage targets, naming conventions, and pre-commit hooks. This workstream creates the quality gates used by all other workstreams.

---

## Sprint Breakdown

### Sprint 1-2: Tooling Setup & Baseline

**Agent**: `devops_agent`
**Tasks**:
1. Configure PMD ruleset for NPSP patterns (`pmd-npsp-ruleset.xml`):
   - Standard Salesforce rules
   - Custom rules for NPSP domain prefixes
   - Severity levels: Critical (block), High (warn in CI), Medium (info)
   - Key rules: `ApexSOQLInjection`, `ApexCRUDViolation`, `AvoidDmlStatementsInLoops`, `CyclomaticComplexity`
2. Configure ESLint for LWC (extend `.eslintrc.json`):
   - `@salesforce/eslint-config-lwc/recommended`
   - `@salesforce/eslint-plugin-aura` for Aura components
   - Custom rules for NPSP naming conventions
3. Set up pre-commit hooks:
   ```yaml
   hooks:
     - id: pmd-apex (runs on .cls files)
     - id: eslint-lwc (runs on .js/.html files)
     - id: apex-compile-validate (runs on .cls files)
   ```
4. Run baseline scans and capture current violation counts

**Deliverables**:
- `pmd-npsp-ruleset.xml` — Custom PMD ruleset
- Updated `.eslintrc.json` with NPSP rules
- `.pre-commit-config.yaml` — Pre-commit hook configuration
- `docs/code-quality-baseline.md` — Current violation counts

### Sprint 3-4: ApexDoc & JSDoc Standards

**Agent**: `documentation_agent`
**Tasks**:
1. Define ApexDoc standard template:
   ```apex
   /**
    * @description Brief description of class/method purpose
    * @author Author name or team
    * @date Creation or modification date
    * @group Feature domain (e.g., Recurring Donations)
    * @param paramName Description of parameter
    * @return Description of return value
    */
   ```
2. Audit existing ApexDoc coverage (~40% currently)
3. Prioritize documentation by domain:
   - P0: Public APIs and service layer classes
   - P1: TDTM trigger handlers
   - P2: Selector and utility classes
   - P3: Internal helpers
4. Begin batch ApexDoc additions for P0 classes

**Agent**: `lwc_agent`
**Tasks**:
1. Define JSDoc standard template for LWC:
   ```javascript
   /**
    * @description Brief description
    * @param {Type} paramName - Description
    * @returns {Type} Description
    */
   ```
2. Audit existing JSDoc coverage (~30% currently)
3. Begin batch JSDoc additions for public component APIs

**Agent**: `apex_agent`
**Tasks**:
1. Add ApexDoc to all service layer classes (`*_SVC`, `*Service`)
2. Add ApexDoc to all selector classes (`*_SEL`, `*Selector`)
3. Add ApexDoc to base classes and framework classes

**Deliverables**:
- ApexDoc standard documented in CONTRIBUTING.md
- JSDoc standard documented in CONTRIBUTING.md
- P0 classes fully documented
- ApexDoc coverage from ~40% to ~55%

### Sprint 5-6: Naming Conventions & Code Review Automation

**Agent**: `documentation_agent` + `devops_agent`
**Tasks**:
1. Document naming conventions (extend CONTRIBUTING.md):
   - Apex: Domain prefixes (`RD2_`, `CRLP_`, etc.), layer suffixes (`_SVC`, `_SEL`, `_TEST`)
   - LWC: camelCase components, PascalCase services, UPPER_SNAKE constants
   - Tests: `*_TEST.cls` suffix, `shouldDoX_WhenY` method naming
2. Create automated code review checklist:
   ```
   NAMING & STRUCTURE
   * Class/method names follow conventions
   * Domain prefix used correctly
   * File organization matches standards

   DOCUMENTATION
   * Class has @description header
   * Public methods have ApexDoc/JSDoc
   * No TODO/FIXME without issue reference

   CODE QUALITY
   * No hardcoded IDs or credentials
   * No SOQL/DML in loops
   * Proper error handling
   * Bulk-safe for 200+ records
   ```
3. Create GitHub PR template with checklist
4. Configure CI to run checklist validation

**Agent**: `documentation_agent`
**Tasks**:
1. Continue batch ApexDoc additions (P1 + P2 classes)
2. Audit and clean up 48 existing TODO/FIXME comments (link to issues)

**Deliverables**:
- Naming conventions documented
- PR template with code review checklist
- CI checklist validation
- ApexDoc coverage from ~55% to ~70%
- TODO/FIXME comments linked to issues

### Sprint 7-8: Enforcement & Cleanup

**Agent**: `devops_agent`
**Tasks**:
1. Enable PMD as blocking CI check (no critical violations allowed)
2. Enable ESLint as blocking CI check (no errors allowed)
3. Set up coverage reporting for ApexDoc/JSDoc
4. Configure quality gate dashboard

**Agent**: `documentation_agent` + `apex_agent` + `lwc_agent`
**Tasks**:
1. Fix remaining PMD critical/high violations
2. Fix remaining ESLint errors
3. Continue ApexDoc/JSDoc coverage push toward 80%

**Agent**: `testing_agent`
**Tasks**:
1. Validate that new quality gates don't break existing test workflows
2. Update test templates to include new naming conventions

**Deliverables**:
- PMD blocking in CI (zero critical violations)
- ESLint blocking in CI (zero errors)
- ApexDoc coverage ~75-80%
- Quality gate dashboard operational

---

## Agent Coordination Protocol

```
Documentation Batch (per domain):
  documentation_agent: Identifies undocumented P0 classes in domain
  documentation_agent → apex_agent: "Add ApexDoc to RD2_Service, RD2_ScheduleService, etc."
  apex_agent: Adds ApexDoc with domain expertise
  documentation_agent: Reviews quality of documentation

PMD Violation Fix:
  devops_agent: Identifies critical PMD violations
  devops_agent → apex_agent: "Fix DML-in-loop in CRLP_Batch_X (line 142)"
  apex_agent: Fixes violation
  testing_agent: Validates fix doesn't break tests

ESLint Violation Fix:
  devops_agent: Identifies ESLint errors
  devops_agent → lwc_agent: "Fix errors in geFormRenderer.js"
  lwc_agent: Fixes violations
  testing_agent: Runs Jest tests
```

---

## Quality Gates

| Gate | Criteria | Enforced By |
|------|----------|-------------|
| PMD | Zero critical violations, zero high violations | `devops_agent` (CI) |
| ESLint | Zero errors | `devops_agent` (CI) |
| ApexDoc | All public classes have @description | `documentation_agent` |
| JSDoc | All public LWC APIs documented | `documentation_agent` |
| Naming | Follows domain prefix conventions | PR review |

---

## Success Metrics

| Metric | Start | Sprint 4 | Sprint 6 | Sprint 8 |
|--------|-------|----------|----------|----------|
| PMD critical violations | TBD | -60% | -90% | 0 |
| ESLint errors | TBD | -60% | -90% | 0 |
| ApexDoc coverage | ~40% | ~55% | ~70% | ~80% |
| JSDoc coverage | ~30% | ~45% | ~60% | ~75% |
| TODO/FIXME without issue | 48 | 24 | 10 | 0 |
| Pre-commit hooks active | No | Yes | Yes | Yes |

---

*Subplan Version: 1.0*
*Last Updated: 2026-02-09*
