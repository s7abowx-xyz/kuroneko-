import axios from 'axios';

function appUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}

// ---------- GitHub ----------
export function githubAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: `${appUrl()}/api/auth/github-callback`,
    scope: 'read:user user:email',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function githubExchangeCode(code: string) {
  const { data } = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: 'application/json' } }
  );
  if (!data.access_token) throw new Error('GitHub OAuth exchange failed');

  const [{ data: profile }, { data: emails }] = await Promise.all([
    axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    }),
    axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    }),
  ]);

  const primaryEmail =
    emails.find((e: { primary: boolean; email: string }) => e.primary)?.email ||
    emails[0]?.email ||
    profile.email;

  return {
    id: String(profile.id),
    name: profile.name || profile.login,
    email: primaryEmail,
    avatar: profile.avatar_url as string,
  };
}

// ---------- Google ----------
export function googleAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${appUrl()}/api/auth/google-callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function googleExchangeCode(code: string) {
  const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    code,
    redirect_uri: `${appUrl()}/api/auth/google-callback`,
    grant_type: 'authorization_code',
  });

  const { data: profile } = await axios.get(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${data.access_token}` } }
  );

  return {
    id: profile.sub as string,
    name: profile.name as string,
    email: profile.email as string,
    avatar: profile.picture as string,
  };
}
