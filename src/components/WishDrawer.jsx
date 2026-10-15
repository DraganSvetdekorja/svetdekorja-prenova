import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eur, useProducts } from '../data.js';
import { useCart } from '../cart.jsx';
import { clearWish, setWishOpen, toggleWish, useWish, useWishOpen } from '../wish.js';

export default function WishDrawer() {
  const open = useWishOpen();
  const wish = useWish();
  const { products } = useProducts();
  const { add } = useCart();
  const items = useMemo(() => {
    const by = new Map(products.map((p) => [p.sku, p]));
    return wish.map((s) => by.get(s)).filter(Boolean);
  }, [wish, products]);

  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && setWishOpen(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open]);

  const close = () => setWishOpen(false);
  const addAll = () => { items.forEach((p) => add(p)); close(); };

  return (
    <>
      <div className={`ov${open ? ' on' : ''}`} onClick={close} />
      <aside className={`dr${open ? ' on' : ''}`} aria-hidden={!open} aria-label="Seznam želja">
        <div className="dh"><b>Seznam želja ({items.length})</b><button className="x" onClick={close} aria-label="Zapri">×</button></div>
        <div className="db">
          {!items.length && (
            <div className="wempty">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 20s-7-4.5-9-9.2C1.7 7.4 4 4.5 7 4.5c1.8 0 3.2 1 5 3 1.8-2 3.2-3 5-3 3 0 5.3 2.9 4 6.3-2 4.7-9 9.2-9 9.2z" /></svg>
              <b>Vaš seznam želja je prazen</b>
              <span>Kliknite srček ob izdelku, da ga shranite za pozneje.</span>
              <Link to="/tapete" className="b p" onClick={close}>Poglej tapete</Link>
            </div>
          )}
          {items.map((p) => (
            <div className="ci" key={p.sku}>
              <Link to={`/izdelek/${encodeURIComponent(p.sku)}`} onClick={close}><img src={p.images[0]} alt={p.name} /></Link>
              <div>
                <Link to={`/izdelek/${encodeURIComponent(p.sku)}`} onClick={close}><b>{p.name}</b></Link>
                <div className="meta" style={{ margin: '4px 0 8px' }}>SKU {p.sku} · <span className="price" style={{ fontSize: 15 }}>{eur(p.price)}</span></div>
                <div className="qty">
                  <button className="add sm" style={{ width: 'auto' }} onClick={() => add(p)}>V košarico</button>
                  <button className="lnk" onClick={() => toggleWish(p.sku)}>Odstrani</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="df">
            <button className="b" onClick={clearWish}>Počisti</button>
            <button className="b p" onClick={addAll}>Dodaj vse v košarico</button>
          </div>
        )}
      </aside>
    </>
  );
}
