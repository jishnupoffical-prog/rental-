import './globals.css';
import './site.css';
import './state.css';
import './admin.css';
import './redesign.css';
import { Navbar } from '../components/navbar';
import { Footer } from '../components/footer';

export const metadata = {
  title: { default: 'Rent Laptops, Cameras & Gadgets by the Day | Nexus Gear Rentals', template: '%s | Nexus Gear Rentals' },
  description: 'Rent laptops, cameras, phones, audio gear and more by the day. Choose your rental dates, then pick up your gadget or get it delivered.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Navbar /><main id="main">{children}</main><Footer /></body></html>;
}
