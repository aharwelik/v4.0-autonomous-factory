/**
 * AI Provider Abstraction
 * Swap between Gemini, Claude, DeepSeek, GLM, Grok, or any AI API
 */

export type AIProvider = 'gemini' | 'claude' | 'deepseek' | 'glm' | 'grok' | 'openai' | 'local';

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
  gemini: 'gemini-2.0-flash', // FREE and fast! (updated Jan 2026)
  claude: 'claude-3-5-haiku-20241022',
  deepseek: 'deepseek-chat', // DeepSeek V3 - best value!
  glm: 'glm-4-flash', // GLM-4 Flash - cheap and good
  grok: 'grok-2',
  openai: 'gpt-4o-mini',
  local: 'local',
};

// Cost per 1M tokens (input/output)
const COSTS: Record<AIProvider, { input: number; output: number }> = {
  gemini: { input: 0, output: 0 }, // FREE tier!
  claude: { input: 0.25, output: 1.25 }, // Haiku
  deepseek: { input: 0.14, output: 0.28 }, // DeepSeek V3 - super cheap!
  glm: { input: 0.10, output: 0.10 }, // GLM-4 Flash - flat rate
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
    case 'deepseek':
      return callDeepSeek(messages, config.apiKey, model);
    case 'glm':
      return callGLM(messages, config.apiKey, model);
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
 * DeepSeek - Best value for code generation
 * $0.14/1M input, $0.28/1M output
 */
async function callDeepSeek(
  messages: AIMessage[],
  apiKey: string,
  model: string
): Promise<AIResponse> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
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
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  return {
    content,
    provider: 'deepseek',
    model,
    tokens: inputTokens + outputTokens,
    cost: (inputTokens * COSTS.deepseek.input + outputTokens * COSTS.deepseek.output) / 1_000_000,
  };
}

/**
 * GLM (Zhipu AI) - Cheap flat-rate pricing
 * $0.10/1M for both input and output
 */
async function callGLM(
  messages: AIMessage[],
  apiKey: string,
  model: string
): Promise<AIResponse> {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
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
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GLM error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;

  return {
    content,
    provider: 'glm',
    model,
    tokens,
    cost: (tokens * COSTS.glm.input) / 1_000_000, // Flat rate
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
 * Get the best available provider based on configured API keys and spending caps
 */
export function getBestProvider(
  env: Record<string, string | undefined>,
  excludeProvider?: string | {
    caps?: Record<string, number>;      // Spending cap per provider
    spent?: Record<string, number>;     // Current spend per provider
  }
): AIProviderConfig | null {
  // Handle old options format (backward compatibility)
  let exclude: string | null = null;
  let options: { caps?: Record<string, number>; spent?: Record<string, number> } = {};

  if (typeof excludeProvider === 'string') {
    exclude = excludeProvider;
  } else if (excludeProvider && typeof excludeProvider === 'object') {
    options = excludeProvider;
  }

  const caps = options?.caps || {};
  const spent = options?.spent || {};

  // Check if provider is within budget and not excluded
  const isAvailable = (provider: string): boolean => {
    if (exclude && provider === exclude) return false;

    const cap = caps[`cap_${provider}`];
    if (cap === undefined || cap === null) return true; // No cap = unlimited
    if (cap === 0) return false; // Cap of 0 = disabled
    const currentSpend = spent[provider] || 0;
    return currentSpend < cap;
  };

  // Priority: Gemini (free) > DeepSeek (cheap) > GLM (cheap) > Claude > OpenAI > Grok
  if (env.GEMINI_API_KEY && isAvailable('gemini')) {
    return { provider: 'gemini', apiKey: env.GEMINI_API_KEY };
  }
  if (env.DEEPSEEK_API_KEY && isAvailable('deepseek')) {
    return { provider: 'deepseek', apiKey: env.DEEPSEEK_API_KEY };
  }
  if (env.GLM_API_KEY && isAvailable('glm')) {
    return { provider: 'glm', apiKey: env.GLM_API_KEY };
  }
  if (env.ANTHROPIC_API_KEY && isAvailable('anthropic')) {
    return { provider: 'claude', apiKey: env.ANTHROPIC_API_KEY };
  }
  if (env.OPENAI_API_KEY && isAvailable('openai')) {
    return { provider: 'openai', apiKey: env.OPENAI_API_KEY };
  }
  if (env.GROK_API_KEY && isAvailable('grok')) {
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
  deepseek: {
    name: 'DeepSeek',
    free: false,
    freeDetails: '$0.14/1M in, $0.28/1M out - BEST VALUE',
    signupUrl: 'https://platform.deepseek.com/',
  },
  glm: {
    name: 'GLM (Zhipu AI)',
    free: false,
    freeDetails: '$0.10/1M flat rate - CHEAPEST',
    signupUrl: 'https://open.bigmodel.cn/',
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
