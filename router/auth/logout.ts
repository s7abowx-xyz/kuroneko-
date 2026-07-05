import { Request, Response } from 'express';
import { clearSessionCookie } from '../../src/auth-utils';

export default async function logoutHandler(req: Request, res: Response) {
  clearSessionCookie(res);
  res.json({ status: true, message: 'تم تسجيل الخروج.' });
}
