'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ShieldCheck } from 'lucide-react';

function localDateTimeString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function plusHours(value, hours) {
  const result = new Date(value);
  if (Number.isNaN(result.getTime())) return '';
  result.setTime(result.getTime() + hours * 3600000);
  return localDateTimeString(result);
}

const defaultStart = new Date();
defaultStart.setDate(defaultStart.getDate() + 1);
defaultStart.setHours(10, 0, 0, 0);
const defaultStartAt = localDateTimeString(defaultStart);
const defaultEndAt = plusHours(defaultStartAt, 3);
const minimumStartAt = localDateTimeString(new Date());

export default function OrderPage() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [startAt, setStartAt] = useState(defaultStartAt);
  const [endAt, setEndAt] = useState(defaultEndAt);
  const [confirmed, setConfirmed] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const product = useMemo(() => products.find((entry) => entry.id === productId) || products[0], [productId, products]);
  const hours = useMemo(() => (new Date(endAt).getTime() - new Date(startAt).getTime()) / 3600000, [startAt, endAt]);
  const total = product && Number.isFinite(hours) && hours > 0 ? Number(product.price) * hours : 0;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    fetch('/api/products')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load products from the sheet.');
        return result.products;
      })
      .then((sheetProducts) => {
        setProducts(sheetProducts);
        const selected = sheetProducts.find((entry) => entry.id === query.get('id'))
          || sheetProducts.find((entry) => entry.name === query.get('item'))
          || sheetProducts[0];
        if (selected) setProductId(selected.id);
        const requestedStart = query.get('startAt');
        const requestedEnd = query.get('endAt');
        const requestedMinutes = (new Date(requestedEnd).getTime() - new Date(requestedStart).getTime()) / 60000;
        if (requestedStart && requestedEnd && Number.isInteger(requestedMinutes) && requestedMinutes >= 1 && requestedMinutes <= 1440 && new Date(requestedStart) > new Date()) {
          setStartAt(requestedStart);
          setEndAt(requestedEnd);
        }
      })
      .catch((loadError) => setProductsError(loadError.message || 'Could not load products from the sheet.'))
      .finally(() => setIsLoadingProducts(false));
  }, []);

  async function submitOrder(event) {
    event.preventDefault();
    if (!product?.available) { setError('This product is not currently available for rental.'); return; }
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const rentalStart = new Date(startAt);
    const rentalEnd = new Date(endAt);
    const durationMinutes = (rentalEnd.getTime() - rentalStart.getTime()) / 60000;
    if (Number.isNaN(rentalStart.getTime()) || Number.isNaN(rentalEnd.getTime()) || rentalStart <= new Date() || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
      setError('Choose an end time after the start and within 24 hours. You can select any minute.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gadgetId: product.id,
          item: product.name,
          startDate: rentalStart.toISOString(),
          endDate: rentalEnd.toISOString(),
          hours,
          total,
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The order could not be sent to the orders sheet.');
      setReference(result.reference);
      setConfirmed(true);
    } catch (submitError) {
      setError(submitError.message || 'The order could not be sent to the orders sheet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingProducts) return <section className="order-wrap"><div className="container"><p className="muted">Loading products from the rental sheet…</p></div></section>;
  if (productsError || !product) return <section className="order-wrap"><div className="container"><h1>Products aren’t available right now.</h1><p className="muted">{productsError || 'The Products tab is empty.'}</p><Link className="btn btn-primary" href="/gear">Back to gear <ArrowRight size={16}/></Link></div></section>;

  if (confirmed) return <section className="order-wrap"><div className="order-confirmation"><span className="confirm-icon"><CheckCircle2 size={32}/></span><div className="eyebrow">REQUEST SAVED</div><h1>You’re one step closer.</h1><p className="muted">Your rental request for <b>{product.name}</b> has been added to the orders sheet.</p><div className="confirmation-ref"><span>ORDER REFERENCE</span><b>{reference}</b></div><p className="order-disclaimer">Your request is pending confirmation. No payment has been taken.</p><Link className="btn btn-primary" href="/gear">Back to gear <ArrowRight size={16}/></Link></div></section>;

  return <>
    <section className="page-hero order-page-hero"><div className="container"><Link className="back-link" href="/gear"><ArrowLeft size={15}/> Back to gear</Link><div className="eyebrow">RESERVE YOUR GEAR</div><h1>Make room for<br/>what’s next.</h1><p className="muted">Choose your rental date and tell us where to reach you.</p></div></section>
    <section className="order-wrap"><div className="container order-grid">
      <form className="order-form" onSubmit={submitOrder}>
        <div className="order-section-title"><span>01</span><div><h2>Your rental</h2><p>Pick the gear and rental hours that suit your project.</p></div></div>
        <div className="form-field"><label htmlFor="product">Choose equipment</label><select id="product" value={productId} onChange={(event) => setProductId(event.target.value)}>{products.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · ₹{entry.price}/{entry.unit}</option>)}</select></div>
        <div className="two-fields"><div className="form-field"><label htmlFor="start-at">Rental starts</label><input id="start-at" type="datetime-local" min={minimumStartAt} step="60" value={startAt} onChange={(event) => setStartAt(event.target.value)} required/></div><div className="form-field"><label htmlFor="end-at">Rental ends</label><input id="end-at" type="datetime-local" step="60" value={endAt} onChange={(event) => setEndAt(event.target.value)} required aria-describedby="rental-time-hint"/><small id="rental-time-hint" className="form-note">Choose any minute, up to 24 hours after your start time.</small></div></div>
        <div className="order-section-title contact-title"><span>02</span><div><h2>Your details</h2><p>The team can use these details to follow up on your request.</p></div></div>
        <div className="two-fields"><div className="form-field"><label htmlFor="order-name">Full name</label><input id="order-name" name="name" autoComplete="name" placeholder="Alex Morgan" required/></div><div className="form-field"><label htmlFor="order-email">Email address</label><input id="order-email" name="email" type="email" autoComplete="email" placeholder="alex@example.com" required/></div></div>
        <div className="form-field"><label htmlFor="order-phone">Phone number</label><input id="order-phone" name="phone" type="tel" autoComplete="tel" placeholder="Your contact number" required/></div>
        {error && <p id="rental-order-error" className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary order-submit" type="submit" disabled={isSubmitting || !product.available}>{isSubmitting ? 'Sending order…' : product.available ? <>Request rental <ArrowRight size={16}/></> : 'Currently unavailable'}</button>
        <p className="order-disclaimer">The connected sheet currently stores your phone number and rental times; it does not save your name or email. Requests remain pending until the team confirms. No payment is taken here.</p>
      </form>
      <aside className="order-summary"><div className="order-product-image"><Image src={product.image} alt={product.alt} fill sizes="(max-width: 800px) 100vw, 440px" unoptimized/></div><div className="order-summary-content"><div className="eyebrow">YOUR SELECTION</div><h2>{product.name}</h2><p>{product.model} · {product.type}</p><div className="order-specs">{product.specs.map((spec) => <span key={spec}>{spec}</span>)}</div><div className="summary-line"><span><CalendarDays size={15}/> {hours.toLocaleString(undefined, { maximumFractionDigits: 2 })} {Number(hours) === 1 ? 'hour' : 'hours'} rental</span><b>₹{Number(product.price).toLocaleString('en-IN')} × {hours.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b></div><div className="summary-total"><span>Estimated total</span><b>₹{total.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(total) ? 0 : 2, maximumFractionDigits: 2 })}</b></div><div className="summary-note"><ShieldCheck size={17}/><span>Flexible rental. Request confirmation required.</span></div></div></aside>
    </div></section>
  </>;
}
