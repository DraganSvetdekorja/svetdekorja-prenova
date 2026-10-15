import { Link } from 'react-router-dom';
import { barvLabel } from '../data.js';

const to = (p) => `/izdelek/${encodeURIComponent(p.sku)}`;

// small round-cornered thumbnails of other colours (or similar designs)
export function VariantThumbs({ p, max = 4 }) {
  if (!p.variants.length) return <div className="vt vt-empty" />;
  const shown = p.variants.slice(0, max), more = p.variants.length - shown.length;
  return (
    <div className="vt">
      {shown.map((v) => (
        <Link key={v.sku} to={to(v)} title={v.name} className="vt-i"><img src={v.images[0]} alt={v.name} loading="lazy" /></Link>
      ))}
      {more > 0 && <Link to={to(p)} className="vt-i vt-more" aria-label="Več barv">+{more}</Link>}
    </div>
  );
}

// larger picker for the product page: current product + other colours
export function VariantPicker({ p }) {
  if (!p.variants.length) return null;
  const color = p.variantsKind === 'color';
  const all = [p, ...p.variants].sort((a, b) => a.sku.localeCompare(b.sku));
  return (
    <div className="vp">
      <b>{color ? `Druge barve (${barvLabel(all.length)})` : 'Podobni izdelki iz kolekcije'}</b>
      <div className="vp-row">
        {all.map((v) => (
          <Link key={v.sku} to={to(v)} className={'vp-i' + (v.sku === p.sku ? ' cur' : '')} title={v.name} aria-current={v.sku === p.sku}>
            <img src={v.images[0]} alt={v.name} loading="lazy" /><span>{v.sku}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
