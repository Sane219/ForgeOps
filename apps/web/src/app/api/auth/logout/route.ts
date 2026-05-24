import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    // Forward cookies to NestJS so it can clear the refresh token cookie
    const cookieHeader = request.headers.get('cookie') ?? '';

    const apiRes = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
    });

    // Build response that clears local cookies regardless of API response
    const response = NextResponse.json({ ok: true }, { status: 200 });

    // Clear the access token cookie
    response.cookies.set('forgeops_access_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });

    // Forward any Set-Cookie from NestJS (e.g. clearing refresh token)
    const setCookies = apiRes.headers.getSetCookie();
    for (const cookie of setCookies) {
      response.headers.append('Set-Cookie', cookie);
    }

    return response;
  } catch {
    // Even if API is down, clear the cookie
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set('forgeops_access_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });
    return response;
  }
}
