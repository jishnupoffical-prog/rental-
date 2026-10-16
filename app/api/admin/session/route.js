import { NextResponse } from 'next/server';
import {
  adminCookieName,
  adminCookieOptions,
  createAdminSession,
  isAdminSessionValid,
  passwordMatches,
} from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function GET(request) {
  return NextResponse.json({ authenticated: isAdminSessionValid(request) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter the admin password.' }, { status: 400 });
  }

  if (!passwordMatches(body.password)) {
    return NextResponse.json({ error: 'That password is not correct.' }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(adminCookieName, createAdminSession(), adminCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(adminCookieName, '', { ...adminCookieOptions(), maxAge: 0 });
  return response;
}
