# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NPSP_nextgen is a community-driven fork of Salesforce's Nonprofit Success Pack (NPSP), enhanced with LLM-assisted development. It's a 2GP unlocked Salesforce package (namespace: `npsp2`, API version 63.0) containing ~1,570 Apex classes and ~115 Lightning Web Components.

**Critical**: This is independent from Salesforce/Salesforce.org. Always test in a sandbox before production deployment.

### Modernization Status
- **Phase 0** (PR #1, complete): Namespace npsp→npsp2, API 53→63, Elevate removal, CCI 4.6.0
- **Phase 1** (PR #2, complete): testMethod→@IsTest (648), @track cleanup (~90), deps update, ESLint fixes
- **Phase 2a** (PR #3, complete): SOQL injection fixes (8 files), sharing declarations (46 classes), hardcoded ID docs
- **Phase 2b** (PR #4, complete): GE_LookupController injection fix, sharing complete (158 classes), hardcoded IDs audit
- **Phase 2c** (PR #5, complete): CRUD/FLS enforcement (7 controller methods), DML wrapping (31 bare DML in 11 controllers)
- **Phase 2d** (PR #6, complete): DML wrapping for services/TDTM/batch/utilities (55 bare DML across 27 files)
- **Phase 2e** (PR #7, complete): Selector FLS hardening (5 selectors), controller read-access guards (2 controllers)
- See `planning/` for full roadmap and `documentation/MODERNIZATION_BURNDOWN.md` for tracking

## Build & Development Commands

### Environment Setup
```bash
yarn install                              # Install JS dependencies
pip install cumulusci                     # Install CumulusCI (>= 4.6.0)
cci org scratch dev my_org                # Create scratch org
cci flow run dev_org --org my_org         # Deploy and configure dev org
```

### Testing
```bash
# LWC Tests (Jest)
npm run test:unit                         # Run all LWC tests
npm run test:unit:watch                   # Watch mode
npm run test:unit:debug                   # Debug mode
npm run test:unit:a11y                    # Accessibility tests (SA11Y)

# Apex Tests (via CumulusCI)
cci task run run_tests --org my_org -o retry_failures True -o required_org_code_coverage_percent 85

# Linting
npm run lint:lwc                          # ESLint for LWC
```

### Key CumulusCI Flows
- `dev_org` - Development environment setup
- `dev_org_namespaced` - Namespaced dev environment
- `qa_org` - QA environment with test data
- `config_dev` - Post-install dev configuration
- `enable_gift_entry` - Enable Gift Entry feature
- `enable_rd2` - Enable Enhanced Recurring Donations
- `enable_crlp` - Enable Customizable Rollups

## Architecture

### Source Structure
```
force-app/
├── main/default/
│   ├── classes/          # ~1,570 Apex classes
│   ├── lwc/              # ~115 LWC components
│   ├── aura/             # Legacy Aura components
│   ├── triggers/         # Triggers (delegated to TDTM)
│   └── customMetadata/   # Configuration metadata
├── infrastructure/       # fflib framework (Enterprise patterns)
└── tdtm/                 # Trigger-Driven Transaction Model
```

### Domain Prefixes
| Prefix | Domain |
|--------|--------|
| `RD2_` | Enhanced Recurring Donations |
| `CRLP_` | Customizable Rollups |
| `BDI_` | Batch Data Import |
| `ALLO_` | Allocations |
| `HH_` | Households |
| `GE_` | Gift Entry |
| `ERR_` | Error Handling |
| `STG_` | Settings |
| `UTIL_` | Utilities |

### Key Patterns

**TDTM (Trigger-Driven Transaction Model)**: All triggers delegate to `TDTM_Config_API.run()`. Handler classes extend `TDTM_Runnable`. Configuration in `Trigger_Handler__c` metadata.

**Service Layer**: Classes named `{Domain}_SVC` or `{Domain}Service` (e.g., `RD2_Service`, `CRLP_Rollup_SVC`)

**Selector Pattern**: Classes named `{Domain}_SEL` or `{Domain}Selector` encapsulate SOQL queries

**Batch Processing**: Base classes `CRLP_Batch_Base`, `CRLP_Batch_Base_NonSkew`, `CRLP_Batch_Base_Skew` handle large data volumes with skew detection

### Test Infrastructure
- Test factory: `UTIL_UnitTestData_TEST`, `CMT_UnitTestData_TEST`
- Builder pattern: `TEST_ContactBuilder`, `TEST_OpportunityBuilder`
- Target coverage: 85% minimum
- Test classes: `*_TEST.cls` suffix

## Code Standards

### Apex
- Use domain prefixes consistently
- Prefer `inherited sharing` over `without sharing`
- Include CRUD/FLS checks at controller boundary (UTIL_Permissions); services/batch are internal and do not enforce CRUD/FLS
- Use `UTIL_DMLService.insertRecord(s)`/`updateRecord(s)` for insert/update DML; `Database.delete(records, true)` for deletes
- Use bind variables in SOQL (no string concatenation); add `WITH SECURITY_ENFORCED` to selectors serving controller paths
- Follow service/selector/domain layer patterns

### Lightning Web Components
- Use camelCase naming: `geFormRenderer`, `rd2EntryForm`
- Include accessibility attributes (ARIA labels, keyboard navigation)
- Use service singletons for shared state
- Avoid `@track` for primitive values

### Testing
- Use `@IsTest` annotation (not deprecated `testMethod` keyword)
- Use `@TestSetup` for shared test data
- Include assertion messages: `System.assertEquals(expected, actual, 'Description')`
- Test bulk scenarios (200+ records) for trigger handlers
- LWC tests: 45 Jest suites, 279 tests (all passing)

## Agent System

This project has LLM agent infrastructure in `.claude/`:
- `.claude/agents/ARCHITECTURE.md` - Multi-agent system design
- `.claude/INTAKE_SYSTEM.md` - Automated issue triage
- `.claude/agents/domains/` - Specialized agent guidance for Apex, LWC, testing, security, DevOps, documentation, modernization

## Dependencies

Salesforce Foundation packages:
- Households (npo02) - includes NPE01
- Recurring Donations (npe03)
- Relationships (npe4)
- Affiliations (npe5)
