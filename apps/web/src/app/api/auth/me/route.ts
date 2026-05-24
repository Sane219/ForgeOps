import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function GET(request: Request) {
  try {
    // Forward cookies to NestJS for JWT validation
    const cookieHeader = request.headers.get('cookie') ?? '';

    const apiRes = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!apiRes.ok) {
      const data = await apiRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: apiRes.status });
    }

    const data = await apiRes.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Failed to connect to authentication service' },
      { status: 502 },
    );
  }
}
