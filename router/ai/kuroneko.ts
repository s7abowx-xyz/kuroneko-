import { Request, Response } from 'express';
import { askAi, AiProvider } from '../../src/ai-providers';

export default async function kuronekoHandler(req: Request, res: Response) {
  const q = (req.query.q || req.body?.q) as string;
  const provider = ((req.query.provider || req.body?.provider || 'anthropic') as string) as AiProvider;

  if (!q) {
    return res.status(400).json({ status: false, message: "المعامل 'q' مطلوب." });
  }

  if (!['anthropic', 'openai', 'gemini'].includes(provider)) {
    return res.status(400).json({ status: false, message: 'مزود غير مدعوم.' });
  }

  try {
    const response = await askAi(provider, q);
    res.json({ status: true, response });
  } catch (error: any) {
    res.status(500).json({ status: false, message: error.message });
  }
}

