import axios from 'axios';

// Real, official Spotify Web API integration (Client Credentials flow).
// Returns track metadata + Spotify's own 30-second preview clip when
// available — never a full downloaded audio file, since that would
// require bypassing Spotify's DRM/licensing, which we don't do.

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET غير مضبوطين');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    { headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

function extractTrackId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function formatTrack(track: any) {
  return {
    name: track.name,
    artists: track.artists.map((a: any) => a.name).join(', '),
    album: track.album?.name,
    cover: track.album?.images?.[0]?.url || null,
    durationMs: track.duration_ms,
    previewUrl: track.preview_url, // official 30s clip — often null due to licensing
    spotifyUrl: track.external_urls?.spotify,
  };
}

export async function getTrackByUrl(url: string) {
  const id = extractTrackId(url);
  if (!id) throw new Error('رابط Spotify غير صالح');

  const token = await getAccessToken();
  const { data } = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return formatTrack(data);
}

export async function searchTrack(query: string) {
  const token = await getAccessToken();
  const { data } = await axios.get('https://api.spotify.com/v1/search', {
    headers: { Authorization: `Bearer ${token}` },
    params: { q: query, type: 'track', limit: 1 },
  });
  const track = data.tracks?.items?.[0];
  if (!track) throw new Error('لم يتم العثور على نتائج');
  return formatTrack(track);
}
