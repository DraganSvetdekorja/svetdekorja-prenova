import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../cart.jsx';
import { eur, useSubcats } from '../data.js';
import { setWishOpen, useWish } from '../wish.js';
import { MENU } from '../menu.js';
import SearchBox from './SearchBox.jsx';

export default function Header() {
  const { total, count, setOpen } = useCart();
  const wish = useWish();
  const subs = useSubcats();
  const [menu, setMenu] = useState(null); // { i, left, top } – dropdown is position:fixed so the scrolling nav never clips it
  const timer = useRef(null);

  const openAt = (i, el) => {
    clearTimeout(timer.current);
    const r = el.getBoundingClientRect();
    setMenu({ i, left: Math.max(8, Math.min(r.left, window.innerWidth - 300)), top: r.bottom });
  };
  const closeSoon = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setMenu(null), 150); };
  const toggle = (i, el) => (menu?.i === i ? setMenu(null) : openAt(i, el));

  useEffect(() => {
    const close = () => setMenu(null);
    const key = (e) => e.key === 'Escape' && close();
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    document.addEventListener('keydown', key);
    return () => { window.removeEventListener('scroll', close); window.removeEventListener('resize', close); document.removeEventListener('keydown', key); };
  }, []);

  return (
    <header>
      <div className="top">
        <div><span>info@svetdekorja.si</span><span>(01) 729 10 51</span><span>Salon: Gorenjska cesta 20, 1234 Mengeš</span></div>
        <div><span className="b2b">Veleprodaja - B2B</span>
          <button className="wl" onClick={() => { setOpen(false); setWishOpen(true); }}>Seznam želja{wish.length ? ` (${wish.length})` : ''}</button>
          <span>Moj račun</span><span>Registracija</span></div>
      </div>
      <div className="hd">
        <Link to="/" className="logo">SVET<span>.</span>DEKORJA<small>Obleci svoj dom</small></Link>
        <SearchBox />
        <button className="cartbtn" onClick={() => { setWishOpen(false); setOpen(true); }}><b>Košarica ({count})</b><br />{eur(total)}</button>
      </div>
      <nav className="nav" aria-label="Glavni meni">
        {MENU.map((m, i) => { const kids = m.parent ? subs.filter((s) => s.parent === m.parent).map((s) => ({ label: s.name, to: `/k/${s.parent}/${s.slug}` })) : []; return (kids.length ? (
          <div key={m.label} className={'nv' + (menu?.i === i ? ' open' : '')}
            onPointerEnter={(e) => e.pointerType === 'mouse' && openAt(i, e.currentTarget)} onPointerLeave={(e) => e.pointerType === 'mouse' && closeSoon()}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenu(null); }}>
            {m.to ? <Link to={m.to}>{m.label}</Link> : <button type="button" className="nvb" onClick={(e) => toggle(i, e.currentTarget.parentElement)}>{m.label}</button>}
            <button type="button" className="chev" aria-label={`Podkategorije: ${m.label}`} aria-expanded={menu?.i === i} onClick={(e) => toggle(i, e.currentTarget.parentElement)}><i /></button>
            {menu?.i === i && (
              <div className="sub" style={{ left: menu.left, top: menu.top }} role="menu">
                {kids.map((c) => <Link key={c.label} to={c.to} role="menuitem" onClick={() => setMenu(null)}>{c.label}</Link>)}
              </div>
            )}
          </div>
        ) : m.to ? <Link key={m.label} to={m.to} className={m.cls}>{m.label}</Link> : <span key={m.label} className={m.cls}>{m.label}</span>); })}
      </nav>
    </header>
  );
}
