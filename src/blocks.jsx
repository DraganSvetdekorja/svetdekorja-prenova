import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './components/ProductCard.jsx';
import { eur, usePosts } from './data.js';
import { rollOf, num } from './roll.js';

// per-block settings from the admin page builder (custom heading)
export const BlockCtx = createContext({});
function T({ children }) { const o = useContext(BlockCtx); return o.title || children; }

const colsOf = (products) => {
  const m = new Map();
  products.forEach((p) => m.set(p.collectionSlug, { slug: p.collectionSlug, name: p.collection, n: (m.get(p.collectionSlug)?.n || 0) + 1 }));
  return [...m.values()].sort((a, b) => b.n - a.n);
};

function Hero({ products }) {
  const [i, setI] = useState(0);
  const slides = useMemo(() => colsOf(products).slice(0, 3).map((c) => {
    const p = products.find((x) => x.collectionSlug === c.slug && x.images.length > 1) || products.find((x) => x.collectionSlug === c.slug);
    return { ...c, img: p?.images[2] || p?.images[1] || p?.images[0] };
  }), [products]);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return <section className="hero2" />;
  return (
    <section className="hero2">
      {slides.map((s, k) => (
        <Link key={s.slug} to={`/kolekcija/${s.slug}`} className={'sl' + (k === i ? ' on' : '')} style={{ backgroundImage: `url(${s.img})` }}>
          <div className="sl-t"><small>Nova kolekcija · {s.n} izdelkov</small><h2><T>{s.name}</T></h2><span className="btn">Oglejte si kolekcijo →</span></div>
        </Link>
      ))}
      <div className="dots">{slides.map((s, k) => <button key={s.slug} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} />)}</div>
    </section>
  );
}

function Usps() {
  const u = [['Brezplačna dostava', 'Pri nakupu nad izbranim zneskom'], ['14 dni za vračilo', 'Če niste zadovoljni z izdelkom'], ['Vzorci v salonu', 'Mengeš, Gorenjska cesta 20'], ['Strokovno svetovanje', '(01) 729 10 51']];
  return <section className="usps">{u.map(([a, b]) => <div key={a}><i /><b>{a}</b><span>{b}</span></div>)}</section>;
}

function Categories({ products }) {
  const tiles = [
    ['tapete', 'Tapete', 'linear-gradient(145deg,#6b4fa3,#c7b6ef)'], ['fototapete', 'Fototapete', 'linear-gradient(145deg,#2f4a63,#7fa6a1)'],
    ['folije', 'Samolepilne folije', 'linear-gradient(145deg,#7a4a2b,#c89a63)'], ['nalepke', 'Stenske nalepke', 'linear-gradient(145deg,#8a3b52,#e0a3b4)'],
    ['slike', 'Slike na platnu', 'linear-gradient(145deg,#2f6b2a,#9ccf6a)'],
  ];
  return (
    <section className="sec">
      <div className="sec-h"><div><h2><T>Kupujte po kategorijah</T></h2><p>Tapete, fototapete, samolepilne folije in več</p></div></div>
      <div className="cats">{tiles.map(([slug, n, g]) => {
        const p = products.find((x) => x.cat === slug && x.images[1]);
        return <Link key={slug} to={`/k/${slug}`} className="cat" style={{ background: p ? `url(${p.images[1]}) center/cover` : g }}><span>{n}</span></Link>;
      })}</div>
    </section>
  );
}

// Full-bleed slider: starts at the content's left edge, runs to the right edge of the screen,
// arrows + green progress bar, mouse drag and touch swipe.
function Slider({ title, sub, linkTo, linkLabel, children }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const moved = useRef(false);
  const [st, setSt] = useState({ start: true, end: false, thumb: 100, pos: 0 });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = {
      start: el.scrollLeft <= 2,
      end: max <= 2 || el.scrollLeft >= max - 2,
      thumb: Math.max(12, Math.min(100, (el.clientWidth / el.scrollWidth) * 100)),
      pos: max > 0 ? el.scrollLeft / max : 0,
    };
    setSt((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  };
  useEffect(() => {
    const el = ref.current;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  });
  const go = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  const down = (e) => { if (e.pointerType === 'mouse') { drag.current = { x: e.clientX, left: ref.current.scrollLeft }; moved.current = false; } };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!moved.current && Math.abs(dx) > 5) { moved.current = true; ref.current.classList.add('dragging'); }
    if (moved.current) ref.current.scrollLeft = d.left - dx;
  };
  const up = () => { drag.current = null; ref.current?.classList.remove('dragging'); };

  return (
    <section className="sec bleed">
      <div className="sec-h">
        <div><h2><T>{title}</T></h2>{sub && <p>{sub}</p>}</div>
        <div className="arr">
          {linkTo && <Link to={linkTo} className="all-link">{linkLabel}</Link>}
          <button onClick={() => go(-1)} disabled={st.start} aria-label="Nazaj">←</button>
          <button onClick={() => go(1)} disabled={st.end} aria-label="Naprej">→</button>
        </div>
      </div>
      <div
        className="rail"
        ref={ref}
        onScroll={update}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } }}
      >
        {children}
      </div>
      <div className={'prog' + (st.thumb >= 99 ? ' off' : '')} aria-hidden="true">
        <i style={{ width: `${st.thumb}%`, marginLeft: `${st.pos * (100 - st.thumb)}%` }} />
      </div>
    </section>
  );
}

function Carousel({ title, sub, items }) {
  return (
    <Slider title={title} sub={sub}>
      {items.map((p) => <div className="rc" key={p.sku}><ProductCard p={p} /></div>)}
    </Slider>
  );
}

function Collections({ products }) {
  const c = useMemo(() => colsOf(products).slice(0, 16), [products]);
  return (
    <section className="sec">
      <div className="sec-h"><div><h2><T>Razišči kolekcije</T></h2><p>Izberite slog, ki ustreza vašemu prostoru</p></div></div>
      <div className="pills">{c.map((x) => <Link key={x.slug} to={`/kolekcija/${x.slug}`}>{x.name} <em>{x.n}</em></Link>)}</div>
    </section>
  );
}

const BRANDS = ['VERSACE', 'Architects Paper', 'PRIVATE WALLS', 'MICHALSKY', 'COSMOLiving', 'walls by patel', 'DANIEL HECHTER', 'living walls', 'MISSONI', 'TURNOWSKY'];
function Brands() {
  return (
    <section className="sec">
      <div className="sec-h"><div><h2><T>Tapete priznanih znamk in dizajnerjev</T></h2></div></div>
      <div className="brands">{BRANDS.map((b) => <span key={b}>{b}</span>)}</div>
    </section>
  );
}

function Newsletter() {
  const [ok, setOk] = useState(false);
  return (
    <section className="news">
      <div><h2><T>Prijava na novice</T></h2><p>Aktualne informacije o ekskluzivnih ponudbah, akcijah in novostih.</p></div>
      <form onSubmit={(e) => { e.preventDefault(); setOk(true); }}>
        {ok ? <b>Hvala za prijavo!</b> : <><input type="email" required placeholder="Elektronski naslov" aria-label="E-pošta" /><button>Prijava</button></>}
      </form>
    </section>
  );
}

function Social() {
  return <section className="social">{['Facebooku', 'Pinterestu', 'YouTube', 'Instagramu'].map((n) => <a key={n} href="#"><small>Obiščite SvetDekorja</small><b>na {n}</b></a>)}</section>;
}

function Blog() {
  const api = usePosts();
  const posts = [
    ['Surova eleganca industrijskega oblikovanja: Kolekcija Rasch tapet Factory VI', 'linear-gradient(145deg,#8f8a82,#d9d3c7)'],
    ['Najpomembnejša vprašanja in odgovori o naši foliji za pohištvo', 'linear-gradient(145deg,#b3202c,#e9867a)'],
    ['Naredi sam z ostanki folije: podarite svojemu dekorju nov videz', 'linear-gradient(145deg,#e58b2a,#f3d27a)'],
  ];
  return (
    <section className="sec">
      <div className="sec-h"><div><h2><T>Zadnje objave na blogu</T></h2></div></div>
      <div className="posts">{(api.length ? api.slice(0, 3).map((x, i) => [x.title, x.cover ? `url(${x.cover}) center/cover` : posts[i % posts.length][1]]) : posts).map(([t, bg]) => <a key={t} href="#" className="post"><div style={{ background: bg }} /><h3>{t}</h3><span>Preberi več →</span></a>)}</div>
    </section>
  );
}

// Styles come from the product data (specification "Stil"); the photo is the room photo of a product in that style
function ShopByStyle({ products }) {
  const items = useMemo(() => {
    const m = new Map();
    products.forEach((p) => {
      if (!p.style || !p.images[1]) return;
      const e = m.get(p.style) || { name: p.style, n: 0, img: p.images[1] };
      e.n++; m.set(p.style, e);
    });
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 12).map((s) => ({ name: s.name, to: `/iskanje?stil=${encodeURIComponent(s.name)}`, img: s.img }));
  }, [products]);
  return (
    <Slider title="Nakupujte po slogu" linkTo="/iskanje" linkLabel="Vsi slogi">
      {items.map((s) => (
        <Link key={s.name} to={s.to} className="style">
          <span className="ring">{s.img && <img src={s.img} alt="" loading="lazy" />}</span>
          <b>{s.name}</b>
        </Link>
      ))}
    </Slider>
  );
}

// Put your real best sellers here (wallpapers and photo murals). Until then the block falls back to
// one product from each of the biggest collections, because the JSON export has no sales data.
export const BESTSELLER_SKUS = [];
function Bestsellers({ products }) {
  const ref = useRef(null);
  const go = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const items = useMemo(() => {
    const by = new Map(products.map((p) => [p.sku, p]));
    const list = BESTSELLER_SKUS.map((s) => by.get(s)).filter(Boolean);
    const seen = new Set(list.map((p) => p.collectionSlug));
    colsOf(products).forEach((c) => {
      if (list.length >= 10 || seen.has(c.slug)) return;
      const p = products.find((x) => x.collectionSlug === c.slug && x.images.length > 1) || products.find((x) => x.collectionSlug === c.slug);
      if (p) { list.push(p); seen.add(c.slug); }
    });
    return list.slice(0, 10);
  }, [products]);
  return (
    <Slider title="Bestsellerji" sub="Najbolj prodajane tapete in fototapete" linkTo="/tapete" linkLabel="Poglej vse">
      {items.map((p) => {
        const r = rollOf(p);
        return (
          <Link key={p.sku} to={`/izdelek/${encodeURIComponent(p.sku)}`} className="bs">
            <span className="bs-img">{(p.images[1] || p.images[0]) && <img src={p.images[1] || p.images[0]} alt={p.name} loading="lazy" />}</span>
            <span className="bs-name">{p.collection} {p.brand.replace(/ tapeta/i, '')}</span>
            <span className="bs-sku">{p.sku}</span>
            <b className="bs-price">{eur(p.price)} *</b>
            {r && <span className="bs-m2">{eur(p.price / (r.len * r.wid))} na 1 m²</span>}
          </Link>
        );
      })}
    </Slider>
  );
}

const COLORS = [
  ['bez', 'Bež', '#d9c8a9'], ['krem', 'Krem', '#efe6d0'], ['crna', 'Črna', '#1f1f1f'], ['modra', 'Modra', '#2f5da3'], ['rjava', 'Rjava', '#7b4f2e'],
  ['zlata', 'Zlata', 'linear-gradient(135deg,#b98a2c,#f3dd8f 50%,#c9a24a)'], ['zelena', 'Zelena', '#4e7b3a'], ['siva', 'Siva', '#9a9a95'],
  ['barvita', 'Barvita', 'conic-gradient(#e53935,#fdd835,#43a047,#1e88e5,#8e24aa,#e53935)'], ['oranzna', 'Oranžna', '#e07a26'],
  ['pastelna', 'Pastelna', 'conic-gradient(#f9c7d8,#fbe9b7,#c9ecd0,#c5dcf6,#e0cdf3,#f9c7d8)'], ['roza', 'Roza', '#e588a8'], ['vijolicna', 'Vijolična', '#7c4f9f'],
  ['rdeca', 'Rdeča', '#b8312a'], ['srebrna', 'Srebrna', 'linear-gradient(135deg,#8d9196,#f2f3f4 50%,#a9adb2)'], ['petrolej', 'Petrolej', '#1f6f73'],
  ['turkizna', 'Turkizna', '#3fb3b0'], ['bela', 'Bela', '#ffffff'], ['rumena', 'Rumena', '#f2c94c'],
];
// shows only colours that exist in the product data (specification "Barva")
function ShopByColor({ products }) {
  const present = useMemo(() => new Set(products.map((p) => p.color).filter(Boolean)), [products]);
  return (
    <section className="sec">
      <div className="sec-h"><div><h2><T>Nakupujte po barvi</T></h2></div><Link to="/iskanje" className="all-link">Vse barve</Link></div>
      <div className="swatches">
        {COLORS.filter(([slug]) => present.has(slug)).map(([slug, name, bg]) => (
          <Link key={slug} to={`/iskanje?barva=${slug}`} className="swatch"><i style={{ background: bg }} /><span>{name}</span></Link>
        ))}
      </div>
    </section>
  );
}

// ---- block with a tall side image + product row + page dots (like the original front page) ----
function MiniCard({ p }) {
  return (
    <Link to={`/izdelek/${encodeURIComponent(p.sku)}`} className="mc">
      <span className="mc-img">{p.images[0] && <img src={p.images[0]} alt={p.name} loading="lazy" />}</span>
      <b>{p.name}</b>
      <span className="mc-p">{eur(p.price)}</span>
    </Link>
  );
}
function SideCarousel({ title, sub, items, side }) {
  const ref = useRef(null);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / 5));
  const step = () => (ref.current ? ref.current.clientWidth + 20 : 1);
  const bg = side || items[0]?.images[2] || items[0]?.images[1] || items[0]?.images[0];
  return (
    <section className="sec side">
      <div className="side-img" style={{ backgroundImage: bg ? `url(${bg})` : undefined }} />
      <div className="side-main">
        <h2 className="side-h">{title}{sub && <small>{sub}</small>}</h2>
        <div className="rail mini" ref={ref} onScroll={() => setPage(Math.round(ref.current.scrollLeft / step()))}>
          {items.map((p) => <MiniCard key={p.sku} p={p} />)}
        </div>
        {pages > 1 && (
          <div className="pdots">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} className={i === page ? 'on' : ''} onClick={() => ref.current?.scrollTo({ left: i * step(), behavior: 'smooth' })} aria-label={`Stran ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
const pickCol = (products, re, skip = []) =>
  colsOf(products).find((c) => re.test(c.name) && !skip.includes(c.slug)) || colsOf(products).find((c) => !skip.includes(c.slug));

function News() {
  const posts = [
    ['Surova eleganca industrijskega oblikovanja: Kolekcija Rasch tapet Factory VI', 'linear-gradient(145deg,#8f8a82,#d9d3c7)'],
    ['Vrhunec visoke mode na vaših stenah: Predstavljamo zbirko Papis Loveday', 'linear-gradient(145deg,#12408f,#4a8ae0)'],
    ['Odkrijte nove kolekcije tapet za vsak prostor', 'linear-gradient(145deg,#c9a98c,#efe0d0)'],
  ];
  return (
    <section className="sec">
      <div className="sec-h"><div><h2><T>Novosti</T></h2></div></div>
      <div className="posts">{posts.map(([t, bg]) => <a key={t} href="#" className="post"><div style={{ background: bg }} /><h3>{t}</h3><span>Preberi več →</span></a>)}</div>
    </section>
  );
}

// Block registry – id, label, renderer. Order/visibility is controlled from Home.jsx
export const COLOR_NAMES = Object.fromEntries(COLORS.map(([s, n]) => [s, n]));
export const BLOCKS = [
  { id: 'hero', label: 'Hero slider', render: (p) => <Hero products={p} /> },
  { id: 'usps', label: 'Prednosti', render: () => <Usps /> },
  { id: 'categories', label: 'Kategorije', render: (p) => <Categories products={p} /> },
  { id: 'styles', label: 'Nakupujte po slogu', render: (p) => <ShopByStyle products={p} /> },
  { id: 'colors', label: 'Nakupujte po barvi', render: (p) => <ShopByColor products={p} /> },
  { id: 'new', label: 'Novosti (izdelki)', render: (p) => <Carousel title="Novosti v ponudbi" sub="Sveže tapete iz naše ponudbe" items={p.slice(0, 12)} /> },
  { id: 'bestsellers', label: 'Bestsellerji', render: (p) => <Bestsellers products={p} /> },
  { id: 'versace', label: 'Kolekcija + slika (Versace)', render: (p) => {
    const c = pickCol(p, /versace/i);
    return c ? <SideCarousel title={`Tapete ${c.name.toUpperCase()}`} items={p.filter((x) => x.collectionSlug === c.slug).slice(0, 15)} /> : null;
  } },
  { id: 'cosmo', label: 'Kolekcija + slika (En prostor. Ena stena.)', render: (p) => {
    const v = pickCol(p, /versace/i);
    const c = pickCol(p, /cosmo/i, v ? [v.slug] : []);
    return c ? <SideCarousel title="En prostor. Ena izjava. Ena stena." sub="Ekskluzivni dizajn za vaš dom." items={p.filter((x) => x.collectionSlug === c.slug).slice(0, 15)} /> : null;
  } },
  { id: 'folije', label: 'Samolepilne folije (potrebni podatki)', render: (p) => {
    const f = p.filter((x) => /folij/i.test(x.name));
    return f.length ? <SideCarousel title="Samolepilne folije" items={f.slice(0, 15)} /> : null;
  } },
  { id: 'collections', label: 'Kolekcije', render: (p) => <Collections products={p} /> },
  { id: 'featured', label: 'Izpostavljena kolekcija', render: (p) => {
    const c = colsOf(p).find((x) => /versace/i.test(x.name)) || colsOf(p)[0];
    return c ? <Carousel title={`Tapete ${c.name}`} sub="Ekskluzivni dizajn za vaš dom" items={p.filter((x) => x.collectionSlug === c.slug).slice(0, 12)} /> : null;
  } },
  { id: 'brands', label: 'Znamke', render: () => <Brands /> },
  { id: 'newsletter', label: 'Novice (newsletter)', render: () => <Newsletter /> },
  { id: 'social', label: 'Družabna omrežja', render: () => <Social /> },
  { id: 'news', label: 'Novosti', render: () => <News /> },
  { id: 'blog', label: 'Blog', render: () => <Blog /> },
];
