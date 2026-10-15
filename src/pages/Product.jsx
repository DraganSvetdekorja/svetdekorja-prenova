import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eur, loadDetail, useGroups, useProducts } from '../data.js';
import { useCart } from '../cart.jsx';
import { addViewed } from '../viewed.js';
import ProductCard from '../components/ProductCard.jsx';
import ProductCards from '../components/ProductCards.jsx';
import { VariantPicker } from '../components/Variants.jsx';
import Lightbox from '../components/Lightbox.jsx';

export default function Product() {
  const { sku } = useParams();
  const { products, loading, error } = useProducts();
  const { add } = useCart();
  const [lb, setLb] = useState(null); // index of the image open in the modal, or null
  const [qty, setQty] = useState(1);
  const [det, setDet] = useState(null); // full record (gallery, descriptions, specification)
  const groups = useGroups();
  const p = useMemo(() => {
    const b = products.find((x) => x.sku === sku);
    return b && det && det.sku === sku ? { ...b, images: det.images.length ? det.images : b.images, shortHtml: det.shortHtml, descHtml: det.descHtml, specList: det.specList } : b;
  }, [products, sku, det]);
  const related = useMemo(() => (p ? products.filter((x) => x.collectionSlug === p.collectionSlug && x.sku !== p.sku).slice(0, 4) : []), [products, p]);

  useEffect(() => { setLb(null); setQty(1); setDet(null); loadDetail(sku).then(setDet).catch(() => {}); }, [sku]);
  useEffect(() => { if (p) addViewed(p.sku); }, [p]);
  useEffect(() => { if (p) document.title = `${p.name} – Svet Dekorja`; }, [p]);

  if (error) return <div className="wrap empty">{String(error.message)}</div>;
  if (loading) return <div className="wrap pdp"><div className="img" /><div /></div>;
  if (!p) return <div className="wrap empty">Izdelek ni najden. <Link to="/tapete">Nazaj na tapete</Link></div>;

  return (
    <div className="wrap">
      <div className="crumb">
        <Link to="/">Domov</Link> / <Link to={`/k/${p.cat}`}>{groups.find((g) => g.slug === p.cat)?.name || 'Izdelki'}</Link> / {p.collection !== 'Ostalo' ? <><Link to={`/kolekcija/${p.collectionSlug}`}>{p.collection}</Link> / </> : null}{p.sku}
      </div>
      <div className="pdp">
        {/* two images per row; click opens the modal */}
        <div className="gal2">
          {p.images.length === 0 && <div className="gi noimg">Ni slike</div>}
          {p.images.map((src, i) => (
            <button key={src} className="gi" onClick={() => setLb(i)} aria-label={`Povečaj sliko ${i + 1}`}>
              <img src={src} alt={`${p.name} – slika ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
            </button>
          ))}
        </div>

        <div className="info">
          <span className="brand">{p.brand} · {p.collection}</span>
          <h1 className="pt">{p.name}</h1>
          <div className="price big">{eur(p.price)} {p.oldPrice && <s>{eur(p.oldPrice)}</s>} <small>z DDV</small></div>
          <VariantPicker p={p} />
          <div className="short" dangerouslySetInnerHTML={{ __html: p.shortHtml }} />
          <ul className="facts">
            <li><span>SKU</span><b>{p.sku}</b></li>
            <li><span>Dobavni rok</span><b>{p.delivery}</b></li>
            <li><span>Material</span><b>Flis tapeta</b></li>
          </ul>
          <div className="buy">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button className="add lg" onClick={() => add(p, qty)}>Dodaj v košarico</button>
          </div>
          <ProductCards p={p} />
        </div>
      </div>

      {p.specList.length > 0 && (
        <section className="desc"><h2>Značilnosti</h2>
          <table className="spec"><tbody>{p.specList.map((s) => <tr key={s.key}><th>{s.label}</th><td>{s.value}</td></tr>)}</tbody></table>
        </section>
      )}

      {p.descHtml && (
        <section className="desc"><h2>Opis izdelka</h2><div dangerouslySetInnerHTML={{ __html: p.descHtml }} /></section>
      )}

      {related.length > 0 && (
        <section className="rel">
          <h2>Več iz kolekcije {p.collection}</h2>
          <div className="grid" style={{ padding: 0 }}>{related.map((r) => <ProductCard key={r.sku} p={r} />)}</div>
        </section>
      )}

      {lb != null && <Lightbox images={p.images} index={lb} onIndex={setLb} onClose={() => setLb(null)} alt={p.name} />}
    </div>
  );
}
