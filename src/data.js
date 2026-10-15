import { useEffect, useState } from 'react';

const API = '/api/public';

export const slugify = (s) =>
  String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const eur = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';
export const barvLabel = (n) => `${n} ${n === 1 ? 'barva' : n === 2 ? 'barvi' : n < 5 ? 'barve' : 'barv'}`;

// slim product from /api/public/products (descriptions + full gallery come from /api/public/product/:sku)
function normalize(x, i) {
  const collection = x.collection || 'Ostalo';
  return {
    index: i,
    sku: x.sku,
    name: String(x.name || '').replace(/\s+/g, ' ').trim(),
    slug: x.slug,
    cat: x.grp || 'ostalo',
    sub: x.sub || '',
    categoryId: x.categoryId,
    brand: x.brand || '',
    collection,
    collectionSlug: x.collection ? slugify(collection) : 'cat-' + (x.grp || 'ostalo'),
    price: x.price,
    oldPrice: x.oldPrice && x.oldPrice > x.price ? x.oldPrice : null, // regular price shown crossed out
    badge: x.badge || '',
    material: x.material || '',
    colorLabel: x.color || '',
    color: slugify(x.color || ''),
    style: x.style || '',
    rooms: String(x.room || '').split(/\s*,\s*/).filter(Boolean),
    tip: x.tip || '',
    unit: x.unit || '',
    dimLabel: x.dim || '',
    delivery: x.delivery || '—',
    stock: x.stock !== false,
    images: [x.image, x.image2].filter(Boolean),
    shortHtml: '',
    descHtml: '',
    specList: [],
  };
}

// "Similar products": nearest products (by SKU) of the same collection. Replace with real colour groups when the data has them.
function linkVariants(list) {
  const byCol = new Map();
  list.forEach((p) => byCol.set(p.collectionSlug, [...(byCol.get(p.collectionSlug) || []), p]));
  byCol.forEach((a) => a.sort((x, y) => x.sku.localeCompare(y.sku)));
  list.forEach((p) => {
    const a = byCol.get(p.collectionSlug), i = a.indexOf(p);
    p.variants = [a[i - 2], a[i - 1], a[i + 1], a[i + 2]].filter(Boolean);
    p.variantsKind = 'similar';
  });
  return list;
}

const getJson = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
let cache;
export function loadProducts() {
  cache ||= getJson(`${API}/products`).then((raw) => linkVariants(raw.map(normalize)));
  return cache;
}
export const loadDetail = (sku) => getJson(`${API}/product/${encodeURIComponent(sku)}`);

export function useProducts() {
  const [state, setState] = useState({ products: [], loading: true, error: null });
  useEffect(() => {
    let alive = true;
    loadProducts()
      .then((products) => alive && setState({ products, loading: false, error: null }))
      .catch(() => alive && setState({ products: [], loading: false, error: new Error('Izdelkov ni mogoče naložiti – ali teče strežnik (npm start v mapi server)?') }));
    return () => { alive = false; };
  }, []);
  return state;
}

export function usePosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { fetch(`${API}/posts`).then((r) => (r.ok ? r.json() : [])).then(setPosts).catch(() => {}); }, []);
  return posts;
}
export function useGroups() {
  const [g, setG] = useState([]);
  useEffect(() => { fetch(`${API}/groups`).then((r) => (r.ok ? r.json() : [])).then(setG).catch(() => {}); }, []);
  return g;
}

export const PRICE_ORDER = ['Do 20 €', '20 – 50 €', '50 – 100 €', 'Nad 100 €'];
const bracket = (p) => (p < 20 ? PRICE_ORDER[0] : p < 50 ? PRICE_ORDER[1] : p < 100 ? PRICE_ORDER[2] : PRICE_ORDER[3]);

// drawer / chip filters (a getter may return one value or a list)
export const GROUPS = [
  { key: 'kolekcija', label: 'Kolekcija', get: (p) => p.collection },
  { key: 'cena', label: 'Cena', get: (p) => bracket(p.price), order: PRICE_ORDER },
  { key: 'znamka', label: 'Znamka', get: (p) => p.brand },
  { key: 'material', label: 'Material', get: (p) => p.material },
  { key: 'barvaf', label: 'Barva', get: (p) => p.colorLabel },
  { key: 'stil', label: 'Stil', get: (p) => p.style },
  { key: 'prostor', label: 'Prostor', get: (p) => p.rooms },
];

// colour swatches for the colour filter (key = slugified "Barva" label from the product data)
export const COLOR_BG = {
  bez: '#d9c8a9', krem: '#efe6d0', crna: '#1f1f1f', modra: '#2f5da3', rjava: '#7b4f2e', zelena: '#4e7b3a', siva: '#9a9a95', oranzna: '#e07a26', roza: '#e588a8',
  vijolicna: '#7c4f9f', rdeca: '#b8312a', petrolej: '#1f6f73', petrol: '#1f6f73', turkizna: '#3fb3b0', bela: '#ffffff', rumena: '#f2c94c', antracit: '#3a3d40',
  taupe: '#8b7d70', oker: '#c9962b', 'olivno-zelena': '#6b7036',
  zlata: 'linear-gradient(135deg,#b98a2c,#f3dd8f 50%,#c9a24a)', srebrna: 'linear-gradient(135deg,#8d9196,#f2f3f4 50%,#a9adb2)',
  bakrena: 'linear-gradient(135deg,#8a4b22,#e0a070 50%,#a45a2a)', metalik: 'linear-gradient(135deg,#6f7a86,#dfe4ea 50%,#8d98a4)',
  barvita: 'conic-gradient(#e53935,#fdd835,#43a047,#1e88e5,#8e24aa,#e53935)', pastelna: 'conic-gradient(#f9c7d8,#fbe9b7,#c9ecd0,#c5dcf6,#e0cdf3,#f9c7d8)',
  transparent: 'repeating-conic-gradient(#e6e6e6 0 25%,#fff 0 50%) 0 0/12px 12px',
};

// subcategories of a group (Folije, Oprema za dom …) – managed in the admin (Podkategorije)
export function useSubcats() {
  const [s, setS] = useState([]);
  useEffect(() => { fetch(`${API}/subcategories`).then((r) => (r.ok ? r.json() : [])).then(setS).catch(() => {}); }, []);
  return s;
}
