import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return <footer className="footer"><div className="container footer-main">
    <div><Link href="/" className="brand"><span className="brand-mark">N</span><span className="brand-word">NEXUS<span>GEAR</span><small>TECH RENTAL / INDIA</small></span></Link><p className="muted footer-blurb">Your next big idea deserves the right tools.<br/>Find your gear. Make your next move.</p></div>
    <div className="footer-col"><b>Discover</b><Link href="/gear">Explore all gear</Link><Link href="/#categories">Browse categories</Link><Link href="/#how-it-works">How renting works</Link></div>
    <div className="footer-col"><b>Your rental</b><Link href="/order">Request a rental</Link><Link href="/rentals">My rentals</Link><Link href="/contact">Talk to the Nexus team</Link></div>
    <div className="footer-col"><b>Nexus Gear</b><Link href="/about">Our story</Link><Link href="/contact">Contact</Link><Link href="/gear">Live collection <ArrowUpRight size={14}/></Link></div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Nexus Gear.</span><span>Requests are confirmed by the Nexus team.</span></div></footer>;
}
