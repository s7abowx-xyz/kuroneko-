import axios from 'axios';

const PERSONA = 'اسمك Alyacore، مساعد ودود ومتعاون. رد بأسلوب قصير ومباشر يشبه محادثات واتساب.';

export type AiProvider = 'anthropic' | 'openai' | 'gemini';

async function callAnthropic(message: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY غير مضبوط');
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

  const { data } = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model,
      max_tokens: 1024,
      system: PERSONA,
      messages: [{ role: 'user', content: message }],
    },
    {
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    }
  );
  return data.content?.map((b: { text?: string }) => b.text || '').join('\n') || '';
}

async function callOpenAI(message: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY غير مضبوط');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const { data } = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: PERSONA },
        { role: 'user', content: message },
      ],
    },
    { headers: { authorization: `Bearer ${apiKey}` } }
  );
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(message: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY غير مضبوط');
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const { data } = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      systemInstruction: { parts: [{ text: PERSONA }] },
      contents: [{ parts: [{ text: message }] }],
    }
  );
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('\n') || ''
  );
}

export async function askAi(provider: AiProvider, message: string) {
  switch (provider) {
    case 'anthropic':
      return callAnthropic(message);
    case 'openai':
      return callOpenAI(message);
    case 'gemini':
      return callGemini(message);
    default:
      throw new Error('مزود غير معروف');
  }
}
