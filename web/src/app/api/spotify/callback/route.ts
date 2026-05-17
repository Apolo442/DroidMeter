import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'no code' }, { status: 400 });

  const id     = process.env.SPOTIFY_CLIENT_ID!;
  const secret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://127.0.0.1:3000/api/spotify/callback',
    }),
  });

  const json = await res.json() as { refresh_token?: string; error?: string };

  if (!json.refresh_token) {
    return NextResponse.json({ error: 'falhou', detail: json }, { status: 500 });
  }

  return new NextResponse(`
    <html><body style="font-family:monospace;padding:40px;background:#111;color:#fff">
      <h2 style="color:#1db954">✓ Novo refresh token gerado!</h2>
      <p>Copie e cole no <code>.env</code> e <code>web/.env.local</code>:</p>
      <pre style="background:#222;padding:16px;border-radius:8px;word-break:break-all">SPOTIFY_REFRESH_TOKEN=${json.refresh_token}</pre>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html' } });
}
