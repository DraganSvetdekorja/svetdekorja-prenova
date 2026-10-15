import { useEffect, useState } from 'react';
import { api } from './api.js';
import Resource from './Resource.jsx';
import Builder from './Builder.jsx';
import Media from './Media.jsx';

function Login({ onLogin }) {
  const [u, setU] = useState(''), [p, setP] = useState(''), [err, setErr] = useState('');
  const go = async (e) => { e.preventDefault(); setErr(''); try { await api('/login', { method: 'POST', body: { username: u, password: p } }); onLogin(u); } catch (x) { setErr(x.message); } };
  return (
    <div className="login"><form className="card" onSubmit={go}>
      <h1>Svet Dekorja</h1><p className="muted">Administracija</p>
      <label className="fld"><span>Uporabniško ime</span><input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" autoFocus required /></label>
      <label className="fld"><span>Geslo</span><input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required /></label>
      {err && <p className="err">{err}</p>}<button className="btn p wide">Prijava</button>
    </form></div>
  );
}

function Dashboard() {
  const [s, setS] = useState({});
  useEffect(() => { api('/admin/stats').then(setS); }, []);
  return <div className="stats">{[['products', 'Izdelki'], ['categories', 'Kategorije'], ['subcategories', 'Podkategorije'], ['posts', 'Objave'], ['attributes', 'Atributi']].map(([k, l]) => <div className="card stat" key={k}><span>{l}</span><b>{s[k] ?? '…'}</b></div>)}</div>;
}

function Account() {
  const [o, setO] = useState(''), [n, setN] = useState(''), [m, setM] = useState('');
  const go = async (e) => { e.preventDefault(); try { await api('/admin/password', { method: 'POST', body: { old: o, next: n } }); setM('Geslo je spremenjeno ✓'); setO(''); setN(''); } catch (x) { setM(x.message); } };
  return <form className="card form" onSubmit={go}><h2>Sprememba gesla</h2>
    <label className="fld"><span>Staro geslo</span><input type="password" value={o} onChange={(e) => setO(e.target.value)} required /></label>
    <label className="fld"><span>Novo geslo (vsaj 10 znakov)</span><input type="password" value={n} onChange={(e) => setN(e.target.value)} required minLength={10} /></label>
    {m && <p className="muted">{m}</p>}<button className="btn p">Spremeni geslo</button></form>;
}

const NAV = [['dash', 'Pregled'], ['products', 'Izdelki'], ['categories', 'Kategorije'], ['attributes', 'Atributi'], ['posts', 'Blog'], ['media', 'Mediji'], ['builder', 'Naslovnica (gradnik)'], ['account', 'Račun']];

export default function App() {
  const [user, setUser] = useState(undefined);
  const [sec, setSec] = useState(location.hash.slice(1) || 'dash');
  useEffect(() => { api('/admin/me').then((d) => setUser(d.username)).catch(() => setUser(null)); const f = () => setUser(null); window.addEventListener('unauth', f); return () => window.removeEventListener('unauth', f); }, []);
  useEffect(() => { location.hash = sec; }, [sec]);
  if (user === undefined) return null;
  if (!user) return <Login onLogin={setUser} />;
  return (
    <div className="shell">
      <aside className="side"><div className="brand">SVET<span>.</span>DEKORJA<small>Admin</small></div>
        {NAV.map(([k, l]) => <button key={k} className={sec === k ? 'on' : ''} onClick={() => setSec(k)}>{l}</button>)}
        <div className="sp" /><a href="/" target="_blank" rel="noreferrer">Odpri trgovino ↗</a>
        <button onClick={async () => { await api('/logout', { method: 'POST' }); setUser(null); }}>Odjava ({user})</button></aside>
      <main className="main">
        {sec === 'dash' && <Dashboard />}{sec === 'builder' && <Builder />}{sec === 'account' && <Account />}{sec === 'media' && <Media />}
        {['products', 'categories', 'subcategories', 'attributes', 'posts'].includes(sec) && <Resource name={sec} />}
      </main>
    </div>
  );
}
