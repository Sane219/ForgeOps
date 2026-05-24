import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const apiRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }

    const response = NextResponse.json(data, { status: 201 });
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
