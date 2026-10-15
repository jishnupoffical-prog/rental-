'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LogOut, PackagePlus, ShieldCheck, Boxes } from 'lucide-react';

const emptyForm = { name: '', model: '', category: 'Laptop', price: '', availability: true, description: '', gpu: '', ram: '', storage: '', gpuSize: '', photo: '' };

export default function AdminPage({ mode = 'add' }) {
  const isAvailabilityPage = mode === 'availability';
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState('');

  async function loadProducts() {
    const response = await fetch('/api/products', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load products from the sheet.');
    setProducts(result.products);
  }

  useEffect(() => {
    fetch('/api/admin/session').then((response) => response.json())
      .then(async (result) => {
        setAuthenticated(result.authenticated);
        if (result.authenticated) await loadProducts();
      })
      .catch((cause) => setError(cause.message || 'Could not check admin access.'))
      .finally(() => setChecking(false));
  }, []);

  async function signIn(event) {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not sign in.');
      setPassword('');
      setAuthenticated(true);
      await loadProducts();
    } catch (cause) {
      setError(cause.message || 'Could not sign in.');
    }
  }

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthenticated(false);
    setProducts([]);
    setMessage('');
  }

  async function addProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not add the product.');
      const addedName = form.name;
      setForm(emptyForm);
      setMessage(`${addedName} was added as item ${result.productId}.`);
      try {
        await loadProducts();
      } catch {
        setError('The product was added, but the list could not refresh. Reload this page to see it.');
      }
    } catch (cause) {
      setError(cause.message || 'Could not add the product.');
    } finally {
      setSaving(false);
    }
  }

  function updateForm(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function updateAvailability(product) {
    setUpdatingId(product.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/availability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, availability: !product.available }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update product availability.');
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, available: !product.available } : item));
      setMessage(`${product.name} is now ${product.available ? 'unavailable' : 'available'} to rent.`);
    } catch (cause) {
      setError(cause.message || 'Could not update product availability.');
    } finally {
      setUpdatingId('');
    }
  }

  if (checking) return <section className="admin-shell"><div className="container"><p className="muted">Checking admin access…</p></div></section>;

  if (!authenticated) return <section className="admin-shell"><div className="container admin-login-wrap"><form className="admin-panel admin-login" onSubmit={signIn}><Link className="back-link" href="/"><ArrowLeft size={15}/> Back to site</Link><span className="admin-icon"><ShieldCheck size={23}/></span><div className="eyebrow">NEXUS GEAR ADMIN</div><h1>Sign in</h1><p className="muted">Use your local admin password to manage products.</p><div className="form-field"><label htmlFor="admin-password">Admin password</label><div className="admin-password-wrap"><input id="admin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/><button className="admin-password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" type="submit">Open admin</button></form></div></section>;

  return <section className="admin-shell"><div className="container">
    <div className="admin-heading"><div><div className="eyebrow">NEXUS GEAR ADMIN</div><h1>{isAvailabilityPage ? 'Manage availability' : 'Add a new product'}</h1><p className="muted">Manage your product catalog through the admin pages.</p></div><button className="admin-logout" type="button" onClick={signOut}><LogOut size={16}/> Sign out</button></div>
    <nav className="admin-tabs" aria-label="Admin pages"><Link className={!isAvailabilityPage ? 'active' : ''} href="/admin"><PackagePlus size={16}/> New product</Link><Link className={isAvailabilityPage ? 'active' : ''} href="/admin/availability"><Boxes size={16}/> Availability <span>{products.length}</span></Link></nav>
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="admin-success" role="status"><CheckCircle2 size={17}/> {message}</p>}
    {!isAvailabilityPage ? <div className="admin-grid admin-grid-single">
      <form className="admin-panel admin-product-form" onSubmit={addProduct}>
        <div className="admin-panel-heading"><span className="admin-icon"><PackagePlus size={20}/></span><div><h2>Add a product</h2><p>New products appear on the site after saving.</p></div></div>
        <div className="admin-fields">
          <div className="form-field"><label htmlFor="product-name">Product name *</label><input id="product-name" name="name" value={form.name} onChange={updateForm} maxLength={120} required/></div>
          <div className="form-field"><label htmlFor="product-model">Model *</label><input id="product-model" name="model" value={form.model} onChange={updateForm} maxLength={120} required/></div>
          <div className="form-field"><label htmlFor="product-category">Category *</label><input id="product-category" name="category" value={form.category} onChange={updateForm} maxLength={80} required/></div>
          <div className="form-field"><label htmlFor="product-price">Price per hour (₹) *</label><input id="product-price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateForm} required/></div>
          <div className="form-field admin-field-wide"><label htmlFor="product-description">Description</label><textarea id="product-description" name="description" value={form.description} onChange={updateForm}/></div>
          <div className="form-field"><label htmlFor="product-gpu">GPU / main spec</label><input id="product-gpu" name="gpu" value={form.gpu} onChange={updateForm}/></div>
          <div className="form-field"><label htmlFor="product-ram">RAM</label><input id="product-ram" name="ram" value={form.ram} onChange={updateForm}/></div>
          <div className="form-field"><label htmlFor="product-storage">Storage</label><input id="product-storage" name="storage" value={form.storage} onChange={updateForm}/></div>
          <div className="form-field"><label htmlFor="product-gpu-size">GPU size</label><input id="product-gpu-size" name="gpuSize" value={form.gpuSize} onChange={updateForm}/></div>
          <div className="form-field admin-field-wide"><label htmlFor="product-photo">Photo URL (https)</label><input id="product-photo" name="photo" type="url" placeholder="https://…" value={form.photo} onChange={updateForm}/></div>
        </div>
        <label className="admin-availability"><input name="availability" type="checkbox" checked={form.availability} onChange={updateForm}/> Available to rent</label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status"><CheckCircle2 size={17}/> {message}</p>}
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving to sheet…' : <><PackagePlus size={16}/> Add product</>}</button>
      </form>
    </div> : <div className="admin-panel admin-availability-panel"><div className="admin-panel-heading"><span className="admin-icon"><Boxes size={19}/></span><div><h2>Rental availability</h2><p>Control which products customers can request.</p></div></div>{products.length ? <div className="admin-product-list">{products.map((product) => <article className="admin-product-row" key={product.id}><div><b>{product.name}</b><small>{product.model} · {product.category}</small></div><span className={product.available ? 'admin-stock is-available' : 'admin-stock'}>{product.available ? 'Available' : 'Unavailable'}</span><button type="button" className="admin-availability-action" disabled={updatingId === product.id} onClick={() => updateAvailability(product)}>{updatingId === product.id ? 'Saving…' : product.available ? 'Mark unavailable' : 'Make available'}</button></article>)}</div> : <p className="muted">No products found. Add a product first.</p>}</div>}
  </div></section>;
}
