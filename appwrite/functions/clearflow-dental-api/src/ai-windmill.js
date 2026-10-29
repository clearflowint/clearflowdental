export async function runWindmillAi(payload) {
  const url = process.env.CLEARFLOW_WINDMILL_AI_URL || 'https://clearflowwindmill.duckdns.org/api/dental/ai/chat';
  const secret = process.env.CLEARFLOW_WINDMILL_WEBHOOK_SECRET;
  if (!secret) {
    throw Object.assign(new Error('Windmill AI bridge is not configured on the server.'), { status: 503 });
  }

  let result;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-ClearFlow-Webhook-Key': secret
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000)
    });
    result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw Object.assign(new Error('Windmill AI execution failed.'), {
        status: response.status >= 500 ? 502 : response.status
      });
    }
  } catch (cause) {
    if (cause?.status) throw cause;
    throw Object.assign(new Error('Could not reach the AI execution service. Try again.'), { status: 502 });
  }

  const expectedStatus = payload.action === 'models' ? 'ready' : 'completed';
  const hasExpectedPayload = payload.action === 'models'
    ? Array.isArray(result?.models)
    : typeof result?.reply === 'string';
  if (!result || result.ok !== true || result.status !== expectedStatus || !hasExpectedPayload) {
    const status = result?.status === 'provider_not_connected' ? 409 : result?.status === 'budget_exhausted' ? 429 : 502;
    throw Object.assign(new Error(
      typeof result?.message === 'string' ? result.message.slice(0, 240) : 'The AI execution service returned an incomplete response.'
    ), { status });
  }
  return result;
}
