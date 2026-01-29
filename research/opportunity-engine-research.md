# 24/7 Autonomous Opportunity Engine Research

**Date Added:** 2026-01-29
**Status:** Backlog - Needs Integration Planning
**Priority:** High - Addresses core autonomous discovery

---

## Overview

Building a 24/7 autonomous "Opportunity Engine" on Mac Mini that discovers profitable app ideas automatically using market signals.

## Core Concept

An "All-In-One" system that:
1. Continuously scans for market opportunities
2. Validates ideas with data (not guesses)
3. Generates complete strategy + roadmap
4. Feeds into autonomous app building pipeline

---

## Technical Stack Proposed

### Infrastructure
- **Docker** - Containerization
- **n8n** - Workflow automation (already in system)
- **PostgreSQL** - Database (need to add)
- **Ollama** - Local LLM hosting
- **DeepSeek-R1** (32b or 14b) - Local reasoning model

### Research Tools
- **gpt-researcher** - Python library for web research
- **Tavily API** - Web search (paid API)
- **PyTrends/Glimpse** - Google Trends data
- **Reddit API** - Forum scanning
- **FB Ad Library** - Competitor ad tracking

---

## The Complete Prompt

```
Build a "24/7 Digital Opportunity Engine" on this Mac Mini. Execute the following steps autonomously:

1. INFRASTRUCTURE:
   - Check if Docker is installed; if not, provide the brew command to install it.
   - Deploy n8n and PostgreSQL using a Docker Compose file. Ensure 'host.docker.internal' is mapped so it can talk to local services.
   - Install 'Ollama' via shell and pull the 'deepseek-r1:32b' (or 14b if RAM < 32GB) model.

2. RESEARCH AGENT SETUP:
   - Create a Python environment and install 'gpt-researcher'.
   - Configure gpt-researcher to use my Tavily API Key for web-wide scanning.
   - Build a 'Watcher' script that pings Google Trends (via Glimpse/PyTrends) and Reddit (r/smallbusiness, r/software) for "Pain Point" keywords.

3. STRATEGY ENGINE:
   - Define a "Success Score" logic: Topic must have >100% search growth, >10 active competitor ads in FB Ad Library, and a "Solution Gap" identified in forum comments.
   - For every high-score signal, generate:
     a) Product Name & Value Proposition (Positioned for "Help First" marketing).
     b) A "100-Signal Proof" Report (Synthesis of 100+ URLs/Comments).
     c) An "Exact Map to Money": Pricing tier, distribution channel (Gumroad/Udemy), and a 30-day launch checklist.

4. DATABASE & OUTPUT:
   - Connect the Python agent to the local PostgreSQL DB.
   - Export every "Green Light" idea to a local Markdown folder called 'Opportunities_Vault'.

Ready. Start with Step 1 and confirm each installation.
```

---

## Success Scoring Logic

### Criteria for "Green Light" Ideas

1. **Search Growth**: >100% increase (Google Trends)
2. **Competitive Validation**: >10 active competitor ads (FB Ad Library)
3. **Solution Gap**: Identified in forum comments (Reddit, forums)
4. **Technical Credibility**: Uses "Help First" positioning
5. **Proof Count**: 100+ signals (URLs, comments, data points)

### Output for Each Opportunity

- **Product Name** + Value Proposition
- **100-Signal Proof Report** (synthesized evidence)
- **Exact Map to Money**:
  - Pricing tier
  - Distribution channel (Gumroad/Udemy/etc)
  - 30-day launch checklist

---

## Technical Requirements

### Hardware
- **Mac Mini** (M2/M3/M4)
- **16GB+ RAM** (for 32b model)
- **Storage** for PostgreSQL + Docker

### Model Sizing
- **DeepSeek-R1 32b**: Full capability (32GB RAM recommended)
- **DeepSeek-R1 14b**: Lighter version (16GB RAM)
- **User Preference**: Avoid local models unless <500MB and fast

### 24/7 Stability
- Runs in Docker containers
- Won't clutter main OS
- Background operation during daily work

---

## How It Uses "Arbitrage Logic"

### The Proof System
- Doesn't guess - counts actual demand signals
- Cross-references customer pain ("I would pay for...") with active competitor ads
- Validates profitability before building

### The Positioning
- Uses "Technical Credibility" framework
- "Help First" approach (avoid "get rich quick")
- Focuses on technical friction (highest conversion rates)

---

## Integration Points with Current System

### Where This Fits

**Current System Flow:**
```
User Input → Validate → Build App → Deploy → ??? (missing ongoing management)
```

**Enhanced System Flow:**
```
24/7 Opportunity Scanning →
Auto-Validate (100-signal proof) →
Queue High-Score Ideas →
Auto-Build App →
Auto-Deploy →
Auto-Market (sales, SEO, content) →
Monitor & Iterate
```

### Specific Integration Points

1. **FRONT END - Idea Discovery**
   - Replace manual idea input with automated scanning
   - Feed into existing IdeaDiscovery component
   - Show "Auto-Discovered" badge vs "Manual Input"

2. **VALIDATION LAYER**
   - Enhance `/api/validate` with 100-signal proof
   - Add scoring dashboard (search growth, competitor count, solution gap)
   - Store evidence in database (URLs, comments, trends data)

3. **DATABASE**
   - Add PostgreSQL alongside SQLite
   - Store: opportunities, signals, proof reports, validation data
   - Export to `Opportunities_Vault/` markdown files

4. **AGENT ORCHESTRATION** (Currently Missing!)
   - Researcher Agent: Scans for opportunities 24/7
   - Validator Agent: Runs 100-signal proof
   - Builder Agent: Builds apps (already exists)
   - Marketer Agent: SEO, content, social (needs implementation)
   - Operator Agent: Monitors performance (needs implementation)

5. **BACK END - Ongoing Management**
   - Marketing automation (currently just docs)
   - SEO optimization (currently missing)
   - Content generation (currently missing)
   - Performance monitoring (currently missing)

---

## Key Advantages

### Automation Level
- **Current**: User types idea → system builds
- **Enhanced**: System finds idea → validates → builds → markets → monitors
- **User Role**: Approve/reject, not create

### Data-Driven
- No guessing
- 100+ signals per idea
- Competitor validation
- Market proof before building

### True Autonomy
- Runs 24/7
- No human intervention needed
- Self-feeding pipeline
- Continuous market scanning

---

## Gaps vs Current System

### What We Have
✅ Manual idea input
✅ AI validation (single-call)
✅ App building (multi-page)
✅ Stripe integration
✅ Deployment (Vercel tested)
✅ Cost tracking

### What's Missing (This Would Add)
❌ Automated opportunity discovery
❌ Deep validation (100-signal proof)
❌ Continuous market scanning
❌ Agent orchestration (real, not docs)
❌ Marketing automation (real implementation)
❌ SEO optimization
❌ Performance monitoring
❌ PostgreSQL database
❌ n8n workflow integration

---

## Implementation Considerations

### Local Model Concern
**User Preference**: "Avoid local models unless <500MB and fast"

**Options:**
1. **Skip Ollama/DeepSeek** - Use cloud APIs only (Gemini, DeepSeek API)
2. **Hybrid Approach** - Cloud for heavy lifting, tiny local model for simple tasks
3. **No Local Models** - 100% cloud-based (aligns with current system)

**Recommendation**: Skip local models, use existing cloud API infrastructure

### Docker on Mac Mini
- User mentioned Mac Mini (likely personal machine)
- Docker adds complexity
- Current system runs native (Next.js, SQLite, no containers)

**Recommendation**: Port logic to Node.js/Python scripts, skip Docker

### Research Tools
- gpt-researcher: Python library (can port to Node.js)
- PyTrends: Can use via Python subprocess or find Node.js alternative
- Reddit: Can use public JSON API (already implemented)
- FB Ad Library: Can scrape or use API

**Recommendation**: Implement in Node.js to match existing stack

---

## Proposed Lightweight Integration

### Phase 1: Automated Discovery (No Local Models)

```typescript
// New service: /lib/opportunity-scanner.ts

import { callAI } from './ai-provider'
import { ideas, db } from './db'

interface OpportunitySignal {
  source: string          // reddit, trends, forums
  keyword: string
  growth: number         // % increase
  competitorCount: number
  solutionGap: string    // identified gap
  proofCount: number     // # of signals
  urls: string[]         // evidence
}

async function scanOpportunities() {
  // 1. Scan Reddit for pain points (already have this)
  const redditSignals = await scanReddit()

  // 2. Check Google Trends (new - use API)
  const trendSignals = await scanTrends()

  // 3. Validate with AI (100-signal proof)
  const validated = await validateSignals([...redditSignals, ...trendSignals])

  // 4. Score and queue high performers
  const greenLights = validated.filter(s => s.score >= 80)

  // 5. Auto-queue for building
  for (const signal of greenLights) {
    ideas.create({
      title: signal.productName,
      description: signal.valueProposition,
      source: 'auto-discovered',
      score: signal.score,
      proof: JSON.stringify(signal.evidence),
      autoApproved: false // User still approves
    })
  }
}

// Run every 4 hours
setInterval(scanOpportunities, 4 * 60 * 60 * 1000)
```

### Phase 2: Enhanced Validation

Replace single-call validation with multi-source proof:

```typescript
// Enhanced /api/validate route

async function validate100Signals(idea: string) {
  // 1. Search web for demand signals
  const webSignals = await searchWeb(idea)

  // 2. Check competitor landscape
  const competitors = await findCompetitors(idea)

  // 3. Analyze solution gaps
  const gaps = await findGaps(idea)

  // 4. Synthesize 100+ data points
  const proof = {
    signals: [...webSignals, ...competitors, ...gaps],
    count: webSignals.length + competitors.length + gaps.length,
    score: calculateScore(webSignals, competitors, gaps)
  }

  return proof
}
```

### Phase 3: Agent Orchestration

Implement the actual agent system (currently just docs):

```typescript
// New: /lib/agent-orchestrator.ts

class AgentOrchestrator {
  async runResearcher() {
    // Scan for opportunities
    const signals = await scanOpportunities()
    return signals
  }

  async runValidator(signal: Signal) {
    // 100-signal proof
    const proof = await validate100Signals(signal)
    return proof
  }

  async runBuilder(validatedIdea: Idea) {
    // Build app (already exists)
    await buildApp(validatedIdea)
  }

  async runMarketer(app: App) {
    // NEW - Implement marketing automation
    await generateContent(app)
    await optimizeSEO(app)
    await postSocial(app)
  }

  async runOperator(app: App) {
    // NEW - Monitor performance
    await checkAnalytics(app)
    await updateContent(app)
    await respondToIssues(app)
  }
}
```

---

## Storage Structure

```
/research/
  opportunity-engine-research.md  ← This file

/backlog/
  opportunity-engine-integration.md  ← Integration plan (to be created in plan mode)

Future files:
/lib/opportunity-scanner.ts
/lib/100-signal-validator.ts
/lib/agent-orchestrator.ts
/agents/researcher-agent.ts (real code, not .md)
/agents/marketer-agent.ts (real code, not .md)
/agents/operator-agent.ts (real code, not .md)
```

---

## Next Steps

1. **REVIEW** - Complete system audit (front + back end)
2. **PLAN** - Enter plan mode to design integration
3. **DECISION POINTS**:
   - Skip local models? (Use cloud APIs only)
   - Skip Docker? (Use native Node.js)
   - PostgreSQL or SQLite? (SQLite is simpler)
   - Phase 1 only or full implementation?

---

## User Requirements Summary

✅ Save research to file (this file)
✅ Backlog for integration planning
⏳ Review where it fits (front + back end)
⏳ Consider full user journey (idea → build → ongoing management)
⏳ Design "never have to think" experience
⏳ Enter planning mode

**User Preference on Local Models:**
"Avoid using local models unless you can find ones that run on [Mac] that are less than 500M that work fast"

→ **Recommendation**: Skip Ollama/DeepSeek-R1, use cloud APIs (Gemini, DeepSeek API) for consistency with existing system.

---

## Related Documentation

- Current system: `/dashboard/COMPLETION_SUMMARY.md`
- Agent docs (not implemented): `/agents/*.md`
- Workflow templates: `/workflows/n8n-templates/`
- Reddit discovery: `/dashboard/src/components/IdeaDiscovery.tsx`

---

**Status**: Research captured. Ready for system review and planning mode.
