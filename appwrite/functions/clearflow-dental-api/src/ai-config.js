export const AI_PROVIDERS = Object.freeze([
  Object.freeze({ id: 'openai', name: 'OpenAI', models: Object.freeze(['gpt-4.1-mini', 'gpt-4.1', 'o4-mini']) }),
  Object.freeze({ id: 'anthropic', name: 'Anthropic', models: Object.freeze(['claude-sonnet-4-20250514', 'claude-haiku-4-5']) }),
  Object.freeze({ id: 'google', name: 'Google AI', models: Object.freeze(['gemini-2.5-flash', 'gemini-2.5-pro']) }),
  Object.freeze({ id: 'openrouter', name: 'OpenRouter', models: Object.freeze(['openrouter/auto']) }),
  Object.freeze({ id: 'groq', name: 'Groq', models: Object.freeze(['llama-3.3-70b-versatile']) }),
  Object.freeze({ id: 'mistral', name: 'Mistral', models: Object.freeze(['mistral-small-latest', 'mistral-large-latest']) })
]);

export function isSupportedProviderModel(providerId, modelId) {
  const provider = AI_PROVIDERS.find(item => item.id === String(providerId || ''));
  return Boolean(provider && provider.models.includes(String(modelId || '')));
}
