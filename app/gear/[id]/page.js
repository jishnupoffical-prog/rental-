import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ShieldCheck } from 'lucide-react';
import { getProducts } from '../../../lib/products';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try { const products = await getProducts(); const item = products.find((p) => p.id === decodeURIComponent(id)); return { title: item ? item.name : 'Gear details' }; } catch { return { title: 'Gear details' }; }
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  let product;
  try { product = (await getProducts()).find((p) => p.id === decodeURIComponent(id)); } catch { /* show a useful recovery state below */ }
  if (!product) return <section className="detail-not-found"><div className="era-eyebrow">NEXUS COLLECTION</div><h1>We can’t find<br/>that piece of gear.</h1><p>The live listing may have changed. Browse the current rental catalog to find what’s available.</p><Link className="era-button" href="/gear">Back to gear <ArrowRight size={16}/></Link></section>;
  const bookLink = `/order?id=${encodeURIComponent(product.id)}&item=${encodeURIComponent(product.name)}`;
  return <section className="product-detail-wrap"><div className="era-container"><Link href="/gear" className="detail-back"><ArrowLeft size={15}/> Back to collection</Link><div className="product-detail-grid"><div className="detail-gallery"><div className="detail-main-image"><Image src={product.image} alt={product.alt} fill priority sizes="(max-width: 800px) 100vw, 55vw" unoptimized/><span className="detail-image-index">NEXUS / {String(product.id).padStart(2,'0')}</span></div><div className="detail-thumb-row"><span className="detail-thumb" aria-hidden="true"><Image src={product.image} alt="" fill sizes="100px" unoptimized/></span><span>CATALOG IMAGE&nbsp; / &nbsp;{product.category} / {product.model}</span></div></div><div className="detail-copy"><div className="era-eyebrow"><span className="eyebrow-line"/> {product.category}</div><h1>{product.name}</h1><p className="detail-model">{product.model}</p><p className="detail-description">{product.description || 'A carefully selected piece from the Nexus Gear rental collection.'}</p><div className="detail-rent-price">₹{Number(product.price).toLocaleString('en-IN')} <small>/ {product.unit}</small></div><div className={`detail-availability ${product.available ? 'available' : ''}`}><i/>{product.available ? 'Listed as available' : 'Currently unavailable'}</div><div className="detail-rule"/><h2>Specifications</h2><ul className="detail-spec-list">{(product.specs.length ? product.specs : ['See product details']).map((spec) => <li key={spec}><Check size={15}/>{spec}</li>)}</ul><div className="detail-booking-note"><ShieldCheck size={18}/><span>Submit a rental request with your preferred dates. Your booking is confirmed only after the Nexus team checks availability.</span></div>{product.available ? <Link className="era-button detail-book-button" href={bookLink}>Choose rental dates <CalendarDays size={17}/></Link> : <button className="era-button detail-book-button" type="button" disabled>Currently unavailable</button>}<Link className="detail-help" href="/contact">Need help choosing? Talk to our team <ArrowRight size={14}/></Link></div></div></div></section>;
}
