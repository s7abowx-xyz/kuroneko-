import { Request, Response } from 'express';
import { prisma } from '../../src/prisma';
import { hashPassword, signSession, setSessionCookie } from '../../src/auth-utils';
import { verifyTurnstile } from '../../src/turnstile';
import { generateApiKey } from '../../src/api-key';

export default async function registerHandler(req: Request, res: Response) {
  const { name, email, password } = req.body || {};
  const turnstileToken = req.body?.['cf-turnstile-response'];

  const humanVerified = await verifyTurnstile(turnstileToken, req.ip);
  if (!humanVerified) {
    return res.status(400).json({ status: false, message: 'فشل التحقق الأمني (Cloudflare)، حاول مرة أخرى.' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ status: false, message: 'الاسم والبريد وكلمة المرور مطلوبة.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ status: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ status: false, message: 'هذا البريد الإلكتروني مستخدم بالفعل.' });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, apiKey: generateApiKey() },
  });

  const token = signSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  setSessionCookie(res, token);

  res.status(201).json({ status: true, message: 'تم إنشاء الحساب بنجاح.', user: { id: user.id, name: user.name, email: user.email } });
}
