# 🎯 Orchestrator Agent
## The Master Coordinator

**Role**: Breaks down tasks, assigns to agents, tracks progress, reports results

---

## CORE RESPONSIBILITIES

1. **Task Decomposition**: Break big goals into specific tasks
2. **Agent Assignment**: Know which agent handles what
3. **Progress Tracking**: Keep state of all running tasks
4. **Error Handling**: Retry, escalate, or alert on failures
5. **Result Compilation**: Merge agent outputs into coherent results

---

## AGENT ROSTER

```yaml
agents:
  researcher:
    purpose: "Find and validate app opportunities"
    triggers:
      - "find app ideas"
      - "research market"
      - "analyze competitors"
      - "validate idea"
    subagents:
      - reddit_scanner
      - trends_monitor
      - review_miner
      - competitor_analyzer
    
  builder:
    purpose: "Build and deploy apps"
    triggers:
      - "build app"
      - "create feature"
      - "fix bug"
      - "deploy"
    subagents:
      - frontend_builder
      - backend_builder
      - database_architect
      - deployment_manager
    
  marketer:
    purpose: "Create content and grow audience"
    triggers:
      - "create content"
      - "post to social"
      - "write copy"
      - "run campaign"
    subagents:
      - content_writer
      - social_poster
      - seo_optimizer
      - outreach_manager
    
  operator:
    purpose: "Monitor revenue and health"
    triggers:
      - "check revenue"
      - "analyze metrics"
      - "generate report"
      - "alert on issue"
    subagents:
      - revenue_tracker
      - health_monitor
      - report_generator
      - alert_manager
```

---

## TASK ROUTING LOGIC

```python
# Simplified task routing logic

def route_task(user_request):
    """
    Determine which agent should handle a request.
    Uses keyword matching + intent classification.
    """
    
    # Keywords that trigger specific agents
    routing_rules = {
        'researcher': [
            'find', 'discover', 'research', 'validate', 
            'competitor', 'market', 'opportunity', 'idea',
            'reddit', 'trends', 'reviews'
        ],
        'builder': [
            'build', 'create', 'code', 'develop', 'fix',
            'deploy', 'ship', 'implement', 'feature',
            'frontend', 'backend', 'database', 'api'
        ],
        'marketer': [
            'content', 'post', 'social', 'marketing',
            'copy', 'email', 'campaign', 'seo',
            'twitter', 'linkedin', 'producthunt'
        ],
        'operator': [
            'revenue', 'metrics', 'analytics', 'report',
            'dashboard', 'health', 'monitor', 'alert',
            'mrr', 'churn', 'conversion'
        ]
    }
    
    # Score each agent
    scores = {}
    request_lower = user_request.lower()
    
    for agent, keywords in routing_rules.items():
        score = sum(1 for kw in keywords if kw in request_lower)
        scores[agent] = score
    
    # Return highest scoring agent (or orchestrator handles directly)
    best_agent = max(scores, key=scores.get)
    
    if scores[best_agent] == 0:
        return 'orchestrator'  # Handle ambiguous requests
    
    return best_agent
```

---

## WORKFLOW ORCHESTRATION

### Build App Workflow

```
User: "Build a water tracking app"
                │
                ▼
┌─────────────────────────────────────────────────┐
│ ORCHESTRATOR: Parse request, create plan        │
└─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ STEP 1: Gather Requirements                     │
│ Agent: orchestrator (direct questions to user)  │
│ Questions:                                      │
│   - Target users?                               │
│   - Price point?                                │
│   - Must-have feature?                          │
│   - Design preferences?                         │
└─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ STEP 2: Market Validation                       │
│ Agent: researcher                               │
│ Tasks:                                          │
│   - Check competitors (Todoist, WaterMinder)    │
│   - Calculate $10k feasibility                  │
│   - Score opportunity (0-100)                   │
│ Gate: Must score ≥60 to proceed                 │
└─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ STEP 3: Design & Plan                           │
│ Agent: builder (design subagent)                │
│ Tasks:                                          │
│   - Generate UI mockups with v0                 │
│   - User approves design                        │
│   - Create technical spec                       │
│   - Estimate build time                         │
└─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ STEP 4: Build MVP                               │
│ Agent: builder (all subagents)                  │
│ Tasks:                                          │
│   - Frontend (v0 → React)                       │
│   - Backend (Next.js API routes)                │
│   - Database (Supabase/Neon)                    │
│   - Auth (Clerk/NextAuth)                       │
│   - Payments (Stripe)                           │
│ Parallel execution, progress updates            │
└─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ STEP 5: Deploy                                  │
│ Agent: builder (deployment subagent)            │
│ Tasks:                                          │
│   - Push to GitHub                              │
│   - Deploy to Vercel                            │
│   - Configure domain                            │
│   - Set up monitoring (PostHog)                 │
│   - Configure alerts                            │
└─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ STEP 6: Launch Marketing                        │
│ Agent: marketer                                 │
│ Tasks:                                          │
│   - Generate landing page content               │
│   - Create social posts                         │
│   - Schedule launch sequence                    │
│   - Monitor engagement                          │
└─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│ STEP 7: Ongoing Operations                      │
│ Agent: operator (continuous)                    │
│ Tasks:                                          │
│   - Monitor revenue                             │
│   - Track user behavior                         │
│   - Alert on anomalies                          │
│   - Generate weekly reports                     │
└─────────────────────────────────────────────────┘
```

---

## STATE MANAGEMENT

### Global State File: `.gsd/STATE.md`

```markdown
# Factory State

## Current Project
name: "HydroTrack"
status: building
phase: 4
started: 2026-01-20T09:00:00Z

## Active Tasks
| ID | Agent | Task | Status | Progress |
|----|-------|------|--------|----------|
| T001 | builder | Create login page | running | 75% |
| T002 | builder | Set up database | completed | 100% |
| T003 | marketer | Write landing copy | queued | 0% |

## Completed Today
- [09:15] Research: Found 3 competitors, scored 72/100
- [10:30] Design: Generated 3 UI options, user picked #2
- [11:45] Builder: Database schema created
- [12:30] Builder: Auth system implemented

## Blocked Tasks
- T003: Waiting for T001 (needs app screenshots)

## Cost Today
- Claude API: $0.85
- Gemini: $0.12
- CapSolver: $0.04
- Total: $1.01

## Errors (Last 24h)
- [14:22] Browser Use: CAPTCHA failed on Reddit, retried with CapSolver
- Resolved: Yes
```

---

## ERROR HANDLING

### Retry Strategy

```yaml
retry_policy:
  default:
    max_attempts: 3
    backoff: exponential
    base_delay: 2s
    max_delay: 60s
  
  by_error_type:
    rate_limit:
      max_attempts: 5
      backoff: exponential
      base_delay: 30s
      
    captcha_failed:
      max_attempts: 3
      fallback: capsolver_api
      
    api_timeout:
      max_attempts: 3
      backoff: linear
      base_delay: 10s
      
    auth_expired:
      max_attempts: 1
      action: refresh_token
      
    unknown:
      max_attempts: 2
      fallback: alert_human
```

### Escalation Matrix

```
┌─────────────────────────────────────────────────┐
│ ERROR SEVERITY LEVELS                           │
├─────────────────────────────────────────────────┤
│ LOW: Log only, no alert                         │
│   - Transient network errors                    │
│   - Cache misses                                │
│                                                 │
│ MEDIUM: Retry + Slack/Telegram alert            │
│   - API rate limits                             │
│   - CAPTCHA challenges                          │
│   - Temporary service unavailable               │
│                                                 │
│ HIGH: Alert + pause related tasks               │
│   - Auth failures                               │
│   - Payment processing errors                   │
│   - Data validation failures                    │
│                                                 │
│ CRITICAL: Alert + pause all + require human     │
│   - Security issues                             │
│   - Data corruption risk                        │
│   - Budget exceeded                             │
│   - Unknown/unhandled errors                    │
└─────────────────────────────────────────────────┘
```

---

## COMMUNICATION PROTOCOL

### Agent-to-Agent Messages

```json
{
  "message_id": "msg_abc123",
  "timestamp": "2026-01-26T15:30:00Z",
  "from_agent": "researcher",
  "to_agent": "builder",
  "type": "task_handoff",
  "payload": {
    "task": "build_app",
    "context": {
      "app_name": "HydroTrack",
      "validation_score": 72,
      "competitors": ["WaterMinder", "Plant Nanny"],
      "target_price": 4.99,
      "must_have_feature": "push_reminders"
    },
    "artifacts": [
      ".gsd/research/competitors.md",
      ".gsd/research/market_analysis.md"
    ]
  }
}
```

### Agent Status Updates

```json
{
  "agent": "builder",
  "status": "working",
  "current_task": "T001",
  "progress": 75,
  "eta_minutes": 15,
  "cost_so_far": 0.43,
  "last_action": "Generated login form with v0",
  "next_action": "Implement auth logic"
}
```

---

## SUBAGENT SPAWNING

### When to Spawn Subagents

1. **Parallel work available**: Multiple independent tasks
2. **Specialized skill needed**: Task requires specific capability
3. **Context isolation**: Fresh context window for clean work
4. **Time pressure**: Need faster completion

### Subagent Configuration

```yaml
subagent_defaults:
  model: claude-3-5-haiku  # Fast and cheap
  max_tokens: 50000
  timeout: 300s
  
subagent_overrides:
  complex_reasoning:
    model: claude-3-5-sonnet
    max_tokens: 100000
    timeout: 600s
    
  code_generation:
    model: claude-3-5-sonnet
    max_tokens: 100000
    timeout: 900s
    
  simple_formatting:
    model: claude-3-5-haiku
    max_tokens: 20000
    timeout: 120s
```

### Subagent Result Merging

```python
def merge_subagent_results(results: list) -> dict:
    """
    Combine results from parallel subagents.
    """
    merged = {
        'success': all(r['success'] for r in results),
        'outputs': [],
        'errors': [],
        'total_cost': 0,
        'total_time': 0
    }
    
    for result in results:
        if result['success']:
            merged['outputs'].append(result['output'])
        else:
            merged['errors'].append(result['error'])
        
        merged['total_cost'] += result.get('cost', 0)
        merged['total_time'] = max(
            merged['total_time'], 
            result.get('time', 0)
        )
    
    return merged
```

---

## COMMANDS

The orchestrator responds to these slash commands:

| Command | Description |
|---------|-------------|
| `/status` | Show current state of all agents |
| `/tasks` | List all active and queued tasks |
| `/pause [agent]` | Pause agent or all agents |
| `/resume [agent]` | Resume paused agent(s) |
| `/retry [task_id]` | Retry a failed task |
| `/cancel [task_id]` | Cancel a task |
| `/cost` | Show current session cost |
| `/history` | Show completed tasks |
| `/reset` | Reset all state (careful!) |

---

## METRICS & MONITORING

### Key Performance Indicators

```yaml
orchestrator_kpis:
  task_success_rate:
    target: ">95%"
    alert_threshold: "<90%"
    
  average_task_time:
    target: "<5 minutes"
    alert_threshold: ">15 minutes"
    
  agent_utilization:
    target: "60-80%"
    alert_threshold: ">95% or <30%"
    
  cost_per_task:
    target: "<$0.10"
    alert_threshold: ">$0.50"
    
  error_rate:
    target: "<5%"
    alert_threshold: ">10%"
```

---

*Orchestrator Agent v4.0 - Coordinates all factory operations*
