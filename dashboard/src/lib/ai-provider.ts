/**
 * AI Provider Abstraction
 * Swap between Gemini, Claude, Grok, or any AI API
 */

export type AIProvider = 'gemini' | 'claude' | 'grok' | 'openai' | 'local';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokens?: number;
  cost?: number;
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

// Default models per provider
const DEFAULT_MODELS: Record<AIProvider, string> = {
  gemini: 'gemini-1.5-flash', // FREE and fast!
  claude: 'claude-3-5-haiku-20241022',
  grok: 'grok-2',
  openai: 'gpt-4o-mini',
  local: 'local',
};

// Cost per 1M tokens (input/output)
const COSTS: Record<AIProvider, { input: number; output: number }> = {
  gemini: { input: 0, output: 0 }, // FREE tier!
  claude: { input: 0.25, output: 1.25 }, // Haiku
  grok: { input: 2, output: 10 },
  openai: { input: 0.15, output: 0.60 }, // GPT-4o-mini
  local: { input: 0, output: 0 },
};

/**
 * Call any AI provider with a unified interface
 */
export async function callAI(
  messages: AIMessage[],
  config: AIProviderConfig
): Promise<AIResponse> {
  const model = config.model || DEFAULT_MODELS[config.provider];

  switch (config.provider) {
    case 'gemini':
      return callGemini(messages, config.apiKey, model);
    case 'claude':
      return callClaude(messages, config.apiKey, model);
    case 'grok':
      return callGrok(messages, config.apiKey, model);
    case 'openai':
      return callOpenAI(messages, config.apiKey, model);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Gemini (Google AI) - FREE TIER AVAILABLE
 * 15 RPM, 1M tokens/day, 1500 requests/day FREE
 */
async function callGemini(
  messages: AIMessage[],
  apiKey: string,
  model: string
): Promise<AIResponse> {
  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  // Add system instruction if present
  const systemMessage = messages.find(m => m.role === 'system');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini error: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const tokens = data.usageMetadata?.totalTokenCount || 0;

  return {
    content,
    provider: 'gemini',
    model,
    tokens,
    cost: 0, // FREE!
  };
}

/**
 * Claude (Anthropic)
 */
async function callClaude(
  messages: AIMessage[],
  apiKey: string,
  model: string
): Promise<AIResponse> {
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemMessage?.content,
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude error: ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;

  return {
    content,
    provider: 'claude',
    model,
    tokens: inputTokens + outputTokens,
    cost: (inputTokens * COSTS.claude.input + outputTokens * COSTS.claude.output) / 1_000_000,
  };
}

/**
 * Grok (xAI)
 */
async function callGrok(
  messages: AIMessage[],
  apiKey: string,
  model: string
): Promise<AIResponse> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;

  return {
    content,
    provider: 'grok',
    model,
    tokens,
    cost: (tokens * (COSTS.grok.input + COSTS.grok.output) / 2) / 1_000_000,
  };
}

/**
 * OpenAI / OpenAI-compatible APIs
 */
async function callOpenAI(
  messages: AIMessage[],
  apiKey: string,
  model: string,
  baseUrl = 'https://api.openai.com/v1'
): Promise<AIResponse> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;

  return {
    content,
    provider: 'openai',
    model,
    tokens,
    cost: (tokens * (COSTS.openai.input + COSTS.openai.output) / 2) / 1_000_000,
  };
}

/**
 * Get the best available provider based on configured API keys
 */
export function getBestProvider(env: Record<string, string | undefined>): AIProviderConfig | null {
  // Priority: Gemini (free) > Claude > OpenAI > Grok
  if (env.GEMINI_API_KEY) {
    return { provider: 'gemini', apiKey: env.GEMINI_API_KEY };
  }
  if (env.ANTHROPIC_API_KEY) {
    return { provider: 'claude', apiKey: env.ANTHROPIC_API_KEY };
  }
  if (env.OPENAI_API_KEY) {
    return { provider: 'openai', apiKey: env.OPENAI_API_KEY };
  }
  if (env.GROK_API_KEY) {
    return { provider: 'grok', apiKey: env.GROK_API_KEY };
  }
  return null;
}

/**
 * Provider info for UI display
 */
export const PROVIDER_INFO: Record<AIProvider, {
  name: string;
  free: boolean;
  freeDetails: string;
  signupUrl: string;
}> = {
  gemini: {
    name: 'Google Gemini',
    free: true,
    freeDetails: '1M tokens/day, 1500 req/day FREE',
    signupUrl: 'https://aistudio.google.com/app/apikey',
  },
  claude: {
    name: 'Anthropic Claude',
    free: false,
    freeDetails: '$5 free credit on signup',
    signupUrl: 'https://console.anthropic.com/signup',
  },
  grok: {
    name: 'xAI Grok',
    free: false,
    freeDetails: 'Pay per use',
    signupUrl: 'https://console.x.ai/',
  },
  openai: {
    name: 'OpenAI',
    free: false,
    freeDetails: '$5 free credit on signup',
    signupUrl: 'https://platform.openai.com/signup',
  },
  local: {
    name: 'Local Model',
    free: true,
    freeDetails: 'Run your own model',
    signupUrl: '',
  },
};
