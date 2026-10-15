import { NextResponse } from 'next/server';
import { getProducts } from '../../../lib/products';
import { APPS_SCRIPT_URL } from '../../../lib/apps-script';

export const runtime = 'nodejs';

export async function POST(request) {
  let order;
  try {
    order = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid order details.' }, { status: 400 });
  }

  let products;
  try {
    products = await getProducts();
  } catch {
    return NextResponse.json({ error: 'Could not verify the product against Google Sheets.' }, { status: 502 });
  }
  const product = order && products.find((entry) => entry.id === order.gadgetId && entry.name === order.item && entry.available);
  const start = order && typeof order.startDate === 'string' ? new Date(order.startDate) : null;
  const end = order && typeof order.endDate === 'string' ? new Date(order.endDate) : null;
  const durationMinutes = start && end ? (end.getTime() - start.getTime()) / 60000 : NaN;
  const validDates = start && end
    && !Number.isNaN(start.getTime())
    && !Number.isNaN(end.getTime())
    && end > start
    && start > new Date()
    && Number.isInteger(durationMinutes)
    && durationMinutes <= 1440
    && Math.abs(durationMinutes / 60 - order.hours) < 0.001;
  const valid = order
    && product
    && typeof order.name === 'string'
    && order.name.trim().length > 0
    && order.name.length <= 120
    && typeof order.email === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)
    && typeof order.phone === 'string'
    && order.phone.trim().length >= 5
    && order.phone.length <= 40
    && validDates
    && Number.isFinite(order.hours)
    && order.hours > 0
    && order.hours <= 24
    && Number.isFinite(order.total)
    && order.total >= 0;

  if (!valid) return NextResponse.json({ error: 'Please check the order details and try again.' }, { status: 400 });

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'order',
        gadgetId: order.gadgetId,
        item: product.name,
        name: order.name.trim(),
        email: order.email.trim(),
        phone: order.phone.trim(),
        startDate: order.startDate,
        endDate: order.endDate,
        hours: order.hours,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      return NextResponse.json({ error: 'Google Apps Script returned a non-JSON response. Redeploy the web app and set access to Anyone.' }, { status: 502 });
    }
    if (!response.ok || !result.success) {
      return NextResponse.json({ error: result.message || 'The orders sheet did not accept this request. Please try again.' }, { status: 502 });
    }
    if (!result.orderId) {
      return NextResponse.json({ error: 'The order handler did not return a saved order reference. The request was not confirmed; check the Apps Script deployment.' }, { status: 502 });
    }
    const orderId = String(result.orderId);
    return NextResponse.json({ ok: true, reference: orderId.startsWith('NX-') ? orderId : `NX-${orderId}` });
  } catch {
    return NextResponse.json({ error: 'Could not reach the orders sheet. Please try again.' }, { status: 502 });
  }
}
