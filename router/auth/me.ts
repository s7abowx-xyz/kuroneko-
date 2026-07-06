import { Request, Response } from 'express';
import { getSession } from '../../src/auth-utils';

export default async function meHandler(req: Request, res: Response) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ status: false, message: 'غير مسجل الدخول.' });
  }
  res.json({ status: true, user: session });
}
