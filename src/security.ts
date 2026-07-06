import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me';
const PASS_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const CHALLENGE_TTL_MS = 2 * 60 * 1000; // 2 minutes
export const POW_DIFFICULTY = 4;
export const PASS_COOKIE_NAME = 'kn_pass';
export const PASS_MAX_AGE_MS = PASS_TTL_MS;

function hmac(data: string) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}

export function issueChallenge() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const expires = Date.now() + CHALLENGE_TTL_MS;
  const signature = hmac(`${nonce}.${expires}`);
  const token = Buffer.from(`${nonce}.${expires}.${signature}`).toString('base64url');
  return { nonce, difficulty: POW_DIFFICULTY, token };
}

export function verifySolution(token: string, solution: string) {
  let decoded: string;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return false;
  }
  const [nonce, expiresStr, signature] = decoded.split('.');
  if (!nonce || !expiresStr || !signature) return false;
  if (Date.now() > Number(expiresStr)) return false;
  if (hmac(`${nonce}.${expiresStr}`) !== signature) return false;

  const hash = crypto.createHash('sha256').update(`${nonce}:${solution}`).digest('hex');
  return hash.startsWith('0'.repeat(POW_DIFFICULTY));
}

export function issuePass() {
  const expires = Date.now() + PASS_TTL_MS;
  const signature = hmac(`pass.${expires}`);
  return Buffer.from(`${expires}.${signature}`).toString('base64url');
}

export function isPassValid(value: string | undefined) {
  if (!value) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return false;
  }
  const [expiresStr, signature] = decoded.split('.');
  if (!expiresStr || !signature) return false;
  if (Date.now() > Number(expiresStr)) return false;
  return hmac(`pass.${expiresStr}`) === signature;
}
