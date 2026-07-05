import { Request, Response } from 'express';
import { googleExchangeCode } from '../../src/oauth';
import { prisma } from '../../src/prisma';
import { signSession, setSessionCookie } from '../../src/auth-utils';

export default async function googleCallback(req: Request, res: Response) {
  const { code, state } = req.query as { code?: string; state?: string };
  const savedState = req.cookies?.kn_oauth_state;
  res.clearCookie('kn_oauth_state');

  if (!code || !state || state !== savedState) {
    return res.redirect('/login?error=oauth_state');
  }

  try {
    const profile = await googleExchangeCode(code);
    if (!profile.email) return res.redirect('/login?error=no_email');

    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: { name: profile.name, avatar: profile.avatar, provider: 'GOOGLE', providerId: profile.id },
      create: {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        provider: 'GOOGLE',
        providerId: profile.id,
      },
    });

    const token = signSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    setSessionCookie(res, token);
    res.redirect('/account');
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect('/login?error=oauth_failed');
  }
}
