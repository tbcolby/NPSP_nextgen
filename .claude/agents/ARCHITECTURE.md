# NPSP_nextgen Agent Architecture

## Overview

This project uses Claude Code with domain-specific knowledge files to guide modernization work. Each domain file in `domains/` contains patterns, conventions, and common pitfalls for that area of the codebase.

## How It Works

When working on NPSP_nextgen, consult the relevant domain knowledge file(s) before making changes:

```
.claude/agents/domains/
├── apex_agent.md          # Apex patterns, TDTM, services, batch, selectors
├── lwc_agent.md           # LWC components, Aura migration, frontend patterns
├── testing_agent.md       # Test factories, coverage, Jest/Apex test patterns
├── security_agent.md      # Sharing, CRUD/FLS, injection, DML wrapping
├── devops_agent.md        # CI/CD, CumulusCI, deployment, environments
├── documentation_agent.md # ApexDoc, JSDoc, planning docs, contributor guide
└── modernization_agent.md # Burndown tracking, phase planning, cross-cutting changes
```

## Domain Ownership

| Domain | Primary Concerns | Key Files |
|--------|-----------------|-----------|
| **Apex** | TDTM handlers, services, selectors, batch classes, domain logic | `force-app/main/default/classes/` |
| **LWC** | Component architecture, wire adapters, Aura interop | `force-app/main/default/lwc/` |
| **Testing** | Test data factories, coverage targets, Jest suites | `*_TEST.cls`, `__tests__/` |
| **Security** | Sharing modes, CRUD/FLS at controller boundary, SOQL injection, DML wrapping | `UTIL_Permissions.cls`, `UTIL_DMLService.cls` |
| **DevOps** | CI pipeline, CumulusCI flows, scratch org management | `cumulusci.yml`, `.github/workflows/` |
| **Documentation** | Planning docs, burndown, contributor guide | `planning/`, `documentation/` |
| **Modernization** | Phase tracking, cross-cutting refactors, backwards compatibility | `documentation/MODERNIZATION_BURNDOWN.md` |

## Security Patterns (Established in Phases 2a-2e)

These patterns are now established and must be followed for all new code:

1. **Sharing**: All new classes use `inherited sharing` unless system-context access is required (document why)
2. **SOQL**: Use bind variables, never string concatenation. Add `WITH SECURITY_ENFORCED` to selectors serving controller paths
3. **DML**: Use `UTIL_DMLService.insertRecord(s)`/`updateRecord(s)` for insert/update; `Database.delete(records, true)` for deletes
4. **CRUD/FLS**: Enforce at controller boundary via `UTIL_Permissions`. Services and batch classes are internal — they do NOT enforce CRUD/FLS
5. **Custom Settings DML**: Idiomatic bare upsert is acceptable (~69 instances, established convention)

## Modernization Progress

See `documentation/MODERNIZATION_BURNDOWN.md` for full tracking. Current state:
- **Phase 0** (complete): Packaging & setup
- **Phase 1** (7/8 complete): Foundation modernization
- **Phase 2** (5/12 complete): Security hardening — core items done, audits remaining
- **Phases 3-10**: Not started

## Quality Gates

All PRs must:
1. Pass `npm run test:unit` (45 Jest suites, 279 tests)
2. Pass ESLint (`npm run lint:lwc`)
3. Maintain 85%+ Apex code coverage
4. Follow established security patterns (sharing, CRUD/FLS, DML wrapping)
5. Not introduce backwards-incompatible changes (see `planning/backwards-compatibility-policy.md`)
