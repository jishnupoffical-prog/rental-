import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
export default function NotFound(){return <section className="not-found"><div className="not-found-mark"><Compass size={30}/></div><div className="eyebrow">404 · LOST IN THE WIRES</div><h1>Looks like this<br/>page went offline.</h1><p className="muted">The page you're after isn't here anymore. Let's get you back to the good stuff.</p><Link className="btn btn-primary" href="/"><ArrowLeft size={16}/> Back to home</Link></section>}
