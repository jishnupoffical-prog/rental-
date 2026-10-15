import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, CalendarDays } from 'lucide-react';

export function ProductCard({ product }) {
  return <article className="card">
    <Link className="product-image" href={`/gear/${encodeURIComponent(product.id)}`} aria-label={`View ${product.name}`}>
      <Image src={product.image} alt={product.alt} fill sizes="(max-width: 560px) 100vw, (max-width: 800px) 50vw, 33vw" unoptimized />
      <span className="product-badge">{product.available ? 'Available' : 'Currently out'}</span>
    </Link>
    <div className="product-body">
      <div className="product-type">{product.category || product.type}</div>
      <h3><Link href={`/gear/${encodeURIComponent(product.id)}`}>{product.name}</Link></h3>
      <p className="muted product-model">{product.model}</p>
      <p className="muted">{product.description}</p>
      <div className="specs">{product.specs.map((spec) => <span key={spec}>{spec}</span>)}</div>
      <div className="product-bottom">
        <div className="price">₹{Number(product.price).toLocaleString('en-IN')}<small> / {product.unit}</small></div>
        <Link className="reserve-link" href={`/gear/${encodeURIComponent(product.id)}`} aria-label={`Details for ${product.name}`}>Details <ArrowUpRight size={15}/></Link>
      </div>
      {product.available && <Link className="product-book-link" href={`/order?id=${encodeURIComponent(product.id)}&item=${encodeURIComponent(product.name)}`}><CalendarDays size={14}/> Request rental</Link>}
    </div>
  </article>;
}
