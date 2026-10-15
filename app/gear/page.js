import Link from 'next/link';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { getProducts } from '../../lib/products';
import { ProductCard } from '../../components/product-card';

export const metadata = { title: 'Explore gear' };

function categoryName(product) {
  const value = `${product.category} ${product.type} ${product.name}`.toLowerCase();
  if (/laptop|notebook|computer/.test(value)) return 'Laptops';
  if (/camera|photograph/.test(value)) return 'Cameras';
  if (/smartphone|mobile|phone/.test(value)) return 'Smartphones';
  if (/gaming|console|playstation|xbox/.test(value)) return 'Gaming';
  if (/audio|headphone|earbud|speaker|microphone/.test(value)) return 'Audio';
  if (/drone|uav/.test(value)) return 'Drones';
  if (/accessor|monitor|keyboard|tablet|watch/.test(value)) return 'Accessories';
  return product.category || 'Other gear';
}

function categoryId(label) {
  return `category-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export default async function GearPage({ searchParams }) {
  const products = await getProducts();
  const params = await searchParams;
  const query = String(params?.search || '').trim().toLowerCase();
  const filtered = query ? products.filter((p) => `${p.name} ${p.model} ${p.category} ${p.description} ${p.specs.join(' ')}`.toLowerCase().includes(query)) : products;
  const grouped = new Map();
  for (const product of filtered) {
    const label = categoryName(product);
    grouped.set(label, [...(grouped.get(label) || []), product]);
  }
  const priority = ['Laptops', 'Cameras', 'Smartphones', 'Gaming', 'Audio', 'Drones', 'Accessories'];
  const groups = [...grouped.entries()].sort(([a], [b]) => {
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    return (aIndex < 0 ? priority.length : aIndex) - (bIndex < 0 ? priority.length : bIndex) || a.localeCompare(b);
  });

  return <>
    <section className="page-hero"><div className="container"><div className="eyebrow">THE NEXUS COLLECTION</div><h1>Good gear.<br/>Great possibilities.</h1><p className="muted">Explore the live rental collection by category.</p><div className="breadcrumb"><Link href="/">Home</Link> / Gear / All equipment</div></div></section>
    <section className="section"><div className="container">
      <div className="catalog-toolbar"><span>{query ? <>Results for <b>“{query}”</b></> : <>Showing <b>{filtered.length} pieces</b> of exceptional kit</>}</span><span><SlidersHorizontal size={16}/> Live catalog</span></div>
      {groups.length > 0 && <nav className="gear-category-nav" aria-label="Product categories">{groups.map(([label, items]) => <a key={label} href={`#${categoryId(label)}`}>{label}<span>{items.length}</span></a>)}</nav>}
      {groups.length ? <div className="gear-category-groups">{groups.map(([label, items]) => <section className="gear-category-group" id={categoryId(label)} key={label}><div className="gear-category-heading"><div><span className="eyebrow">NEXUS COLLECTION</span><h2>{label}</h2></div><span>{String(items.length).padStart(2, '0')} {items.length === 1 ? 'ITEM' : 'ITEMS'}</span></div><div className="grid-products">{items.map((product) => <ProductCard key={product.id} product={product}/>)}</div></section>)}</div> : <div className="catalog-state"><b>No gear matched “{query}”.</b><p>Try another search or return to the full collection.</p><Link className="line-link" href="/gear">Clear search <ArrowRight size={16}/></Link></div>}
      <div className="catalog-note"><span className="live-dot"/> Need help choosing? <Link href="/contact">Talk to a gear expert <ArrowRight size={14}/></Link></div>
    </div></section>
    <section className="cta-band"><div className="container cta-content"><div><div className="eyebrow">CAN'T FIND WHAT YOU NEED?</div><h2>We can source it.</h2><p>Tell us what you’re looking for and we’ll make it happen.</p></div><Link href="/contact" className="btn btn-primary">Ask our team <ArrowRight size={16}/></Link></div></section>
  </>;
}
