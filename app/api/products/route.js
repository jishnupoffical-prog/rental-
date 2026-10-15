import { NextResponse } from 'next/server';
import { getProducts } from '../../../lib/products';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({ products: await getProducts() });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Could not load products from Google Sheets.' },
      { status: 502 },
    );
  }
}
