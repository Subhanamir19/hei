import { env } from './env';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

const apiKey = env.OPENAI_API_KEY.trim();
let loggedKeyOnce = false;

export const callOpenAiChat = async (
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> => {
  try {
    if (!loggedKeyOnce) {
      const keyPreview = `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`;
      // eslint-disable-next-line no-console
      console.log(`[OPENAI] using key ${keyPreview} (len=${apiKey.length})`);
      loggedKeyOnce = true;
    }

    const response = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      // eslint-disable-next-line no-console
      console.warn(`[OPENAI] non-200 status=${response.status} body=${body.slice(0, 200)}`);
      return null;
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[OPENAI] request failed', error);
    return null;
  }
};
