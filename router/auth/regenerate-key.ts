import { Request, Response } from 'express';
import { getSession } from '../../src/auth-utils';
import { generateApiKey } from '../../src/api-key';
import { prisma } from '../../src/prisma';

export default async function regenerateKeyHandler(req: Request, res: Response) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ status: false, message: 'غير مسجل الدخول.' });

  const user = await prisma.user.update({
    where: { id: session.id },
    data: { apiKey: generateApiKey() },
    select: { apiKey: true },
  });

  res.json({ status: true, apiKey: user.apiKey });
}
