export async function api(path, opts = {}) {
  const r = await fetch('/api' + path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== '/login') window.dispatchEvent(new Event('unauth'));
  if (!r.ok) throw new Error(d.error || (r.status >= 500 ? `Strežnik (API na vratih 4000) ni dosegljiv ali je javil napako [${r.status}]. Preverite okno »API 4000«.` : `Napaka [${r.status}]`));
  return d;
}

export async function uploadFile(file) {
  const r = await fetch('/api/admin/media', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': file.type, 'X-Filename': encodeURIComponent(file.name) }, body: file });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Nalaganje ni uspelo');
  return d;
}
