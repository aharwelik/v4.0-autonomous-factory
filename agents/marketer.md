# 📣 Marketer Agent
## Content Generation & Distribution

**Role**: Generate marketing content and grow audience for factory apps

---

## CORE RESPONSIBILITIES

1. **Content Generation**: Blog posts, social posts, emails
2. **Distribution**: Post to platforms automatically
3. **Engagement**: Monitor and respond (with human approval)
4. **Analytics**: Track what's working

---

## CONTENT STRATEGY

### Weekly Content Calendar

```yaml
weekly_schedule:
  monday:
    - twitter_thread: "Educational content"
    - linkedin_post: "Industry insight"
    
  tuesday:
    - twitter_post: "Quick tip"
    - blog_draft: "Start weekly article"
    
  wednesday:
    - twitter_post: "Product feature highlight"
    - email_newsletter_draft: "Prepare weekly send"
    
  thursday:
    - twitter_thread: "Case study or results"
    - linkedin_post: "Thought leadership"
    - blog_publish: "Publish weekly article"
    
  friday:
    - twitter_post: "Weekend reading"
    - email_send: "Weekly newsletter"
    
  saturday:
    - content_analysis: "Review week's performance"
    - next_week_planning: "Queue next week's content"
    
  sunday:
    - rest: "No posting (engagement only)"
```

### Content Pillars

```yaml
content_pillars:
  educational:
    purpose: "Establish expertise, drive SEO"
    formats: ["blog_posts", "twitter_threads", "guides"]
    frequency: "2-3x per week"
    
  product:
    purpose: "Drive signups and conversions"
    formats: ["feature_highlights", "tutorials", "use_cases"]
    frequency: "2x per week"
    
  social_proof:
    purpose: "Build trust"
    formats: ["testimonials", "case_studies", "metrics"]
    frequency: "1x per week"
    
  engagement:
    purpose: "Build community"
    formats: ["questions", "polls", "behind_scenes"]
    frequency: "daily"
```

---

## CONTENT GENERATION

### Blog Post Generation

```python
# blog_generator.py
async def generate_blog_post(topic, app_context, seo_keywords):
    """
    Generate a complete blog post optimized for SEO.
    Uses GLM-4.5 for cost efficiency on long-form content.
    """
    
    # Step 1: Research (gather supporting data)
    research = await grok_chat([{
        "role": "user",
        "content": f"""Research the topic: {topic}
        
        Find:
        - 3 recent statistics or data points
        - 2 expert quotes or studies
        - Current trends related to this topic
        
        Focus on information from the last 6 months."""
    }])
    
    # Step 2: Outline
    outline = await glm_chat([{
        "role": "user",
        "content": f"""Create a blog post outline for: {topic}
        
        Target keywords: {', '.join(seo_keywords)}
        Target length: 1500-2000 words
        
        Include:
        - Compelling headline with primary keyword
        - Meta description (155 chars)
        - 5-7 main sections with H2 headers
        - Key points for each section
        - CTA placement"""
    }])
    
    # Step 3: Write full post
    post = await glm_chat([{
        "role": "user",
        "content": f"""Write a complete blog post based on this outline:
        
        {outline}
        
        Research to incorporate:
        {research}
        
        Product context (weave in naturally):
        {app_context}
        
        Requirements:
        - Conversational but professional tone
        - Include the keywords naturally (not stuffed)
        - Add internal links placeholders: [LINK: topic]
        - Include 1 CTA per 500 words
        - End with strong conclusion and final CTA"""
    }])
    
    # Step 4: Generate featured image prompt
    image_prompt = await generate_image_prompt(topic, post[:500])
    
    return {
        "title": extract_title(post),
        "meta_description": extract_meta(outline),
        "content": post,
        "keywords": seo_keywords,
        "image_prompt": image_prompt,
        "word_count": len(post.split()),
        "estimated_read_time": len(post.split()) // 200
    }
```

### Twitter Thread Generation

```python
# twitter_generator.py
async def generate_twitter_thread(topic, hook_style, app_context):
    """
    Generate engaging Twitter thread.
    Uses Grok for Twitter-native content.
    """
    
    hook_styles = {
        "controversial": "Start with a bold, slightly contrarian take",
        "story": "Start with a personal story or anecdote",
        "question": "Start with a thought-provoking question",
        "statistic": "Start with a surprising statistic",
        "mistake": "Start with a common mistake people make"
    }
    
    thread = await grok_chat([{
        "role": "system",
        "content": """You are a Twitter expert who creates viral threads.
        
        Rules:
        - Each tweet MUST be under 280 characters
        - First tweet is the hook - make it stop the scroll
        - Use line breaks for readability
        - Include 1 emoji per tweet (max)
        - End with a clear CTA
        - Don't number the tweets"""
    }, {
        "role": "user",
        "content": f"""Create a 7-tweet thread about: {topic}
        
        Hook style: {hook_styles.get(hook_style, hook_style)}
        
        Structure:
        1. Hook (must grab attention)
        2-5. Main points (one insight per tweet)
        6. Soft product mention (if relevant): {app_context['name']}
        7. CTA (follow, reply, or visit)
        
        Make it feel like advice from a friend, not a brand."""
    }])
    
    # Parse into individual tweets
    tweets = parse_thread(thread)
    
    # Validate character counts
    for i, tweet in enumerate(tweets):
        if len(tweet) > 280:
            tweets[i] = await shorten_tweet(tweet)
    
    return {
        "tweets": tweets,
        "total_tweets": len(tweets),
        "best_post_time": get_optimal_post_time("twitter"),
        "hashtags": suggest_hashtags(topic)
    }
```

### Email Sequence Generation

```python
# email_generator.py
async def generate_email_sequence(sequence_type, product, subscriber_segment):
    """
    Generate complete email sequence.
    Uses GLM for cost efficiency.
    """
    
    sequences = {
        "welcome": {
            "emails": 5,
            "cadence": [0, 1, 3, 5, 7],  # Days after signup
            "goals": [
                "Welcome + quick win",
                "Core value proposition",
                "Social proof",
                "Advanced tip",
                "Soft upgrade pitch"
            ]
        },
        "onboarding": {
            "emails": 4,
            "cadence": [0, 2, 5, 10],
            "goals": [
                "Getting started guide",
                "First feature deep-dive",
                "Common mistakes to avoid",
                "Success metrics check-in"
            ]
        },
        "trial_ending": {
            "emails": 3,
            "cadence": [-3, -1, 0],  # Days before trial ends
            "goals": [
                "Reminder + value recap",
                "Urgency + offer",
                "Last chance"
            ]
        },
        "win_back": {
            "emails": 3,
            "cadence": [7, 14, 30],  # Days after churn
            "goals": [
                "We miss you + what's new",
                "Special offer",
                "Final goodbye + feedback request"
            ]
        }
    }
    
    config = sequences[sequence_type]
    emails = []
    
    for i, goal in enumerate(config["goals"]):
        email = await glm_chat([{
            "role": "user",
            "content": f"""Write email {i+1} of {len(config['goals'])} in a {sequence_type} sequence.
            
            Product: {product['name']} - {product['description']}
            Audience: {subscriber_segment}
            Goal: {goal}
            Send day: {config['cadence'][i]} (relative to trigger)
            
            Include:
            - Subject line (50 chars max, compelling)
            - Preview text (90 chars)
            - Email body (150 words max)
            - Clear CTA button text
            
            Tone: Friendly, helpful, not salesy
            Format: Plain text with [CTA: button text] markers"""
        }])
        
        emails.append({
            "sequence": sequence_type,
            "position": i + 1,
            "send_day": config["cadence"][i],
            "goal": goal,
            "content": parse_email(email)
        })
    
    return {
        "sequence_type": sequence_type,
        "total_emails": len(emails),
        "emails": emails,
        "estimated_completion_rate": estimate_sequence_completion(sequence_type)
    }
```

---

## DISTRIBUTION

### Platform Connectors

```javascript
// platform-connectors.js

class TwitterConnector {
  constructor(credentials) {
    this.client = new TwitterApi(credentials);
  }
  
  async postTweet(content, options = {}) {
    const tweet = await this.client.v2.tweet({
      text: content,
      ...options
    });
    return { id: tweet.data.id, url: `https://twitter.com/i/status/${tweet.data.id}` };
  }
  
  async postThread(tweets) {
    let lastTweetId = null;
    const results = [];
    
    for (const tweet of tweets) {
      const options = lastTweetId ? { reply: { in_reply_to_tweet_id: lastTweetId } } : {};
      const result = await this.postTweet(tweet, options);
      lastTweetId = result.id;
      results.push(result);
      
      // Rate limit: wait between tweets
      await sleep(2000);
    }
    
    return results;
  }
}

class LinkedInConnector {
  constructor(credentials) {
    this.accessToken = credentials.accessToken;
    this.personUrn = credentials.personUrn;
  }
  
  async postUpdate(content, imageUrl = null) {
    const body = {
      author: this.personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: imageUrl ? "IMAGE" : "NONE"
        }
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
    };
    
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    return await response.json();
  }
}

class EmailConnector {
  constructor(resendApiKey) {
    this.resend = new Resend(resendApiKey);
  }
  
  async sendEmail({ to, subject, html, from }) {
    return await this.resend.emails.send({
      from: from || "hello@yourdomain.com",
      to,
      subject,
      html
    });
  }
  
  async sendBulk(emails) {
    return await this.resend.batch.send(emails);
  }
}
```

### Posting Scheduler

```javascript
// scheduler.js
class ContentScheduler {
  constructor(connectors) {
    this.connectors = connectors;
    this.queue = [];
  }
  
  async schedulePost(post) {
    const optimalTime = await this.getOptimalTime(post.platform, post.type);
    
    this.queue.push({
      ...post,
      scheduledFor: optimalTime,
      status: 'queued'
    });
    
    // Save to database
    await db.insert(scheduledPosts).values(post);
    
    return { scheduledFor: optimalTime };
  }
  
  getOptimalTime(platform, contentType) {
    // Research-backed optimal posting times
    const optimalTimes = {
      twitter: {
        default: { weekday: [9, 12, 17], weekend: [10, 14] },
        thread: { weekday: [8, 9], weekend: [9] }
      },
      linkedin: {
        default: { weekday: [7, 8, 12, 17, 18], weekend: [] }
      },
      email: {
        newsletter: { weekday: [10], weekend: [] },
        promotional: { weekday: [10, 14], weekend: [] }
      }
    };
    
    const times = optimalTimes[platform]?.[contentType] || optimalTimes[platform]?.default;
    const now = new Date();
    const isWeekend = [0, 6].includes(now.getDay());
    const hours = isWeekend ? times.weekend : times.weekday;
    
    // Find next available slot
    return this.findNextSlot(hours);
  }
  
  async processQueue() {
    const dueItems = this.queue.filter(
      item => item.scheduledFor <= new Date() && item.status === 'queued'
    );
    
    for (const item of dueItems) {
      try {
        const connector = this.connectors[item.platform];
        const result = await connector.post(item.content, item.options);
        
        item.status = 'posted';
        item.result = result;
        
        // Track for analytics
        await this.trackPost(item);
        
      } catch (error) {
        item.status = 'failed';
        item.error = error.message;
        
        // Alert on failure
        await this.alertFailure(item, error);
      }
    }
  }
}
```

---

## ANALYTICS & OPTIMIZATION

### Engagement Tracking

```javascript
// analytics.js
class MarketingAnalytics {
  async trackEngagement(postId, platform) {
    const metrics = await this.fetchMetrics(postId, platform);
    
    await db.insert(postMetrics).values({
      postId,
      platform,
      ...metrics,
      fetchedAt: new Date()
    });
    
    return metrics;
  }
  
  async getContentPerformance(timeframe = '30d') {
    const posts = await db.query.postMetrics.findMany({
      where: gte(postMetrics.postedAt, getStartDate(timeframe))
    });
    
    // Aggregate by content type
    const byType = groupBy(posts, 'contentType');
    
    return Object.entries(byType).map(([type, items]) => ({
      type,
      count: items.length,
      avgEngagement: avg(items.map(i => i.engagementRate)),
      avgReach: avg(items.map(i => i.reach)),
      topPerformer: maxBy(items, 'engagementRate'),
      worstPerformer: minBy(items, 'engagementRate')
    }));
  }
  
  async generateWeeklyReport() {
    const performance = await this.getContentPerformance('7d');
    const growth = await this.calculateGrowth();
    const recommendations = await this.getRecommendations(performance);
    
    return {
      period: 'Last 7 days',
      performance,
      growth,
      recommendations,
      topContent: await this.getTopContent(5),
      contentToRetire: await this.getUnderperformers()
    };
  }
}
```

### A/B Testing

```javascript
// ab-testing.js
async function runContentABTest(contentA, contentB, platform, sampleSize) {
  // Split audience
  const audienceA = await getAudienceSegment(sampleSize / 2);
  const audienceB = await getAudienceSegment(sampleSize / 2);
  
  // Post both variants
  const postA = await post(contentA, platform, { audience: audienceA });
  const postB = await post(contentB, platform, { audience: audienceB });
  
  // Wait for engagement (24-48 hours)
  await sleep(24 * 60 * 60 * 1000);
  
  // Collect metrics
  const metricsA = await getMetrics(postA.id);
  const metricsB = await getMetrics(postB.id);
  
  // Statistical significance
  const winner = determineWinner(metricsA, metricsB);
  
  return {
    variantA: { content: contentA, metrics: metricsA },
    variantB: { content: contentB, metrics: metricsB },
    winner: winner.variant,
    confidence: winner.confidence,
    recommendation: winner.recommendation
  };
}
```

---

## SUBAGENTS

### Content Writer

```yaml
name: content_writer
model: glm-4.5  # Cost-effective for long-form
purpose: Generate written content

capabilities:
  - Blog posts
  - Email copy
  - Landing page copy
  - Ad copy
  - Social captions

style_guide:
  tone: "Friendly, helpful, not salesy"
  reading_level: "8th grade"
  sentence_length: "Mix short and medium"
  paragraphs: "3-4 sentences max"
  cta_style: "Clear, action-oriented"
```

### Social Poster

```yaml
name: social_poster
model: grok-4  # Best for Twitter/X
purpose: Create and post social content

platforms:
  - twitter
  - linkedin
  
capabilities:
  - Thread creation
  - Single posts
  - Replies (drafts for approval)
  - Scheduling
  
requires_approval:
  - replies
  - controversial_content
  - product_announcements
```

### SEO Optimizer

```yaml
name: seo_optimizer
model: claude-3-5-haiku
purpose: Optimize content for search

capabilities:
  - Keyword research
  - Title optimization
  - Meta description writing
  - Internal linking suggestions
  - Content gap analysis

tools:
  - google_search_console_api
  - ahrefs_api (if available)
  - semrush_api (if available)
```

---

## COMMANDS

| Command | Description |
|---------|-------------|
| `/generate-blog {topic}` | Generate full blog post |
| `/generate-thread {topic}` | Generate Twitter thread |
| `/generate-email {type}` | Generate email sequence |
| `/schedule {content}` | Schedule content for posting |
| `/analyze-performance` | Get performance report |
| `/ab-test {contentA} {contentB}` | Run A/B test |

---

## SAFETY RAILS

### Human Approval Required For:

```yaml
requires_approval:
  - Replies to users (always)
  - Controversial topics
  - Product announcements
  - Pricing mentions
  - Competitor mentions
  - Legal/compliance topics
  - Content over $10 budget
```

### Content Guidelines

```yaml
never_post:
  - Negative competitor mentions
  - Unverified claims
  - Political content
  - Offensive content
  - Misleading information
  
always_verify:
  - Statistics and data
  - Quotes
  - Feature claims
  - Pricing information
```

---

## COST TRACKING

```javascript
// marketer-costs.js
const CONTENT_COSTS = {
  blog_post: {
    glm_tokens: 5000,
    cost: 0.012
  },
  twitter_thread: {
    grok_tokens: 2000,
    cost: 0.007
  },
  email_sequence: {
    glm_tokens: 3000,
    cost: 0.008
  },
  image: {
    gemini: 1,
    cost: 0.04
  }
};

function estimateWeeklyCost(contentPlan) {
  let total = 0;
  
  for (const [type, count] of Object.entries(contentPlan)) {
    total += CONTENT_COSTS[type].cost * count;
  }
  
  return {
    estimated: total,
    breakdown: contentPlan
  };
}

// Example weekly plan
const weeklyPlan = {
  blog_post: 1,
  twitter_thread: 3,
  email_sequence: 0.5,  // Part of a sequence
  image: 5
};

// Result: ~$0.24/week for content generation
```

---

*Marketer Agent v4.0 - Automated content that converts*
