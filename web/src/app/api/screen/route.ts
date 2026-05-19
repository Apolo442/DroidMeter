import { NextResponse } from 'next/server';

export async function POST() {
  const host = process.env.BACKEND_HOST ?? 'localhost';
  const port = process.env.BACKEND_PORT ?? '3333';

  try {
    const res = await fetch(`http://${host}:${port}/screen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sleep' }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'backend indisponível' }, { status: 502 });
  }
}
