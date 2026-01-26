# UI Generation Skill
## Vercel v0 Integration & Component Generation

**Purpose**: Generate production-ready UI components using Vercel v0 with shadcn/ui integration

---

## OVERVIEW

### What is Vercel v0?

v0 is Vercel's AI-powered UI generation tool that creates React components from natural language descriptions. It produces production-ready code using:
- React / Next.js
- Tailwind CSS
- shadcn/ui components
- Radix UI primitives
- Lucide icons

### Pricing (January 2026)

| Plan | Cost | Credits | Best For |
|------|------|---------|----------|
| **Free** | $0/mo | 200 credits | Testing, learning |
| **Premium** | $20/mo | 5000 credits | Regular use |
| **Team** | $30/user/mo | 10000 credits | Production apps |

**Credit Usage:**
- Simple component: 1-2 credits
- Complex component: 3-5 credits
- Full page: 5-10 credits
- Iteration/refinement: 1-2 credits each

### When to Use v0

```
┌─────────────────────────────────────────────────────────────────┐
│                    V0 DECISION TREE                             │
├─────────────────────────────────────────────────────────────────┤
│  Need UI component?                                             │
│  ├─ Yes                                                         │
│  │   └─ Is it a common pattern (form, dashboard, card)?         │
│  │       ├─ Yes → USE V0 (fast, production-ready)               │
│  │       └─ No → Is visual design important?                    │
│  │           ├─ Yes → USE V0 (great design defaults)            │
│  │           └─ No → Write manually (more control)              │
│  └─ No                                                          │
│      └─ Don't use v0                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## SETUP & AUTHENTICATION

### API Setup

```bash
# Install v0 CLI
npm install -g @vercel/v0

# Login to Vercel
npx v0 login

# Verify authentication
npx v0 whoami
```

### Environment Configuration

```bash
# .env
V0_API_KEY=v0_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
V0_TEAM_ID=team_xxxxxxxxxxxx  # Optional for team accounts
```

### Client Initialization

```javascript
// v0-client.js
class V0Client {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.V0_API_KEY;
    this.baseUrl = 'https://api.v0.dev/v1';
    this.creditsUsed = 0;
  }

  async generate(prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        framework: options.framework || 'nextjs',
        styling: options.styling || 'tailwind',
        typescript: options.typescript !== false,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`v0 API error: ${response.statusText}`);
    }

    const result = await response.json();
    this.creditsUsed += result.creditsUsed || 1;

    return result;
  }

  async iterate(generationId, feedback) {
    const response = await fetch(`${this.baseUrl}/iterate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        generationId,
        feedback
      })
    });

    const result = await response.json();
    this.creditsUsed += result.creditsUsed || 1;

    return result;
  }

  getCreditsUsed() {
    return this.creditsUsed;
  }
}

module.exports = V0Client;
```

---

## PROMPT TEMPLATES

### Dashboard Components

```javascript
// prompts/dashboard.js
const dashboardPrompts = {
  // Analytics Dashboard
  analyticsDashboard: (config) => `
    Create an analytics dashboard component with:

    Stats Cards (top row):
    - Total Users: ${config.metrics?.users || 'dynamic'}
    - Revenue: ${config.metrics?.revenue || 'dynamic'}
    - Active Sessions: ${config.metrics?.sessions || 'dynamic'}
    - Conversion Rate: ${config.metrics?.conversion || 'dynamic'}

    Charts (main area):
    - Line chart for ${config.primaryChart || 'daily revenue'} (use Recharts)
    - Bar chart for ${config.secondaryChart || 'user signups by source'}

    Style:
    - ${config.theme || 'Light'} theme
    - Brand color: ${config.brandColor || '#3B82F6'}
    - Responsive grid layout
    - Cards with subtle shadows
    - Clean, minimal design

    Include:
    - Date range picker in header
    - Refresh button
    - Export to CSV button
    - Loading skeletons for data

    Use shadcn/ui components.
  `,

  // KPI Cards
  kpiCards: (metrics) => `
    Create a responsive grid of KPI cards showing:
    ${metrics.map(m => `- ${m.label}: ${m.format || 'number'}`).join('\n')}

    Each card should have:
    - Icon (use Lucide)
    - Metric value (large, bold)
    - Label
    - Trend indicator (up/down arrow with percentage)
    - Subtle background color based on trend

    Use shadcn Card component. Make it responsive (4 cols on desktop, 2 on tablet, 1 on mobile).
  `,

  // Data Table
  dataTable: (config) => `
    Create a data table component for ${config.entity || 'users'}:

    Columns:
    ${config.columns.map(c => `- ${c.name} (${c.type})`).join('\n')}

    Features:
    - Sortable columns
    - Search/filter input
    - Pagination (10/25/50 per page)
    - Row selection with checkboxes
    - Action dropdown per row (view, edit, delete)
    - Bulk actions toolbar

    Style:
    - Use shadcn Table component
    - Zebra striping
    - Hover highlight
    - Sticky header

    Make it accept data as prop: ${config.dataShape || 'array of objects'}
  `
};

module.exports = dashboardPrompts;
```

### Form Components

```javascript
// prompts/forms.js
const formPrompts = {
  // Signup Form
  signupForm: (config) => `
    Create a user signup form with:

    Fields:
    - Full name (required)
    - Email (required, validated)
    - Password (required, min 8 chars, show strength indicator)
    - Confirm password (must match)
    ${config.extraFields?.map(f => `- ${f}`).join('\n') || ''}

    Features:
    - Real-time validation
    - Show/hide password toggle
    - Password strength meter (weak/medium/strong)
    - Loading state on submit
    - Error messages below fields
    - Success state

    Additional:
    - "Sign up with Google" button (OAuth style)
    - "Sign up with GitHub" button
    - Link to login page
    - Terms of service checkbox

    Style:
    - Centered card layout
    - Max width 400px
    - Clean, modern look
    - Brand color: ${config.brandColor || '#3B82F6'}

    Use shadcn/ui form components with react-hook-form.
  `,

  // Settings Form
  settingsForm: (sections) => `
    Create a settings page with tabbed sections:

    Tabs:
    ${sections.map(s => `- ${s.name}: ${s.fields.join(', ')}`).join('\n')}

    Features per section:
    - Form validation
    - Save button per section
    - Reset to defaults option
    - Unsaved changes warning

    Style:
    - Vertical tabs on desktop, horizontal on mobile
    - Card per section
    - Save button fixed at bottom

    Use shadcn Tabs, Form, and Input components.
  `,

  // Multi-step Form
  multiStepForm: (steps) => `
    Create a multi-step form wizard:

    Steps:
    ${steps.map((s, i) => `${i + 1}. ${s.name}: ${s.fields.join(', ')}`).join('\n')}

    Features:
    - Step indicator at top (numbered circles)
    - Next/Previous buttons
    - Validation before proceeding
    - Save progress (localStorage)
    - Skip optional steps
    - Summary/review step before submit
    - Success confirmation page

    Style:
    - Clean progress indicator
    - Animated transitions between steps
    - Current step highlighted
    - Completed steps with checkmark

    Use shadcn Progress, Button, and Form components.
  `,

  // Contact Form
  contactForm: (config) => `
    Create a contact form with:

    Fields:
    - Name (required)
    - Email (required)
    - Subject (dropdown: ${config.subjects?.join(', ') || 'General, Support, Sales'})
    - Message (textarea, required, min 20 chars)
    ${config.hasPhone ? '- Phone (optional)' : ''}

    Features:
    - Character count for message
    - Spam protection (honeypot field)
    - Rate limiting notice
    - Success message with ticket number
    - Email confirmation checkbox

    Style:
    - Card with subtle shadow
    - Clear labels
    - Helpful placeholders

    Include a FAQ accordion below the form.
  `
};

module.exports = formPrompts;
```

### Landing Page Components

```javascript
// prompts/landing.js
const landingPrompts = {
  // Hero Section
  hero: (config) => `
    Create a hero section for ${config.productName || 'a SaaS product'}:

    Content:
    - Headline: "${config.headline || 'Build faster with AI'}"
    - Subheadline: "${config.subheadline || 'The modern way to ship products'}"
    - Primary CTA: "${config.primaryCta || 'Get Started Free'}"
    - Secondary CTA: "${config.secondaryCta || 'Watch Demo'}"

    Visual:
    - ${config.visual || 'Product screenshot mockup on the right'}
    - Gradient background (${config.gradientColors || 'blue to purple'})
    - Subtle animated particles or grid pattern

    Style:
    - Full viewport height
    - Text left, visual right (stacked on mobile)
    - Large, bold headline
    - Brand color: ${config.brandColor || '#3B82F6'}

    Include navigation bar with logo and menu items.
  `,

  // Features Section
  features: (features) => `
    Create a features grid section:

    Features:
    ${features.map(f => `- ${f.title}: ${f.description} (icon: ${f.icon || 'auto'})`).join('\n')}

    Layout:
    - 3 columns on desktop, 2 on tablet, 1 on mobile
    - Each feature in a card with icon, title, description
    - Icons from Lucide

    Style:
    - Section heading: "Features" with subtext
    - Cards with hover lift effect
    - Consistent icon sizing (48px)
    - Subtle gradient on icon backgrounds
  `,

  // Pricing Section
  pricing: (plans) => `
    Create a pricing section with ${plans.length} tiers:

    Plans:
    ${plans.map(p => `
    - ${p.name} ($${p.price}/${p.interval || 'month'}):
      Features: ${p.features.join(', ')}
      ${p.highlighted ? 'HIGHLIGHTED (most popular)' : ''}
      CTA: "${p.cta || 'Get Started'}"
    `).join('\n')}

    Features:
    - Monthly/Annual toggle (show annual discount)
    - Highlighted "Most Popular" plan
    - Feature comparison checkmarks
    - FAQ accordion below

    Style:
    - Cards side by side
    - Highlighted card slightly raised with border
    - Clean, easy to scan
    - Current plan indicator (if logged in)
  `,

  // Testimonials
  testimonials: (count) => `
    Create a testimonials section:

    Layout:
    - ${count || 3} testimonial cards
    - Auto-rotating carousel on mobile
    - Grid on desktop

    Each testimonial:
    - Quote text
    - Author name
    - Author role/company
    - Author avatar (placeholder)
    - Star rating (5 stars)

    Style:
    - Quote marks decoration
    - Cards with subtle shadow
    - Company logos below testimonials
    - Smooth carousel animation
  `,

  // CTA Section
  ctaSection: (config) => `
    Create a call-to-action section:

    Content:
    - Headline: "${config.headline || 'Ready to get started?'}"
    - Subtext: "${config.subtext || 'Join thousands of happy customers'}"
    - Primary button: "${config.buttonText || 'Start Free Trial'}"
    - No credit card required text

    Style:
    - Full-width gradient background
    - Centered text
    - Large button
    - Floating decorative elements

    Optional: Email input for newsletter signup instead of button.
  `
};

module.exports = landingPrompts;
```

---

## COMPONENT EXTRACTION

### Parsing v0 Output

```javascript
// component-extractor.js
const fs = require('fs');
const path = require('path');

class ComponentExtractor {
  constructor(outputDir) {
    this.outputDir = outputDir || './components';
  }

  // Extract code blocks from v0 response
  extractComponents(v0Response) {
    const components = [];

    // v0 returns components in code blocks
    const codeBlockRegex = /```(?:tsx?|jsx?)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(v0Response.code)) !== null) {
      const code = match[1];
      const componentInfo = this.parseComponent(code);
      components.push(componentInfo);
    }

    return components;
  }

  // Parse component name and dependencies
  parseComponent(code) {
    // Extract component name
    const exportMatch = code.match(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/);
    const componentName = exportMatch ? exportMatch[1] : 'Component';

    // Extract imports
    const imports = [];
    const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
    let importMatch;

    while ((importMatch = importRegex.exec(code)) !== null) {
      imports.push(importMatch[1]);
    }

    // Categorize dependencies
    const dependencies = {
      shadcn: imports.filter(i => i.startsWith('@/components/ui')),
      external: imports.filter(i => !i.startsWith('@/') && !i.startsWith('.')),
      internal: imports.filter(i => i.startsWith('@/') && !i.startsWith('@/components/ui'))
    };

    return {
      name: componentName,
      code,
      dependencies,
      imports
    };
  }

  // Save component to file system
  async saveComponent(component, subDir = '') {
    const dir = path.join(this.outputDir, subDir);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileName = this.toKebabCase(component.name) + '.tsx';
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, component.code, 'utf8');

    return {
      path: filePath,
      relativePath: path.join(subDir, fileName)
    };
  }

  // Convert PascalCase to kebab-case
  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  // Generate index file for exports
  generateIndex(components) {
    const exports = components.map(c =>
      `export { ${c.name} } from './${this.toKebabCase(c.name)}';`
    );

    return exports.join('\n');
  }
}

module.exports = ComponentExtractor;
```

### shadcn/ui Integration

```javascript
// shadcn-setup.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ShadcnSetup {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.componentsDir = path.join(projectDir, 'components/ui');
  }

  // Initialize shadcn/ui in project
  async init() {
    console.log('Initializing shadcn/ui...');

    // Check if already initialized
    if (fs.existsSync(path.join(this.projectDir, 'components.json'))) {
      console.log('shadcn/ui already initialized');
      return;
    }

    // Run init command
    execSync('npx shadcn@latest init -y', {
      cwd: this.projectDir,
      stdio: 'inherit'
    });
  }

  // Install required shadcn components
  async installComponents(componentNames) {
    const existing = this.getInstalledComponents();
    const toInstall = componentNames.filter(c => !existing.includes(c));

    if (toInstall.length === 0) {
      console.log('All required components already installed');
      return;
    }

    console.log(`Installing shadcn components: ${toInstall.join(', ')}`);

    execSync(`npx shadcn@latest add ${toInstall.join(' ')} -y`, {
      cwd: this.projectDir,
      stdio: 'inherit'
    });
  }

  // Get list of installed shadcn components
  getInstalledComponents() {
    if (!fs.existsSync(this.componentsDir)) {
      return [];
    }

    return fs.readdirSync(this.componentsDir)
      .filter(f => f.endsWith('.tsx'))
      .map(f => f.replace('.tsx', ''));
  }

  // Extract required shadcn components from v0 code
  extractRequiredComponents(code) {
    const shadcnImports = code.match(/@\/components\/ui\/(\w+)/g) || [];
    return [...new Set(shadcnImports.map(i => i.split('/').pop()))];
  }
}

module.exports = ShadcnSetup;
```

---

## ITERATION WORKFLOW

### Refining Generated Components

```javascript
// iteration-workflow.js
const V0Client = require('./v0-client');
const ComponentExtractor = require('./component-extractor');

class V0Workflow {
  constructor(options = {}) {
    this.v0 = new V0Client(options.apiKey);
    this.extractor = new ComponentExtractor(options.outputDir);
    this.maxIterations = options.maxIterations || 5;
  }

  // Generate and iterate until satisfied
  async generateWithFeedback(prompt, feedbackFn) {
    let generation = await this.v0.generate(prompt);
    let iteration = 0;

    while (iteration < this.maxIterations) {
      // Show current generation to feedback function
      const feedback = await feedbackFn(generation, iteration);

      if (!feedback || feedback.approved) {
        console.log(`Component approved after ${iteration} iterations`);
        break;
      }

      // Iterate with feedback
      generation = await this.v0.iterate(generation.id, feedback.message);
      iteration++;
    }

    return generation;
  }

  // Common iteration prompts
  getIterationPrompts() {
    return {
      makeResponsive: 'Make this component fully responsive. It should stack vertically on mobile (< 768px) and use the current layout on desktop.',

      addDarkMode: 'Add dark mode support using Tailwind dark: variants. Ensure all colors work in both light and dark modes.',

      addLoadingState: 'Add a loading state with skeleton placeholders. The component should accept an isLoading prop.',

      addErrorState: 'Add an error state with an error message and retry button. Accept an error prop.',

      improveAccessibility: 'Improve accessibility: add proper ARIA labels, keyboard navigation, and focus states.',

      addAnimations: 'Add subtle animations: entrance animations, hover effects, and transitions. Keep it professional.',

      simplifyDesign: 'Simplify the design. Remove unnecessary elements, reduce visual noise, increase whitespace.',

      changeColor: (color) => `Change the primary brand color to ${color}. Update all related colors to maintain harmony.`,

      addFeature: (feature) => `Add this feature: ${feature}. Integrate it naturally with the existing design.`,

      fixIssue: (issue) => `Fix this issue: ${issue}`
    };
  }
}

module.exports = V0Workflow;
```

### Interactive Feedback Loop

```javascript
// interactive-iterate.js
const readline = require('readline');
const V0Workflow = require('./iteration-workflow');

async function interactiveGenerate(initialPrompt) {
  const workflow = new V0Workflow();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question) => {
    return new Promise(resolve => {
      rl.question(question, resolve);
    });
  };

  const result = await workflow.generateWithFeedback(
    initialPrompt,
    async (generation, iteration) => {
      console.log('\n--- Generated Component ---');
      console.log(generation.code);
      console.log('---------------------------\n');

      const response = await askQuestion(
        'Enter feedback (or "done" to approve, "skip" to use as-is): '
      );

      if (response.toLowerCase() === 'done') {
        return { approved: true };
      }

      if (response.toLowerCase() === 'skip') {
        return { approved: true };
      }

      return { approved: false, message: response };
    }
  );

  rl.close();
  return result;
}

module.exports = { interactiveGenerate };
```

---

## COST OPTIMIZATION

### Credit Tracking

```javascript
// cost-tracker.js
class V0CostTracker {
  constructor() {
    this.usage = {
      generations: 0,
      iterations: 0,
      totalCredits: 0,
      byComponent: {}
    };

    this.pricing = {
      simpleGeneration: 2,
      complexGeneration: 5,
      fullPage: 10,
      iteration: 1
    };
  }

  recordGeneration(componentName, complexity = 'simple') {
    const credits = this.pricing[`${complexity}Generation`] || this.pricing.simpleGeneration;

    this.usage.generations++;
    this.usage.totalCredits += credits;
    this.usage.byComponent[componentName] = (this.usage.byComponent[componentName] || 0) + credits;

    return credits;
  }

  recordIteration(componentName) {
    this.usage.iterations++;
    this.usage.totalCredits += this.pricing.iteration;
    this.usage.byComponent[componentName] = (this.usage.byComponent[componentName] || 0) + this.pricing.iteration;

    return this.pricing.iteration;
  }

  estimateCost(monthlyCredits = 5000, planCost = 20) {
    const costPerCredit = planCost / monthlyCredits;
    return {
      totalCredits: this.usage.totalCredits,
      estimatedCost: `$${(this.usage.totalCredits * costPerCredit).toFixed(2)}`,
      remainingCredits: monthlyCredits - this.usage.totalCredits,
      usagePercent: `${((this.usage.totalCredits / monthlyCredits) * 100).toFixed(1)}%`
    };
  }

  getReport() {
    return {
      ...this.usage,
      ...this.estimateCost()
    };
  }
}

module.exports = V0CostTracker;
```

### Batch Generation Strategy

```javascript
// batch-strategy.js
async function optimizedBatchGenerate(components, v0Client) {
  // Sort by complexity (simple first)
  const sorted = components.sort((a, b) => {
    const complexity = { simple: 1, medium: 2, complex: 3 };
    return (complexity[a.complexity] || 2) - (complexity[b.complexity] || 2);
  });

  const results = [];

  // Generate similar components together (may share patterns)
  const groups = groupByType(sorted);

  for (const [type, items] of Object.entries(groups)) {
    console.log(`Generating ${items.length} ${type} components...`);

    for (const item of items) {
      // Add context from previously generated components of same type
      const context = results
        .filter(r => r.type === type)
        .map(r => r.code)
        .join('\n\n');

      const prompt = context
        ? `Following the same style as previous components:\n\n${item.prompt}`
        : item.prompt;

      const result = await v0Client.generate(prompt);
      results.push({
        ...item,
        code: result.code,
        generationId: result.id
      });

      // Small delay to avoid rate limits
      await sleep(1000);
    }
  }

  return results;
}

function groupByType(components) {
  return components.reduce((groups, comp) => {
    const type = comp.type || 'misc';
    groups[type] = groups[type] || [];
    groups[type].push(comp);
    return groups;
  }, {});
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { optimizedBatchGenerate };
```

---

## COMPLETE EXAMPLES

### Generate Full Dashboard

```javascript
// examples/generate-dashboard.js
const V0Client = require('../v0-client');
const ComponentExtractor = require('../component-extractor');
const ShadcnSetup = require('../shadcn-setup');
const dashboardPrompts = require('../prompts/dashboard');

async function generateDashboard(config) {
  const v0 = new V0Client();
  const extractor = new ComponentExtractor('./src/components/dashboard');
  const shadcn = new ShadcnSetup('./');

  console.log('Generating analytics dashboard...');

  // 1. Generate the main dashboard
  const dashboardResult = await v0.generate(
    dashboardPrompts.analyticsDashboard({
      metrics: {
        users: 'totalUsers',
        revenue: 'monthlyRevenue',
        sessions: 'activeSessions',
        conversion: 'conversionRate'
      },
      theme: config.theme || 'Light',
      brandColor: config.brandColor || '#3B82F6',
      primaryChart: 'revenue over time',
      secondaryChart: 'signups by channel'
    })
  );

  // 2. Generate KPI cards separately
  const kpiResult = await v0.generate(
    dashboardPrompts.kpiCards([
      { label: 'Total Revenue', format: 'currency' },
      { label: 'Active Users', format: 'number' },
      { label: 'Conversion Rate', format: 'percent' },
      { label: 'Avg Session', format: 'duration' }
    ])
  );

  // 3. Generate data table
  const tableResult = await v0.generate(
    dashboardPrompts.dataTable({
      entity: 'users',
      columns: [
        { name: 'Name', type: 'string' },
        { name: 'Email', type: 'string' },
        { name: 'Plan', type: 'badge' },
        { name: 'Revenue', type: 'currency' },
        { name: 'Joined', type: 'date' }
      ],
      dataShape: 'User[]'
    })
  );

  // 4. Extract and save components
  const components = [
    ...extractor.extractComponents(dashboardResult),
    ...extractor.extractComponents(kpiResult),
    ...extractor.extractComponents(tableResult)
  ];

  for (const comp of components) {
    await extractor.saveComponent(comp);
  }

  // 5. Install required shadcn components
  const requiredShadcn = components.flatMap(c =>
    shadcn.extractRequiredComponents(c.code)
  );
  await shadcn.installComponents([...new Set(requiredShadcn)]);

  // 6. Generate index file
  const indexContent = extractor.generateIndex(components);
  require('fs').writeFileSync(
    './src/components/dashboard/index.ts',
    indexContent
  );

  console.log(`Generated ${components.length} components`);
  console.log(`Credits used: ${v0.getCreditsUsed()}`);

  return {
    components,
    creditsUsed: v0.getCreditsUsed()
  };
}

module.exports = { generateDashboard };
```

### Generate Landing Page

```javascript
// examples/generate-landing.js
const V0Client = require('../v0-client');
const ComponentExtractor = require('../component-extractor');
const landingPrompts = require('../prompts/landing');

async function generateLandingPage(config) {
  const v0 = new V0Client();
  const extractor = new ComponentExtractor('./src/components/landing');

  const sections = [];

  // 1. Hero Section
  console.log('Generating hero section...');
  const heroResult = await v0.generate(
    landingPrompts.hero({
      productName: config.productName,
      headline: config.headline,
      subheadline: config.subheadline,
      primaryCta: config.ctaText || 'Start Free Trial',
      secondaryCta: 'See Demo',
      visual: 'App screenshot in a MacBook mockup',
      brandColor: config.brandColor
    })
  );
  sections.push({ name: 'Hero', result: heroResult });

  // 2. Features Section
  console.log('Generating features section...');
  const featuresResult = await v0.generate(
    landingPrompts.features(config.features || [
      { title: 'Fast', description: 'Lightning fast performance', icon: 'Zap' },
      { title: 'Secure', description: 'Enterprise-grade security', icon: 'Shield' },
      { title: 'Scalable', description: 'Grows with your business', icon: 'TrendingUp' }
    ])
  );
  sections.push({ name: 'Features', result: featuresResult });

  // 3. Pricing Section
  console.log('Generating pricing section...');
  const pricingResult = await v0.generate(
    landingPrompts.pricing(config.plans || [
      { name: 'Starter', price: 0, interval: 'month', features: ['1 user', '1GB storage'], cta: 'Get Started' },
      { name: 'Pro', price: 29, interval: 'month', features: ['5 users', '10GB storage', 'Priority support'], highlighted: true, cta: 'Start Trial' },
      { name: 'Enterprise', price: 99, interval: 'month', features: ['Unlimited users', '100GB storage', 'Custom integrations'], cta: 'Contact Sales' }
    ])
  );
  sections.push({ name: 'Pricing', result: pricingResult });

  // 4. Testimonials
  console.log('Generating testimonials section...');
  const testimonialsResult = await v0.generate(
    landingPrompts.testimonials(3)
  );
  sections.push({ name: 'Testimonials', result: testimonialsResult });

  // 5. CTA Section
  console.log('Generating CTA section...');
  const ctaResult = await v0.generate(
    landingPrompts.ctaSection({
      headline: 'Ready to transform your workflow?',
      subtext: 'Join 10,000+ teams already using ' + config.productName,
      buttonText: 'Start Free Trial'
    })
  );
  sections.push({ name: 'CTA', result: ctaResult });

  // Extract and save all components
  const allComponents = [];
  for (const section of sections) {
    const components = extractor.extractComponents(section.result);
    for (const comp of components) {
      await extractor.saveComponent(comp, section.name.toLowerCase());
    }
    allComponents.push(...components);
  }

  console.log(`Generated ${allComponents.length} landing page components`);
  console.log(`Credits used: ${v0.getCreditsUsed()}`);

  return {
    sections,
    components: allComponents,
    creditsUsed: v0.getCreditsUsed()
  };
}

module.exports = { generateLandingPage };
```

---

## BEST PRACTICES

### Prompt Writing Tips

```javascript
// Effective prompts are:
// 1. Specific about layout and dimensions
// 2. Clear about interactivity (hover, click, etc.)
// 3. Explicit about responsive behavior
// 4. Descriptive about visual style

// GOOD prompt:
const goodPrompt = `
Create a user profile card (400px max width) with:
- Circular avatar (64px) top-left
- Name (18px, semibold) and title (14px, gray) to the right of avatar
- Bio text below (14px, 3 lines max with ellipsis)
- Stats row: posts, followers, following (centered, bold numbers)
- "Follow" button (full width, blue, rounded)

Hover: Card lifts with shadow
Click: Follow button toggles to "Following" (gray outline)
Mobile: Stack elements vertically
`;

// BAD prompt (too vague):
const badPrompt = `Make a profile card with user info and a follow button`;
```

### Do's and Don'ts

**Do:**
- Be specific about sizes, colors, spacing
- Mention responsive breakpoints
- Specify interaction states (hover, focus, active)
- Reference shadcn/ui components by name
- Include accessibility requirements

**Don't:**
- Use vague terms like "nice" or "modern"
- Forget mobile layouts
- Skip error/loading states
- Assume colors (specify hex codes)
- Over-complicate single components

---

*UI Generation Skill v4.0 - Vercel v0 Integration*
