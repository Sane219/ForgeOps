import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const apiRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }

    // Forward Set-Cookie headers from NestJS to the browser
    const response = NextResponse.json(data, { status: 200 });
    const setCookies = apiRes.headers.getSetCookie();
    for (const cookie of setCookies) {
      response.headers.append('Set-Cookie', cookie);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: 'Failed to connect to authentication service' },
      { status: 502 },
    );
  }
}
