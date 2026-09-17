import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/auth';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const ok = verifyCredentials(username.trim(), password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const token = await createSessionToken(username.trim());
    const res = NextResponse.json({ success: true });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours, keep in sync with lib/session.ts
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
