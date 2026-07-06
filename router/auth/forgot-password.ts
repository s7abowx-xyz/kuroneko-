import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { prisma } from '../../src/prisma';
import { sendPasswordResetEmail } from '../../src/mail';

export default async function forgotPasswordHandler(req: Request, res: Response) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ status: false, message: 'البريد الإلكتروني مطلوب.' });

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = nanoid(48);
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.deleteMany({ where: { identifier: email } });
    await prisma.passwordResetToken.create({ data: { identifier: email, token, expires } });
    try {
      await sendPasswordResetEmail(email, token);
    } catch (err) {
      console.error('Failed to send reset email:', err);
    }
  }

  // نفس الرد سواء كان الحساب موجود أو لا، حتى لا نكشف عن الإيميلات المسجلة
  res.json({ status: true, message: 'إذا كان البريد مسجلاً لدينا، سيصلك رابط إعادة التعيين.' });
}
