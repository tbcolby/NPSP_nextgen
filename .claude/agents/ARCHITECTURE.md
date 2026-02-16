# NPSP_nextgen Agent Architecture

## Overview

This document defines the autonomous agent system for maintaining and evolving the NPSP_nextgen codebase. The system is designed to handle issues, feature requests, code reviews, and ongoing maintenance with minimal human intervention.

## System Architecture

```
                    ┌─────────────────────────────────────────────────────┐
                    │                  INTAKE LAYER                        │
                    │  GitHub Issues │ PRs │ Discussions │ Scheduled Tasks │
                    └─────────────────────────┬───────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPERVISOR AGENT                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Classifier │  │   Router    │  │ Coordinator │  │  Escalation Manager │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        STATE MANAGER                                     ││
│  │  • Active Tasks  • Agent Status  • Dependencies  • Context Cache        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                              │
              ┌──────────┬──────────┼──────────┬──────────┬──────────┬──────────┐
              ▼          ▼          ▼          ▼          ▼          ▼          ▼
    ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
    │   APEX   ││   LWC    ││ TESTING  ││ SECURITY ││  DEVOPS  ││  DOCS    ││ MODERN.  │
    │  AGENT   ││  AGENT   ││  AGENT   ││  AGENT   ││  AGENT   ││  AGENT   ││  AGENT   │
    └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
              │          │          │          │          │          │          │
              └──────────┴──────────┴──────────┼──────────┴──────────┴──────────┘
                                               ▼
                    ┌─────────────────────────────────────────────────────┐
                    │                  KNOWLEDGE LAYER                     │
                    │  NPSP Patterns │ Salesforce Best Practices │ History │
                    │  Planning Docs │ Modernization Burndown             │
                    └─────────────────────────────────────────────────────┘
```

## Supervisor Agent

### Purpose
The Supervisor Agent is the central orchestrator that receives all incoming work, classifies it, routes it to appropriate domain agents, and coordinates multi-agent tasks.

### Components

#### 1. Classifier
Analyzes incoming requests to determine:
- **Type**: Bug fix, Feature request, Refactoring, Security issue, Documentation, Maintenance
- **Domain**: Apex, LWC, Aura, Visualforce, Testing, DevOps, Configuration
- **Complexity**: Simple (single agent), Medium (2-3 agents), Complex (multi-agent coordination)
- **Priority**: Critical, High, Medium, Low
- **Urgency**: Immediate, Normal, Deferred

#### 2. Router
Routes classified work to appropriate agent(s) based on:
- Domain expertise required
- Current agent workload
- Task dependencies
- Historical performance data

#### 3. Coordinator
Manages multi-agent tasks:
- Creates execution plans for complex work
- Manages inter-agent dependencies
- Handles parallel execution where possible
- Synthesizes results from multiple agents

#### 4. Escalation Manager
Handles situations requiring human intervention:
- Unclassifiable requests
- Agent conflicts or failures
- Security-sensitive decisions
- Architectural decisions beyond agent scope

### Routing Logic

```yaml
routing_rules:
  # Single-domain routing
  - pattern: "*.cls changes only"
    route_to: apex_agent

  - pattern: "*.js, *.html in lwc/"
    route_to: lwc_agent

  - pattern: "*_TEST.cls or test coverage"
    route_to: testing_agent

  - pattern: "security, sharing, CRUD/FLS"
    route_to: security_agent

  - pattern: "CI/CD, workflows, deployment"
    route_to: devops_agent

  # Multi-domain routing
  - pattern: "new feature with UI and backend"
    route_to: [apex_agent, lwc_agent]
    coordinator: required

  - pattern: "any code change"
    post_route: [testing_agent, security_agent]

  - pattern: "Aura to LWC migration"
    route_to: lwc_agent
    consult: [apex_agent]

  - pattern: "modernization, burndown, phase planning"
    route_to: modernization_agent
    consult: [relevant domain agents]

  - pattern: "cross-cutting modernization (API version, annotations, etc)"
    route_to: modernization_agent
    post_route: [testing_agent]
```

### State Management

The Supervisor maintains:
```yaml
state:
  active_tasks:
    - task_id: string
      status: pending | in_progress | blocked | completed | failed
      assigned_agents: [agent_ids]
      dependencies: [task_ids]
      created_at: timestamp
      updated_at: timestamp

  agent_status:
    - agent_id: string
      status: idle | busy | blocked
      current_task: task_id | null
      queue_depth: integer

  context_cache:
    - key: string
      value: any
      ttl: duration
```

### Communication Protocol

Agents communicate via structured messages:

```typescript
interface AgentMessage {
  id: string;
  from: AgentId;
  to: AgentId;
  type: 'request' | 'response' | 'notification' | 'escalation';
  payload: {
    action: string;
    data: any;
    context?: {
      task_id: string;
      parent_message?: string;
      priority: Priority;
    };
  };
  timestamp: Date;
}
```

### Decision Trees

#### Task Classification
```
START
  │
  ├─ Is this a bug report?
  │   ├─ YES → Analyze affected files
  │   │         ├─ Apex only → apex_agent
  │   │         ├─ LWC only → lwc_agent
  │   │         ├─ Multiple → coordinator + relevant agents
  │   │         └─ Unknown → explorer_agent → reclassify
  │   └─ NO → Continue
  │
  ├─ Is this a feature request?
  │   ├─ YES → Analyze scope
  │   │         ├─ Backend only → apex_agent
  │   │         ├─ Frontend only → lwc_agent
  │   │         ├─ Full stack → coordinator + [apex, lwc, testing]
  │   │         └─ Infrastructure → devops_agent
  │   └─ NO → Continue
  │
  ├─ Is this a security concern?
  │   ├─ YES → security_agent (priority: high)
  │   └─ NO → Continue
  │
  ├─ Is this a PR/code review?
  │   ├─ YES → Analyze changed files
  │   │         ├─ Route to relevant domain agents
  │   │         └─ Always include: security_agent (review mode)
  │   └─ NO → Continue
  │
  ├─ Is this maintenance/refactoring?
  │   ├─ YES → Analyze scope and impact
  │   │         ├─ Modernization item → modernization_agent
  │   │         ├─ Single-domain refactor → relevant domain agent
  │   │         └─ Cross-cutting → modernization_agent + coordinator
  │   └─ NO → Continue
  │
  └─ Is this tech debt / modernization?
      ├─ YES → modernization_agent
      │         ├─ Check burndown alignment
      │         └─ Route sub-tasks to domain agents
      └─ NO → escalate_to_human
```

## Agent Communication Patterns

### Request-Response
```
Supervisor → Agent: "Analyze this issue"
Agent → Supervisor: "Analysis complete, here are findings"
```

### Delegation
```
Supervisor → Apex Agent: "Implement backend logic"
Apex Agent → Testing Agent: "Generate tests for this implementation"
Testing Agent → Apex Agent: "Tests ready, here are edge cases found"
Apex Agent → Supervisor: "Implementation complete with tests"
```

### Consultation
```
LWC Agent → Apex Agent: "What Apex methods are available for this feature?"
Apex Agent → LWC Agent: "Here are the methods and their signatures"
```

### Broadcast
```
Supervisor → All Agents: "New NPSP release detected, update knowledge bases"
```

## Error Handling

### Agent Failure
1. Supervisor detects agent timeout or error
2. Retry with exponential backoff (max 3 retries)
3. If persistent failure:
   - Attempt with alternative approach
   - Escalate to human if critical
   - Log failure for pattern analysis

### Conflict Resolution
When agents disagree:
1. Supervisor collects all agent recommendations
2. Applies priority rules (security > functionality > style)
3. If unresolvable, escalates to human

### Deadlock Prevention
- Maximum task age before forced completion/escalation
- Circular dependency detection in coordinator
- Agent heartbeat monitoring

## Performance Metrics

The Supervisor tracks:
- Task completion rate
- Average time to resolution
- Agent utilization
- Escalation frequency
- Error rates by agent/domain

## Configuration

```yaml
supervisor:
  max_concurrent_tasks: 10
  task_timeout_minutes: 60
  retry_attempts: 3
  escalation_threshold: 0.8  # Confidence below this → escalate

  classification:
    model: "domain-classifier"
    confidence_threshold: 0.7

  routing:
    load_balancing: true
    max_queue_per_agent: 5

  coordination:
    max_agents_per_task: 4
    parallel_execution: true
```
