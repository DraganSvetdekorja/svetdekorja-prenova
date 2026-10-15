import { useState } from 'react';
import { eur } from '../data.js';
import { rollOf, num } from '../roll.js';
import { toggleWish, useWish } from '../wish.js';
import Calculator from './Calculator.jsx';
import RoomVisualizer from './RoomVisualizer.jsx';

const UNITS = { rol: 'rolo', m2: 'm²' };

export default function ProductCards({ p }) {
  const [viz, setViz] = useState(false);
  const wished = useWish().includes(p.sku);
  const roll = rollOf(p); // only wallpapers have a roll
  const area = roll ? roll.len * roll.wid : 0;
  const unit = UNITS[p.unit] || p.unit || 'kos';
  return (
    <div className="pcards">
      <div className="pc">
        <div><b>Cena za {unit} {eur(p.price)}</b> {p.oldPrice && <s style={{ color: '#999' }}>{eur(p.oldPrice)}</s>} <small>z DDV</small></div>
        {roll && <span>{eur(p.price / area)} / m² · rola {num(roll.len)} m × {num(roll.wid)} m ({num(area)} m²)</span>}
        {!roll && p.dimLabel && <span>Dimenzija: {p.dimLabel}</span>}
      </div>
      <button className="pc wish" onClick={() => toggleWish(p.sku)}>{wished ? '♥ Na seznamu želja' : '♡ Dodaj na seznam želja'}</button>

      {roll && (
        <div className="pc viz">
          <b>Brezplačna vizualizacija v vaši sobi</b>
          <span>Oglejte si, kako bo ta tapeta videti na vaši steni. Naložite fotografijo svoje sobe in označite steno.</span>
          <button className="b p" onClick={() => setViz(true)}>Preizkusi v moji sobi</button>
        </div>
      )}
      {roll && <Calculator key={p.sku} p={p} roll={roll} />}

      <details className="pc">
        <summary><b>O materialih</b><span>{[p.material, p.tip].filter(Boolean).join(' · ') || 'Tehnične specifikacije in lastnosti'}</span></summary>
        <ul>
          {p.material && <li>Material: {p.material}</li>}
          {p.tip && <li>Tip artikla: {p.tip}</li>}
          {p.dimLabel && <li>Dimenzija: {p.dimLabel}</li>}
          <li>Vse podrobne značilnosti so navedene spodaj na strani.</li>
        </ul>
      </details>

      <div className="pc">
        <b>Dostava in vračilo</b>
        <span>Dobavni rok: {p.delivery}. Če niste zadovoljni, izdelek lahko vrnete v 14 dneh. Pogoje brezplačne dostave najdete na strani Dostava.</span>
      </div>
      {viz && <RoomVisualizer p={p} onClose={() => setViz(false)} />}
    </div>
  );
}
