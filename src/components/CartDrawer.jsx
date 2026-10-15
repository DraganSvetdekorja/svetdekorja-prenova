import { Link } from 'react-router-dom';
import { useCart } from '../cart.jsx';
import { eur } from '../data.js';

export default function CartDrawer() {
  const { items, open, setOpen, setQty, remove, total } = useCart();
  return (
    <>
      <div className={`ov${open ? ' on' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`dr${open ? ' on' : ''}`} aria-hidden={!open} aria-label="Košarica">
        <div className="dh"><b>Košarica</b><button className="x" onClick={() => setOpen(false)} aria-label="Zapri">×</button></div>
        <div className="db">
          {!items.length && <p className="meta" style={{ marginTop: 24 }}>Košarica je prazna.</p>}
          {items.map((i) => (
            <div className="ci" key={i.sku}>
              <img src={i.img} alt="" />
              <div>
                <Link to={`/izdelek/${encodeURIComponent(i.sku)}`} onClick={() => setOpen(false)}><b>{i.name}</b></Link>
                <div className="meta">{eur(i.price)}</div>
                <div className="qty">
                  <button onClick={() => setQty(i.sku, i.qty - 1)}>−</button><span>{i.qty}</span><button onClick={() => setQty(i.sku, i.qty + 1)}>+</button>
                  <button className="lnk" onClick={() => remove(i.sku)}>Odstrani</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="df"><b>Skupaj: {eur(total)}</b><button className="b p">Na blagajno</button></div>
      </aside>
    </>
  );
}
