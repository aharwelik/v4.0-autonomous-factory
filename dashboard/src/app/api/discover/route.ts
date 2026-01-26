import { NextRequest, NextResponse } from "next/server";
import { ideas, cache } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * Idea Discovery API
 * Scrapes public sources for app ideas (no API keys needed)
 */

// Pain point keywords that indicate someone needs a solution
const PAIN_KEYWORDS = [
  "looking for",
  "is there a",
  "need help with",
  "frustrated with",
  "wish there was",
  "anyone know",
  "recommendation for",
  "alternative to",
  "tired of",
  "hate how",
  "why is it so hard",
  "can't find",
  "struggling with",
  "any tool for",
  "how do you",
];

// Subreddits good for SaaS ideas
const SUBREDDITS = [
  "SaaS",
  "startups",
  "Entrepreneur",
  "smallbusiness",
  "freelance",
  "webdev",
  "marketing",
  "productivity",
];

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  url: string;
  created_utc: number;
}

export async function GET() {
  // Check cache first (5 minute TTL for discovery)
  const cacheKey = "discovered_ideas";
  const cached = cache.get<{ ideas: unknown[]; discoveredAt: string }>(cacheKey);

  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true });
  }

  const discoveredIdeas: Array<{
    id: string;
    title: string;
    source: string;
    score: number;
    url: string;
    snippet: string;
  }> = [];

  // Scrape Reddit (public JSON API, no auth needed)
  for (const subreddit of SUBREDDITS.slice(0, 3)) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/new.json?limit=25`,
        {
          headers: {
            "User-Agent": "AppFactory/1.0",
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const posts: RedditPost[] = data?.data?.children?.map((c: { data: RedditPost }) => c.data) || [];

      for (const post of posts) {
        const text = `${post.title} ${post.selftext}`.toLowerCase();

        // Check if it matches pain point keywords
        const matchedKeyword = PAIN_KEYWORDS.find((kw) => text.includes(kw));
        if (matchedKeyword && post.score >= 1) {
          // Score based on engagement and keyword match
          const ideaScore = Math.min(100, Math.round(
            30 + // Base score
            (post.score * 2) + // Upvotes
            (text.length > 100 ? 10 : 0) + // Has description
            (PAIN_KEYWORDS.filter(kw => text.includes(kw)).length * 5) // Multiple pain keywords
          ));

          discoveredIdeas.push({
            id: `reddit-${post.created_utc}`,
            title: post.title.slice(0, 100),
            source: `r/${post.subreddit}`,
            score: ideaScore,
            url: `https://reddit.com${post.url}`,
            snippet: post.selftext.slice(0, 150) || post.title,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch r/${subreddit}:`, error);
    }
  }

  // Sort by score
  discoveredIdeas.sort((a, b) => b.score - a.score);

  // Take top 10
  const topIdeas = discoveredIdeas.slice(0, 10);

  const result = {
    ideas: topIdeas,
    total: discoveredIdeas.length,
    sources: SUBREDDITS.slice(0, 3),
    discoveredAt: new Date().toISOString(),
  };

  // Cache for 5 minutes
  cache.set(cacheKey, result, 300);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  // Save a discovered idea to the database
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "Title required" },
        { status: 400 }
      );
    }

    const id = `idea-${randomUUID().slice(0, 8)}`;

    const idea = ideas.create({
      id,
      title: body.title,
      description: body.snippet || body.description,
      source: body.source || "discovered",
      score: body.score || 50,
      status: "new",
    });

    // Clear dashboard cache
    cache.delete("dashboard_data");

    return NextResponse.json({
      success: true,
      idea,
      message: "Idea saved to pipeline",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to save idea" },
      { status: 500 }
    );
  }
}
