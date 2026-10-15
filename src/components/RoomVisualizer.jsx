import { useEffect, useRef, useState } from 'react';

const N = 10; // grid subdivision for the perspective warp
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// unit square -> quad (TL, TR, BR, BL) perspective mapping
function homography(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = den ? (dx3 * dy2 - dx2 * dy3) / den : 0;
  const h = den ? (dx1 * dy3 - dx3 * dy1) / den : 0;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return (u, v) => { const w = g * u + h * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w]; };
}

// draw one textured triangle (affine) from source image coords s to canvas coords d
function tri(ctx, img, s, d) {
  const [[u0, v0], [u1, v1], [u2, v2]] = s, [[x0, y0], [x1, y1], [x2, y2]] = d;
  const det = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
  if (!det) return;
  const a = (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / det;
  const c = (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / det;
  const b = (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / det;
  const dd = (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / det;
  const cx = (x0 + x1 + x2) / 3, cy = (y0 + y1 + y2) / 3;
  ctx.save();
  ctx.beginPath();
  [[x0, y0], [x1, y1], [x2, y2]].forEach(([x, y], i) => {
    const px = x + Math.sign(x - cx) * 0.7, py = y + Math.sign(y - cy) * 0.7; // tiny overlap hides seams
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, dd, x0 - a * u0 - c * v0, y0 - b * u0 - dd * v0);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

export default function RoomVisualizer({ p, onClose }) {
  const canvas = useRef(null);
  const drag = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [tex, setTex] = useState(null);
  const [texErr, setTexErr] = useState(false);
  const [pts, setPts] = useState([]);
  const [scale, setScale] = useState(360);
  const [opacity, setOpacity] = useState(0.9);
  const [handles, setHandles] = useState(true);

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = old; };
  }, [onClose]);

  useEffect(() => { // wallpaper texture
    const im = new Image();
    im.onload = () => setTex(im);
    im.onerror = () => setTexErr(true);
    im.src = p.images[0] || '';
  }, [p]);

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      setPhoto(im);
      const W = im.naturalWidth, H = im.naturalHeight;
      setPts([[W * .15, H * .12], [W * .85, H * .12], [W * .85, H * .72], [W * .15, H * .72]]);
    };
    im.src = url;
  };

  useEffect(() => {
    const c = canvas.current; if (!c || !photo) return;
    const max = 1400, k = Math.min(1, max / photo.naturalWidth);
    c.width = Math.round(photo.naturalWidth * k); c.height = Math.round(photo.naturalHeight * k);
    const ctx = c.getContext('2d');
    ctx.drawImage(photo, 0, 0, c.width, c.height);
    const q = pts.map(([x, y]) => [x * k, y * k]);
    if (tex && q.length === 4) {
      // 1) tiled wallpaper texture
      const T = 1024, tc = document.createElement('canvas'); tc.width = tc.height = T;
      const tile = document.createElement('canvas'); tile.width = Math.max(8, scale); tile.height = Math.max(8, Math.round(scale * tex.naturalHeight / tex.naturalWidth));
      tile.getContext('2d').drawImage(tex, 0, 0, tile.width, tile.height);
      const tctx = tc.getContext('2d'); tctx.fillStyle = tctx.createPattern(tile, 'repeat'); tctx.fillRect(0, 0, T, T);
      // 2) warp onto the wall quad
      const wc = document.createElement('canvas'); wc.width = c.width; wc.height = c.height;
      const wctx = wc.getContext('2d'), H = homography(q);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const u0 = i / N, u1 = (i + 1) / N, v0 = j / N, v1 = (j + 1) / N;
        const d00 = H(u0, v0), d10 = H(u1, v0), d11 = H(u1, v1), d01 = H(u0, v1);
        const s = (u, v) => [u * T, v * T];
        tri(wctx, tc, [s(u0, v0), s(u1, v0), s(u1, v1)], [d00, d10, d11]);
        tri(wctx, tc, [s(u0, v0), s(u1, v1), s(u0, v1)], [d00, d11, d01]);
      }
      // 3) multiply keeps the room's light and shadows
      ctx.save(); ctx.globalAlpha = opacity; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(wc, 0, 0); ctx.restore();
    }
    if (handles && q.length === 4) {
      ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.setLineDash([8, 6]); ctx.beginPath();
      q.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      q.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fillStyle = '#7c5cd6'; ctx.fill(); ctx.stroke(); });
    }
  }, [photo, tex, pts, scale, opacity, handles]);

  const pos = (e) => { // pointer -> original photo coordinates
    const c = canvas.current, r = c.getBoundingClientRect(), k = photo.naturalWidth / r.width;
    return [(e.clientX - r.left) * k, (e.clientY - r.top) * k, k];
  };
  const down = (e) => {
    if (!photo) return;
    const [x, y, k] = pos(e);
    const i = pts.findIndex((q) => Math.hypot(q[0] - x, q[1] - y) < 30 * k);
    if (i >= 0) { drag.current = i; canvas.current.setPointerCapture(e.pointerId); }
  };
  const move = (e) => {
    if (drag.current == null) return;
    const [x, y] = pos(e);
    setPts((cur) => cur.map((q, i) => (i === drag.current ? [clamp(x, 0, photo.naturalWidth), clamp(y, 0, photo.naturalHeight)] : q)));
  };

  return (
    <div className="rv" role="dialog" aria-modal="true" aria-label="Vizualizacija v vaši sobi">
      <div className="rv-box">
        <div className="rv-head"><b>Vizualizacija: {p.name}</b><button className="x" onClick={onClose} aria-label="Zapri">×</button></div>
        <div className="rv-body">
          <div className="rv-stage">
            {!photo ? (
              <label className="rv-drop">
                <input type="file" accept="image/*" onChange={onFile} hidden />
                <b>Naložite fotografijo svoje sobe</b>
                <span>Najbolje deluje fotografija stene, posneta čelno.</span>
                <em>Izberi fotografijo</em>
              </label>
            ) : (
              <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} />
            )}
          </div>
          <div className="rv-side">
            <ol>
              <li>Naložite fotografijo sobe.</li>
              <li>Povlecite 4 vijolične točke na vogale stene.</li>
              <li>Prilagodite velikost vzorca in prosojnost.</li>
            </ol>
            {texErr && <p className="cwarn">Slike vzorca ni bilo mogoče naložiti.</p>}
            <label className="cf"><span>Velikost vzorca</span><input type="range" min="120" max="900" value={scale} onChange={(e) => setScale(+e.target.value)} /></label>
            <label className="cf"><span>Intenzivnost</span><input type="range" min="0.3" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)} /></label>
            <label className="cf chk"><input type="checkbox" checked={handles} onChange={(e) => setHandles(e.target.checked)} /> Prikaži oznake vogalov</label>
            <label className="b" style={{ display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <input type="file" accept="image/*" onChange={onFile} hidden />{photo ? 'Zamenjaj fotografijo' : 'Naloži fotografijo'}
            </label>
            <small>Fotografija ostane v vašem brskalniku in se ne pošilja na strežnik.</small>
          </div>
        </div>
      </div>
    </div>
  );
}
