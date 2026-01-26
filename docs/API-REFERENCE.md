# API Reference
## Complete Integration Documentation

This document covers all external APIs used by the App Factory system.

---

## Table of Contents

1. [Anthropic (Claude)](#anthropic-claude)
2. [Google Gemini](#google-gemini)
3. [Vercel](#vercel)
4. [Stripe](#stripe)
5. [PostHog](#posthog)
6. [Telegram](#telegram)
7. [CapSolver](#capsolver)
8. [Grok (X.AI)](#grok-xai)
9. [GLM (Zhipu)](#glm-zhipu)
10. [Resend](#resend)

---

## Anthropic (Claude)

### Overview
Primary AI for code generation, reasoning, and agent orchestration.

**Base URL**: `https://api.anthropic.com`
**Docs**: https://docs.anthropic.com

### Authentication
```bash
# Header
x-api-key: sk-ant-api03-xxxxx
anthropic-version: 2023-06-01
```

### Key Endpoints

#### Create Message
```http
POST /v1/messages

{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 8192,
  "messages": [
    {"role": "user", "content": "Hello, Claude"}
  ]
}
```

#### Models
| Model | Use Case | Cost (Input/Output per 1M) |
|-------|----------|----------------------------|
| claude-opus-4-5-20251101 | Complex reasoning | $15 / $75 |
| claude-sonnet-4-20250514 | General coding | $3 / $15 |
| claude-3-5-haiku-20241022 | Fast, simple tasks | $0.25 / $1.25 |

### JavaScript SDK
```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const message = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }]
});
```

---

## Google Gemini

### Overview
Image and video generation, plus multimodal understanding.

**Base URL**: `https://generativelanguage.googleapis.com`
**Docs**: https://ai.google.dev/docs

### Authentication
```bash
# Query parameter
?key=YOUR_API_KEY

# Or header
Authorization: Bearer YOUR_API_KEY
```

### Key Endpoints

#### Generate Content
```http
POST /v1/models/gemini-3.0-pro:generateContent?key=API_KEY

{
  "contents": [{
    "parts": [{"text": "Explain quantum computing"}]
  }]
}
```

#### Generate Image (Imagen 3)
```http
POST /v1/models/imagen-3.0-generate-001:predict?key=API_KEY

{
  "instances": [{
    "prompt": "A futuristic city at sunset"
  }],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "16:9"
  }
}
```

### Image Pricing
| Resolution | Cost per Image |
|------------|---------------|
| 1K | $0.039 |
| 2K | $0.134 |
| 4K | $0.240 |

### JavaScript SDK
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.0-pro' });

const result = await model.generateContent('Hello');
console.log(result.response.text());
```

---

## Vercel

### Overview
Deployment platform and v0 UI generation.

**Base URL**: `https://api.vercel.com`
**Docs**: https://vercel.com/docs/rest-api

### Authentication
```bash
Authorization: Bearer YOUR_VERCEL_TOKEN
```

### Key Endpoints

#### List Projects
```http
GET /v9/projects
```

#### Create Deployment
```http
POST /v13/deployments

{
  "name": "my-project",
  "gitSource": {
    "type": "github",
    "repo": "user/repo",
    "ref": "main"
  }
}
```

#### Get Deployment
```http
GET /v13/deployments/{id}
```

### v0 API (UI Generation)
```http
POST https://api.v0.dev/chat

{
  "model": "v0-1.5-lg",
  "messages": [{
    "role": "user",
    "content": "Create a login form with email and password"
  }]
}
```

### JavaScript
```javascript
// Vercel CLI programmatic use
import { createClient } from '@vercel/client';

const client = createClient({
  token: process.env.VERCEL_TOKEN
});

const deployment = await client.createDeployment({
  name: 'my-app',
  files: [...]
});
```

---

## Stripe

### Overview
Payment processing and subscription management.

**Base URL**: `https://api.stripe.com`
**Docs**: https://stripe.com/docs/api

### Authentication
```bash
# Basic Auth
Authorization: Basic sk_test_xxxxx:
# (API key as username, empty password)
```

### Key Endpoints

#### Create Checkout Session
```http
POST /v1/checkout/sessions

{
  "mode": "subscription",
  "customer": "cus_xxx",
  "line_items": [{
    "price": "price_xxx",
    "quantity": 1
  }],
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel"
}
```

#### List Subscriptions
```http
GET /v1/subscriptions?customer=cus_xxx
```

#### Create Customer Portal Session
```http
POST /v1/billing_portal/sessions

{
  "customer": "cus_xxx",
  "return_url": "https://example.com/dashboard"
}
```

### Webhook Events
```javascript
// Verify webhook signature
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Key events to handle
switch (event.type) {
  case 'checkout.session.completed':
    // Provision access
    break;
  case 'customer.subscription.deleted':
    // Revoke access
    break;
  case 'invoice.payment_failed':
    // Notify user
    break;
}
```

### JavaScript SDK
```javascript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  success_url: 'https://...',
  cancel_url: 'https://...'
});
```

---

## PostHog

### Overview
Product analytics, feature flags, and session replay.

**Base URL**: `https://app.posthog.com` (or self-hosted)
**Docs**: https://posthog.com/docs

### Authentication
```bash
# Personal API Key (for backend)
Authorization: Bearer phx_xxxxx

# Project API Key (for frontend)
# Included in tracking snippet
```

### Key Endpoints

#### Capture Event
```http
POST /capture/

{
  "api_key": "phc_xxxxx",
  "event": "user_signed_up",
  "distinct_id": "user_123",
  "properties": {
    "plan": "pro",
    "$current_url": "https://..."
  }
}
```

#### Query Insights
```http
POST /api/projects/{project_id}/query

{
  "query": {
    "kind": "TrendsQuery",
    "series": [{
      "kind": "EventsNode",
      "event": "$pageview",
      "math": "total"
    }],
    "dateRange": {"date_from": "-7d"}
  }
}
```

#### Feature Flags
```http
POST /decide/?v=3

{
  "api_key": "phc_xxxxx",
  "distinct_id": "user_123"
}
```

### JavaScript SDK
```javascript
// Frontend
import posthog from 'posthog-js';

posthog.init('phc_xxxxx', {
  api_host: 'https://app.posthog.com'
});

posthog.capture('button_clicked', { button_name: 'signup' });

// Backend
import { PostHog } from 'posthog-node';

const client = new PostHog('phc_xxxxx');

client.capture({
  distinctId: 'user_123',
  event: 'purchase_completed',
  properties: { amount: 99 }
});
```

---

## Telegram

### Overview
Bot notifications and alerts.

**Base URL**: `https://api.telegram.org/bot{token}`
**Docs**: https://core.telegram.org/bots/api

### Key Endpoints

#### Send Message
```http
POST /bot{token}/sendMessage

{
  "chat_id": 123456789,
  "text": "Hello from App Factory!",
  "parse_mode": "HTML"
}
```

#### Get Updates (get chat_id)
```http
GET /bot{token}/getUpdates
```

#### Send Photo
```http
POST /bot{token}/sendPhoto

{
  "chat_id": 123456789,
  "photo": "https://example.com/image.png",
  "caption": "Daily report"
}
```

### JavaScript
```javascript
async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    })
  });
}
```

---

## CapSolver

### Overview
CAPTCHA solving service for browser automation.

**Base URL**: `https://api.capsolver.com`
**Docs**: https://docs.capsolver.com

### Key Endpoints

#### Create Task
```http
POST /createTask

{
  "clientKey": "CAP-xxxxx",
  "task": {
    "type": "ReCaptchaV2TaskProxyLess",
    "websiteURL": "https://example.com",
    "websiteKey": "6Le-xxxxx"
  }
}
```

#### Get Task Result
```http
POST /getTaskResult

{
  "clientKey": "CAP-xxxxx",
  "taskId": "task_xxxxx"
}
```

### Supported CAPTCHA Types
| Type | Task Type | Cost |
|------|-----------|------|
| reCAPTCHA v2 | ReCaptchaV2TaskProxyLess | $0.002 |
| reCAPTCHA v3 | ReCaptchaV3Task | $0.003 |
| hCaptcha | HCaptchaTaskProxyLess | $0.001 |
| Cloudflare | AntiCloudflareTask | $0.002 |

### JavaScript
```javascript
import CapSolver from 'capsolver-npm';

const solver = new CapSolver(process.env.CAPSOLVER_API_KEY);

const solution = await solver.recaptchaV2({
  websiteURL: 'https://example.com',
  websiteKey: '6Le-xxxxx'
});

console.log(solution.gRecaptchaResponse);
```

---

## Grok (X.AI)

### Overview
Real-time information and Twitter-native content.

**Base URL**: `https://api.x.ai`
**Docs**: https://docs.x.ai

### Authentication
```bash
Authorization: Bearer xai-xxxxx
```

### Key Endpoints

#### Chat Completions
```http
POST /v1/chat/completions

{
  "model": "grok-4",
  "messages": [
    {"role": "user", "content": "What's trending on Twitter right now?"}
  ]
}
```

### Pricing
| Model | Input (per 1M) | Output (per 1M) |
|-------|---------------|-----------------|
| grok-4 | $3.15 | $15.75 |

### JavaScript
```javascript
async function grokChat(messages) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'grok-4',
      messages
    })
  });

  return response.json();
}
```

---

## GLM (Zhipu)

### Overview
Budget-friendly Chinese AI model for content generation.

**Base URL**: `https://open.bigmodel.cn/api/paas/v4`
**Docs**: https://open.bigmodel.cn/dev/api

### Authentication
```bash
Authorization: Bearer YOUR_API_KEY
```

### Key Endpoints

#### Chat Completions
```http
POST /chat/completions

{
  "model": "glm-4.5",
  "messages": [
    {"role": "user", "content": "Write a blog post about..."}
  ]
}
```

### Pricing
| Model | Input (per 1M) | Output (per 1M) |
|-------|---------------|-----------------|
| GLM-4.5 | $0.63 | $2.31 |

### JavaScript
```javascript
async function glmChat(messages) {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'glm-4.5',
      messages
    })
  });

  return response.json();
}
```

---

## Resend

### Overview
Email sending for transactional and marketing emails.

**Base URL**: `https://api.resend.com`
**Docs**: https://resend.com/docs

### Authentication
```bash
Authorization: Bearer re_xxxxx
```

### Key Endpoints

#### Send Email
```http
POST /emails

{
  "from": "hello@yourdomain.com",
  "to": "user@example.com",
  "subject": "Welcome!",
  "html": "<h1>Welcome to our app!</h1>"
}
```

#### Send Batch
```http
POST /emails/batch

[
  {"from": "...", "to": "user1@...", "subject": "...", "html": "..."},
  {"from": "...", "to": "user2@...", "subject": "...", "html": "..."}
]
```

### JavaScript SDK
```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'hello@yourdomain.com',
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome!</h1>'
});
```

---

## Rate Limits Summary

| API | Rate Limit | Notes |
|-----|------------|-------|
| Anthropic | 4000 RPM | Varies by tier |
| Gemini | 60 RPM | Free tier |
| Vercel | 100 RPM | |
| Stripe | 100 RPM | Read ops |
| PostHog | 1000 RPM | |
| Telegram | 30 msg/sec | Per bot |
| CapSolver | No limit | Pay per use |
| Grok | Varies | |
| GLM | 100 RPM | |
| Resend | 100 emails/day | Free tier |

---

## Error Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Check endpoint/ID |
| 429 | Rate Limited | Back off and retry |
| 500 | Server Error | Retry later |
| 502 | Bad Gateway | Retry later |
| 503 | Unavailable | Service down |

---

*API Reference v4.0 - All integrations documented*
