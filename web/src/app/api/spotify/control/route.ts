import { NextRequest, NextResponse } from 'next/server';

let cachedToken: string | null = null;
let expiresAt = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < expiresAt) return cachedToken;
  const id      = process.env.SPOTIFY_CLIENT_ID;
  const secret  = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!id || !secret || !refresh) {
    throw new Error(`Variáveis de ambiente ausentes: ID=${!!id} SECRET=${!!secret} REFRESH=${!!refresh}`);
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth Spotify ${res.status}: ${text}`);
  }

  const json = await res.json() as { access_token: string; expires_in: number };
  cachedToken = json.access_token;
  expiresAt   = Date.now() + json.expires_in * 1000 - 60_000;
  return cachedToken;
}

const ACTIONS: Record<string, { url: string; method: string }> = {
  play:  { url: 'https://api.spotify.com/v1/me/player/play',     method: 'PUT' },
  pause: { url: 'https://api.spotify.com/v1/me/player/pause',    method: 'PUT' },
  next:  { url: 'https://api.spotify.com/v1/me/player/next',     method: 'POST' },
  prev:  { url: 'https://api.spotify.com/v1/me/player/previous', method: 'POST' },
};

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json() as { action: string };
    const cmd = ACTIONS[action];
    if (!cmd) return NextResponse.json({ error: 'unknown action' }, { status: 400 });

    const token = await getToken();
    const spotifyRes = await fetch(cmd.url, {
      method: cmd.method,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!spotifyRes.ok && spotifyRes.status !== 204) {
      const text = await spotifyRes.text();
      console.error(`Spotify ${cmd.method} ${cmd.url} → ${spotifyRes.status}: ${text}`);
      return NextResponse.json({ error: `Spotify ${spotifyRes.status}`, detail: text }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Spotify control error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
