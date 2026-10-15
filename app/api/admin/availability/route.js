import { NextResponse } from 'next/server';
import { isAdminSessionValid } from '../../../../lib/admin-auth';
import { APPS_SCRIPT_URL } from '../../../../lib/apps-script';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!isAdminSessionValid(request)) {
    return NextResponse.json({ error: 'Sign in to manage product availability.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid availability update.' }, { status: 400 });
  }

  const id = String(body.id || '').trim();
  if (!id || typeof body.availability !== 'boolean') {
    return NextResponse.json({ error: 'A product ID and availability value are required.' }, { status: 400 });
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateAvailability', id, availability: body.availability }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      return NextResponse.json({ error: result.message || 'The product sheet could not update availability. Confirm the Apps Script supports the updateAvailability action.' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Could not reach the Products sheet.' }, { status: 502 });
  }
}
