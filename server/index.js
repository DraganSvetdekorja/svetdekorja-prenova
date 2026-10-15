import express from 'express';
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
try { // minimal .env loader
  for (const l of fs.readFileSync(path.join(here, '.env'), 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {}
const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 4000;
const SECRET = process.env.SESSION_SECRET || (console.warn('! SESSION_SECRET missing: random secret, logins reset on restart'), crypto.randomBytes(32).toString('hex'));

const db = new Database(path.join(here, 'data.db'));
db.pragma('journal_mode = WAL');
// products table changed (new data structure): drop the old one, it is re-imported from public/products.json
if (db.prepare('PRAGMA table_info(products)').all().some((c) => c.name === 'price_vpc')) db.exec('DROP TABLE products');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE, hash TEXT, salt TEXT);
CREATE TABLE IF NOT EXISTS products(sku TEXT PRIMARY KEY, name TEXT, slug TEXT, category_id INTEGER, price REAL, old_price REAL, discount_pct TEXT, badge TEXT, main_image TEXT, media_gallery TEXT DEFAULT '[]', short_description TEXT, description TEXT, meta_title TEXT, meta_description TEXT, brand TEXT, collection TEXT, material TEXT, dimenzija TEXT, width TEXT, in_stock INTEGER DEFAULT 1, featured INTEGER DEFAULT 0, dobavni_rok TEXT, color TEXT, style TEXT, room TEXT, tip TEXT, unit TEXT, dim_label TEXT, spec TEXT DEFAULT '{}', active INTEGER DEFAULT 1, sub TEXT);
CREATE TABLE IF NOT EXISTS subcats(slug TEXT PRIMARY KEY, parent TEXT, name TEXT, position INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE INDEX IF NOT EXISTS ix_p_cat ON products(category_id);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY, name TEXT, slug TEXT, parent TEXT, description TEXT, image TEXT, position INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY, title TEXT, slug TEXT, excerpt TEXT, body TEXT, cover TEXT, published INTEGER DEFAULT 1, created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS attributes(id INTEGER PRIMARY KEY, name TEXT, code TEXT, type TEXT DEFAULT 'select', options TEXT DEFAULT '[]');
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);`);

// ---------- subcategories (Folije, Oprema za dom) ----------
// The export has no subcategories, so products are assigned by rules on the product name; editable per product in the admin ("sub" field).
const SUBCATS = [
  ['folije', 'samolepilne-folije', 'Samolepilne folije'], ['folije', 'transparentne-folije', 'Transparentne folije za steklo'], ['folije', 'funkcijske-folije', 'Funkcijske folije'],
  ['oprema', 'pogrinjki', 'Pogrinjki'], ['oprema', 'protidrsna-podloga', 'Protidrsna podloga'], ['oprema', 'kopalniske-zavese', 'Kopalniške zavese'],
  ['oprema', 'nosilci-za-kopalniske-zavese', 'Nosilci za kopalniške zavese'], ['oprema', 'kopalniske-podloge', 'Kopalniške podloge'], ['oprema', 'podloge-za-umivalnik', 'Podloge za umivalnik'],
  ['oprema', 'utezi-za-prte', 'Uteži za prte'], ['oprema', 'tekstilne-podloge', 'Tekstilne podloge'], ['oprema', 'tepihi', 'Tepihi'], ['oprema', 'tekaci', 'Tekači'],
  ['oprema', 'talne-ploscice', 'Talne ploščice'], ['oprema', 'zascitne-mreze', 'Zaščitne mreže'],
];
const FOLIJE_IDS = [132, 133, 134, 172, 135];
const OPREMA_RULES = [
  ['nosilci-za-kopalniske-zavese', /nosil.*zavese/i], ['kopalniske-zavese', /kopalniška zavesa|kopalniške zavese/i], ['protidrsna-podloga', /protidrsn/i], ['podloge-za-umivalnik', /umivalnik/i],
  ['kopalniske-podloge', /kopalniška podloga/i], ['tekstilne-podloge', /tekstilna podloga/i], ['pogrinjki', /pogrinjek|pogrinjk/i], ['utezi-za-prte', /uteži|utež /i],
  ['tepihi', /(^|\s)tepih/i], ['tekaci', /(^|\s)tekač/i], ['talne-ploscice', /talne ploščice/i], ['zascitne-mreze', /mreža/i],
];
function subOf(name, cat) {
  name = String(name || '');
  if (FOLIJE_IDS.includes(cat)) return /funkcijsk/i.test(name) ? 'funkcijske-folije' : /statik|transparent/i.test(name) ? 'transparentne-folije' : 'samolepilne-folije';
  for (const [slug, re] of OPREMA_RULES) if (re.test(name)) return slug;
  return [181, 192, 194, 185].includes(cat) ? 'kopalniske-podloge' : null;
}
if (!db.prepare('PRAGMA table_info(products)').all().some((c) => c.name === 'sub')) { // database created by an older version
  db.exec('ALTER TABLE products ADD COLUMN sub TEXT');
  const up = db.prepare('UPDATE products SET sub=? WHERE sku=?');
  db.transaction(() => db.prepare('SELECT sku,name,category_id FROM products').all().forEach((r) => up.run(subOf(r.name, r.category_id), r.sku)))();
}
if (!db.prepare('SELECT 1 FROM subcats LIMIT 1').get()) {
  const isub = db.prepare('INSERT INTO subcats(slug,parent,name,position) VALUES(?,?,?,?)');
  SUBCATS.forEach(([parent, slug, name], i) => isub.run(slug, parent, name, i));
  db.prepare("UPDATE products SET sub = NULL WHERE sub IS NULL").run();
}
db.prepare("INSERT OR IGNORE INTO categories(id,name,slug,parent,position,active) VALUES(9001,'Oprema za dom','oprema','oprema',9,1)").run();

// ---------- seed ----------
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
{
  const u = process.env.ADMIN_USER || 'admin', pw = process.env.ADMIN_PASSWORD;
  if (!db.prepare('SELECT 1 FROM users WHERE username=?').get(u)) {
    if (!pw) console.warn('! Set ADMIN_PASSWORD in server/.env to create the admin user');
    else { const salt = crypto.randomBytes(16).toString('hex'); db.prepare('INSERT INTO users(username,hash,salt) VALUES(?,?,?)').run(u, hashPw(pw, salt), salt); console.log('Admin user created:', u); }
  }
  // categories = storefront groups; ids are the Magento category ids found in the product data (names inferred from product names – rename in admin)
  const GROUPS = [
    ['tapete', 'Tapete', [141, 165, 205, 163, 146, 176]], ['fototapete', 'Fototapete', [138, 226]], ['folije', 'Samolepilne folije', [132, 133, 134, 172, 135]],
    ['nalepke', 'Stenske nalepke', [137, 177]], ['slike', 'Slike na platnu', [214, 254]], ['posterji', 'Posterji', [255]], ['bordure', 'Bordure', [164]],
    ['predpraznik', 'Predpražniki', [157]], ['trava', 'Umetna trava', [171]], ['kopalnica', 'Kopalnica', [181, 174, 159, 192, 194, 185, 187, 161]],
    ['namizni', 'Namizni prti in pogrinjki', [183, 197, 184, 191, 189, 196, 198, 160, 175]], ['tekaci', 'Tekači in tepihi', [188, 222]], ['lepila', 'Lepila in pripomočki', [151]],
  ];
  if (!db.prepare('SELECT 1 FROM categories WHERE id > 100 AND id < 9000 LIMIT 1').get()) {
    db.exec('DELETE FROM categories WHERE id < 9000');
    const ic = db.prepare('INSERT OR REPLACE INTO categories(id,name,slug,parent,position,active) VALUES(?,?,?,?,?,1)');
    GROUPS.forEach(([slug, name, ids], i) => ids.forEach((id) => ic.run(id, name, slug, slug, i)));
  }
  if (!db.prepare('SELECT 1 FROM products LIMIT 1').get()) {
    try {
      const list = JSON.parse(fs.readFileSync(path.join(here, '../public/products.json'), 'utf8'));
      const ins = db.prepare('INSERT OR REPLACE INTO products(sku,name,slug,category_id,price,old_price,discount_pct,badge,main_image,media_gallery,short_description,description,meta_title,meta_description,brand,collection,material,dimenzija,width,in_stock,featured,dobavni_rok,color,style,room,tip,unit,dim_label,spec,sub) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      const sv = (x, k) => { const v = x.spec && x.spec[k]; return v && v.value_label != null ? String(v.value_label) : ''; };
      db.transaction(() => list.forEach((x) => {
        const cat = x.categoryId ?? (/foto/i.test(x.name) ? 138 : /tapet/i.test(x.name) ? 141 : null); // 300 products have no category
        const color = sv(x, 'color_1'), old = x.specialPrice > x.price ? x.specialPrice : null;  // in the export `price` is the sale price and `specialPrice` the regular one
        ins.run(x.sku, x.name, x.slug, cat, x.price, old, x.discount_pct, x.badge, x.mainImage, JSON.stringify(x.media_gallery || []), x.short_description, x.description, x.metaTitle, x.metaDescription, x.brand, x.collection || sv(x, 'kolekcija') || null, x.material, x.dimenzija, x.width, x.inStock ? 1 : 0, x.featured ? 1 : 0, x.dobavni_rok, color === '0' ? '' : color, sv(x, 'stil_1'), sv(x, 'prostor'), sv(x, 'tip_artikla'), sv(x, 'enota'), sv(x, 'dimenzija'), JSON.stringify(x.spec || {}), subOf(x.name, cat));
      }))();
      console.log('Imported', list.length, 'products');
    } catch (e) { console.warn('Product import skipped (put the export into public/products.json):', e.message); }
  }
  if (!db.prepare('SELECT 1 FROM attributes LIMIT 1').get()) {
    [['Barva', 'barva', ['Bež', 'Črna', 'Modra', 'Rjava', 'Zlata', 'Zelena', 'Siva', 'Rdeča', 'Bela', 'Rumena']], ['Slog', 'slog', ['Skandinavski', 'Boho', 'Art Deco', 'Barok']], ['Prostor', 'prostor', ['Dnevna soba', 'Spalnica', 'Kuhinja', 'Pisarna']], ['Material', 'material', ['Flis', 'Papir', 'Vinil']]]
      .forEach(([n, c, o]) => db.prepare('INSERT INTO attributes(name,code,type,options) VALUES(?,?,?,?)').run(n, c, 'select', JSON.stringify(o)));
  }
}
const DEFAULT_ORDER = ['hero', 'usps', 'categories', 'styles', 'colors', 'new', 'bestsellers', 'versace', 'cosmo', 'folije', 'collections', 'featured', 'brands', 'newsletter', 'social', 'news', 'blog'];

// ---------- auth (scrypt password + signed httpOnly cookie) ----------
const b64 = (b) => Buffer.from(b).toString('base64url');
const sign = (p) => { const body = b64(JSON.stringify(p)); return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); };
function verify(tok) {
  if (!tok || !tok.includes('.')) return null;
  const [body, mac] = tok.split('.');
  const good = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (mac.length !== good.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
const cookie = (req, n) => (req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).find(([k]) => k === n)?.[1];
const auth = (req, res, next) => { const s = verify(cookie(req, 'sd_admin')); if (!s) return res.status(401).json({ error: 'Ni prijave' }); req.user = s.u; next(); };
const tries = new Map();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' }); next(); });
// ---- media library (admin only): raw image upload, stored in server/uploads ----
const uploads = path.join(here, 'uploads');
fs.mkdirSync(uploads, { recursive: true });
app.use('/uploads', express.static(uploads, { maxAge: '7d' }));
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }; // no SVG (can carry scripts)
app.post('/api/admin/media', auth, express.raw({ type: Object.keys(EXT), limit: '10mb' }), (req, res) => {
  const ext = EXT[String(req.headers['content-type'] || '').split(';')[0]];
  if (!ext || !Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'Dovoljene so slike JPG, PNG, WebP ali GIF (do 10 MB)' });
  let base = 'slika';
  try { base = decodeURIComponent(String(req.headers['x-filename'] || 'slika')); } catch {}
  base = base.replace(/\.[^.]+$/, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 60) || 'slika';
  const name = `${Date.now().toString(36)}-${base}.${ext}`;
  fs.writeFileSync(path.join(uploads, name), req.body);
  res.json({ url: `/uploads/${name}`, name });
});
app.get('/api/admin/media', auth, (req, res) => res.json(fs.readdirSync(uploads).filter((f) => /\.(jpe?g|png|webp|gif)$/.test(f)).map((f) => { const st = fs.statSync(path.join(uploads, f)); return { name: f, url: '/uploads/' + f, size: st.size, time: st.mtimeMs }; }).sort((a, b) => b.time - a.time)));
app.delete('/api/admin/media/:name', auth, (req, res) => { try { fs.unlinkSync(path.join(uploads, path.basename(req.params.name))); } catch {} res.json({ ok: true }); });

// state-changing requests must be JSON (blocks cross-site form posts) – cookie is SameSite=Strict as well
app.use((req, res, next) => (req.method !== 'GET' && req.method !== 'HEAD' && !req.is('application/json') ? res.status(415).json({ error: 'JSON only' }) : next()));

app.post('/api/login', (req, res) => {
  const k = req.ip, t = tries.get(k) || { n: 0, at: Date.now() };
  if (Date.now() - t.at > 15 * 60e3) { t.n = 0; t.at = Date.now(); }
  if (t.n >= 5) return res.status(429).json({ error: 'Preveč poskusov. Poskusite čez 15 minut.' });
  const { username = '', password = '' } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(String(username));
  const ok = u && crypto.timingSafeEqual(Buffer.from(hashPw(String(password), u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
  if (!ok) { t.n++; tries.set(k, t); return res.status(401).json({ error: 'Napačno uporabniško ime ali geslo' }); }
  tries.delete(k);
  res.set('Set-Cookie', `sd_admin=${sign({ u: u.username, exp: Date.now() + 8 * 3600e3 })}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${PROD ? '; Secure' : ''}`);
  res.json({ username: u.username });
});
app.post('/api/logout', (req, res) => { res.set('Set-Cookie', 'sd_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/admin/me', auth, (req, res) => res.json({ username: req.user }));
app.post('/api/admin/password', auth, (req, res) => {
  const { old = '', next = '' } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(req.user);
  if (!u || hashPw(String(old), u.salt) !== u.hash) return res.status(400).json({ error: 'Staro geslo ni pravilno' });
  if (String(next).length < 10) return res.status(400).json({ error: 'Novo geslo naj ima vsaj 10 znakov' });
  const salt = crypto.randomBytes(16).toString('hex');
  db.prepare('UPDATE users SET hash=?, salt=? WHERE id=?').run(hashPw(String(next), salt), salt, u.id);
  res.json({ ok: true });
});
app.get('/api/admin/stats', auth, (req, res) => res.json(Object.fromEntries(['products', 'categories', 'posts', 'attributes'].map((t) => [t, db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n]))));

let slim = null; // cached slim product list for the storefront (invalidated by any admin write)
app.use('/api/admin', (req, res, next) => { if (req.method !== 'GET') res.on('finish', () => { slim = null; }); next(); });

// ---------- generic CRUD (admin only) ----------
function crud(name, table, pk, cols, { search = [], json = [], filters = {} } = {}) {
  const A = '/api/admin/' + name;
  const parse = (r) => { if (r) json.forEach((c) => { try { r[c] = JSON.parse(r[c]); } catch { r[c] = c === 'spec' ? {} : []; } }); return r; };
  const clean = (b) => Object.fromEntries(cols.filter((c) => c in b).map((c) => [c, json.includes(c) ? JSON.stringify(b[c]) : typeof b[c] === 'boolean' ? +b[c] : b[c]]));
  app.get(A, auth, (req, res) => {
    const conds = [], params = {};
    let i = 0;
    if (req.query.q && search.length) { conds.push('(' + search.map((c) => `${c} LIKE @q`).join(' OR ') + ')'); params.q = `%${req.query.q}%`; }
    for (const [k, expr] of Object.entries(filters)) { const v = req.query[k]; if (v !== undefined && v !== '') { conds.push(`${expr} = @f${i}`); params['f' + i++] = String(v); } }
    for (const [k, v] of Object.entries(req.query)) { // characteristics: ?attr.dimenzija=61
      const m = k.match(/^attr\.([A-Za-z0-9_]+)$/);
      if (m && v !== '' && json.includes('spec')) { conds.push(`json_extract(spec,'$.${m[1]}.value_label') = @f${i}`); params['f' + i++] = String(v); }
    }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const page = Math.max(1, +req.query.page || 1), limit = Math.min(100, +req.query.limit || 25);
    const total = db.prepare(`SELECT COUNT(*) n FROM ${table} ${where}`).get(params).n;
    const rows = db.prepare(`SELECT * FROM ${table} ${where} ORDER BY rowid DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`).all(params).map(parse);
    res.json({ rows, total });
  });
  app.get(A + '/:id', auth, (req, res) => { const r = db.prepare(`SELECT * FROM ${table} WHERE ${pk}=?`).get(req.params.id); r ? res.json(parse(r)) : res.status(404).json({ error: 'Ni najdeno' }); });
  app.post(A, auth, (req, res) => {
    try { const o = clean(req.body || {}), k = Object.keys(o); const info = db.prepare(`INSERT INTO ${table}(${k.join(',')}) VALUES(${k.map((x) => '@' + x).join(',')})`).run(o); res.json({ id: o[pk] ?? info.lastInsertRowid }); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });
  app.put(A + '/:id', auth, (req, res) => {
    try { const o = clean(req.body || {}); delete o[pk]; const k = Object.keys(o); db.prepare(`UPDATE ${table} SET ${k.map((x) => `${x}=@${x}`).join(',')} WHERE ${pk}=@__id`).run({ ...o, __id: req.params.id }); res.json({ ok: true }); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });
  app.delete(A + '/:id', auth, (req, res) => { db.prepare(`DELETE FROM ${table} WHERE ${pk}=?`).run(req.params.id); res.json({ ok: true }); });
}
// ---- products: filter values, bulk publish/unpublish/delete, duplicate (declared before the generic :id routes) ----
app.get('/api/admin/products/facets', auth, (req, res) => {
  const col = (c) => db.prepare(`SELECT ${c} v, COUNT(*) n FROM products WHERE ${c} IS NOT NULL AND ${c} != '' GROUP BY ${c} ORDER BY n DESC LIMIT 300`).all().map((r) => [r.v, r.n]);
  const spec = {};
  for (const r of db.prepare("SELECT j.key k, json_extract(j.value,'$.value_label') v, COUNT(*) n FROM products p, json_each(p.spec) j GROUP BY k, v").all()) if (r.v != null && r.v !== '' && r.v !== '0') (spec[r.k] ||= []).push([String(r.v), r.n]);
  for (const k of Object.keys(spec)) { spec[k].sort((a, b) => b[1] - a[1]); if (spec[k].length > 300) delete spec[k]; }
  const st = Object.fromEntries(db.prepare('SELECT active a, COUNT(*) n FROM products GROUP BY active').all().map((r) => [r.a, r.n]));
  res.json({
    category_id: db.prepare('SELECT p.category_id v, COUNT(*) n, c.name label FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.category_id IS NOT NULL GROUP BY p.category_id ORDER BY n DESC').all().map((r) => [r.v, r.n, `${r.label || 'Kategorija'} (${r.v})`]),
    sub: db.prepare('SELECT p.sub v, COUNT(*) n, s.name label FROM products p JOIN subcats s ON s.slug = p.sub GROUP BY p.sub ORDER BY n DESC').all().map((r) => [r.v, r.n, r.label]), brand: col('brand'), collection: col('collection'), material: col('material'), color: col('color'), style: col('style'), tip: col('tip'), badge: col('badge'),
    spec, published: st[1] || 0, hidden: st[0] || 0,
  });
});
app.post('/api/admin/products/bulk', auth, (req, res) => {
  const { skus, action } = req.body || {};
  if (!Array.isArray(skus) || !skus.length || skus.length > 2000 || !['publish', 'unpublish', 'delete'].includes(action)) return res.status(400).json({ error: 'Neveljavna zahteva' });
  const st = action === 'delete' ? db.prepare('DELETE FROM products WHERE sku=?') : db.prepare('UPDATE products SET active=? WHERE sku=?');
  db.transaction(() => skus.forEach((k) => (action === 'delete' ? st.run(String(k)) : st.run(action === 'publish' ? 1 : 0, String(k)))))();
  res.json({ ok: true, count: skus.length });
});
app.post('/api/admin/products/:sku/duplicate', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM products WHERE sku=?').get(req.params.sku);
  if (!r) return res.status(404).json({ error: 'Ni najdeno' });
  let n = 1, sku;
  do { sku = `${r.sku}-KOPIJA${n > 1 ? n : ''}`; n++; } while (db.prepare('SELECT 1 FROM products WHERE sku=?').get(sku));
  const o = { ...r, sku, name: `${r.name} (kopija)`, active: 0 }; // copies start as hidden drafts
  const k = Object.keys(o);
  db.prepare(`INSERT INTO products(${k.join(',')}) VALUES(${k.map((x) => '@' + x).join(',')})`).run(o);
  res.json({ sku });
});
crud('products', 'products', 'sku', ['sku', 'name', 'slug', 'category_id', 'price', 'old_price', 'discount_pct', 'badge', 'main_image', 'media_gallery', 'short_description', 'description', 'meta_title', 'meta_description', 'brand', 'collection', 'material', 'dimenzija', 'width', 'in_stock', 'featured', 'dobavni_rok', 'color', 'style', 'room', 'tip', 'unit', 'dim_label', 'spec', 'sub', 'active'], { search: ['sku', 'name', 'collection', 'brand'], json: ['media_gallery', 'spec'], filters: { sub: 'sub', category_id: 'category_id', brand: 'brand', collection: 'collection', material: 'material', color: 'color', style: 'style', tip: 'tip', badge: 'badge', featured: 'CAST(featured AS TEXT)', in_stock: 'CAST(in_stock AS TEXT)', active: 'CAST(active AS TEXT)' } });
crud('subcategories', 'subcats', 'slug', ['slug', 'parent', 'name', 'position', 'active'], { search: ['name', 'slug'] });
crud('categories', 'categories', 'id', ['name', 'slug', 'parent', 'description', 'image', 'position', 'active'], { search: ['name'] });
crud('posts', 'posts', 'id', ['title', 'slug', 'excerpt', 'body', 'cover', 'published'], { search: ['title'] });
crud('attributes', 'attributes', 'id', ['name', 'code', 'type', 'options'], { search: ['name', 'code'], json: ['options'] });

// ---------- front page layout (page builder) ----------
const getLayout = () => { try { return JSON.parse(db.prepare("SELECT value FROM settings WHERE key='layout'").get().value); } catch { return { order: DEFAULT_ORDER, hidden: [] }; } };
app.get('/api/public/layout', (req, res) => res.json(getLayout()));
app.get('/api/admin/layout', auth, (req, res) => res.json(getLayout()));
app.put('/api/admin/layout', auth, (req, res) => {
  const { order, hidden, props = {} } = req.body || {};
  if (![order, hidden].every((a) => Array.isArray(a) && a.every((s) => typeof s === 'string'))) return res.status(400).json({ error: 'Neveljaven format' });
  db.prepare("INSERT INTO settings(key,value) VALUES('layout',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify({ order, hidden, props: Object.fromEntries(Object.entries(props || {}).filter(([, v]) => v && typeof v.title === 'string').map(([k, v]) => [k, { title: v.title.slice(0, 120) }])) }));
  res.json({ ok: true });
});

// ---------- public API for the storefront (read only) ----------
const buildSlim = () => {
  const rows = db.prepare('SELECT p.sku,p.name,p.slug,p.category_id,p.price,p.old_price,p.discount_pct,p.badge,p.main_image,p.media_gallery,p.brand,p.collection,p.material,p.color,p.style,p.room,p.tip,p.unit,p.dim_label,p.dobavni_rok,p.in_stock,COALESCE(sc.parent, c.slug) AS grp, p.sub FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN subcats sc ON sc.slug = p.sub WHERE p.active = 1').all();
  const list = rows.map((r) => {
    let g = []; try { g = JSON.parse(r.media_gallery || '[]'); } catch {}
    const image = r.main_image || g[0] || '';
    return { sku: r.sku, name: r.name, slug: r.slug, grp: r.grp, sub: r.sub || '', categoryId: r.category_id, price: r.price, oldPrice: r.old_price, discount: r.discount_pct, badge: r.badge, brand: r.brand, collection: r.collection, material: r.material, color: r.color, style: r.style, room: r.room, tip: r.tip, unit: r.unit, dim: r.dim_label, delivery: r.dobavni_rok, stock: !!r.in_stock, image, image2: g.find((u) => u !== image) || '' };
  });
  const json = JSON.stringify(list);
  slim = { json, gz: zlib.gzipSync(json) };
};
app.get('/api/public/products', (req, res) => { // slim list (no descriptions) – full record: /api/public/product/:sku
  if (!slim) buildSlim();
  res.set({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60', Vary: 'Accept-Encoding' });
  if (/gzip/.test(req.headers['accept-encoding'] || '')) { res.set('Content-Encoding', 'gzip'); return res.send(slim.gz); }
  res.send(slim.json);
});
app.get('/api/public/product/:sku', (req, res) => {
  const r = db.prepare('SELECT * FROM products WHERE sku = ? AND active = 1').get(req.params.sku);
  if (!r) return res.status(404).json({ error: 'Ni najdeno' });
  let g = [], spec = {}; try { g = JSON.parse(r.media_gallery || '[]'); } catch {} try { spec = JSON.parse(r.spec || '{}'); } catch {}
  const hide = new Set(['short_description', 'meta_description', 'meta_title', 'pattern_type']);
  res.json({ sku: r.sku, images: g.length ? g : r.main_image ? [r.main_image] : [], shortHtml: r.short_description || '', descHtml: r.description || '', metaTitle: r.meta_title || '', specList: Object.entries(spec).filter(([k, v]) => !hide.has(k) && v && v.value_label != null && String(v.value_label) !== '' && String(v.value_label) !== '0').map(([k, v]) => ({ key: k, label: v.label || k, value: String(v.value_label) })) });
});
app.get('/api/public/groups', (req, res) => {
  const names = db.prepare('SELECT slug, MIN(name) name, MIN(position) pos FROM categories WHERE active = 1 GROUP BY slug ORDER BY pos').all();
  const counts = db.prepare('SELECT COALESCE(sc.parent, c.slug) g, COUNT(*) n FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN subcats sc ON sc.slug = p.sub WHERE p.active = 1 GROUP BY g').all();
  res.json(names.map((g) => ({ slug: g.slug, name: g.name, n: counts.find((c) => c.g === g.slug)?.n || 0 })));
});
app.get('/api/public/subcategories', (req, res) => res.json(db.prepare('SELECT s.slug, s.parent, s.name, COUNT(p.sku) n FROM subcats s LEFT JOIN products p ON p.sub = s.slug AND p.active = 1 WHERE s.active = 1 GROUP BY s.slug ORDER BY s.position').all()));
app.get('/api/public/posts', (req, res) => res.json(db.prepare('SELECT id,title,slug,excerpt,cover,created FROM posts WHERE published=1 ORDER BY id DESC LIMIT 12').all()));
app.get('/api/public/categories', (req, res) => res.json(db.prepare('SELECT id,name,slug,parent,image FROM categories WHERE active=1 ORDER BY position').all()));

// ---------- static: admin at /admin, storefront at / (after `npm run build`) ----------
const adminDist = path.join(here, '../admin/dist'), shopDist = path.join(here, '../dist');
if (fs.existsSync(adminDist)) { app.use('/admin', express.static(adminDist)); app.get('/admin/*', (q, s) => s.sendFile(path.join(adminDist, 'index.html'))); }
if (fs.existsSync(shopDist)) { app.use(express.static(shopDist)); app.get(/^\/(?!api).*/, (q, s) => s.sendFile(path.join(shopDist, 'index.html'))); }
if (!fs.existsSync(shopDist)) app.get('/', (q, s) => s.type('html').send('<h2>Svet Dekorja API deluje ✓</h2><p>To je samo API (port ' + PORT + '). Admin (razvoj): <a href="http://localhost:5174/admin/">http://localhost:5174/admin/</a> · Trgovina (razvoj): <a href="http://localhost:5173">http://localhost:5173</a><br>Test API: <a href="/api/public/layout">/api/public/layout</a></p>'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Ni najdeno' }));

app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
