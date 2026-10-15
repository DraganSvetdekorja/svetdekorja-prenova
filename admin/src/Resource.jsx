import { useEffect, useState } from 'react';
import { api, uploadFile } from './api.js';
import { RESOURCES } from './resources.js';

function KV({ label, v, set }) { // specification: { key: { label, value_label } } <-> "key=value" lines
  const show = (x) => (x && typeof x === 'object' && 'value_label' in x ? x.value_label : x);
  const [text, setText] = useState(() => Object.entries(v || {}).map(([k, x]) => `${k}=${show(x) ?? ''}`).join('\n'));
  const change = (t) => {
    setText(t);
    const o = {};
    t.split('\n').forEach((l) => {
      const i = l.indexOf('=');
      const k = i > 0 ? l.slice(0, i).trim().replace(/[^A-Za-z0-9_]/g, '') : '';
      if (k) o[k] = { label: (v && v[k] && v[k].label) || k, value_label: l.slice(i + 1).trim() };
    });
    set(o);
  };
  return <label className="fld"><span>{label}</span><textarea rows={8} value={text} onChange={(e) => change(e.target.value)} /></label>;
}

function SubSelect({ label, v, set }) {
  const [subs, setSubs] = useState([]);
  useEffect(() => { api('/admin/subcategories?limit=100').then((d) => setSubs(d.rows)).catch(() => {}); }, []);
  return (
    <label className="fld"><span>{label}</span>
      <select value={v ?? ''} onChange={(e) => set(e.target.value === '' ? null : e.target.value)}>
        <option value="">— brez —</option>{subs.map((s) => <option key={s.slug} value={s.slug}>{s.parent} › {s.name}</option>)}
      </select></label>
  );
}

function CatSelect({ label, v, set }) {
  const [cats, setCats] = useState([]);
  useEffect(() => { api('/admin/categories?limit=100').then((d) => setCats(d.rows)).catch(() => {}); }, []);
  return (
    <label className="fld"><span>{label}</span>
      <select value={v ?? ''} onChange={(e) => set(e.target.value === '' ? null : +e.target.value)}>
        <option value="">—</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
      </select></label>
  );
}

const FILTERS = [['sub', 'Podkategorija'], ['category_id', 'Kategorija'], ['brand', 'Znamka'], ['collection', 'Kolekcija'], ['material', 'Material'], ['color', 'Barva'], ['style', 'Stil'], ['tip', 'Tip artikla'], ['badge', 'Značka']];
const SPEC_SKIP = new Set(['kolekcija', 'color_1', 'material_1', 'stil_1', 'prostor', 'tip_artikla', 'short_description', 'meta_description', 'meta_title']);
const prettify = (k) => { const t = k.replace(/_\d+$/, '').replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };

function Field({ f, v, set }) {
  const [k, label, t = 'text', o = {}] = f;
  if (t === 'bool') return <label className="chk"><input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} /> {label}</label>;
  if (t === 'kv') return <KV label={label} v={v} set={set} />;
  if (t === 'cat') return <CatSelect label={label} v={v} set={set} />;
  if (t === 'sub') return <SubSelect label={label} v={v} set={set} />;
  const common = { value: t === 'lines' ? (v || []).join('\n') : v ?? '', required: o.req };
  const up = async (e) => {
    try {
      const urls = [];
      for (const file of Array.from(e.target.files)) urls.push((await uploadFile(file)).url);
      set(t === 'lines' ? [...(v || []).filter(Boolean), ...urls] : urls[0]);
    } catch (x) { alert(x.message); }
    e.target.value = '';
  };
  return (
    <div>
      <label className="fld"><span>{label}</span>
        {t === 'textarea' || t === 'lines' ? <textarea rows={o.rows || (t === 'lines' ? 6 : 4)} {...common} onChange={(e) => set(t === 'lines' ? e.target.value.split('\n') : e.target.value)} />
          : t === 'select' ? <select {...common} onChange={(e) => set(e.target.value)}>{(o.options || []).map((x) => <option key={x} value={x}>{x || '—'}</option>)}</select>
          : <input type={t} step={t === 'number' ? 'any' : undefined} {...common} onChange={(e) => set(t === 'number' ? (e.target.value === '' ? null : +e.target.value) : e.target.value)} />}
      </label>
      {o.upload && <label className="btn sm up">Naloži {t === 'lines' ? 'slike' : 'sliko'}<input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" multiple={t === 'lines'} onChange={up} /></label>}
    </div>
  );
}

const Sel = ({ label, value, onChange, options }) => (
  <label className="fl"><span>{label}</span>
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">Vse</option>{options.map(([v, n, l]) => <option key={v} value={v}>{l ?? v} ({n})</option>)}
    </select></label>
);

export default function Resource({ name }) {
  const R = RESOURCES[name];
  const isP = name === 'products';
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [fl, setFl] = useState({});      // filters: category, kolekcija, barva, active, attr.<key>
  const [facets, setFacets] = useState(null);
  const [sel, setSel] = useState([]);
  const [ed, setEd] = useState(null);
  const [err, setErr] = useState('');
  const limit = 25;
  const fkey = JSON.stringify(fl);

  const load = () => {
    const p = new URLSearchParams({ page, limit, q });
    Object.entries(fl).forEach(([k, v]) => v && p.set(k, v));
    return api(`/admin/${name}?${p}`).then((d) => { setRows(d.rows); setTotal(d.total); setErr(''); }).catch((e) => setErr(e.message));
  };
  const loadFacets = () => isP && api('/admin/products/facets').then(setFacets).catch(() => {});
  useEffect(() => { setPage(1); setQ(''); setFl({}); setSel([]); setEd(null); }, [name]);
  useEffect(() => { load(); setSel([]); }, [name, page, q, fkey]);
  useEffect(() => { loadFacets(); }, [name]);

  const setF = (k, v) => { setFl({ ...fl, [k]: v }); setPage(1); };
  const idOf = (r) => r[R.pk];
  const open = (id) => api(`/admin/${name}/${encodeURIComponent(id)}`).then((d) => setEd({ isNew: false, data: d })).catch((e) => setErr(e.message));
  const refresh = () => { load(); loadFacets(); };

  const save = async (e) => {
    e.preventDefault(); setErr('');
    const d = { ...ed.data };
    if (Array.isArray(d.media_gallery)) d.media_gallery = d.media_gallery.map((s) => s.trim()).filter(Boolean);
    if (Array.isArray(d.options)) d.options = d.options.map((s) => s.trim()).filter(Boolean);
    try {
      if (ed.isNew) await api(`/admin/${name}`, { method: 'POST', body: d });
      else await api(`/admin/${name}/${encodeURIComponent(ed.data[R.pk])}`, { method: 'PUT', body: d });
      setEd(null); refresh();
    } catch (x) { setErr(x.message); }
  };
  const del = async (id) => { if (confirm('Res želite izbrisati?')) { await api(`/admin/${name}/${encodeURIComponent(id)}`, { method: 'DELETE' }); setEd(null); refresh(); } };
  const copy = async (id) => { try { const r = await api(`/admin/products/${encodeURIComponent(id)}/duplicate`, { method: 'POST', body: {} }); refresh(); open(r.sku); } catch (x) { setErr(x.message); } };
  const bulk = async (skus, action) => {
    if (action === 'delete' && !confirm(`Izbrišem ${skus.length} izdelkov?`)) return;
    try { await api('/admin/products/bulk', { method: 'POST', body: { skus, action } }); setSel([]); refresh(); } catch (x) { setErr(x.message); }
  };

  if (ed) return (
    <form className="card form" onSubmit={save}>
      <h2>{ed.isNew ? 'Nov vnos' : 'Urejanje'} · {R.label}</h2>
      {R.fields.map((f) => (!ed.isNew && f[0] === R.pk && R.pk !== 'id' ? <p key={f[0]} className="muted">{f[1]}: <b>{ed.data[R.pk]}</b></p> : <Field key={f[0]} f={f} v={ed.data[f[0]]} set={(v) => setEd({ ...ed, data: { ...ed.data, [f[0]]: v } })} />))}
      {err && <p className="err">{err}</p>}
      <div className="actions"><button className="btn p">Shrani</button><button type="button" className="btn" onClick={() => { setEd(null); setErr(''); }}>Prekliči</button>
        {isP && !ed.isNew && <button type="button" className="btn" onClick={() => copy(ed.data.sku)}>Kopiraj</button>}
        {!ed.isNew && <button type="button" className="btn danger" onClick={() => del(ed.data[R.pk])}>Izbriši</button>}</div>
    </form>
  );

  const pages = Math.max(1, Math.ceil(total / limit));
  const ids = rows.map(idOf);
  const all = ids.length > 0 && ids.every((i) => sel.includes(i));
  const activeFilters = Object.values(fl).filter(Boolean).length;
  return (
    <div className="card">
      <div className="bar"><h2>{R.label} <small>({total})</small></h2>
        <input className="search" placeholder="Iskanje…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <button className="btn p" onClick={() => setEd({ isNew: true, data: { ...R.blank } })}>+ Dodaj</button></div>

      {isP && facets && (
        <div className="filters">
          <label className="fl"><span>Status</span><select value={fl.active || ''} onChange={(e) => setF('active', e.target.value)}>
            <option value="">Vsi</option><option value="1">Objavljeni ({facets.published})</option><option value="0">Skriti ({facets.hidden})</option></select></label>
          {FILTERS.map(([k, l]) => (facets[k] && facets[k].length ? <Sel key={k} label={l} value={fl[k]} onChange={(v) => setF(k, v)} options={facets[k]} /> : null))}
          {Object.entries(facets.spec || {}).filter(([k]) => !SPEC_SKIP.has(k)).map(([k, opts]) => <Sel key={k} label={prettify(k)} value={fl['attr.' + k]} onChange={(v) => setF('attr.' + k, v)} options={opts} />)}
          {activeFilters > 0 && <button className="btn sm" onClick={() => { setFl({}); setPage(1); }}>Počisti filtre ({activeFilters})</button>}
        </div>
      )}

      {isP && sel.length > 0 && (
        <div className="bulk"><b>Izbrano: {sel.length}</b>
          <button className="btn sm" onClick={() => bulk(sel, 'publish')}>Objavi</button>
          <button className="btn sm" onClick={() => bulk(sel, 'unpublish')}>Skrij (unpublish)</button>
          <button className="btn sm danger" onClick={() => bulk(sel, 'delete')}>Izbriši</button>
          <button className="btn sm" onClick={() => setSel([])}>Prekliči izbiro</button></div>
      )}
      {err && <p className="err">{err}</p>}
      <div className="tw"><table><thead><tr>
        {isP && <th><input type="checkbox" aria-label="Izberi vse" checked={all} onChange={(e) => setSel(e.target.checked ? ids : [])} /></th>}
        {R.head.map((h) => <th key={h}>{h}</th>)}<th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={idOf(r)} className={isP && !r.active ? 'hid' : ''}>
            {isP && <td><input type="checkbox" aria-label={`Izberi ${idOf(r)}`} checked={sel.includes(idOf(r))} onChange={(e) => setSel(e.target.checked ? [...sel, idOf(r)] : sel.filter((x) => x !== idOf(r)))} /></td>}
            {R.cols.map((c) => <td key={c}>{c === 'active' ? <span className={'bdg ' + (r.active ? 'on' : 'off')}>{r.active ? 'Objavljen' : 'Skrit'}</span>
              : typeof r[c] === 'number' && c.startsWith('price') ? r[c].toFixed(2) : String(r[c] ?? '')}</td>)}
            <td className="r">
              <button className="btn sm" onClick={() => open(idOf(r))}>Uredi</button>{' '}
              {isP && <><button className="btn sm" onClick={() => copy(idOf(r))}>Kopiraj</button>{' '}
                <button className="btn sm" onClick={() => bulk([idOf(r)], r.active ? 'unpublish' : 'publish')}>{r.active ? 'Skrij' : 'Objavi'}</button></>}
            </td></tr>))}</tbody></table></div>
      <div className="pg"><button className="btn sm" disabled={page < 2} onClick={() => setPage(page - 1)}>←</button><span>Stran {page} / {pages}</span><button className="btn sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>→</button></div>
    </div>
  );
}
