import { Request, Response } from 'express';
import { prisma } from '../../src/prisma';
import { verifyPassword, signSession, setSessionCookie } from '../../src/auth-utils';

export default async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ status: false, message: 'البريد وكلمة المرور مطلوبة.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return res.status(401).json({ status: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ status: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  }

  const token = signSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  setSessionCookie(res, token);

  res.json({ status: true, message: 'تم تسجيل الدخول بنجاح.', user: { id: user.id, name: user.name, email: user.email } });
}
