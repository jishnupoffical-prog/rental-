'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

export default function ErrorPage({ error, reset }) {
  useEffect(() => { console.error(error); }, [error]);
  return <section className="not-found" role="alert"><div className="eyebrow">A QUICK RESET</div><h1>That didn’t go<br/>quite to plan.</h1><p className="muted">Something unexpected happened. Try again, or head back to the homepage.</p><div className="error-actions"><button className="btn btn-primary" onClick={() => reset()}><RefreshCw size={16}/> Try again</button><Link className="btn btn-ghost" href="/">Back home</Link></div></section>;
}
