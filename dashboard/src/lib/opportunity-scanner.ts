/**
 * Multi-Source Opportunity Scanner
 * Discovers app ideas from Reddit, Google Trends, and other sources
 * Runs continuously via cron to populate the opportunity pipeline
 */

import { randomUUID } from 'crypto';
import { ideas, opportunitySignals, marketTrends, cache } from './db';
import googleTrends from 'google-trends-api';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Pain point keywords that indicate someone needs a solution
const PAIN_KEYWORDS = [
  'looking for',
  'is there a',
  'need help with',
  'frustrated with',
  'wish there was',
  'anyone know',
  'recommendation for',
  'alternative to',
  'tired of',
  'hate how',
  'why is it so hard',
  'can\'t find',
  'struggling with',
  'any tool for',
  'how do you',
  'does anyone have',
  'where can i find',
  'help me find',
];

// Expanded subreddits for better coverage
const SUBREDDITS = [
  'SaaS',
  'startups',
  'Entrepreneur',
  'smallbusiness',
  'freelance',
  'webdev',
  'marketing',
  'productivity',
  'digitalnomad',
  'indiehackers',
  'sideproject',
  'microsaas',
  'buildinpublic',
  'nocode',
  'solopreneur',
];

// Keywords to track on Google Trends
const TREND_KEYWORDS = [
  'saas tools',
  'productivity app',
  'freelance tools',
  'business automation',
  'project management',
  'time tracking',
  'invoice software',
  'crm software',
  'marketing automation',
  'analytics dashboard',
];

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  url: string;
  created_utc: number;
  author: string;
  num_comments: number;
}

interface OpportunitySignalData {
  title: string;
  description: string;
  source: string;
  score: number;
  signals: Array<{
    type: string;
    source: string;
    content: string;
    url?: string;
    score: number;
    sentiment?: string;
  }>;
  search_growth?: number;
  signal_count?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// REDDIT SCANNER
// ═══════════════════════════════════════════════════════════════════════════

export async function scanReddit(): Promise<OpportunitySignalData[]> {
  const opportunities: OpportunitySignalData[] = [];

  for (const subreddit of SUBREDDITS) {
    try {
      // Check cache first (Reddit rate limits)
      const cacheKey = `reddit_scan_${subreddit}`;
      const cached = cache.get<RedditPost[]>(cacheKey);

      let posts: RedditPost[];

      if (cached) {
        posts = cached;
      } else {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/new.json?limit=50`,
          {
            headers: {
              'User-Agent': 'AppFactory/2.0 (Opportunity Scanner)',
            },
          }
        );

        if (!response.ok) {
          console.warn(`Failed to fetch r/${subreddit}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        posts = data?.data?.children?.map((c: { data: RedditPost }) => c.data) || [];

        // Cache for 15 minutes
        cache.set(cacheKey, posts, 900);
      }

      // Analyze posts for pain points
      for (const post of posts) {
        const text = `${post.title} ${post.selftext}`.toLowerCase();

        // Check if it matches pain point keywords
        const matchedKeywords = PAIN_KEYWORDS.filter((kw) => text.includes(kw));

        if (matchedKeywords.length > 0 && post.score >= 1) {
          // Calculate opportunity score based on multiple factors
          const engagementScore = Math.min(50, post.score * 2 + post.num_comments * 3);
          const descriptionScore = post.selftext.length > 100 ? 15 : 5;
          const keywordScore = matchedKeywords.length * 5;
          const recencyScore = (Date.now() / 1000 - post.created_utc) < 86400 ? 10 : 0; // Bonus for last 24h

          const totalScore = Math.min(100, 30 + engagementScore + descriptionScore + keywordScore + recencyScore);

          opportunities.push({
            title: post.title.slice(0, 200),
            description: post.selftext.slice(0, 500) || post.title,
            source: `r/${post.subreddit}`,
            score: Math.round(totalScore),
            signals: [
              {
                type: 'reddit_post',
                source: `r/${post.subreddit}`,
                content: `${post.title}\n\n${post.selftext.slice(0, 300)}`,
                url: `https://reddit.com${post.url}`,
                score: post.score,
                sentiment: matchedKeywords.length > 2 ? 'frustrated' : 'seeking',
              },
            ],
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning r/${subreddit}:`, error);
    }
  }

  return opportunities;
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE TRENDS SCANNER
// ═══════════════════════════════════════════════════════════════════════════

export async function scanGoogleTrends(): Promise<{
  trends: Array<{ keyword: string; growth: number }>;
  opportunities: OpportunitySignalData[];
}> {
  const trendData: Array<{ keyword: string; growth: number }> = [];
  const opportunities: OpportunitySignalData[] = [];

  for (const keyword of TREND_KEYWORDS) {
    try {
      // Check cache first (rate limiting)
      const cacheKey = `trends_${keyword.replace(/\s+/g, '_')}`;
      const cached = cache.get<{ growth: number; volume: number }>(cacheKey);

      let growth = 0;
      let volume = 0;

      if (cached) {
        growth = cached.growth;
        volume = cached.volume;
      } else {
        // Get interest over time (last 90 days)
        const result = await googleTrends.interestOverTime({
          keyword,
          startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          endTime: new Date(),
        });

        const data = JSON.parse(result);
        const timelineData = data?.default?.timelineData || [];

        if (timelineData.length > 10) {
          // Calculate growth rate (compare first half vs second half)
          const midpoint = Math.floor(timelineData.length / 2);
          const firstHalfAvg = timelineData.slice(0, midpoint).reduce((sum: number, item: { value: number[] }) => sum + (item.value[0] || 0), 0) / midpoint;
          const secondHalfAvg = timelineData.slice(midpoint).reduce((sum: number, item: { value: number[] }) => sum + (item.value[0] || 0), 0) / (timelineData.length - midpoint);

          growth = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
          volume = secondHalfAvg;

          // Save to trends table
          const trendId = `trend-${randomUUID().slice(0, 8)}`;
          marketTrends.create({
            id: trendId,
            keyword,
            search_volume: Math.round(volume),
            growth_rate: Math.round(growth * 10) / 10,
            snapshot_date: new Date().toISOString().split('T')[0],
          });

          // Cache for 24 hours
          cache.set(cacheKey, { growth, volume }, 86400);
        }
      }

      trendData.push({ keyword, growth: Math.round(growth * 10) / 10 });

      // If significant growth, create an opportunity
      if (growth > 20) {
        opportunities.push({
          title: `Growing demand for ${keyword}`,
          description: `Search interest for "${keyword}" has grown ${growth.toFixed(1)}% in the last 90 days. This indicates increasing market demand.`,
          source: 'Google Trends',
          score: Math.min(100, 50 + Math.round(growth)),
          search_growth: growth,
          signals: [
            {
              type: 'trend',
              source: 'Google Trends',
              content: `${keyword}: ${growth.toFixed(1)}% growth`,
              score: Math.round(volume),
              sentiment: growth > 50 ? 'surging' : 'growing',
            },
          ],
        });
      }
    } catch (error) {
      console.error(`Error fetching trends for ${keyword}:`, error);
      // Continue with next keyword
    }

    // Rate limiting: wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { trends: trendData, opportunities };
}

// ═══════════════════════════════════════════════════════════════════════════
// AGGREGATE AND SAVE
// ═══════════════════════════════════════════════════════════════════════════

export async function discoverOpportunities(): Promise<{
  discovered: number;
  signals: number;
  topOpportunities: OpportunitySignalData[];
}> {
  console.log('🔍 Starting opportunity discovery scan...');

  // Scan all sources
  const [redditOpportunities, { opportunities: trendOpportunities, trends }] = await Promise.all([
    scanReddit(),
    scanGoogleTrends(),
  ]);

  // Combine all opportunities
  const allOpportunities = [...redditOpportunities, ...trendOpportunities];

  console.log(`📊 Found ${allOpportunities.length} potential opportunities`);
  console.log(`📈 Tracked ${trends.length} keyword trends`);

  // Sort by score and deduplicate similar ideas
  const deduped = deduplicateOpportunities(allOpportunities);

  // Save top opportunities to database
  let savedCount = 0;
  let totalSignals = 0;

  for (const opp of deduped.slice(0, 20)) {
    // Only save if score is above threshold
    if (opp.score < 50) continue;

    // Check if similar idea already exists
    const existingIdeas = ideas.list('new', 100);
    const isDuplicate = existingIdeas.some(
      (existing) => similarity(existing.title, opp.title) > 0.7
    );

    if (isDuplicate) {
      console.log(`⏭️  Skipping duplicate: ${opp.title}`);
      continue;
    }

    // Create idea record
    const ideaId = `idea-${randomUUID().slice(0, 8)}`;
    ideas.create({
      id: ideaId,
      title: opp.title,
      description: opp.description,
      source: opp.source,
      score: opp.score,
      status: 'new',
      auto_discovered: 1,
      signal_count: opp.signals.length,
      search_growth: opp.search_growth || 0,
      competitor_count: 0,
    });

    // Save signals
    for (const signal of opp.signals) {
      const signalId = `signal-${randomUUID().slice(0, 8)}`;
      opportunitySignals.create({
        id: signalId,
        idea_id: ideaId,
        signal_type: signal.type,
        source: signal.source,
        content: signal.content,
        url: signal.url,
        score: signal.score,
        sentiment: signal.sentiment,
      });
      totalSignals++;
    }

    savedCount++;
    console.log(`✅ Saved: ${opp.title} (score: ${opp.score}, signals: ${opp.signals.length})`);
  }

  // Clear cache
  cache.delete('discovered_ideas');
  cache.delete('dashboard_data');

  console.log(`\n🎉 Discovery complete: ${savedCount} new opportunities, ${totalSignals} signals`);

  return {
    discovered: savedCount,
    signals: totalSignals,
    topOpportunities: deduped.slice(0, 10),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Deduplicate opportunities by combining similar ideas
 */
function deduplicateOpportunities(opportunities: OpportunitySignalData[]): OpportunitySignalData[] {
  const unique: OpportunitySignalData[] = [];

  for (const opp of opportunities) {
    const existing = unique.find((u) => similarity(u.title, opp.title) > 0.7);

    if (existing) {
      // Merge signals
      existing.signals.push(...opp.signals);
      existing.score = Math.max(existing.score, opp.score);
      existing.signal_count = existing.signals.length;
    } else {
      unique.push({ ...opp, signal_count: opp.signals.length });
    }
  }

  // Sort by score descending
  return unique.sort((a, b) => b.score - a.score);
}

/**
 * Calculate similarity between two strings (0-1)
 */
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1.toLowerCase() : s2.toLowerCase();
  const shorter = s1.length > s2.length ? s2.toLowerCase() : s1.toLowerCase();

  if (longer.length === 0) return 1.0;

  // Simple word overlap similarity
  const words1 = new Set(longer.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(shorter.split(/\s+/).filter(w => w.length > 3));

  const intersection = new Set(Array.from(words1).filter(w => words2.has(w)));

  return intersection.size / Math.max(words1.size, words2.size);
}
