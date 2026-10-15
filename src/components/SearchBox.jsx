import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { eur, useProducts } from '../data.js';
import { getViewed } from '../viewed.js';

const RECENT_KEY = 'sd-recent-searches';
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } };
const saveRecent = (term) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([term, ...readRecent().filter((r) => r !== term)].slice(0, 8))); } catch {}
};

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></svg>
);

function Hl({ text, q }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

function ProductRow({ p, onPick, q }) {
  return (
    <Link to={`/izdelek/${encodeURIComponent(p.sku)}`} className="pr" onClick={onPick}>
      {p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <span className="ph" />}
      <div><b><Hl text={p.name} q={q} /></b><span>{eur(p.price)}</span></div>
    </Link>
  );
}

export default function SearchBox() {
  const nav = useNavigate();
  const { products } = useProducts();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const [viewed, setViewed] = useState([]);
  const wrap = useRef(null);
  const input = useRef(null);
  const t = q.trim().toLowerCase();

  const openPanel = () => { setRecent(readRecent()); setViewed(getViewed()); setOpen(true); };
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (wrap.current && !wrap.current.contains(e.target)) close(); };
    const key = (e) => { if (e.key === 'Escape') { close(); input.current?.blur(); } };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);

  const collections = useMemo(() => {
    const m = new Map();
    products.forEach((p) => m.set(p.collectionSlug, { slug: p.collectionSlug, name: p.collection, n: (m.get(p.collectionSlug)?.n || 0) + 1 }));
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [products]);

  // Search suggestions (left column)
  const suggestions = useMemo(() => {
    const searchTo = (s) => `/iskanje?q=${encodeURIComponent(s)}`;
    if (!t) {
      const rec = recent.slice(0, 4).map((r) => ({ label: r, to: searchTo(r), kind: 'recent', save: true }));
      const pop = collections.slice(0, 8 - rec.length).map((c) => ({ label: c.name, to: `/kolekcija/${c.slug}`, kind: 'col' }));
      return [...rec, ...pop];
    }
    const rec = recent.filter((r) => r.toLowerCase().includes(t) && r.toLowerCase() !== t).slice(0, 3).map((r) => ({ label: r, to: searchTo(r), kind: 'recent', save: true }));
    const cols = collections.filter((c) => c.name.toLowerCase().includes(t)).slice(0, 5).map((c) => ({ label: c.name, to: `/kolekcija/${c.slug}`, kind: 'col', n: c.n }));
    return [{ label: q.trim(), to: searchTo(q.trim()), kind: 'q', save: true }, ...rec, ...cols];
  }, [t, q, recent, collections]);

  // Product suggestions (middle column)
  const { items, total } = useMemo(() => {
    if (!t) return { items: products.slice(0, 5), total: products.length };
    const tokens = t.split(/\s+/);
    const hit = products.filter((p) => { const h = (p.name + ' ' + p.sku + ' ' + p.collection).toLowerCase(); return tokens.every((k) => h.includes(k)); });
    hit.sort((a, b) => (b.sku.toLowerCase().startsWith(t) ? 1 : 0) - (a.sku.toLowerCase().startsWith(t) ? 1 : 0));
    return { items: hit.slice(0, 6), total: hit.length };
  }, [t, products]);

  // Last viewed (right column)
  const last = useMemo(() => {
    const by = new Map(products.map((p) => [p.sku, p]));
    return viewed.map((s) => by.get(s)).filter(Boolean).slice(0, 6);
  }, [viewed, products]);

  const go = (term) => {
    const s = term.trim();
    if (!s) return;
    saveRecent(s);
    close();
    input.current?.blur();
    nav(`/iskanje?q=${encodeURIComponent(s)}`);
  };

  return (
    <div className="srch" ref={wrap}>
      <form className="sbox" onSubmit={(e) => { e.preventDefault(); go(q); }} role="search">
        <input
          ref={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); if (!open) openPanel(); }}
          onFocus={openPanel}
          onClick={openPanel}
          placeholder="Tu iščete po celotni trgovini…"
          aria-label="Iskanje"
          autoComplete="off"
        />
        <button aria-label="Išči" />
      </form>

      {open && (
        <div className="sp-panel" role="dialog" aria-label="Iskalni predlogi">
          <div className="sp-col">
            <h5>{t ? 'ISKALNI PREDLOGI' : 'DRUGI IŠČEJO TUDI'}</h5>
            {suggestions.map((s) => (
              <Link key={s.kind + s.label} to={s.to} className="sg" onClick={() => { if (s.save) saveRecent(s.label); close(); }}>
                {s.kind === 'recent' ? <ClockIcon /> : <SearchIcon />}
                <span><Hl text={s.label} q={s.kind === 'q' ? '' : q.trim()} /></span>
                {s.n != null && <em>{s.n}</em>}
              </Link>
            ))}
          </div>

          <div className="sp-col">
            <h5>{t ? 'IZDELKI' : 'PRIPOROČENI IZDELKI'}</h5>
            {items.map((p) => <ProductRow key={p.sku} p={p} q={q.trim()} onPick={close} />)}
            {t && !items.length && <p className="sp-empty">Ni zadetkov za »{q.trim()}«.</p>}
            {t && total > items.length && (
              <button type="button" className="sp-all" onClick={() => go(q)}>Poglej vseh {total} rezultatov →</button>
            )}
          </div>

          <div className="sp-col last">
            <h5>NAZADNJE OGLEDANO <ClockIcon /></h5>
            {last.length
              ? last.map((p) => <ProductRow key={p.sku} p={p} onPick={close} />)
              : <p className="sp-empty">Tukaj se bodo prikazali izdelki, ki ste si jih ogledali.</p>}
          </div>
        </div>
      )}
      {open && createPortal(<div className="sov" onClick={close} />, document.body)}
    </div>
  );
}
