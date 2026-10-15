import { useEffect, useState } from 'react';
import { BLOCKS, BlockCtx } from '../blocks.jsx';
import { useProducts } from '../data.js';

const known = BLOCKS.map((b) => b.id);
const byId = Object.fromEntries(BLOCKS.map((b) => [b.id, b]));

// Front page layout (order, visibility, custom headings) is controlled from the admin page builder
export default function Home() {
  const { products, loading } = useProducts();
  const [layout, setLayout] = useState(null);
  useEffect(() => {
    fetch('/api/public/layout').then((r) => (r.ok ? r.json() : null)).catch(() => null)
      .then((l) => setLayout(l && Array.isArray(l.order)
        ? { order: l.order.filter((i) => known.includes(i)), hidden: l.hidden || [], props: l.props || {} }
        : { order: known, hidden: [], props: {} }));
    document.title = 'Svet Dekorja – tapete, fototapete, samolepilne folije';
  }, []);
  if (!layout) return <main className="home"><div className="sec"><div className="skel" /></div></main>;
  return (
    <main className="home">
      {layout.order.filter((id) => !layout.hidden.includes(id)).map((id) => (
        <BlockCtx.Provider key={id} value={layout.props[id] || {}}>
          <div>{loading ? <div className="sec"><div className="skel" /></div> : byId[id].render(products)}</div>
        </BlockCtx.Provider>
      ))}
    </main>
  );
}
