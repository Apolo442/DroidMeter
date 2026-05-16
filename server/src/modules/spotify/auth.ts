let accessToken: string | null = null;
let expiresAt = 0;

export async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < expiresAt) return accessToken;

  const id = process.env.SPOTIFY_CLIENT_ID!;
  const secret = process.env.SPOTIFY_CLIENT_SECRET!;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN!;

  const res = await globalThis.fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  });

  if (!res.ok) throw new Error(`Spotify auth ${res.status}`);

  const json = await res.json() as { access_token: string; expires_in: number };
  accessToken = json.access_token;
  expiresAt = Date.now() + json.expires_in * 1000 - 60_000;
  return accessToken;
}
