import { useMemo, useState } from 'react';
import { eur } from '../data.js';
import { useCart } from '../cart.jsx';
import { num } from '../roll.js';

export default function Calculator({ p, roll }) {
  const { add } = useCart();
  const [w, setW] = useState(4);
  const [h, setH] = useState(2.6);
  const [rapport, setRapport] = useState(0);   // pattern repeat in cm
  const [reserve, setReserve] = useState(true); // +10 % reserve
  const [len, setLen] = useState(roll.len);
  const [wid, setWid] = useState(roll.wid);

  const r = useMemo(() => {
    if (!(w > 0 && h > 0 && len > 0 && wid > 0)) return null;
    let strips = Math.ceil(w / wid);
    if (reserve) strips = Math.ceil(strips * 1.1);
    let stripLen = h + 0.1;                                  // 10 cm trimming allowance
    if (rapport > 0) stripLen = Math.ceil((stripLen * 100) / rapport) * rapport / 100; // round up to pattern repeat
    const perRoll = Math.floor(len / stripLen);
    if (perRoll < 1) return { error: true, stripLen };
    const rolls = Math.ceil(strips / perRoll);
    return { strips, stripLen, perRoll, rolls, total: rolls * p.price, area: w * h };
  }, [w, h, len, wid, rapport, reserve, p.price]);

  const field = (label, val, set, step = 0.1) => (
    <label className="cf"><span>{label}</span><input type="number" min="0" step={step} value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)} /></label>
  );

  return (
    <div className="pc calc">
      <b>Kalkulator tapet</b>
      <span>Izračunajte, koliko rol potrebujete za vašo steno.</span>
      <div className="cgrid">
        {field('Širina stene (m)', w, setW)}
        {field('Višina stene (m)', h, setH)}
        {field('Dolžina role (m)', len, setLen, 0.01)}
        {field('Širina role (m)', wid, setWid, 0.01)}
        <label className="cf"><span>Rapport vzorca</span>
          <select value={rapport} onChange={(e) => setRapport(+e.target.value)}>
            <option value={0}>Brez (naključni vzorec)</option><option value={32}>32 cm</option><option value={53}>53 cm</option><option value={64}>64 cm</option><option value={70}>70 cm</option>
          </select>
        </label>
        <label className="cf chk"><input type="checkbox" checked={reserve} onChange={(e) => setReserve(e.target.checked)} /> Dodaj 10 % rezerve</label>
      </div>
      {r?.error && <p className="cwarn">Višina stene ({num(r.stripLen)} m s priprezom) je večja od dolžine role.</p>}
      {r && !r.error && (
        <div className="cres">
          <div><span>Potrebnih trakov</span><b>{r.strips}</b></div>
          <div><span>Trakov na rolo</span><b>{r.perRoll}</b></div>
          <div><span>Potrebnih rol</span><b className="big">{r.rolls}</b></div>
          <div><span>Skupaj</span><b>{eur(r.total)}</b></div>
          <button className="add lg" onClick={() => add(p, r.rolls)}>Dodaj {r.rolls} {r.rolls === 1 ? 'rolo' : 'rol'} v košarico</button>
        </div>
      )}
    </div>
  );
}
