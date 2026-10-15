import { useEffect, useState } from 'react';
import { api, uploadFile } from './api.js';

export default function Media() {
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');
  const load = () => api('/admin/media').then(setFiles).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, []);
  const up = async (e) => {
    setMsg('Nalagam …');
    try { for (const f of Array.from(e.target.files)) await uploadFile(f); setMsg('Naloženo ✓'); } catch (x) { setMsg(x.message); }
    e.target.value = ''; load();
  };
  const del = async (n) => { if (confirm('Izbrišem sliko?')) { await api('/admin/media/' + encodeURIComponent(n), { method: 'DELETE' }); load(); } };
  return (
    <div className="card">
      <div className="bar"><h2>Mediji <small>({files.length})</small></h2><span className="muted">{msg}</span>
        <label className="btn p">Naloži slike<input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={up} /></label></div>
      <div className="mgrid">
        {files.map((f) => (
          <figure key={f.name} className="mi"><img src={f.url} alt={f.name} loading="lazy" />
            <figcaption><span title={f.name}>{f.name}</span><small>{Math.round(f.size / 1024)} kB</small>
              <div><button className="btn sm" onClick={() => navigator.clipboard?.writeText(location.origin + f.url)}>Kopiraj URL</button> <button className="btn sm danger" onClick={() => del(f.name)}>×</button></div></figcaption></figure>
        ))}
        {!files.length && <p className="muted">Ni naloženih slik.</p>}
      </div>
    </div>
  );
}
