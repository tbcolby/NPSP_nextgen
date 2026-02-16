# Issue and Feature Request Intake System

## Overview

This document describes the automated intake system for NPSP_nextgen that routes issues and feature requests to the appropriate domain agents for analysis and action.

## Issue Templates

### Available Templates

1. **Bug Report** (`bug_report.yml`)
   - For reporting bugs in existing functionality
   - Collects: Feature area, component type, severity, reproduction steps
   - Auto-labels: `bug`, `triage`, domain labels, agent assignments

2. **Feature Request** (`feature_request.yml`)
   - For suggesting new features or enhancements
   - Collects: Feature area, request type, problem statement, acceptance criteria
   - Auto-labels: `enhancement`, `triage`, domain labels, agent assignments

3. **Security Report** (`security_report.yml`)
   - For reporting security vulnerabilities (non-sensitive)
   - Collects: Vulnerability type, severity, affected area
   - Auto-labels: `security`, `triage`, `priority-high`
   - Always routes to Security Agent

## Auto-Routing Logic

### Feature Area → Domain Labels

| Feature Area | Domain Label | Primary Agent |
|--------------|--------------|---------------|
| Recurring Donations (RD2) | `domain:rd2` | apex_agent |
| Customizable Rollups (CRLP) | `domain:crlp` | apex_agent |
| Gift Entry / Batch Gift Entry | `domain:gift-entry` | lwc_agent, apex_agent |
| Batch Data Import (BDI) | `domain:bdi` | apex_agent |
| Allocations | `domain:allo` | apex_agent |
| Households | `domain:hh` | apex_agent, lwc_agent |
| Relationships | `domain:rel` | apex_agent |
| Payments | `domain:pmt` | apex_agent, security_agent |
| Settings/Configuration | `domain:stg` | apex_agent |
| DevOps/CI-CD | `domain:devops` | devops_agent |
| Documentation | `domain:docs` | documentation_agent |
| Testing | `domain:testing` | testing_agent |
| Modernization / Tech Debt | `domain:modernization` | modernization_agent |

### Component Type → Agent Labels

| Component Type | Agent Labels |
|----------------|--------------|
| Apex (Backend Logic) | `agent:apex` |
| Lightning Web Component (LWC) | `agent:lwc` |
| Aura Component | `agent:lwc` |
| Visualforce Page | `agent:apex` |
| Trigger/Automation | `agent:apex`, `agent:testing` |
| Modernization / Tech Debt | `agent:modernization` |

### Priority Labels

| Severity | Priority Label | Response Time |
|----------|---------------|---------------|
| Critical | `priority:critical` | 24 hours |
| High | `priority:high` | 3 days |
| Medium | `priority:medium` | 1 week |
| Low | `priority:low` | 2 weeks |

## Agent Assignment Flow

```
┌─────────────────┐
│  Issue Created  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse Template │
│     Fields      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Apply Domain   │
│     Labels      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Apply Agent    │
│     Labels      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent Routes   │
│  Add Comment    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Priority Check │
│  (if critical)  │
└─────────────────┘
```

## Agent Response Protocol

When an agent is assigned, it adds a comment explaining:
- What analysis will be performed
- Relevant considerations for the domain
- Expected deliverables

### Sample Agent Responses

**Apex Agent:**
> 🔧 **Apex Agent** has been assigned to review this issue.
>
> This issue will be analyzed for:
> - TDTM framework compatibility
> - Service layer patterns
> - CRUD/FLS compliance
> - Performance considerations

**Security Agent:**
> 🔒 **Security Agent** has been assigned to review this issue.
>
> Security review includes:
> - Sharing mode analysis
> - CRUD/FLS verification
> - Vulnerability assessment
> - Compliance check

**Modernization Agent:**
> 🔄 **Modernization Agent** has been assigned to review this issue.
>
> This issue will be analyzed for:
> - Alignment with modernization roadmap
> - Phase placement and prioritization
> - Cross-cutting impact assessment
> - Burndown tracking updates

## Integration with Supervisor Agent

The Supervisor Agent monitors all incoming issues and can:

1. **Override Routing**: Reassign to different agents if auto-routing was incorrect
2. **Escalate**: Add `priority:critical` and notify maintainers
3. **Coordinate**: When issues span multiple domains, coordinate agent collaboration
4. **Track Progress**: Monitor issue resolution and update status

## Labels Reference

### Domain Labels
- `domain:rd2` - Recurring Donations
- `domain:crlp` - Customizable Rollups
- `domain:gift-entry` - Gift Entry
- `domain:bdi` - Batch Data Import
- `domain:allo` - Allocations
- `domain:hh` - Households
- `domain:rel` - Relationships
- `domain:pmt` - Payments
- `domain:stg` - Settings
- `domain:devops` - DevOps
- `domain:docs` - Documentation
- `domain:testing` - Testing
- `domain:modernization` - Modernization / Tech Debt

### Agent Labels
- `agent:apex` - Apex Agent
- `agent:lwc` - LWC Agent
- `agent:testing` - Testing Agent
- `agent:security` - Security Agent
- `agent:devops` - DevOps Agent
- `agent:documentation` - Documentation Agent
- `agent:modernization` - Modernization Agent

### Status Labels
- `triage` - Needs initial review
- `in-progress` - Being worked on
- `needs-info` - Awaiting more information
- `blocked` - Blocked by dependency
- `ready-for-review` - PR ready for review
- `approved` - Ready to merge

### Priority Labels
- `priority:critical` - Immediate attention
- `priority:high` - High priority
- `priority:medium` - Medium priority
- `priority:low` - Low priority

## Maintenance

### Adding New Feature Areas

1. Update `bug_report.yml` and `feature_request.yml` dropdown options
2. Update `issue-triage.yml` `featureAreaMapping`
3. Update this documentation
4. Create domain agent knowledge base if needed

### Adding New Agents

1. Create agent specification in `.claude/agents/domains/`
2. Add agent label to `issue-triage.yml`
3. Add agent response message
4. Update routing logic
5. Update ARCHITECTURE.md
