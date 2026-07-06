import { Request, Response } from 'express';
import { prisma } from '../../src/prisma';
import { hashPassword } from '../../src/auth-utils';

export default async function resetPasswordHandler(req: Request, res: Response) {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ status: false, message: 'بيانات ناقصة.' });
  if (String(password).length < 8) return res.status(400).json({ status: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) {
    return res.status(400).json({ status: false, message: 'الرابط غير صالح أو منتهي الصلاحية.' });
  }

  const hashed = await hashPassword(password);
  await prisma.user.update({ where: { email: record.identifier }, data: { password: hashed } });
  await prisma.passwordResetToken.delete({ where: { token } });

  res.json({ status: true, message: 'تم تحديث كلمة المرور بنجاح.' });
}
