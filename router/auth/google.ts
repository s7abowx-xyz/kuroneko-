import { Request, Response } from 'express';
import crypto from 'crypto';
import { googleAuthorizeUrl } from '../../src/oauth';

export default async function googleStart(req: Request, res: Response) {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('kn_oauth_state', state, { httpOnly: true, maxAge: 5 * 60 * 1000, sameSite: 'lax' });
  res.redirect(googleAuthorizeUrl(state));
}
