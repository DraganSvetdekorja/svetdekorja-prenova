import { useState } from 'react';
import { Link } from 'react-router-dom';
import { barvLabel, eur } from '../data.js';
import { rollOf } from '../roll.js';
import { useCart } from '../cart.jsx';
import { toggleWish, useWish } from '../wish.js';
import { VariantThumbs } from './Variants.jsx';

const UNITS = { rol: 'rola', m2: 'm²' };

export default function ProductCard({ p }) {
  const [loaded, setLoaded] = useState(false);
  const [hover, setHover] = useState(false);
  const [altLoaded, setAltLoaded] = useState(false);
  const { add } = useCart();
  const wished = useWish().includes(p.sku);
  const r = rollOf(p);
  const href = `/izdelek/${encodeURIComponent(p.sku)}`;
  const label = p.variantsKind === 'color' ? barvLabel(p.variants.length + 1) : p.variants.length ? 'Podobni izdelki' : '';
  return (
    <article className="card" onMouseEnter={() => setHover(true)}>
      <Link to={href} className={`img${loaded ? ' ok' : ''}`}>
        {p.badge ? <span className="tag sale">{p.badge}</span> : p.tip ? <span className="tag">{p.tip}</span> : null}
        {p.images[0] && (
          <img src={p.images[0]} alt={p.name} loading="lazy" decoding="async" className={loaded ? 'ok' : ''} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
        )}
        {hover && p.images[1] && (
          <img src={p.images[1]} alt="" loading="lazy" decoding="async" className={`alt${altLoaded ? ' ok' : ''}`} onLoad={() => setAltLoaded(true)} />
        )}
      </Link>
      <span className="vlabel">{label}</span>
      <h3><Link to={href}>{p.name}</Link></h3>
      <span className="brand" style={{ marginTop: 2 }}>{[p.brand, p.collection !== 'Ostalo' && p.collection].filter(Boolean).join(' · ')}</span>
      <div className="row prow">
        <div className="pr2">
          <span className="price">{eur(p.price)}{p.oldPrice && <s>{eur(p.oldPrice)}</s>} <em>/ {UNITS[p.unit] || p.unit || 'kos'}</em></span>
          {r && <span className="m2">{eur(p.price / (r.len * r.wid))} /m²</span>}
        </div>
        <button className={'heart' + (wished ? ' on' : '')} onClick={() => toggleWish(p.sku)} aria-label={wished ? 'Odstrani s seznama želja' : 'Dodaj na seznam želja'} aria-pressed={wished}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20s-7-4.5-9-9.2C1.7 7.4 4 4.5 7 4.5c1.8 0 3.2 1 5 3 1.8-2 3.2-3 5-3 3 0 5.3 2.9 4 6.3-2 4.7-9 9.2-9 9.2z" /></svg>
        </button>
      </div>
      <VariantThumbs p={p} />
      <button className="add wide" onClick={() => add(p)}>Dodaj v košarico</button>
    </article>
  );
}
