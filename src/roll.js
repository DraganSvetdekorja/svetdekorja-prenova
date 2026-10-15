export const num = (n, d = 2) => Number(n).toFixed(d).replace('.', ',');
const toM = (v, u) => parseFloat(String(v).replace(',', '.')) * (u.toLowerCase() === 'cm' ? 0.01 : 1);

// Wallpaper roll size from the "Dimenzija" value ("10,05 m x 0,53 m"); other categories have no roll → null
export function rollOf(p) {
  if (p.cat !== 'tapete') return null;
  const m = String(p.dimLabel || '').match(/(\d+(?:[.,]\d+)?)\s*(m|cm)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(m|cm)/i);
  if (m) {
    const a = toM(m[1], m[2]), b = toM(m[3], m[4]);
    const len = Math.max(a, b), wid = Math.min(a, b);
    if (len >= 3 && wid <= 1.5) return { len, wid };
  }
  return { len: 10.05, wid: 0.53 };
}
