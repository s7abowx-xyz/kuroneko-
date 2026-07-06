import { Request, Response } from 'express';
import { getSession } from '../../src/auth-utils';
import { prisma } from '../../src/prisma';

export default async function meHandler(req: Request, res: Response) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ status: false, message: 'غير مسجل الدخول.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, apiKey: true, createdAt: true },
  });

  if (!user) return res.status(401).json({ status: false, message: 'الحساب غير موجود.' });

  res.json({ status: true, user });
}
