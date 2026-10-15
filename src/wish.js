import { useSyncExternalStore } from 'react';
// tiny wishlist store (localStorage) shared by cards, product page, header and the wishlist drawer
const KEY = 'sd-wish';
const subs = new Set();
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
let snap = read();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(snap)); } catch {} subs.forEach((f) => f()); };
export function toggleWish(sku) { snap = snap.includes(sku) ? snap.filter((s) => s !== sku) : [...snap, sku]; save(); }
export function clearWish() { snap = []; save(); }
export const useWish = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => snap);

// drawer open/close state
const osubs = new Set();
let opened = false;
export const setWishOpen = (v) => { opened = v; osubs.forEach((f) => f()); };
export const useWishOpen = () => useSyncExternalStore((f) => { osubs.add(f); return () => osubs.delete(f); }, () => opened);
