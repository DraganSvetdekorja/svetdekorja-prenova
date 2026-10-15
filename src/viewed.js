// "Nazadnje ogledano" – last viewed products, stored in localStorage (most recent first)
const KEY = 'sd-viewed';
export function getViewed() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
export function addViewed(sku) {
  try {
    const list = [sku, ...getViewed().filter((s) => s !== sku)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* storage unavailable */ }
}
