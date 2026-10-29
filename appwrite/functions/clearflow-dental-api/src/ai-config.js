const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'openai',
    apiStyle: 'openai-compatible',
    modelsUrl: 'https://api.openai.com/v1/models',
    chatUrl: 'https://api.openai.com/v1/chat/completions'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'anthropic',
    apiStyle: 'anthropic',
    modelsUrl: 'https://api.anthropic.com/v1/models',
    chatUrl: 'https://api.anthropic.com/v1/messages'
  },
  {
    id: 'google',
    name: 'Google AI',
    icon: 'google',
    apiStyle: 'google',
    modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    chatUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  {
    id: 'groq',
    name: 'Groq',
    icon: 'groq',
    apiStyle: 'openai-compatible',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    chatUrl: 'https://api.groq.com/openai/v1/chat/completions'
  },
  {
    id: 'mistral',
    name: 'Mistral',
    icon: 'mistral',
    apiStyle: 'openai-compatible',
    modelsUrl: 'https://api.mistral.ai/v1/models',
    chatUrl: 'https://api.mistral.ai/v1/chat/completions'
  },
  {
    id: 'xai',
    name: 'xAI',
    icon: 'xai',
    apiStyle: 'openai-compatible',
    modelsUrl: 'https://api.x.ai/v1/models',
    chatUrl: 'https://api.x.ai/v1/chat/completions'
  }
];

export const AI_PROVIDERS = Object.freeze(providers.map(provider => Object.freeze(provider)));

export function getProvider(providerId) {
  return AI_PROVIDERS.find(provider => provider.id === String(providerId || '')) || null;
}

export function isSupportedProvider(providerId) {
  return Boolean(getProvider(providerId));
}

export function isSupportedProviderModel(providerId, modelId) {
  return isSupportedProvider(providerId) &&
    typeof modelId === 'string' &&
    modelId.trim().length > 0 &&
    modelId.length <= 200 &&
    !/[\u0000-\u001f]/.test(modelId);
}
