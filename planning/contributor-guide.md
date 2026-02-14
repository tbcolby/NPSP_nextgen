# NPSP_nextgen Contributor Guide

**Scope**: Standards and procedures for all contributors (agents and humans)
**Complements**: Existing `CONTRIBUTING.md` at repo root

---

## Project Overview

NPSP_nextgen is a community fork of the Salesforce Nonprofit Success Pack, modernizing the codebase while maintaining backwards compatibility. The project uses a multi-agent architecture where specialized agents handle different domains.

### Agent Roster

| Agent | Domain | Primary Workstreams |
|-------|--------|-------------------|
| `apex_agent` | Apex code, triggers, batch classes | WS-01, WS-03, WS-04 |
| `lwc_agent` | Lightning Web Components, Aura | WS-06, WS-08 |
| `testing_agent` | Test classes, test data, CI validation | WS-10 |
| `security_agent` | Sharing, CRUD/FLS, code scanning | WS-02, WS-05 |
| `devops_agent` | CI/CD, environments, deployments | WS-05 (CI), environments |
| `documentation_agent` | ApexDoc, JSDoc, admin guides | WS-05 (docs) |
| Supervisor | Coordination, reviews, approvals | All |

---

## Getting Started

### Prerequisites

- Salesforce CLI (`sf`) >= 2.x
- CumulusCI >= 4.6.0
- Node.js >= 18 (for LWC development)
- Python 3.11+ (for Robot Framework)
- Git

### Environment Setup

```bash
# Clone the repository
git clone https://github.com/tbcolby/NPSP_nextgen.git
cd NPSP_nextgen

# Install CumulusCI (if not already installed)
pip install cumulusci

# Create a dev scratch org
cci org scratch dev my_dev_org --days 7

# Deploy and configure
cci flow run dev_org --org my_dev_org

# Install LWC dependencies
npm install

# Verify setup
cci task run run_tests --org my_dev_org -o test_name_match "SMOKE_*"
npm run test:unit
```

### Repository Structure

```
NPSP_nextgen/
├── CLAUDE.md                      # Project-level agent context (repo root)
├── .claude/                       # Agent configuration
│   ├── agents/                    # Domain agent definitions
│   └── INTAKE_SYSTEM.md           # Intake system documentation
├── force-app/main/default/    # Salesforce source (primary)
│   ├── classes/               # ~843 Apex classes (with corresponding .cls-meta.xml files)
│   ├── lwc/                   # 122 Lightning Web Components
│   ├── aura/                  # 35 Aura components
│   ├── objects/               # Custom objects and fields
│   ├── triggers/              # Apex triggers (TDTM pattern)
│   └── ...
├── datasets/                  # CumulusCI test data
├── orgs/                      # 15 scratch org definitions
├── planning/                  # Project planning documents
│   ├── implementation/        # Implementation subplans
│   ├── assessments/           # Review assessments
│   ├── devops/                # DevOps procedures
│   └── testing/               # Testing strategies
├── robot/Cumulus/             # Robot Framework tests
├── cumulusci.yml              # CumulusCI configuration (1,961 lines)
├── sfdx-project.json          # SFDX project config (2GP unlocked package, namespace: npsp2)
└── jest.config.js             # Jest configuration
```

---

## Development Workflow

### Branch Naming Convention

```
feature/ws-XX/description     # Workstream feature branches
hotfix/YYYY-MM-DD-description # Hotfix branches
rel/X.Y.Z                     # Release branches
uat/phase-N                    # UAT branches
```

See [Branching Strategy](devops/01-branching-strategy.md) for details.

### Making Changes

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/ws-XX/my-change main
   ```

2. **Make your changes** following the coding standards below

3. **Run local validation**:
   ```bash
   # Apex: Deploy and run tests
   cci task run deploy --org my_dev_org
   cci task run run_tests --org my_dev_org \
     -o test_name_match "AFFECTED_DOMAIN_*_TEST"

   # LWC: Run Jest tests
   npm run test:unit -- --testPathPattern="myComponent"

   # Static analysis
   npm run lint:lwc
   ```

4. **Push and create PR** following the PR template

---

## Coding Standards

### Apex

| Standard | Rule | Enforced By |
|----------|------|-------------|
| API Version | `63.0` minimum for new/modified classes | PR review |
| Sharing | `inherited sharing` default; `without sharing` only for system operations | `security_agent` review |
| CRUD/FLS | All user-context DML must use `Security.stripInaccessible()` or equivalent | PMD + `security_agent` |
| Naming | Domain prefix required (`RD2_`, `CRLP_`, `BDI_`, etc.) | PR review |
| Error Handling | Use `ERR_Handler` — never swallow exceptions silently | PMD |
| Test Methods | `@IsTest` annotation (not `testMethod` keyword) | PMD |
| Assertions | `Assert.areEqual()` / `Assert.isTrue()` (not legacy `System.assert*`) | PMD |
| Documentation | ApexDoc on all `public` and `global` methods | `documentation_agent` |
| Governor Limits | Stay within 50-60% budget (see [Performance](testing/04-performance-load-testing.md)) | Budget tests |

### Apex Class Template

```apex
/**
 * @description [Brief description of the class purpose]
 * @group [Domain: Household, Donation, RD2, BDI, etc.]
 * @since [API version when created]
 */
public inherited sharing class DOMAIN_ClassName_SVC {

    @TestVisible
    private static DOMAIN_ClassName_SVC instance;

    public static DOMAIN_ClassName_SVC getInstance() {
        if (instance == null) {
            instance = new DOMAIN_ClassName_SVC();
        }
        return instance;
    }

    // ... implementation
}
```

### LWC

| Standard | Rule | Enforced By |
|----------|------|-------------|
| API Version | `63.0` minimum | `.js-meta.xml` check |
| Accessibility | WCAG 2.1 AA compliance | SA11Y + `lwc_agent` |
| Labels | All user-visible text via Custom Labels | ESLint |
| Wire/Imperative | Prefer `@wire` over imperative Apex calls | PR review |
| Error Handling | Display user-friendly errors via `lightning-card` | PR review |
| Testing | Jest test file required for every component | CI gate |
| Keyboard Navigation | All interactive elements focusable and operable | SA11Y |

### LWC Component Template

```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

/**
 * @description [Brief description]
 */
export default class DomainComponentName extends LightningElement {
    @api recordId;

    // ... implementation

    handleError(error) {
        // Use consistent error handling pattern
    }
}
```

### Test Standards

| Standard | Rule |
|----------|------|
| Naming | `DOMAIN_ClassName_TEST` for Apex; `componentName.test.js` for LWC |
| Data | Use builder pattern (`TEST_*Builder`); no `@SeeAllData` |
| Assertions | Meaningful messages on all assertions |
| Bulk | All trigger tests must include 200-record bulk test |
| Negative | Include at least one negative test per method |
| Coverage | 85% minimum per class; 90% target |

See [Test Data Strategy](testing/01-test-data-strategy.md) for builder patterns and data standards.

---

## Pull Request Process

### PR Template

```markdown
## Summary
[1-2 sentence description of the change]

## Workstream
WS-XX: [Workstream name]

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring (no functional change)
- [ ] Performance improvement
- [ ] Security fix
- [ ] Documentation

## Backwards Compatibility Checklist
- [ ] No `global` method signatures changed or removed
- [ ] No Custom Object/Field API names changed or removed
- [ ] No `@AuraEnabled` method signatures changed
- [ ] No sharing behavior changes that reduce data visibility
- [ ] All existing test classes still pass
- [ ] [Full checklist](backwards-compatibility-policy.md)

## Testing
- [ ] Unit tests added/updated
- [ ] Bulk test (200 records) included
- [ ] Jest tests added/updated (if LWC)
- [ ] All existing tests pass

## Screenshots (if UI change)
[Before/After screenshots]
```

### Review Requirements

| Change Type | Required Reviewers |
|------------|-------------------|
| Apex code | `apex_agent` + domain agent |
| LWC code | `lwc_agent` |
| Sharing/security changes | `security_agent` (mandatory) |
| Test changes | `testing_agent` |
| CI/CD changes | `devops_agent` |
| Cross-workstream | Supervisor |
| Breaking change | Supervisor + human architect |

### Merge Criteria

- All CI checks pass (Apex tests, Jest tests, PMD, ESLint)
- Required reviews approved
- BC checklist completed
- No unresolved review comments
- Branch up to date with `main`

---

## CumulusCI Quick Reference

**Minimum CumulusCI version: 4.6.0**

### Common Tasks

```bash
# Create scratch org (namespaced for 2GP development)
cci org scratch dev my_org --days 7

# Deploy to org
cci flow run dev_org --org my_org

# Run all Apex tests
cci task run run_tests --org my_org

# Run specific test class
cci task run run_tests --org my_org \
  -o test_name_match "RD2_*_TEST"

# Run Robot Framework tests
cci task run robot --org my_org \
  -o suites robot/Cumulus/tests/browser/contacts

# Run Jest tests
npm run test:unit

# Run Jest with coverage
npm run test:unit -- --coverage

# Run accessibility tests
npm run test:unit:a11y

# Load test data
cci task run load_dataset --org my_org \
  -o mapping datasets/mapping.yml \
  -o sql_path datasets/dev_org/test_data.sql

# Delete scratch org
cci org scratch_delete my_org
```

### 2GP Package Development Tasks

```bash
# Create a new package version (beta)
sf package version create --package "NPSP_nextgen" \
  --installation-key-bypass --wait 30 \
  --code-coverage --target-dev-hub DevHub

# List package versions
sf package version list --packages "NPSP_nextgen" --target-dev-hub DevHub

# Promote a package version (mark as released)
sf package version promote --package "NPSP_nextgen@4.0.0-1" --target-dev-hub DevHub

# Install package in a target org
sf package install --package "NPSP_nextgen@4.0.0-1" \
  --target-org my_org --wait 20 --installation-key-bypass

# Generate installation URL
sf package version list --packages "NPSP_nextgen" \
  --target-dev-hub DevHub --verbose
# Use the SubscriberPackageVersionId (04t...) in:
# https://login.salesforce.com/packaging/installPackage.apexp?p0=04t...
```

### Org Variants

Scratch org configurations are defined in `cumulusci.yml` under the `orgs:` section.
Use the CCI-defined org names directly:

```bash
# Standard dev org
cci org scratch dev my_org

# Multi-currency org (defined in cumulusci.yml orgs: section)
cci org scratch beta_multicurrency my_org

# Person Accounts org (defined in cumulusci.yml orgs: section)
cci org scratch beta_personaccounts my_org

# Enterprise edition (defined in cumulusci.yml orgs: section)
cci org scratch enterprise my_org
```

---

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: <agent-name> <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `perf`, `security`, `chore`

**Scopes**: Workstream ID (`ws-01`) or domain (`rd2`, `crlp`, `bdi`, `hh`, `ge`, `allo`)

**Examples**:
```
feat(ws-02): convert HH_Households to inherited sharing

fix(rd2): correct installment calculation for monthly schedules

test(ws-10): migrate CRLP test methods to @IsTest annotation

refactor(ws-01): upgrade TDTM_Config_API to API 63.0
```

---

## Extension Patterns

NPSP_nextgen supports 8 extension patterns for customizers and companion package developers. These patterns allow organizations to extend functionality without modifying the core package.

### 1. TDTM Trigger Handlers

Register custom trigger handlers via `Trigger_Handler__c` records. NPSP_nextgen's Table-Driven Trigger Management framework will execute your handler alongside built-in handlers.

```
Trigger_Handler__c:
  Class__c: "MyOrg_CustomDonationHandler"
  Object__c: "Opportunity"
  Load_Order__c: 5.0
  Active__c: true
  Action__c: "AfterInsert;AfterUpdate"
```

### 2. Custom Rollup Definitions (Rollup__mdt)

Define custom rollup calculations using `npsp2__Rollup__mdt` Custom Metadata records. Supports COUNT, SUM, MIN, MAX, FIRST, LAST, and custom operations.

### 3. Data Import Field Mappings

Extend Batch Data Import by adding custom field mappings via `npsp2__Data_Import_Field_Mapping__mdt`. Map custom fields from the Data Import object to target objects.

### 4. Custom Metadata Configuration

Override default NPSP behavior by deploying Custom Metadata records. The `NPSP_ConfigurationService` facade reads CMT values first, falling back to Custom Settings for backwards compatibility.

### 5. Custom LWC Components

Build custom Lightning Web Components that interact with NPSP data. Use `@wire` adapters and `@AuraEnabled` controller methods documented in the public API.

### 6. Custom Fields on Package Objects

Add custom fields to any NPSP_nextgen object (e.g., `npsp2__Opportunity__c.MyOrg_Custom_Field__c`). Custom fields survive package upgrades and are visible in rollup configurations.

### 7. fflib Application Layer (Services / Selectors)

NPSP_nextgen uses the fflib enterprise patterns. Extend or override behavior by:
- Registering custom `fflib_ISObjectSelector` implementations
- Registering custom `fflib_ISObjectDomain` implementations
- Calling service layer methods from your own Apex code

### 8. Companion Packages

Build separate unlocked packages that depend on NPSP_nextgen. Declare the dependency in your `sfdx-project.json`:

```json
{
  "packageDirectories": [{
    "path": "force-app",
    "dependencies": [
      { "package": "NPSP_nextgen", "versionNumber": "4.0.0.LATEST" }
    ]
  }]
}
```

Companion packages can reference any `global` class, custom object, or custom field in the `npsp2` namespace.

---

## Getting Help

- **Project planning**: See `planning/00-PLANNING-INDEX.md` for all planning documents
- **Implementation details**: See `planning/implementation/` for workstream subplans
- **DevOps procedures**: See `planning/devops/` for CI/CD and environment docs
- **Testing standards**: See `planning/testing/` for test strategies
- **Assessment findings**: See `planning/assessments/` for review findings
- **Agent coordination**: See `planning/implementation/agent-coordination-playbook.md`

---

*Document Version: 1.1*
*Last Updated: 2026-02-13*
