# 🌐 Browser Automation Skill
## CAPTCHA Bypass & Signup Automation

**Purpose**: Automate any browser task including signups, form filling, and data extraction

---

## TOOL SELECTION

### Primary: Browser Use (Open Source)

```bash
# Installation
npm install browser-use
# or
pip install browser-use
```

**Pros:**
- Open source, free to self-host
- 50k+ GitHub stars
- Active community
- Claude/GPT integration built-in
- $30/month hosted version available

**Cons:**
- Requires some setup
- Rate limited on free tier

### Fallback: Manus AI

**When to use Manus:**
- Complex multi-step research
- Tasks that need to run for hours
- When Browser Use fails
- Async background tasks

**Access:**
- Note: Meta acquired Manus in late 2025
- Browser Operator extension still available
- Signups may be paused - check manus.im

---

## CAPTCHA HANDLING STRATEGY

### Layer 1: Avoidance (Free)

Before solving, try to avoid triggering CAPTCHAs:

```javascript
// browser-use-config.js
module.exports = {
  stealth: {
    enabled: true,
    
    // Spoof browser fingerprint
    userAgent: 'random_realistic',
    viewport: { width: 1920, height: 1080 },
    timezone: 'America/New_York',
    locale: 'en-US',
    
    // Human-like behavior
    mouseMovements: 'bezier_curve',
    typingSpeed: 'variable',  // 50-150ms between keystrokes
    clickDelay: 'random',     // 100-300ms
    
    // Anti-detection
    webdriver: false,
    chrome: true,
    permissions: ['geolocation', 'notifications'],
    plugins: ['PDF Viewer', 'Chrome PDF Plugin']
  },
  
  proxy: {
    enabled: true,
    type: 'residential',  // residential > datacenter
    rotation: 'per_session',
    provider: 'brightdata'  // or smartproxy, oxylabs
  }
}
```

### Layer 2: Solving (Paid)

When CAPTCHAs appear, solve them:

```javascript
// capsolver-integration.js
const CapSolver = require('capsolver-npm');

const solver = new CapSolver(process.env.CAPSOLVER_API_KEY);

async function solveCaptcha(type, params) {
  const solutions = {
    'recaptcha_v2': async () => {
      return await solver.recaptchaV2({
        websiteURL: params.url,
        websiteKey: params.siteKey,
        proxy: params.proxy
      });
    },
    
    'recaptcha_v3': async () => {
      return await solver.recaptchaV3({
        websiteURL: params.url,
        websiteKey: params.siteKey,
        pageAction: params.action,
        minScore: 0.7
      });
    },
    
    'hcaptcha': async () => {
      return await solver.hCaptcha({
        websiteURL: params.url,
        websiteKey: params.siteKey
      });
    },
    
    'cloudflare_turnstile': async () => {
      return await solver.turnstile({
        websiteURL: params.url,
        websiteKey: params.siteKey
      });
    }
  };
  
  return await solutions[type]();
}

// Cost tracking
const CAPTCHA_COSTS = {
  'recaptcha_v2': 0.002,
  'recaptcha_v3': 0.003,
  'hcaptcha': 0.001,
  'cloudflare_turnstile': 0.002
};
```

### Layer 3: AI Vision (Experimental)

For image CAPTCHAs, use vision models:

```python
# ai-captcha-solve.py
import anthropic
import base64

client = anthropic.Anthropic()

def solve_image_captcha(image_path, instructions):
    """
    Use Claude's vision to solve image CAPTCHAs.
    Works for: text recognition, object selection, puzzles
    """
    with open(image_path, 'rb') as f:
        image_data = base64.b64encode(f.read()).decode()
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=100,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_data
                    }
                },
                {
                    "type": "text",
                    "text": f"CAPTCHA Instructions: {instructions}\n\nRespond ONLY with the answer, nothing else."
                }
            ]
        }]
    )
    
    return response.content[0].text.strip()
```

---

## SIGNUP AUTOMATION SCRIPTS

### Generic Email Signup

```javascript
// signup-email.js
const { Browser } = require('browser-use');

async function signupWithEmail(config) {
  const browser = await Browser.launch({
    headless: false,  // Set true for production
    stealth: true
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to signup page
    await page.goto(config.signupUrl);
    await page.waitForTimeout(randomDelay(1000, 2000));
    
    // Fill email
    await page.type(config.selectors.email, config.email, {
      delay: randomDelay(50, 150)
    });
    
    // Fill password
    await page.type(config.selectors.password, config.password, {
      delay: randomDelay(50, 150)
    });
    
    // Handle CAPTCHA if present
    const captchaPresent = await page.$(config.selectors.captcha);
    if (captchaPresent) {
      const solution = await solveCaptcha('recaptcha_v2', {
        url: config.signupUrl,
        siteKey: await getCaptchaSiteKey(page)
      });
      
      await page.evaluate((token) => {
        document.querySelector('[name="g-recaptcha-response"]').value = token;
        // Trigger callback if exists
        if (typeof ___grecaptcha_cfg !== 'undefined') {
          Object.keys(___grecaptcha_cfg.clients).forEach(key => {
            ___grecaptcha_cfg.clients[key].callback(token);
          });
        }
      }, solution);
    }
    
    // Submit form
    await page.click(config.selectors.submit);
    await page.waitForNavigation({ timeout: 30000 });
    
    // Check for success
    const success = await page.$(config.selectors.successIndicator);
    
    return {
      success: !!success,
      url: page.url(),
      message: success ? 'Signup successful' : 'Signup may have failed'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

### OAuth Signup (GitHub/Google)

```javascript
// signup-oauth.js
async function signupWithOAuth(config) {
  const browser = await Browser.launch({ stealth: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(config.signupUrl);
    
    // Click OAuth button
    await page.click(config.selectors.oauthButton);
    
    // Wait for OAuth provider page
    await page.waitForNavigation();
    
    // Handle provider-specific flow
    if (page.url().includes('github.com')) {
      await handleGitHubOAuth(page, config.credentials);
    } else if (page.url().includes('accounts.google.com')) {
      await handleGoogleOAuth(page, config.credentials);
    }
    
    // Wait for redirect back to app
    await page.waitForNavigation({ timeout: 60000 });
    
    return { success: true, url: page.url() };
    
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

async function handleGitHubOAuth(page, credentials) {
  // Already logged in to GitHub?
  if (await page.$('[data-login-button]')) {
    // Need to authorize
    await page.click('[data-login-button]');
  } else {
    // Need to login first
    await page.type('#login_field', credentials.email);
    await page.type('#password', credentials.password);
    await page.click('[type="submit"]');
    
    // Wait for 2FA if enabled
    const twoFaField = await page.$('#app_totp');
    if (twoFaField) {
      // Would need to handle 2FA - usually via authenticator app
      throw new Error('2FA required - manual intervention needed');
    }
    
    // Authorize app
    await page.waitForSelector('[data-login-button]');
    await page.click('[data-login-button]');
  }
}
```

---

## SERVICE-SPECIFIC SCRIPTS

### Vercel Signup

```javascript
// services/vercel-signup.js
const VERCEL_CONFIG = {
  signupUrl: 'https://vercel.com/signup',
  method: 'github_oauth',
  selectors: {
    githubButton: '[data-testid="github-login-button"]',
    successIndicator: '[data-testid="dashboard"]'
  },
  captcha: 'none',
  difficulty: 'easy'
};

async function signupVercel(githubCredentials) {
  return await signupWithOAuth({
    ...VERCEL_CONFIG,
    credentials: githubCredentials
  });
}
```

### Stripe Setup

```javascript
// services/stripe-setup.js
const STRIPE_CONFIG = {
  signupUrl: 'https://dashboard.stripe.com/register',
  method: 'email',
  selectors: {
    email: '#email',
    password: '#password',
    country: '#country',
    submit: '[type="submit"]',
    captcha: '.grecaptcha-badge',
    successIndicator: '[data-testid="dashboard"]'
  },
  captcha: 'recaptcha_v3',
  difficulty: 'medium',
  manualSteps: [
    'Verify email',
    'Complete business details',
    'Connect bank account'
  ]
};

async function setupStripe(credentials, businessDetails) {
  // Note: Stripe requires manual verification
  // This automates initial signup only
  
  const result = await signupWithEmail({
    ...STRIPE_CONFIG,
    email: credentials.email,
    password: credentials.password
  });
  
  if (result.success) {
    return {
      ...result,
      nextSteps: STRIPE_CONFIG.manualSteps,
      message: 'Initial signup complete. Manual verification required.'
    };
  }
  
  return result;
}
```

### Reddit Account

```javascript
// services/reddit-signup.js
const REDDIT_CONFIG = {
  signupUrl: 'https://www.reddit.com/register/',
  method: 'email',
  selectors: {
    email: '#regEmail',
    username: '#regUsername',
    password: '#regPassword',
    captcha: '#recaptcha',
    submit: 'button[type="submit"]',
    successIndicator: '.reddit-username'
  },
  captcha: 'recaptcha_v2',
  difficulty: 'hard',
  postSignupDelay: '48h',  // Wait before posting
  notes: 'Reddit aggressively detects bots. Use aged accounts when possible.'
};

async function createRedditAccount(email, username, password) {
  const result = await signupWithEmail({
    ...REDDIT_CONFIG,
    email,
    password
  });
  
  if (result.success) {
    return {
      ...result,
      warning: 'Wait 48h before posting to avoid shadowban',
      recommendations: [
        'Subscribe to some subreddits first',
        'Upvote/comment before posting',
        'Use residential proxy'
      ]
    };
  }
  
  return result;
}
```

### Airtable Setup

```javascript
// services/airtable-setup.js
const AIRTABLE_CONFIG = {
  signupUrl: 'https://airtable.com/signup',
  method: 'email',
  selectors: {
    email: '[name="email"]',
    password: '[name="password"]',
    submit: '[type="submit"]',
    successIndicator: '[data-testid="workspace"]'
  },
  captcha: 'hcaptcha',
  difficulty: 'medium'
};
```

### PostHog Setup

```javascript
// services/posthog-setup.js
const POSTHOG_CONFIG = {
  signupUrl: 'https://app.posthog.com/signup',
  method: 'email',
  selectors: {
    email: '#email',
    password: '#password',
    submit: 'button[type="submit"]',
    successIndicator: '[data-attr="project-home"]'
  },
  captcha: 'none',  // Usually no CAPTCHA
  difficulty: 'easy'
};
```

---

## PROXY CONFIGURATION

### Recommended Providers

| Provider | Type | Cost | Best For |
|----------|------|------|----------|
| **BrightData** | Residential | $15/GB | High-security sites |
| **SmartProxy** | Residential | $12.5/GB | General use |
| **Oxylabs** | Residential | $15/GB | Enterprise |
| **IPRoyal** | Residential | $7/GB | Budget |

### Proxy Rotation Strategy

```javascript
// proxy-manager.js
class ProxyManager {
  constructor(provider, credentials) {
    this.provider = provider;
    this.credentials = credentials;
    this.currentProxy = null;
    this.usageCount = 0;
    this.maxUsage = 50;  // Requests before rotation
  }
  
  async getProxy() {
    if (this.usageCount >= this.maxUsage || !this.currentProxy) {
      await this.rotate();
    }
    this.usageCount++;
    return this.currentProxy;
  }
  
  async rotate() {
    // Get new proxy from provider
    const proxy = await this.provider.getResidentialProxy({
      country: 'US',
      session: `session_${Date.now()}`
    });
    
    this.currentProxy = proxy;
    this.usageCount = 0;
    
    return proxy;
  }
  
  formatForBrowser() {
    return {
      server: `http://${this.currentProxy.host}:${this.currentProxy.port}`,
      username: this.currentProxy.username,
      password: this.currentProxy.password
    };
  }
}
```

---

## ERROR HANDLING

### Common Errors & Recovery

```javascript
// error-handler.js
const ERROR_HANDLERS = {
  'CAPTCHA_FAILED': async (context) => {
    // Try different CAPTCHA service
    const alternativeServices = ['capsolver', '2captcha', 'anticaptcha'];
    for (const service of alternativeServices) {
      try {
        return await solveCaptchaWith(service, context);
      } catch (e) {
        continue;
      }
    }
    throw new Error('All CAPTCHA services failed');
  },
  
  'IP_BLOCKED': async (context) => {
    // Rotate proxy
    await context.proxyManager.rotate();
    // Wait before retrying
    await sleep(randomDelay(5000, 15000));
    return { retry: true };
  },
  
  'SESSION_EXPIRED': async (context) => {
    // Clear cookies and restart
    await context.page.context().clearCookies();
    return { retry: true, restart: true };
  },
  
  'RATE_LIMITED': async (context) => {
    // Exponential backoff
    const delay = Math.pow(2, context.retryCount) * 1000;
    await sleep(Math.min(delay, 60000));
    return { retry: true };
  },
  
  'VERIFICATION_REQUIRED': async (context) => {
    // Alert human for manual verification
    await notifyHuman({
      type: 'verification_required',
      url: context.page.url(),
      service: context.service
    });
    return { pauseAndWait: true };
  }
};
```

---

## USAGE EXAMPLES

### Full Automation Flow

```javascript
// main.js
const { BrowserAutomation } = require('./browser-automation');

async function setupNewApp(appConfig) {
  const automation = new BrowserAutomation();
  
  // 1. Create GitHub repo (if needed)
  if (!appConfig.githubRepo) {
    await automation.createGitHubRepo(appConfig.appName);
  }
  
  // 2. Set up Vercel
  const vercelResult = await automation.setupVercel({
    githubRepo: appConfig.githubRepo
  });
  
  // 3. Set up Stripe
  const stripeResult = await automation.setupStripe({
    email: appConfig.businessEmail,
    businessDetails: appConfig.business
  });
  
  // 4. Set up PostHog
  const posthogResult = await automation.setupPostHog({
    email: appConfig.businessEmail,
    projectName: appConfig.appName
  });
  
  // 5. Set up Airtable (for data)
  const airtableResult = await automation.setupAirtable({
    email: appConfig.businessEmail,
    baseName: appConfig.appName
  });
  
  return {
    vercel: vercelResult,
    stripe: stripeResult,
    posthog: posthogResult,
    airtable: airtableResult,
    manualStepsRequired: [
      stripeResult.nextSteps,
      'Connect domain in Vercel',
      'Add PostHog snippet to app'
    ].flat()
  };
}
```

---

## COST TRACKING

```javascript
// cost-tracker.js
class CostTracker {
  constructor() {
    this.costs = {
      captcha: 0,
      proxy: 0,
      api: 0
    };
  }
  
  recordCaptchaSolve(type) {
    this.costs.captcha += CAPTCHA_COSTS[type];
  }
  
  recordProxyUsage(gb) {
    this.costs.proxy += gb * 12.5;  // Assuming $12.5/GB
  }
  
  getTotal() {
    return Object.values(this.costs).reduce((a, b) => a + b, 0);
  }
  
  getReport() {
    return {
      ...this.costs,
      total: this.getTotal()
    };
  }
}
```

---

*Browser Automation Skill v4.0 - Handles any web task*
