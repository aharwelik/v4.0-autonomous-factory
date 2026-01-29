/**
 * Google Stitch Integration
 * AI-powered UI design generation using Google's Stitch API
 *
 * Features:
 * - Generate UI designs from text prompts
 * - Export HTML/CSS code
 * - Higher quality output with Gemini 3 Pro
 * - Free tier: 350 generations/month
 *
 * Setup:
 * 1. Enable Stitch API: gcloud beta services mcp enable stitch.googleapis.com
 * 2. Set GOOGLE_CLOUD_PROJECT in settings
 * 3. Authenticate with: npx @_davideast/stitch-mcp init
 */

import { settings } from './db';

interface StitchScreen {
  id: string;
  name: string;
  html?: string;
  css?: string;
  imageUrl?: string;
}

interface StitchProject {
  id: string;
  name: string;
  screens: StitchScreen[];
}

interface GenerateUIOptions {
  prompt: string;
  model?: 'gemini-3-pro' | 'gemini-3-flash';
  style?: 'modern' | 'minimal' | 'bold' | 'corporate';
  platform?: 'web' | 'mobile' | 'tablet';
}

interface StitchResponse {
  success: boolean;
  projectId?: string;
  screenId?: string;
  html?: string;
  css?: string;
  imageUrl?: string;
  error?: string;
}

// Check if Stitch is configured
export function isStitchConfigured(): boolean {
  const projectId = settings.get<string>('GOOGLE_CLOUD_PROJECT');
  const stitchEnabled = settings.get<boolean>('STITCH_ENABLED');
  return !!(projectId && stitchEnabled);
}

/**
 * Generate UI using Google Stitch
 * Falls back to standard Gemini generation if Stitch is not configured
 */
export async function generateUIWithStitch(options: GenerateUIOptions): Promise<StitchResponse> {
  if (!isStitchConfigured()) {
    return {
      success: false,
      error: 'Stitch not configured. Enable it in Settings.',
    };
  }

  const projectId = settings.get<string>('GOOGLE_CLOUD_PROJECT');
  const model = options.model || 'gemini-3-flash';

  // Build the prompt
  const enhancedPrompt = buildStitchPrompt(options);

  try {
    // Call Stitch API via MCP
    const response = await fetch('http://localhost:3001/api/stitch/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        prompt: enhancedPrompt,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Stitch API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      projectId: data.projectId,
      screenId: data.screenId,
      html: data.html,
      css: data.css,
      imageUrl: data.imageUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Stitch generation failed',
    };
  }
}

/**
 * Build an optimized prompt for Stitch
 */
function buildStitchPrompt(options: GenerateUIOptions): string {
  const { prompt, style = 'modern', platform = 'web' } = options;

  const styleGuides: Record<string, string> = {
    modern: 'Clean, contemporary design with subtle shadows, rounded corners, and a professional color palette',
    minimal: 'Minimalist design with lots of whitespace, simple typography, and monochromatic colors',
    bold: 'Bold, eye-catching design with vibrant colors, large typography, and strong visual hierarchy',
    corporate: 'Professional business design with trustworthy colors (blues, grays), clean typography',
  };

  const platformGuides: Record<string, string> = {
    web: 'Desktop-first responsive web layout with navigation header, hero section, and content areas',
    mobile: 'Mobile-first design optimized for touch, with bottom navigation and card-based layouts',
    tablet: 'Tablet-optimized layout with multi-column grids and touch-friendly elements',
  };

  return `
Create a ${platform} UI design for: ${prompt}

Style: ${styleGuides[style]}
Platform: ${platformGuides[platform]}

Requirements:
- Modern, production-ready design
- Accessible color contrast
- Clear visual hierarchy
- Responsive layout
- Clean, semantic HTML
- Tailwind CSS classes preferred
  `.trim();
}

/**
 * Export Stitch project to files
 */
export async function exportStitchProject(projectId: string): Promise<{
  success: boolean;
  files?: { name: string; content: string }[];
  error?: string;
}> {
  if (!isStitchConfigured()) {
    return { success: false, error: 'Stitch not configured' };
  }

  try {
    const response = await fetch(`http://localhost:3001/api/stitch/export/${projectId}`);

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, files: data.files };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Stitch capabilities info
 */
export const STITCH_INFO = {
  name: 'Google Stitch',
  description: 'AI-powered UI design generation',
  features: [
    'Generate UI from text prompts',
    'Export HTML/CSS code',
    'Figma export',
    'Image-to-code (screenshot → design)',
    'Gemini 3 Pro for higher quality',
  ],
  freeTier: {
    standard: 350, // generations/month with Flash
    experimental: 50, // generations/month with Pro
  },
  setupUrl: 'https://stitch.withgoogle.com/',
  docsUrl: 'https://developers.googleblog.com/stitch-a-new-way-to-design-uis/',
};
