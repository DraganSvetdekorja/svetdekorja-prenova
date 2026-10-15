import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sd-cart')) || []; } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  useEffect(() => { try { localStorage.setItem('sd-cart', JSON.stringify(items)); } catch {} }, [items]);

  const add = (p, qty = 1) => {
    setItems((cur) => {
      const f = cur.find((i) => i.sku === p.sku);
      if (f) return cur.map((i) => (i.sku === p.sku ? { ...i, qty: i.qty + qty } : i));
      return [...cur, { sku: p.sku, name: p.name, price: p.price, img: p.images[0], qty }];
    });
    setOpen(true);
  };
  const setQty = (sku, qty) => setItems((cur) => cur.map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, qty) } : i)));
  const remove = (sku) => setItems((cur) => cur.filter((i) => i.sku !== sku));
  const total = items.reduce((t, i) => t + i.price * i.qty, 0);
  const count = items.reduce((t, i) => t + i.qty, 0);

  return <Ctx.Provider value={{ items, add, setQty, remove, total, count, open, setOpen }}>{children}</Ctx.Provider>;
}
