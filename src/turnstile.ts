import axios from 'axios';

// Real Cloudflare Turnstile verification (the free CAPTCHA widget shown
// embedded inside a form — different from Cloudflare's site-wide
// "under attack" interstitial, which is configured entirely on
// Cloudflare's dashboard and needs no code here).
//
// Get your keys from: https://dash.cloudflare.com/?to=/:account/turnstile
export async function verifyTurnstile(token: string | undefined, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // If no secret is configured, skip verification (useful for local dev
  // before you've set up a Turnstile site). In production, always set it.
  if (!secret) return true;

  if (!token) return false;

  try {
    const { data } = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      })
    );
    return data.success === true;
  } catch {
    return false;
  }
}
