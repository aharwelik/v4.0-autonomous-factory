# 🎨 Content Generation Skill
## Images, Videos, and Marketing Content

**Purpose**: Generate marketing assets using Gemini, Grok, and GLM APIs

---

## API OVERVIEW

### Pricing Summary (January 2026)

| API | Content Type | Cost | Quality | Speed |
|-----|--------------|------|---------|-------|
| **Gemini 3 Pro Image** | Images | $0.039/image (1K) | Excellent | Fast |
| **Gemini 3 Pro Image** | Images | $0.134/image (2K) | Excellent | Fast |
| **Gemini 3 Pro Image** | Images | $0.24/image (4K) | Excellent | Medium |
| **Gemini Veo 2** | Video | ~$0.50/5-sec | Excellent | Slow |
| **Grok 4** | Text/Analysis | $3.15/1M in | Excellent | Fast |
| **GLM-4.5** | Text/Images | $0.63/1M in | Good | Fast |

### When to Use What

```
┌─────────────────────────────────────────────────────────────┐
│ CONTENT TYPE          │ PRIMARY      │ FALLBACK             │
├─────────────────────────────────────────────────────────────┤
│ Product screenshots   │ Gemini Image │ Midjourney/DALL-E    │
│ Marketing graphics    │ Gemini Image │ Canva API            │
│ App demo videos       │ Gemini Veo   │ Screen recording     │
│ Social media images   │ Gemini Image │ GLM-4.5              │
│ Blog featured images  │ Gemini Image │ Unsplash + AI edit   │
│ Product videos        │ Gemini Veo   │ Synthesia            │
│ Real-time data posts  │ Grok 4       │ Claude               │
│ Budget text content   │ GLM-4.5      │ Claude Haiku         │
└─────────────────────────────────────────────────────────────┘
```

---

## GEMINI IMAGE GENERATION

### Setup

```javascript
// gemini-setup.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// For image generation, use Imagen 3 model
const imagenModel = genAI.getGenerativeModel({
  model: 'imagen-3.0-generate-001'
});

// For image editing/understanding, use Gemini 3 Pro
const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-3.0-pro'
});
```

### Generate Product Screenshot

```javascript
// generate-screenshot.js
async function generateProductScreenshot(appDescription, style) {
  const prompt = `
    Create a realistic app screenshot for: ${appDescription}
    
    Style: ${style || 'Modern, clean, minimal UI'}
    
    Requirements:
    - Show on an iPhone 15 Pro mockup
    - Light mode
    - No placeholder text - use realistic content
    - Professional quality suitable for App Store
    - 1290x2796 resolution (iPhone screenshot size)
  `;
  
  const result = await imagenModel.generateImages({
    prompt,
    numberOfImages: 1,
    aspectRatio: '9:19.5',  // iPhone aspect ratio
    safetyFilterLevel: 'block_few'
  });
  
  return result.images[0];
}
```

### Generate Marketing Graphics

```javascript
// generate-marketing.js
async function generateMarketingGraphic(type, content) {
  const templates = {
    'og-image': {
      prompt: `Create an Open Graph image for: ${content.title}
        - 1200x630 pixels
        - Bold, readable title text
        - Brand color: ${content.brandColor || '#3B82F6'}
        - Include subtle app icon or logo placeholder
        - Professional, tech/SaaS aesthetic`,
      aspectRatio: '1200:630'
    },
    
    'twitter-card': {
      prompt: `Create a Twitter card image for: ${content.title}
        - 1600x900 pixels
        - Eye-catching, scroll-stopping design
        - Brief value proposition visible
        - Brand color: ${content.brandColor || '#3B82F6'}`,
      aspectRatio: '16:9'
    },
    
    'instagram-post': {
      prompt: `Create an Instagram post image for: ${content.title}
        - 1080x1080 pixels (square)
        - Minimal text, strong visual
        - Mobile-first design
        - Trendy, modern aesthetic`,
      aspectRatio: '1:1'
    },
    
    'linkedin-banner': {
      prompt: `Create a LinkedIn banner for: ${content.title}
        - 1584x396 pixels
        - Professional, corporate aesthetic
        - Company name: ${content.companyName}
        - Tagline: ${content.tagline}`,
      aspectRatio: '1584:396'
    }
  };
  
  const template = templates[type];
  
  const result = await imagenModel.generateImages({
    prompt: template.prompt,
    numberOfImages: 3,  // Generate options
    aspectRatio: template.aspectRatio
  });
  
  return result.images;
}
```

### Batch Generation (Cost Optimization)

```javascript
// batch-generate.js
async function batchGenerateImages(requests) {
  // Use Gemini Batch API for 50% cost savings
  // Tradeoff: Results in 24h instead of seconds
  
  const batchRequest = {
    requests: requests.map(req => ({
      prompt: req.prompt,
      outputConfig: {
        numberOfImages: req.count || 1,
        aspectRatio: req.aspectRatio || '1:1'
      }
    }))
  };
  
  const response = await fetch('https://generativelanguage.googleapis.com/v1/images:batchGenerate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(batchRequest)
  });
  
  const result = await response.json();
  
  // Returns operation ID - poll for results
  return {
    operationId: result.name,
    estimatedCompletion: '24 hours',
    checkStatus: async () => {
      // Poll operation status
    }
  };
}
```

---

## GEMINI VIDEO GENERATION (VEO)

### Generate Product Demo

```javascript
// generate-video.js
async function generateProductDemo(config) {
  const prompt = `
    Create a ${config.duration || 5}-second product demo video showing:
    
    App Name: ${config.appName}
    Main Action: ${config.mainAction}
    
    Scene Description:
    ${config.sceneDescription}
    
    Style:
    - Clean, modern UI
    - Smooth animations
    - Professional quality
    - No text overlays (will add separately)
  `;
  
  const response = await fetch('https://generativelanguage.googleapis.com/v1/videos:generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'veo-2.0-generate-001',
      prompt,
      config: {
        duration: config.duration || 5,
        aspectRatio: config.aspectRatio || '9:16',  // Vertical for social
        resolution: '1080p'
      }
    })
  });
  
  return await response.json();
}

// Example usage
const demoVideo = await generateProductDemo({
  appName: 'HydroTrack',
  duration: 8,
  mainAction: 'User tapping to log water intake',
  sceneDescription: `
    1. Phone screen shows dashboard with 0ml logged
    2. User taps large "+" button
    3. Water drop animation appears
    4. Progress circle fills to 250ml
    5. Satisfying completion animation
  `,
  aspectRatio: '9:16'  // TikTok/Reels format
});
```

### Video Cost Optimization

```javascript
// video-costs.js
const VIDEO_COSTS = {
  'veo-2.0': {
    perSecond: 0.10,  // Approximate
    minDuration: 2,
    maxDuration: 16
  }
};

function estimateVideoCost(duration, count = 1) {
  const cost = duration * VIDEO_COSTS['veo-2.0'].perSecond * count;
  return {
    estimated: cost,
    tip: duration > 8 
      ? 'Consider splitting into shorter clips for social media'
      : 'Duration optimal for social platforms'
  };
}
```

---

## GROK API (Real-time Data)

### Setup

```javascript
// grok-setup.js
const XAI_API_KEY = process.env.XAI_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

async function grokChat(messages, options = {}) {
  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || 'grok-4',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000
    })
  });
  
  return await response.json();
}
```

### Generate Twitter/X Content

```javascript
// grok-twitter.js
async function generateTwitterContent(topic, style) {
  // Grok excels at Twitter-native content
  const response = await grokChat([
    {
      role: 'system',
      content: `You are a Twitter content expert. Generate engaging tweets that:
        - Are concise and punchy
        - Use hooks that stop scrolling
        - Include relevant hashtags
        - Optimize for engagement
        - Style: ${style || 'Professional but approachable'}`
    },
    {
      role: 'user',
      content: `Generate 5 tweet variations about: ${topic}
        
        Include:
        1. A question hook
        2. A controversial take
        3. A listicle style
        4. A story/anecdote style
        5. A call-to-action style`
    }
  ]);
  
  return parseTweets(response.choices[0].message.content);
}

// Real-time trend integration
async function generateTrendingContent(appCategory) {
  // Grok has real-time X/Twitter data access
  const response = await grokChat([
    {
      role: 'system',
      content: 'You have access to real-time Twitter/X trending data.'
    },
    {
      role: 'user',
      content: `What's trending right now related to ${appCategory}?
        Suggest 3 content angles that tie our app to current conversations.`
    }
  ]);
  
  return response.choices[0].message.content;
}
```

---

## GLM API (Budget Option)

### Setup

```javascript
// glm-setup.js
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = process.env.GLM_API_KEY;

async function glmChat(messages, options = {}) {
  const response = await fetch(GLM_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GLM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || 'glm-4.5',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000
    })
  });
  
  return await response.json();
}
```

### Budget Content Generation

```javascript
// glm-content.js
async function generateBlogPost(topic, length) {
  // GLM-4.5 at $0.63/1M tokens is great for bulk content
  const response = await glmChat([
    {
      role: 'system',
      content: `You are an expert SaaS content writer. Write SEO-optimized blog posts.`
    },
    {
      role: 'user',
      content: `Write a ${length || 1500} word blog post about: ${topic}
        
        Structure:
        - Engaging headline
        - Hook intro (first paragraph crucial for SEO)
        - 3-5 main sections with H2 headers
        - Actionable takeaways
        - CTA at end
        
        Tone: Professional, helpful, not salesy`
    }
  ]);
  
  return response.choices[0].message.content;
}

// Bulk email sequence generation
async function generateEmailSequence(product, sequenceType) {
  const sequences = {
    'onboarding': ['Welcome', 'Setup guide', 'First win', 'Advanced tips', 'Feedback request'],
    'abandoned_trial': ['Day 3 reminder', 'Day 5 value prop', 'Day 7 urgency', 'Day 14 last chance'],
    'upgrade': ['Feature highlight', 'Case study', 'Limited offer', 'Final reminder']
  };
  
  const emailTopics = sequences[sequenceType];
  const emails = [];
  
  for (const topic of emailTopics) {
    const email = await glmChat([
      {
        role: 'user',
        content: `Write a ${topic} email for ${product.name}.
          Product: ${product.description}
          Target: ${product.targetAudience}
          Max length: 150 words
          Include: Subject line, preview text, body, CTA`
      }
    ]);
    
    emails.push({
      topic,
      content: email.choices[0].message.content
    });
  }
  
  return emails;
}
```

---

## CONTENT PIPELINE

### Automated Content Calendar

```javascript
// content-pipeline.js
class ContentPipeline {
  constructor(config) {
    this.app = config.app;
    this.schedule = config.schedule;
    this.budget = config.monthlyBudget;
  }
  
  async generateWeeklyContent() {
    const content = {
      twitter: [],
      linkedin: [],
      blog: [],
      images: []
    };
    
    // Twitter: 2 posts/day using Grok (best for X platform)
    for (let i = 0; i < 14; i++) {
      const tweet = await generateTwitterContent(
        this.getTopicForDay(i),
        this.app.voiceStyle
      );
      content.twitter.push(tweet);
    }
    
    // LinkedIn: 3 posts/week using GLM (budget-friendly)
    for (let i = 0; i < 3; i++) {
      const post = await glmChat([{
        role: 'user',
        content: `Write a LinkedIn post about ${this.getLinkedInTopic(i)} 
          for ${this.app.name}. Professional tone, 100-200 words.`
      }]);
      content.linkedin.push(post.choices[0].message.content);
    }
    
    // Blog: 1 post/week using GLM (longest content, budget matters)
    const blogPost = await generateBlogPost(
      this.getBlogTopic(),
      2000
    );
    content.blog.push(blogPost);
    
    // Images: 10/week using Gemini
    const imagePrompts = this.getImagePrompts();
    for (const prompt of imagePrompts) {
      const image = await generateMarketingGraphic('twitter-card', {
        title: prompt,
        brandColor: this.app.brandColor
      });
      content.images.push(image);
    }
    
    return content;
  }
  
  getCostEstimate() {
    return {
      twitter: 14 * 0.003,  // ~1000 tokens each, Grok
      linkedin: 3 * 0.001,  // ~1500 tokens each, GLM
      blog: 1 * 0.005,      // ~5000 tokens, GLM
      images: 10 * 0.04,    // $0.04 average per image
      total: 0.042 + 0.003 + 0.005 + 0.4  // ~$0.45/week
    };
  }
}
```

---

## QUALITY CONTROL

### Image Quality Checklist

```javascript
// quality-check.js
async function checkImageQuality(imageBuffer) {
  // Use Gemini to evaluate generated images
  const gemini = getGeminiModel('gemini-3.0-pro-vision');
  
  const analysis = await gemini.generateContent([
    {
      inlineData: {
        mimeType: 'image/png',
        data: imageBuffer.toString('base64')
      }
    },
    {
      text: `Evaluate this marketing image on:
        1. Visual appeal (1-10)
        2. Text readability (1-10)
        3. Brand consistency (1-10)
        4. Mobile visibility (1-10)
        5. Call-to-action clarity (1-10)
        
        Return JSON: {"scores": {...}, "issues": [...], "suggestions": [...]}`
    }
  ]);
  
  return JSON.parse(analysis.response.text());
}
```

### Content A/B Testing

```javascript
// ab-testing.js
async function generateABVariants(content, count = 2) {
  const variants = [content];
  
  for (let i = 1; i < count; i++) {
    const variant = await glmChat([{
      role: 'user',
      content: `Create a variation of this content with a different angle:
        
        Original: ${content}
        
        Requirements:
        - Same core message
        - Different hook/opening
        - Different CTA
        - Similar length`
    }]);
    
    variants.push(variant.choices[0].message.content);
  }
  
  return variants.map((v, i) => ({
    variant: String.fromCharCode(65 + i),  // A, B, C...
    content: v
  }));
}
```

---

## COST TRACKING

```javascript
// content-costs.js
class ContentCostTracker {
  constructor() {
    this.costs = {
      gemini_image: { count: 0, total: 0 },
      gemini_video: { count: 0, total: 0 },
      grok: { tokens: 0, total: 0 },
      glm: { tokens: 0, total: 0 }
    };
  }
  
  recordImage(resolution) {
    const prices = {
      '1k': 0.039,
      '2k': 0.134,
      '4k': 0.24
    };
    this.costs.gemini_image.count++;
    this.costs.gemini_image.total += prices[resolution] || prices['1k'];
  }
  
  recordVideo(seconds) {
    this.costs.gemini_video.count++;
    this.costs.gemini_video.total += seconds * 0.10;
  }
  
  recordGrok(inputTokens, outputTokens) {
    const cost = (inputTokens * 3.15 + outputTokens * 15.75) / 1_000_000;
    this.costs.grok.tokens += inputTokens + outputTokens;
    this.costs.grok.total += cost;
  }
  
  recordGLM(inputTokens, outputTokens) {
    const cost = (inputTokens * 0.63 + outputTokens * 2.31) / 1_000_000;
    this.costs.glm.tokens += inputTokens + outputTokens;
    this.costs.glm.total += cost;
  }
  
  getReport() {
    const total = Object.values(this.costs)
      .reduce((sum, c) => sum + c.total, 0);
    
    return {
      breakdown: this.costs,
      total,
      formatted: `$${total.toFixed(2)}`
    };
  }
}
```

---

*Content Generation Skill v4.0 - Multi-API content creation*
