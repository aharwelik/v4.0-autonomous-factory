# CAPTCHA Solving Skill
## Automated CAPTCHA Bypass & Stealth Strategies

**Purpose**: Solve CAPTCHAs programmatically using CapSolver API with AI vision fallback

---

## OVERVIEW

### Supported CAPTCHA Types

| Type | Provider | Cost | Solve Time | Success Rate |
|------|----------|------|------------|--------------|
| **reCAPTCHA v2** | CapSolver | $0.002 | 10-30s | 95%+ |
| **reCAPTCHA v3** | CapSolver | $0.003 | 5-15s | 90%+ |
| **hCaptcha** | CapSolver | $0.001 | 10-25s | 95%+ |
| **Cloudflare Turnstile** | CapSolver | $0.002 | 5-15s | 98%+ |
| **Image CAPTCHA** | Claude Vision | $0.003 | 2-5s | 85%+ |
| **FunCaptcha** | CapSolver | $0.003 | 15-40s | 90%+ |
| **GeeTest v3/v4** | CapSolver | $0.003 | 10-30s | 92%+ |

### Strategy Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPTCHA HANDLING STRATEGY                     │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: AVOIDANCE (Free)                                      │
│  └─ Stealth browser config, fingerprint spoofing                │
│                                                                 │
│  Layer 2: SOLVING (Paid - CapSolver)                            │
│  └─ API-based solving for standard CAPTCHAs                     │
│                                                                 │
│  Layer 3: AI VISION (Fallback)                                  │
│  └─ Claude/GPT-4 vision for image-based challenges              │
│                                                                 │
│  Layer 4: MANUAL ESCALATION                                     │
│  └─ Alert human when all automated methods fail                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## SETUP & CONFIGURATION

### Installation

```bash
# Install CapSolver SDK
npm install capsolver-npm

# Alternative: Install 2captcha as backup
npm install 2captcha

# For AI vision fallback
npm install @anthropic-ai/sdk
```

### Environment Variables

```bash
# .env
CAPSOLVER_API_KEY=CAP-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CAPSOLVER_BACKUP_KEY=CAP-yyyyyyyyyyyyyyyyyyyyyyyyyyyy
TWOCAPTCHA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cost tracking
CAPTCHA_BUDGET_DAILY=5.00
CAPTCHA_BUDGET_MONTHLY=100.00
```

### Client Initialization

```javascript
// captcha-client.js
const CapSolver = require('capsolver-npm');
const Anthropic = require('@anthropic-ai/sdk');

class CaptchaClient {
  constructor(options = {}) {
    this.capsolver = new CapSolver(process.env.CAPSOLVER_API_KEY);
    this.anthropic = new Anthropic();

    this.options = {
      timeout: options.timeout || 120000,  // 2 minutes default
      retries: options.retries || 3,
      logCosts: options.logCosts !== false,
      ...options
    };

    this.stats = {
      solved: 0,
      failed: 0,
      totalCost: 0
    };
  }

  // Get current balance
  async getBalance() {
    const balance = await this.capsolver.getBalance();
    return {
      balance: balance.balance,
      currency: 'USD',
      estimatedSolves: Math.floor(balance.balance / 0.002)
    };
  }
}

module.exports = CaptchaClient;
```

---

## LAYER 1: STEALTH & AVOIDANCE

### Browser Configuration (Prevent CAPTCHA Triggers)

```javascript
// stealth-config.js
const stealthConfig = {
  // Browser fingerprint spoofing
  fingerprint: {
    // Use realistic user agent strings
    userAgent: {
      rotate: true,
      pool: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0'
      ]
    },

    // Viewport dimensions (common screen sizes)
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    },

    // Timezone must match IP location
    timezone: 'America/New_York',
    locale: 'en-US',

    // WebGL fingerprint
    webgl: {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)'
    },

    // Canvas fingerprint randomization
    canvas: {
      noise: 0.0001  // Slight noise to vary fingerprint
    }
  },

  // Human-like behavior
  behavior: {
    // Mouse movements (Bezier curves, not straight lines)
    mouse: {
      movementType: 'bezier',
      speedVariation: [50, 200],  // ms between points
      jitter: true
    },

    // Typing patterns
    typing: {
      wpm: [40, 80],  // Words per minute range
      mistakeRate: 0.02,  // 2% chance of typo + correction
      pauseBetweenWords: [100, 300]
    },

    // Click behavior
    clicking: {
      preClickDelay: [50, 150],  // Hover before click
      holdDuration: [50, 100],   // Click hold time
      postClickDelay: [100, 300]
    },

    // Scroll patterns
    scrolling: {
      speed: 'variable',
      pauseOnContent: true,
      readingTime: [2000, 5000]  // Time spent "reading"
    }
  },

  // Anti-detection flags
  antiDetection: {
    webdriver: false,           // navigator.webdriver = undefined
    chrome: true,               // window.chrome exists
    permissions: true,          // navigator.permissions
    plugins: [                  // Fake plugins
      'Chrome PDF Plugin',
      'Chrome PDF Viewer',
      'Native Client'
    ],
    languages: ['en-US', 'en'],
    hardwareConcurrency: 8,
    deviceMemory: 8
  }
};

module.exports = stealthConfig;
```

### Applying Stealth to Puppeteer/Playwright

```javascript
// stealth-browser.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const stealthConfig = require('./stealth-config');

// Add stealth plugin
puppeteer.use(StealthPlugin());

async function launchStealthBrowser() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      `--window-size=${stealthConfig.fingerprint.viewport.width},${stealthConfig.fingerprint.viewport.height}`,
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();

  // Apply fingerprint
  await page.setUserAgent(
    stealthConfig.fingerprint.userAgent.pool[
      Math.floor(Math.random() * stealthConfig.fingerprint.userAgent.pool.length)
    ]
  );

  await page.setViewport({
    width: stealthConfig.fingerprint.viewport.width,
    height: stealthConfig.fingerprint.viewport.height
  });

  // Override navigator properties
  await page.evaluateOnNewDocument((config) => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => config.antiDetection.languages });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => config.antiDetection.hardwareConcurrency });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => config.antiDetection.deviceMemory });

    // Fake plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => config.antiDetection.plugins.map(name => ({ name }))
    });
  }, stealthConfig);

  return { browser, page };
}

// Human-like mouse movement
async function humanMove(page, x, y) {
  const steps = 25;
  const currentPosition = await page.evaluate(() => ({
    x: window.mouseX || 0,
    y: window.mouseY || 0
  }));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Bezier curve interpolation
    const px = currentPosition.x + (x - currentPosition.x) * (t * t * (3 - 2 * t));
    const py = currentPosition.y + (y - currentPosition.y) * (t * t * (3 - 2 * t));

    // Add slight jitter
    const jitterX = (Math.random() - 0.5) * 2;
    const jitterY = (Math.random() - 0.5) * 2;

    await page.mouse.move(px + jitterX, py + jitterY);
    await sleep(randomInt(5, 20));
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { launchStealthBrowser, humanMove };
```

---

## LAYER 2: CAPSOLVER API INTEGRATION

### reCAPTCHA v2 Solving

```javascript
// solve-recaptcha-v2.js
async function solveRecaptchaV2(page, options = {}) {
  const { capsolver } = require('./captcha-client');

  // Extract site key from page
  const siteKey = await page.evaluate(() => {
    const recaptchaDiv = document.querySelector('.g-recaptcha');
    return recaptchaDiv?.getAttribute('data-sitekey');
  });

  if (!siteKey) {
    throw new Error('Could not find reCAPTCHA site key');
  }

  console.log(`Solving reCAPTCHA v2 for site key: ${siteKey}`);

  const solution = await capsolver.recaptchaV2({
    websiteURL: page.url(),
    websiteKey: siteKey,
    isInvisible: options.invisible || false,
    proxy: options.proxy ? {
      type: 'http',
      address: options.proxy.host,
      port: options.proxy.port,
      login: options.proxy.username,
      password: options.proxy.password
    } : undefined
  });

  // Inject the solution token
  await page.evaluate((token) => {
    document.querySelector('#g-recaptcha-response').value = token;
    document.querySelector('#g-recaptcha-response').style.display = 'block';

    // Trigger any callbacks
    if (typeof ___grecaptcha_cfg !== 'undefined') {
      Object.keys(___grecaptcha_cfg.clients).forEach(key => {
        const client = ___grecaptcha_cfg.clients[key];
        if (client.callback) {
          client.callback(token);
        }
      });
    }

    // Also try window callback
    if (window.captchaCallback) {
      window.captchaCallback(token);
    }
  }, solution.gRecaptchaResponse);

  return {
    success: true,
    token: solution.gRecaptchaResponse,
    cost: 0.002
  };
}

module.exports = { solveRecaptchaV2 };
```

### reCAPTCHA v3 Solving

```javascript
// solve-recaptcha-v3.js
async function solveRecaptchaV3(page, options = {}) {
  const { capsolver } = require('./captcha-client');

  // v3 requires site key and action
  const siteKey = options.siteKey || await page.evaluate(() => {
    // Try to find from script tags
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const match = script.src?.match(/render=([A-Za-z0-9_-]+)/);
      if (match) return match[1];
    }
    return null;
  });

  if (!siteKey) {
    throw new Error('Could not find reCAPTCHA v3 site key');
  }

  const solution = await capsolver.recaptchaV3({
    websiteURL: page.url(),
    websiteKey: siteKey,
    pageAction: options.action || 'submit',
    minScore: options.minScore || 0.7,
    proxy: options.proxy ? formatProxy(options.proxy) : undefined
  });

  // v3 tokens are used differently - usually sent with form data
  return {
    success: true,
    token: solution.gRecaptchaResponse,
    score: solution.score,
    cost: 0.003
  };
}

// Helper to inject v3 token into form
async function injectRecaptchaV3Token(page, token, fieldName = 'g-recaptcha-response') {
  await page.evaluate(({ token, fieldName }) => {
    // Find or create hidden input
    let input = document.querySelector(`input[name="${fieldName}"]`);
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = fieldName;
      document.querySelector('form')?.appendChild(input);
    }
    input.value = token;
  }, { token, fieldName });
}

module.exports = { solveRecaptchaV3, injectRecaptchaV3Token };
```

### hCaptcha Solving

```javascript
// solve-hcaptcha.js
async function solveHCaptcha(page, options = {}) {
  const { capsolver } = require('./captcha-client');

  // Extract hCaptcha site key
  const siteKey = await page.evaluate(() => {
    const hcaptchaDiv = document.querySelector('.h-captcha, [data-hcaptcha-widget-id]');
    return hcaptchaDiv?.getAttribute('data-sitekey');
  });

  if (!siteKey) {
    throw new Error('Could not find hCaptcha site key');
  }

  const solution = await capsolver.hCaptcha({
    websiteURL: page.url(),
    websiteKey: siteKey,
    proxy: options.proxy ? formatProxy(options.proxy) : undefined
  });

  // Inject solution
  await page.evaluate((token) => {
    // Set response textarea
    const responseTextarea = document.querySelector('[name="h-captcha-response"]');
    if (responseTextarea) {
      responseTextarea.value = token;
    }

    // Trigger hCaptcha callback
    if (window.hcaptcha) {
      // Find widget ID
      const widget = document.querySelector('[data-hcaptcha-widget-id]');
      const widgetId = widget?.getAttribute('data-hcaptcha-widget-id') || '0';

      // Execute callback
      const iframe = document.querySelector('iframe[data-hcaptcha-widget-id]');
      if (iframe) {
        window.hcaptcha.execute(widgetId);
      }
    }
  }, solution.token);

  return {
    success: true,
    token: solution.token,
    cost: 0.001
  };
}

module.exports = { solveHCaptcha };
```

### Cloudflare Turnstile Solving

```javascript
// solve-turnstile.js
async function solveTurnstile(page, options = {}) {
  const { capsolver } = require('./captcha-client');

  // Extract Turnstile site key
  const siteKey = await page.evaluate(() => {
    const turnstileDiv = document.querySelector('.cf-turnstile');
    return turnstileDiv?.getAttribute('data-sitekey');
  });

  if (!siteKey) {
    throw new Error('Could not find Turnstile site key');
  }

  const solution = await capsolver.turnstile({
    websiteURL: page.url(),
    websiteKey: siteKey,
    proxy: options.proxy ? formatProxy(options.proxy) : undefined
  });

  // Inject Turnstile token
  await page.evaluate((token) => {
    // Turnstile uses cf-turnstile-response
    const responseInput = document.querySelector('[name="cf-turnstile-response"]');
    if (responseInput) {
      responseInput.value = token;
    }

    // Trigger callback if exists
    if (window.turnstile && window.turnstileCallback) {
      window.turnstileCallback(token);
    }
  }, solution.token);

  return {
    success: true,
    token: solution.token,
    cost: 0.002
  };
}

module.exports = { solveTurnstile };
```

---

## LAYER 3: AI VISION FALLBACK

### Claude Vision for Image CAPTCHAs

```javascript
// solve-image-captcha.js
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic();

async function solveImageCaptcha(imagePath, captchaType, instructions) {
  // Read image and convert to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = getMimeType(imagePath);

  // Build prompt based on CAPTCHA type
  const prompts = {
    'text': `Look at this CAPTCHA image. Your task is to read and type out the exact text/characters shown.

      IMPORTANT:
      - Only output the characters you see, nothing else
      - Include spaces if there are any
      - Distinguish between similar characters (0 vs O, 1 vs l)
      - If unclear, make your best guess

      Respond ONLY with the text. No explanations.`,

    'math': `This CAPTCHA shows a math problem. Solve it.

      Respond ONLY with the numerical answer. No explanations.`,

    'select': `${instructions || 'Select all squares that contain the requested object.'}

      Respond with the grid positions (1-9 for 3x3, 1-16 for 4x4) separated by commas.
      Example: 1,3,5,7

      Only output the numbers, nothing else.`,

    'puzzle': `This is a puzzle CAPTCHA. ${instructions || 'Identify what action needs to be taken.'}

      Describe the solution briefly (under 20 words).`,

    'rotation': `This image needs to be rotated to be upright.

      Respond ONLY with the degrees to rotate clockwise (0, 90, 180, or 270).`
  };

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: base64Image
            }
          },
          {
            type: 'text',
            text: prompts[captchaType] || prompts['text']
          }
        ]
      }
    ]
  });

  return {
    success: true,
    answer: response.content[0].text.trim(),
    cost: 0.003,  // Approximate cost for vision request
    confidence: 'medium'
  };
}

// Solve grid selection CAPTCHAs (like "select all traffic lights")
async function solveGridCaptcha(imagePath, targetObject) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image
            }
          },
          {
            type: 'text',
            text: `This is a grid CAPTCHA image divided into squares.

              Task: Identify all squares that contain: "${targetObject}"

              The grid is numbered like this:
              | 1 | 2 | 3 |
              | 4 | 5 | 6 |
              | 7 | 8 | 9 |

              (For 4x4 grids, continue: 10, 11, 12, 13, 14, 15, 16)

              Respond ONLY with comma-separated numbers of squares containing ${targetObject}.
              If none contain it, respond with "none".
              Example: 1,3,5,7`
          }
        ]
      }
    ]
  });

  const answer = response.content[0].text.trim();
  const squares = answer === 'none' ? [] : answer.split(',').map(n => parseInt(n.trim()));

  return {
    success: true,
    squares,
    cost: 0.003
  };
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/png';
}

module.exports = { solveImageCaptcha, solveGridCaptcha };
```

---

## UNIFIED CAPTCHA SOLVER

### Auto-Detect and Solve

```javascript
// captcha-solver.js
const { solveRecaptchaV2 } = require('./solve-recaptcha-v2');
const { solveRecaptchaV3 } = require('./solve-recaptcha-v3');
const { solveHCaptcha } = require('./solve-hcaptcha');
const { solveTurnstile } = require('./solve-turnstile');
const { solveImageCaptcha, solveGridCaptcha } = require('./solve-image-captcha');

class CaptchaSolver {
  constructor(options = {}) {
    this.options = options;
    this.costs = {
      total: 0,
      breakdown: {}
    };
  }

  // Detect CAPTCHA type on page
  async detectCaptchaType(page) {
    return await page.evaluate(() => {
      // Check for reCAPTCHA v2
      if (document.querySelector('.g-recaptcha')) {
        return { type: 'recaptcha_v2', found: true };
      }

      // Check for reCAPTCHA v3 (invisible)
      if (document.querySelector('script[src*="recaptcha"][src*="render"]')) {
        return { type: 'recaptcha_v3', found: true };
      }

      // Check for hCaptcha
      if (document.querySelector('.h-captcha')) {
        return { type: 'hcaptcha', found: true };
      }

      // Check for Cloudflare Turnstile
      if (document.querySelector('.cf-turnstile')) {
        return { type: 'turnstile', found: true };
      }

      // Check for image CAPTCHA
      if (document.querySelector('img[alt*="captcha" i], img[src*="captcha" i]')) {
        return { type: 'image', found: true };
      }

      return { type: null, found: false };
    });
  }

  // Solve any detected CAPTCHA
  async solve(page, options = {}) {
    const detection = await this.detectCaptchaType(page);

    if (!detection.found) {
      return { success: true, message: 'No CAPTCHA detected', cost: 0 };
    }

    console.log(`Detected CAPTCHA type: ${detection.type}`);

    let result;

    switch (detection.type) {
      case 'recaptcha_v2':
        result = await solveRecaptchaV2(page, options);
        break;

      case 'recaptcha_v3':
        result = await solveRecaptchaV3(page, options);
        break;

      case 'hcaptcha':
        result = await solveHCaptcha(page, options);
        break;

      case 'turnstile':
        result = await solveTurnstile(page, options);
        break;

      case 'image':
        // Screenshot the CAPTCHA and use AI vision
        const captchaElement = await page.$('img[alt*="captcha" i], img[src*="captcha" i]');
        const screenshot = await captchaElement.screenshot();
        result = await solveImageCaptcha(screenshot, 'text');

        // Enter the solution
        const inputField = await page.$('input[name*="captcha" i]');
        if (inputField) {
          await inputField.type(result.answer);
        }
        break;

      default:
        return { success: false, error: `Unknown CAPTCHA type: ${detection.type}` };
    }

    // Track costs
    this.costs.total += result.cost || 0;
    this.costs.breakdown[detection.type] = (this.costs.breakdown[detection.type] || 0) + (result.cost || 0);

    return {
      ...result,
      captchaType: detection.type
    };
  }

  // Get cost report
  getCostReport() {
    return {
      total: `$${this.costs.total.toFixed(4)}`,
      breakdown: Object.entries(this.costs.breakdown).map(([type, cost]) => ({
        type,
        cost: `$${cost.toFixed(4)}`
      }))
    };
  }
}

module.exports = CaptchaSolver;
```

---

## ERROR HANDLING & RETRY LOGIC

```javascript
// error-handler.js
const CAPTCHA_ERRORS = {
  'ERROR_CAPTCHA_UNSOLVABLE': {
    retry: false,
    action: 'escalate',
    message: 'CAPTCHA is unsolvable by automated means'
  },
  'ERROR_WRONG_CAPTCHA_ID': {
    retry: true,
    maxRetries: 3,
    message: 'Invalid CAPTCHA ID, retrying...'
  },
  'ERROR_TOKEN_EXPIRED': {
    retry: true,
    maxRetries: 2,
    message: 'Token expired, solving again...'
  },
  'ERROR_NO_SLOT_AVAILABLE': {
    retry: true,
    delay: 5000,
    message: 'Server busy, waiting...'
  },
  'ERROR_ZERO_BALANCE': {
    retry: false,
    action: 'alert',
    message: 'CapSolver balance depleted!'
  },
  'ERROR_PROXY_BANNED': {
    retry: true,
    action: 'rotate_proxy',
    message: 'Proxy banned, rotating...'
  }
};

async function handleCaptchaError(error, context) {
  const errorInfo = CAPTCHA_ERRORS[error.code] || {
    retry: true,
    maxRetries: 3,
    message: error.message
  };

  console.error(`CAPTCHA Error: ${errorInfo.message}`);

  if (!errorInfo.retry) {
    if (errorInfo.action === 'escalate') {
      await escalateToHuman(context);
    } else if (errorInfo.action === 'alert') {
      await sendAlert('CAPTCHA service issue', errorInfo.message);
    }
    throw error;
  }

  if (errorInfo.delay) {
    await sleep(errorInfo.delay);
  }

  if (errorInfo.action === 'rotate_proxy' && context.proxyManager) {
    await context.proxyManager.rotate();
  }

  return { retry: true };
}

async function solveCaptchaWithRetry(solver, page, options = {}) {
  const maxRetries = options.maxRetries || 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`CAPTCHA solve attempt ${attempt}/${maxRetries}`);
      const result = await solver.solve(page, options);

      if (result.success) {
        console.log(`CAPTCHA solved on attempt ${attempt}`);
        return result;
      }

    } catch (error) {
      lastError = error;
      const handled = await handleCaptchaError(error, { page, ...options });

      if (!handled.retry) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await sleep(delay);
    }
  }

  throw new Error(`CAPTCHA solve failed after ${maxRetries} attempts: ${lastError?.message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { handleCaptchaError, solveCaptchaWithRetry };
```

---

## COST TRACKING & BUDGET MANAGEMENT

```javascript
// cost-tracker.js
class CaptchaCostTracker {
  constructor(options = {}) {
    this.dailyBudget = options.dailyBudget || parseFloat(process.env.CAPTCHA_BUDGET_DAILY) || 5.00;
    this.monthlyBudget = options.monthlyBudget || parseFloat(process.env.CAPTCHA_BUDGET_MONTHLY) || 100.00;

    this.costs = {
      today: 0,
      thisMonth: 0,
      byType: {},
      history: []
    };
  }

  record(type, cost, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      cost,
      ...metadata
    };

    this.costs.today += cost;
    this.costs.thisMonth += cost;
    this.costs.byType[type] = (this.costs.byType[type] || 0) + cost;
    this.costs.history.push(entry);

    // Check budget alerts
    this.checkBudgetAlerts();

    return entry;
  }

  checkBudgetAlerts() {
    const dailyUsage = (this.costs.today / this.dailyBudget) * 100;
    const monthlyUsage = (this.costs.thisMonth / this.monthlyBudget) * 100;

    if (dailyUsage >= 90) {
      console.warn(`BUDGET ALERT: Daily CAPTCHA budget at ${dailyUsage.toFixed(1)}%`);
    }

    if (monthlyUsage >= 75) {
      console.warn(`BUDGET ALERT: Monthly CAPTCHA budget at ${monthlyUsage.toFixed(1)}%`);
    }

    return { dailyUsage, monthlyUsage };
  }

  canSolve(estimatedCost = 0.003) {
    return (this.costs.today + estimatedCost) <= this.dailyBudget;
  }

  getReport() {
    return {
      today: {
        spent: `$${this.costs.today.toFixed(4)}`,
        budget: `$${this.dailyBudget.toFixed(2)}`,
        remaining: `$${(this.dailyBudget - this.costs.today).toFixed(4)}`,
        usage: `${((this.costs.today / this.dailyBudget) * 100).toFixed(1)}%`
      },
      month: {
        spent: `$${this.costs.thisMonth.toFixed(4)}`,
        budget: `$${this.monthlyBudget.toFixed(2)}`,
        remaining: `$${(this.monthlyBudget - this.costs.thisMonth).toFixed(4)}`,
        usage: `${((this.costs.thisMonth / this.monthlyBudget) * 100).toFixed(1)}%`
      },
      byType: this.costs.byType,
      totalSolves: this.costs.history.length
    };
  }

  resetDaily() {
    this.costs.today = 0;
  }
}

module.exports = CaptchaCostTracker;
```

---

## USAGE EXAMPLES

### Complete Flow Example

```javascript
// example-usage.js
const { launchStealthBrowser } = require('./stealth-browser');
const CaptchaSolver = require('./captcha-solver');
const CaptchaCostTracker = require('./cost-tracker');
const { solveCaptchaWithRetry } = require('./error-handler');

async function signupWithCaptcha(url, credentials) {
  const { browser, page } = await launchStealthBrowser();
  const solver = new CaptchaSolver();
  const costTracker = new CaptchaCostTracker();

  try {
    // Navigate to signup page
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Fill in form
    await page.type('#email', credentials.email, { delay: 100 });
    await page.type('#password', credentials.password, { delay: 100 });

    // Check for CAPTCHA
    const detection = await solver.detectCaptchaType(page);

    if (detection.found) {
      console.log(`CAPTCHA detected: ${detection.type}`);

      // Check budget before solving
      if (!costTracker.canSolve()) {
        throw new Error('Daily CAPTCHA budget exceeded');
      }

      // Solve with retry logic
      const result = await solveCaptchaWithRetry(solver, page, {
        maxRetries: 3
      });

      // Track cost
      costTracker.record(detection.type, result.cost, {
        url,
        success: result.success
      });

      console.log('CAPTCHA solved successfully');
    }

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 30000 });

    // Report costs
    console.log('Cost Report:', costTracker.getReport());

    return { success: true, url: page.url() };

  } catch (error) {
    console.error('Signup failed:', error.message);
    return { success: false, error: error.message };

  } finally {
    await browser.close();
  }
}

// Run example
signupWithCaptcha('https://example.com/signup', {
  email: 'test@example.com',
  password: 'SecurePassword123!'
});
```

---

## BEST PRACTICES

### Do's
- Always try stealth/avoidance first (free)
- Use residential proxies for high-security sites
- Implement exponential backoff on failures
- Track costs and set budget alerts
- Rotate proxies after CAPTCHA failures
- Use AI vision as last resort (most flexible)

### Don'ts
- Don't solve CAPTCHAs faster than humans (suspicious)
- Don't reuse tokens (they expire)
- Don't ignore error codes (they tell you what's wrong)
- Don't exceed rate limits on CAPTCHA services
- Don't use datacenter proxies for sensitive sites

---

*CAPTCHA Solving Skill v4.0 - Automated CAPTCHA bypass*
