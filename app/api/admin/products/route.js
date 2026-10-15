import { NextResponse } from 'next/server';
import { isAdminSessionValid } from '../../../../lib/admin-auth';
import { APPS_SCRIPT_URL } from '../../../../lib/apps-script';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!isAdminSessionValid(request)) {
    return NextResponse.json({ error: 'Sign in to the admin page before adding products.' }, { status: 401 });
  }

  let form;
  try {
    form = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid product details.' }, { status: 400 });
  }

  const name = typeof form.name === 'string' ? form.name.trim() : '';
  const model = typeof form.model === 'string' ? form.model.trim() : '';
  const category = typeof form.category === 'string' ? form.category.trim() : '';
  const price = Number(form.price);
  const photo = typeof form.photo === 'string' ? form.photo.trim() : '';

  if (!name || !model || !category || name.length > 120 || model.length > 120 || category.length > 80) {
    return NextResponse.json({ error: 'Name, model, and category are required.' }, { status: 400 });
  }
  if (form.price === '' || !Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: 'Enter a valid hourly price.' }, { status: 400 });
  }
  if (photo && !/^https:\/\//i.test(photo)) {
    return NextResponse.json({ error: 'Product photo must use an https URL.' }, { status: 400 });
  }

  const payload = {
    action: 'addProduct',
    name,
    model,
    category,
    price,
    hours: 'hour',
    availability: Boolean(form.availability),
    description: String(form.description || '').trim(),
    gpu: String(form.gpu || '').trim(),
    ram: String(form.ram || '').trim(),
    storage: String(form.storage || '').trim(),
    gpuSize: String(form.gpuSize || '').trim(),
    photo,
  };

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      return NextResponse.json({ error: result.message || 'Google Sheets rejected this product.' }, { status: 502 });
    }
    return NextResponse.json({ success: true, productId: result.productId });
  } catch {
    return NextResponse.json({ error: 'Could not reach the Products sheet.' }, { status: 502 });
  }
}
