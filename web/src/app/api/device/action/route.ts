import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const host = process.env.BACKEND_HOST ?? 'localhost';
  const port = process.env.BACKEND_PORT ?? '3333';
  const body = await request.json().catch(() => null);

  try {
    const res = await fetch(`http://${host}:${port}/device/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'backend indisponível' }, { status: 502 });
  }
}
