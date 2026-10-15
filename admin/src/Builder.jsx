import { useEffect, useState } from 'react';
import { api } from './api.js';

// block types that exist in the storefront (ids must match src/blocks.jsx)
export const BLOCKS = [
  ['hero', 'Hero slider', 'Velik slider z najbolj priljubljenimi kolekcijami'],
  ['usps', 'Prednosti', 'Dostava, vračilo, vzorci, svetovanje'],
  ['categories', 'Kategorije', 'Ploščice kategorij: tapete, fototapete, folije …'],
  ['styles', 'Nakupujte po slogu', 'Okrogle slike slogov'],
  ['colors', 'Nakupujte po barvi', 'Barvni vzorci'],
  ['new', 'Novosti v ponudbi', 'Vrstica najnovejših izdelkov'],
  ['bestsellers', 'Bestsellerji', 'Najbolj prodajani izdelki'],
  ['versace', 'Kolekcija + slika (Versace)', 'Velika slika levo, izdelki desno'],
  ['cosmo', 'Kolekcija + slika (En prostor. Ena stena.)', 'Velika slika levo, izdelki desno'],
  ['folije', 'Samolepilne folije', 'Prikaže se, ko so v podatkih folije'],
  ['collections', 'Kolekcije', 'Gumbi vseh kolekcij'],
  ['featured', 'Izpostavljena kolekcija', 'Vrstica izdelkov ene kolekcije'],
  ['brands', 'Znamke', 'Seznam znamk'],
  ['newsletter', 'Novice (newsletter)', 'Prijava na e-novice'],
  ['social', 'Družabna omrežja', 'Povezave na omrežja'],
  ['news', 'Novosti', 'Kartice novic'],
  ['blog', 'Blog', 'Zadnje objave iz bloga (urejate v razdelku Blog)'],
].map(([id, label, desc]) => ({ id, label, desc }));
const by = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));

export default function Builder() {
  const [order, setOrder] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const [msg, setMsg] = useState('');
  const [props, setProps] = useState({});
  const [dirty, setDirty] = useState(false);
  useEffect(() => { api('/admin/layout').then((l) => { setOrder(l.order.filter((i) => by[i])); setHidden(l.hidden || []); setProps(l.props || {}); }); }, []);

  const touch = (fn) => { fn(); setDirty(true); setMsg(''); };
  const move = (from, to) => touch(() => { const o = order.filter((x) => x !== from); o.splice(order.indexOf(from) < order.indexOf(to) ? o.indexOf(to) + 1 : o.indexOf(to), 0, from); setOrder(o); });
  const step = (id, d) => touch(() => { const o = [...order], i = o.indexOf(id), j = i + d; if (j < 0 || j >= o.length) return; [o[i], o[j]] = [o[j], o[i]]; setOrder(o); });
  const toggle = (id) => touch(() => setHidden(hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id]));
  const remove = (id) => touch(() => { setOrder(order.filter((x) => x !== id)); setHidden(hidden.filter((x) => x !== id)); });
  const add = (id) => touch(() => setOrder([...order, id]));
  const save = async () => { try { await api('/admin/layout', { method: 'PUT', body: { order, hidden, props } }); setDirty(false); setMsg('Shranjeno ✓ – spremembe so takoj vidne v trgovini'); } catch (e) { setMsg(e.message); } };
  const avail = BLOCKS.filter((b) => !order.includes(b.id));

  return (
    <div className="builder">
      <div className="canvas card">
        <div className="bar"><h2>Naslovnica – gradnik strani</h2><span className="muted">{msg}</span><button className="btn p" onClick={save} disabled={!dirty}>Shrani razpored</button></div>
        <p className="muted">Povlecite bloke za spremembo vrstnega reda. Stikalo skrije blok brez brisanja.</p>
        {order.map((id, i) => (
          <div key={id} className={'blk' + (drag === id ? ' dragging' : '') + (over === id && drag !== id ? ' over' : '') + (hidden.includes(id) ? ' off' : '')}
            draggable onDragStart={(e) => { setDrag(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); }}
            onDragOver={(e) => { e.preventDefault(); setOver(id); }} onDrop={(e) => { e.preventDefault(); if (drag) move(drag, id); setDrag(null); setOver(null); }} onDragEnd={() => { setDrag(null); setOver(null); }}>
            <span className="grip">⠿</span>
            <div className="bi"><b>{by[id].label}</b><small>{by[id].desc}</small><input className="ttl" placeholder="Prilagojen naslov (prazno = privzeti)" value={props[id]?.title || ''} onChange={(e) => touch(() => setProps({ ...props, [id]: { title: e.target.value } }))} onDragStart={(e) => e.stopPropagation()} /></div>
            <label className="sw"><input type="checkbox" checked={!hidden.includes(id)} onChange={() => toggle(id)} /><span className="knob" /></label>
            <button className="btn sm" onClick={() => step(id, -1)} disabled={i === 0} aria-label="Gor">▲</button>
            <button className="btn sm" onClick={() => step(id, 1)} disabled={i === order.length - 1} aria-label="Dol">▼</button>
            <button className="btn sm danger" onClick={() => remove(id)} aria-label="Odstrani">×</button>
          </div>
        ))}
      </div>
      <aside className="card inserter">
        <h3>Dodaj blok</h3>
        {!avail.length && <p className="muted">Vsi bloki so že na strani.</p>}
        {avail.map((b) => <button key={b.id} className="ins" onClick={() => add(b.id)}><b>+ {b.label}</b><small>{b.desc}</small></button>)}
        <a className="btn" href="/" target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>Odpri trgovino ↗</a>
      </aside>
    </div>
  );
}
