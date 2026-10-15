import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { GROUPS, useGroups, useProducts, useSubcats } from '../data.js';
import ProductCard from '../components/ProductCard.jsx';
import FilterDrawer from '../components/FilterDrawer.jsx';
import Pager from '../components/Pager.jsx';
import { COLOR_NAMES } from '../blocks.jsx';

const PER_PAGE = 96;
const vals = (g, p) => [].concat(g.get(p) ?? []).filter(Boolean);

// routes: /k/:grp (category group) · /kolekcija/:slug · /tapete (fixed group) · /iskanje (fixed "*" = all products)
export default function Category({ fixed }) {
  const { slug, grp: grpParam, sub } = useParams();
  const grp = fixed ?? grpParam;
  const [sp, setSp] = useSearchParams();
  const { products, loading, error } = useProducts();
  const groups = useGroups();
  const subcats = useSubcats();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);

  const base = useMemo(() => products.filter((p) => (!grp || grp === '*' || p.cat === grp) && (!slug || p.collectionSlug === slug) && (!sub || p.sub === sub)), [products, grp, slug, sub]);
  const rawQ = sp.get('q') || '';
  const q = rawQ.toLowerCase();
  const barva = sp.get('barva') || '';
  const akcija = sp.get('akcija') === '1'; // only discounted products
  const sort = sp.get('sort') || 'new';
  const page = Math.max(1, +(sp.get('p') || 1));
  const title = akcija ? 'Tapete v akciji' : sub ? (subcats.find((s) => s.slug === sub)?.name || 'Podkategorija') : slug ? base[0]?.collection ?? 'Kolekcija' : grp === '*' || !grp ? (rawQ ? `Iskanje: ${rawQ}` : 'Vsi izdelki') : groups.find((g) => g.slug === grp)?.name || 'Izdelki';
  const active = useMemo(() => Object.fromEntries(GROUPS.map((g) => [g.key, sp.getAll(g.key)])), [sp]);

  const filtered = useMemo(() => {
    const r = base.filter((p) =>
      (!q || (p.name + ' ' + p.sku + ' ' + p.brand + ' ' + p.collection).toLowerCase().includes(q)) && (!barva || p.color === barva) && (!akcija || p.oldPrice) &&
      GROUPS.every((g) => !active[g.key].length || vals(g, p).some((v) => active[g.key].includes(v)))
    );
    if (sort === 'pa') r.sort((a, b) => a.price - b.price);
    if (sort === 'pd') r.sort((a, b) => b.price - a.price);
    if (sort === 'n') r.sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [base, q, barva, akcija, active, sort]);

  const fgroups = useMemo(() => GROUPS.map((g) => {
    const c = {};
    base.forEach((p) => vals(g, p).forEach((v) => { c[v] = (c[v] || 0) + 1; }));
    const options = g.order ? g.order.filter((v) => c[v]).map((v) => [v, c[v]]) : Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 150);
    return { ...g, options };
  }), [base]);

  const collections = useMemo(() => {
    const m = new Map();
    base.forEach((p) => p.collection !== 'Ostalo' && m.set(p.collectionSlug, { name: p.collection, n: (m.get(p.collectionSlug)?.n || 0) + 1 }));
    return [...m].sort((a, b) => b[1].n - a[1].n);
  }, [base]);

  const update = (fn) => { const n = new URLSearchParams(sp); fn(n); setSp(n); };
  const toggle = (key, val) => update((n) => {
    const cur = n.getAll(key); n.delete(key);
    (cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val]).forEach((v) => n.append(key, v));
    n.delete('p');
  });
  const clear = () => update((n) => { GROUPS.forEach((g) => n.delete(g.key)); n.delete('p'); });
  const openDrawer = (k) => { setFocus(k); setOpen(true); };
  const goPage = (p) => { update((n) => (p > 1 ? n.set('p', p) : n.delete('p'))); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const nActive = Object.values(active).reduce((t, a) => t + a.length, 0);

  useEffect(() => { document.title = `${title} – Svet Dekorja`; }, [title]);
  if (error) return <div className="wrap empty">{String(error.message)}</div>;

  return (
    <>
      <section className="hero">
        <div>
          <div className="crumb"><Link to="/">Domov</Link>{grp && grp !== '*' && <> / <Link to={`/k/${grp}`}>{groups.find((g) => g.slug === grp)?.name || grp}</Link></>}{(slug || sub) && <> / {title}</>}</div>
          <h1>{title}</h1>
        </div>
        <p>Največja izbira izdelkov za notranjo dekoracijo. Prebrskajte kolekcije in poiščite popolno izbiro zase in za svoj dom.</p>
      </section>

      {grp && grp !== '*' && !slug && subcats.some((s) => s.parent === grp) && (
        <div className="cols">{subcats.filter((s) => s.parent === grp).map((s) => <Link key={s.slug} to={`/k/${grp}/${s.slug}`} className={s.slug === sub ? 'cur' : ''}>{s.name} <em>{s.n}</em></Link>)}</div>
      )}

      {!slug && !subcats.some((s) => s.parent === grp) && collections.length > 1 && (
        <div className="cols">{collections.slice(0, 14).map(([s, c]) => <Link key={s} to={`/kolekcija/${s}`}>{c.name} <em>{c.n}</em></Link>)}</div>
      )}

      {barva && (
        <div className="cnote">
          <span>Barva: <b>{COLOR_NAMES[barva] || barva}</b></span>
          <button onClick={() => update((n) => { n.delete('barva'); n.delete('p'); })}>Odstrani ×</button>
        </div>
      )}

      <div className="bar">
        {fgroups.filter((g) => g.options.length > 1 && !(slug && g.key === 'kolekcija')).map((g) => {
          const n = active[g.key].length;
          return <button key={g.key} className="chip" onClick={() => openDrawer(g.key)}>{g.label}{n > 0 && <b className="n">{n}</b>}<i /></button>;
        })}
        <button className="chip all" onClick={() => openDrawer(null)}>Vsi filtri{nActive ? ` (${nActive})` : ''}</button>
        <span className="sp" />
        <span className="cnt">{filtered.length ? `${(cur - 1) * PER_PAGE + 1}–${Math.min(cur * PER_PAGE, filtered.length)} od ${filtered.length}` : '0'} izdelkov</span>
        <select value={sort} onChange={(e) => update((n) => { n.set('sort', e.target.value); n.delete('p'); })} aria-label="Razvrsti">
          <option value="new">Novejše</option><option value="pa">Cena: naraščajoče</option><option value="pd">Cena: padajoče</option><option value="n">Naziv</option>
        </select>
      </div>

      <main className="grid">
        {loading && Array.from({ length: 8 }, (_, i) => <div key={i} className="img" />)}
        {!loading && !slice.length && <div className="empty">Ni rezultatov za izbrane filtre.</div>}
        {slice.map((p) => <ProductCard key={p.sku} p={p} />)}
      </main>
      <Pager page={cur} pages={pages} onChange={goPage} />

      <FilterDrawer open={open} focus={focus} onClose={() => setOpen(false)} groups={fgroups} active={active} onToggle={toggle} onClear={clear} total={filtered.length} />
    </>
  );
}
