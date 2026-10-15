'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CalendarDays, Camera, Check, Gamepad2, Headphones, Laptop, Plane, Search, ShieldCheck, Smartphone, Cable, Grid2X2, PackageCheck } from 'lucide-react';

const categories = ['All gadgets', 'Laptops', 'Cameras', 'Smartphones', 'Gaming', 'Audio', 'Drones', 'Accessories'];
const categoryMatches = {
  Laptops: /laptop|computer|notebook/i, Cameras: /camera|photography/i,
  Smartphones: /phone|mobile|smartphone/i, Gaming: /gaming|console|playstation|xbox/i,
  Audio: /audio|headphone|earbud|speaker|microphone/i, Drones: /drone|uav/i,
  Accessories: /accessor|monitor|keyboard|storage|tablet|watch/i,
};
const categoryVisuals = [
  { name: 'Laptops', image: 'photo-1496181133206-80ce9b88a853', Icon: Laptop },
  { name: 'Cameras', image: 'photo-1516035069371-29a1b244cc32', Icon: Camera },
  { name: 'Smartphones', image: 'photo-1511707171634-5f897ff02aa9', Icon: Smartphone },
  { name: 'Gaming', image: 'photo-1593305841991-05c297ba4575', Icon: Gamepad2 },
  { name: 'Audio', image: 'photo-1505740420928-5e560c06d30e', Icon: Headphones },
  { name: 'Drones', image: 'photo-1473968512647-3e447244af8f', Icon: Plane },
  { name: 'Accessories', image: 'photo-1527814050087-3793815479db', Icon: ArrowUpRight },
];
const heroCategories = [
  { label: 'Laptops', category: 'Laptops', Icon: Laptop },
  { label: 'Cameras', category: 'Cameras', Icon: Camera },
  { label: 'Phones', category: 'Smartphones', Icon: Smartphone },
  { label: 'Audio', category: 'Audio', Icon: Headphones },
  { label: 'Accessories', category: 'Accessories', Icon: Cable },
  { label: 'More', category: 'All gadgets', Icon: Grid2X2 },
];
const stockFallback = 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85';
const categoryImage = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const dateTimeInput = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
function defaultWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: dateTimeInput(start), end: dateTimeInput(end) };
}
function addHours(value, hours) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateTimeInput(new Date(date.getTime() + hours * 60 * 60 * 1000));
}
function durationHours(start, end) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
}
function dailyPrice(product) {
  const price = Number(product.price) || 0;
  const unit = String(product.unit || 'hour').toLowerCase();
  return unit === 'hour' || unit === 'hours' ? price * 24 : price;
}
function bookingUrl(product, start, end) {
  const query = new URLSearchParams({ id: product.id, item: product.name, startAt: start, endAt: end });
  return `/order?${query.toString()}`;
}

function ProductCard({ product, startAt, endAt }) {
  return <article className="rental-product-card">
    <Link className="rental-product-photo" href={`/gear/${encodeURIComponent(product.id)}`} aria-label={`View ${product.name}`}>
      <Image src={product.image || stockFallback} alt={product.alt || product.name} fill sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 25vw" unoptimized onError={(event) => { event.currentTarget.src = stockFallback; }}/>
      <span className={`rental-stock ${product.available ? 'listed-available' : ''}`}><i/>{product.available ? 'Listed available' : 'Currently unavailable'}</span>
    </Link>
    <div className="rental-product-info"><span className="rental-product-category">{product.category || product.type}</span><h3>{product.name}</h3><p className="rental-product-model">{product.model}</p>
      <div className="rental-price"><strong>₹{dailyPrice(product).toLocaleString('en-IN')}<small> / day</small></strong><span>24-hour estimate</span></div>
      {String(product.unit).toLowerCase().startsWith('hour') && <div className="source-rate">Sheet rate ₹{Number(product.price).toLocaleString('en-IN')} / hour</div>}
      {product.specs?.length > 0 && <div className="rental-specs">{product.specs.slice(0, 3).map((spec) => <span key={spec}>{spec}</span>)}</div>}
      <div className="rental-product-actions"><Link href={`/gear/${encodeURIComponent(product.id)}`}>View details <ArrowUpRight size={14}/></Link>{product.available ? <Link className="rental-now" href={bookingUrl(product, startAt, endAt)}>Rent now <CalendarDays size={14}/></Link> : <span className="rent-disabled">Rent now unavailable</span>}</div>
    </div>
  </article>;
}

export default function HomeExperience() {
  const initialWindow = useMemo(defaultWindow, []);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All gadgets');
  const [nameInput, setNameInput] = useState('');
  const [appliedName, setAppliedName] = useState('');
  const [startAt, setStartAt] = useState(initialWindow.start);
  const [endAt, setEndAt] = useState(initialWindow.end);
  const [appliedWindow, setAppliedWindow] = useState(initialWindow);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Products are temporarily unavailable.'); return result.products; })
      .then(setProducts)
      .catch((cause) => setError(cause.message || 'Products are temporarily unavailable.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll('[data-scroll-reveal]');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          activeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const visible = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.model} ${product.category} ${product.type}`;
    const matchesCategory = category === 'All gadgets' || (categoryMatches[category] || /$a/).test(text);
    return matchesCategory && text.toLowerCase().includes(appliedName.toLowerCase());
  }), [products, category, appliedName]);
  const spotlight = products.find((product) => product.available) || products[0];
  const cameraProduct = products.find((product) => /camera/i.test(`${product.category} ${product.name}`));
  const laptopProduct = products.find((product) => product.id !== spotlight?.id && /laptop/i.test(`${product.category} ${product.name}`));
  const phoneProduct = products.find((product) => /phone|mobile|smartphone/i.test(`${product.category} ${product.name}`));
  const audioProduct = products.find((product) => /audio|headphone|earbud|speaker/i.test(`${product.category} ${product.name}`));
  const endMin = addHours(startAt, 1);
  const endMax = addHours(startAt, 24);

  async function reloadProducts() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Products are temporarily unavailable.');
      setProducts(result.products);
    } catch (cause) {
      setError(cause.message || 'Products are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }

  function findGadgets(event) {
    event.preventDefault();
    setSearchError('');
    if (!event.currentTarget.reportValidity()) return;
    const hours = durationHours(startAt, endAt);
    if (!Number.isFinite(hours) || hours < 1 || hours > 24 || !Number.isInteger(hours)) {
      setSearchError('Choose an end time between 1 and 24 whole hours after the start.');
      return;
    }
    if (new Date(startAt).getTime() <= Date.now()) {
      setSearchError('Choose a future rental start time.');
      return;
    }
    setAppliedName(nameInput.trim());
    setAppliedWindow({ start: startAt, end: endAt });
    document.getElementById('popular-gadgets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function chooseCategory(nextCategory) {
    setCategory(nextCategory);
    document.getElementById('popular-gadgets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return <>
    <section className="rental-hero" id="home"><div className="era-container rental-hero-grid">
      <div className="rental-hero-copy"><span className="rental-eyebrow"><i/> GADGET RENTALS MADE SIMPLE</span><h1>Rent laptops, cameras &amp; more <em>— by the day</em></h1><p>No need to buy. Pick a gadget, choose your dates, and pick it up or get it delivered.</p><div className="rental-hero-buttons"><a href="#popular-gadgets" className="rental-button-primary">Browse Rentals <ArrowRight size={16}/></a><a href="#how-it-works" className="rental-button-secondary">How it works</a></div>
        <nav className="rental-hero-categories" aria-label="Browse rental categories">{heroCategories.map(({ label, category: nextCategory, Icon }) => <a href="#popular-gadgets" key={label} onClick={() => chooseCategory(nextCategory)}><Icon size={14}/>{label}</a>)}</nav>
      </div>
      <div className="rental-hero-art"><div className="rental-art-main"><Image src={spotlight?.image || stockFallback} alt={spotlight?.alt || 'Featured gadget available to rent'} fill priority sizes="(max-width: 700px) 100vw, 52vw" unoptimized onError={(event) => { event.currentTarget.src = stockFallback; }}/><span className="rental-for-rent">FOR RENT</span></div>
        <div className="rental-art-small rental-art-camera"><Image src={cameraProduct?.image || categoryImage('photo-1516035069371-29a1b244cc32')} alt={cameraProduct?.alt || 'Camera for rent'} fill sizes="150px" unoptimized/><span>{cameraProduct ? `₹${dailyPrice(cameraProduct).toLocaleString('en-IN')} / day` : 'RENT / DAY'}</span></div>
        <div className="rental-art-small rental-art-laptop"><Image src={laptopProduct?.image || categoryImage('photo-1541807084-5c52b6b3adef')} alt={laptopProduct?.alt || 'Laptop for rent'} fill sizes="150px" unoptimized/><span>{laptopProduct ? `₹${dailyPrice(laptopProduct).toLocaleString('en-IN')} / day` : 'RENT / DAY'}</span></div>
        <div className="rental-art-small rental-art-phone"><Image src={phoneProduct?.image || categoryImage('photo-1511707171634-5f897ff02aa9')} alt={phoneProduct?.alt || 'Phone for rent'} fill sizes="100px" unoptimized/><span>{phoneProduct ? `₹${dailyPrice(phoneProduct).toLocaleString('en-IN')} / day` : 'RENT / DAY'}</span></div>
        <div className="rental-art-small rental-art-audio"><Image src={audioProduct?.image || categoryImage('photo-1505740420928-5e560c06d30e')} alt={audioProduct?.alt || 'Headphones for rent'} fill sizes="100px" unoptimized/><span>{audioProduct ? `₹${dailyPrice(audioProduct).toLocaleString('en-IN')} / day` : 'RENT / DAY'}</span></div>
        <div className="rental-hero-product"><span className="rental-eyebrow">FEATURED RENTAL</span>{spotlight ? <><b>{spotlight.name}</b><div><strong>₹{dailyPrice(spotlight).toLocaleString('en-IN')}<small> / day</small></strong><span className={spotlight.available ? 'hero-listed' : ''}><i/>{spotlight.available ? 'Available to rent' : 'Currently unavailable'}</span></div>{spotlight.available ? <Link href={bookingUrl(spotlight, appliedWindow.start, appliedWindow.end)}>Rent now <ArrowRight size={14}/></Link> : <span className="rental-featured-disabled">Unavailable to rent now</span>}</> : <><b>Explore the Nexus collection</b><span>Rental listings and prices come from the live catalog.</span></>}</div>
      </div>
    </div></section>
    <section className="rental-steps-strip" aria-label="How gadget rentals work"><div className="era-container rental-steps-inner"><div><Laptop size={18}/><span>Choose your item</span></div><div><CalendarDays size={18}/><span>Pick your dates</span></div><div><PackageCheck size={18}/><span>Pick up or get it delivered</span></div></div></section>

    <section className="rental-search-section" aria-label="Search rentals" data-scroll-reveal><form className="rental-search-panel era-container" onSubmit={findGadgets}>
      <label className="rental-search-field"><span>Search gadgets</span><div><Search size={16}/><input type="search" value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="Name or model" aria-label="Search gadget name or model"/></div></label>
      <label className="rental-search-field"><span>Category</span><select aria-label="Choose gadget category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="rental-search-field"><span>Rental starts</span><div><CalendarDays size={15}/><input type="datetime-local" min={initialWindow.start} step="3600" value={startAt} onChange={(event) => { setStartAt(event.target.value); if (event.target.value) setEndAt(addHours(event.target.value, 24)); }} required aria-label="Rental start date and time"/></div></label>
      <label className="rental-search-field"><span>Rental ends</span><div><CalendarDays size={15}/><input type="datetime-local" min={endMin} max={endMax} step="3600" value={endAt} onChange={(event) => setEndAt(event.target.value)} required aria-label="Rental end date and time"/></div></label>
      <button className="rental-search-submit" type="submit">Find gadgets <ArrowRight size={16}/></button>
      {searchError && <p className="rental-search-error" role="alert">{searchError}</p>}
    </form></section>

    <section className="rental-categories" id="categories" data-scroll-reveal><div className="era-container"><div className="rental-section-title"><div><span className="rental-eyebrow">EXPLORE THE COLLECTION</span><h2>What would you like to rent?</h2></div><Link href="/gear">All gadgets <ArrowRight size={15}/></Link></div><div className="rental-category-grid">{categoryVisuals.map(({ name, image, Icon }) => <Link href="#popular-gadgets" onClick={() => chooseCategory(name)} className="rental-category-tile" key={name}><Image src={categoryImage(image)} alt="" fill sizes="(max-width: 600px) 45vw, 180px" unoptimized/><span className="rental-category-icon"><Icon size={17}/></span><b>{name}</b><ArrowUpRight className="rental-category-arrow" size={15}/></Link>)}</div></div></section>

    <section className="rental-popular" id="popular-gadgets" data-scroll-reveal><div className="era-container"><div className="rental-section-title"><div><span className="rental-eyebrow">THE LIVE RENTAL CATALOG</span><h2>Popular gadgets for rent</h2><p>Daily estimates are calculated from the hourly prices in the live catalog. Date-specific availability is confirmed when you submit a request.</p></div><Link href="/gear">Browse full catalog <ArrowRight size={15}/></Link></div>
      <div className="rental-filter-row" role="group" aria-label="Filter popular gadgets by category">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {appliedWindow && <p className="rental-date-note">Rental window selected: <b>{new Date(appliedWindow.start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} – {new Date(appliedWindow.end).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b>. Availability is checked when the request is sent.</p>}
      {loading ? <div className="rental-loading" role="status"><span className="loading-spinner"/> Loading gadgets from the live catalog…</div> : error ? <div className="rental-empty" role="alert"><b>We can’t load the gadget catalog right now.</b><span>{error}</span><button type="button" onClick={reloadProducts}>Try again <ArrowRight size={14}/></button></div> : visible.length ? <div className="rental-product-grid">{visible.map((product) => <ProductCard key={product.id} product={product} startAt={appliedWindow.start} endAt={appliedWindow.end}/>)}</div> : <div className="rental-empty"><b>{appliedName ? `No gadgets match “${appliedName}”.` : `No ${category.toLowerCase()} in the live catalog yet.`}</b><span>Try another category or clear your search.</span><button type="button" onClick={() => { setCategory('All gadgets'); setNameInput(''); setAppliedName(''); }}>Show all gadgets <ArrowRight size={14}/></button></div>}
    </div></section>

    <section className="rental-how" id="how-it-works" data-scroll-reveal><div className="era-container"><div className="rental-section-title"><div><span className="rental-eyebrow">HOW RENTING WORKS</span><h2>Rent in three simple steps.</h2></div></div><div className="rental-how-grid"><article><span>01</span><div><b>Choose a gadget</b><p>Pick the tech you need.</p></div></article><article><span>02</span><div><b>Choose your dates</b><p>Set your rental start and end time.</p></div></article><article><span>03</span><div><b>Send your request</b><p>We’ll confirm availability with you.</p></div></article></div></div></section>
  </>;
}
