import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

export const metadata = { title: 'My rentals' };

export default function RentalsPage() {
  return <section className="rentals-page"><div className="rentals-card"><span className="rentals-icon"><MessageCircle size={22}/></span><div className="era-eyebrow"><span className="eyebrow-line"/> RENTAL SUPPORT</div><h1>Your rental,<br/><em>with a human.</em></h1><p>The connected rental sheet can accept and confirm requests, but it doesn’t provide a private order history yet. For an update on a request, contact the Nexus team with the phone number you used.</p><div className="rentals-actions"><Link href="/contact" className="era-button">Contact the team <ArrowRight size={16}/></Link><Link href="/gear" className="line-link">Explore gear <ArrowRight size={15}/></Link></div></div></section>;
}
