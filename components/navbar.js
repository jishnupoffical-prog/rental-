'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, Search, UserRound, ArrowUpRight } from 'lucide-react';

const links = [
  { href: '/#home', label: 'Home' },
  { href: '/#popular-gadgets', label: 'Browse Rentals' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/contact?topic=list-your-item', label: 'List Your Item' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('Home');
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname !== '/') return;
      const sections = ['home', 'popular-gadgets', 'how-it-works'].map((id) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current) setActive(({ home: 'Home', 'popular-gadgets': 'Browse Rentals', 'how-it-works': 'How It Works' })[current.target.id]);
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, .15, .4] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);
  function doSearch(e) { e.preventDefault(); router.push(`/gear${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`); setSearchOpen(false); }
  return <header className="nav-wrap">
    <nav className="nav era-container" aria-label="Main navigation">
      <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark">N</span><span className="brand-word">NEXUS<span>GEAR</span><small>GADGET RENTALS / INDIA</small></span></Link>
      <div className="nav-links">{links.map((link) => { const selected = pathname === '/' && active === link.label || link.label === 'Contact' && pathname === '/contact'; return <Link key={link.href} href={link.href} className={selected ? 'nav-active' : ''} aria-current={selected ? 'location' : undefined} onClick={() => setActive(link.label)}>{link.label}</Link>; })}</div>
      <div className="nav-tools">
        {searchOpen && <form className="nav-search" onSubmit={doSearch}><label className="sr-only" htmlFor="nav-search-input">Search the rental catalog</label><input autoFocus id="nav-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gear" onKeyDown={(e) => { if(e.key === 'Escape') setSearchOpen(false); }}/></form>}
        <button className="nav-icon" type="button" aria-label={searchOpen ? 'Close search' : 'Search gear'} onClick={() => setSearchOpen(!searchOpen)}><Search size={18}/></button>
        <Link className="nav-rentals-link" href="/rentals">My Rentals</Link>
        <Link className="nav-icon account-link" href="/admin" aria-label="Account and admin"><UserRound size={18}/></Link>
        <Link className="nav-cta" href="/#popular-gadgets">Browse Rentals <ArrowUpRight size={15}/></Link>
        <button className="menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
      </div>
    </nav>
    {open && <div className="mobile-nav">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}<Link href="/rentals" onClick={() => setOpen(false)}>My Rentals</Link><Link href="/admin" onClick={() => setOpen(false)}>Account</Link><Link className="mobile-rent-cta" href="/#popular-gadgets" onClick={() => setOpen(false)}>Rent a Gadget <ArrowUpRight size={15}/></Link></div>}
  </header>;
}
