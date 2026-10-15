import { useEffect, useRef } from 'react';
import { COLOR_BG, slugify } from '../data.js';

export default function FilterDrawer({ open, focus, onClose, groups, active, onToggle, onClear, total }) {
  const body = useRef(null);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && body.current) {
      const t = focus && body.current.querySelector(`#grp-${focus}`);
      if (t) body.current.scrollTop = t.offsetTop - 8; else body.current.scrollTop = 0;
    }
  }, [open, focus]);
  return (
    <>
      <div className={`ov${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`dr${open ? ' on' : ''}`} aria-hidden={!open} aria-label="Filtri">
        <div className="dh"><b>Filtri</b><button className="x" onClick={onClose} aria-label="Zapri">×</button></div>
        <div className="db" ref={body}>
          {groups.map((g) => (
            <section key={g.key}>
              <h4 id={`grp-${g.key}`}>{g.label}</h4>
              {g.key === 'barvaf' ? (
                <>
                  <div className="swgrid" role="group" aria-label="Barva">
                    {g.options.map(([v, c]) => {
                      const on = active[g.key].includes(v), bg = COLOR_BG[slugify(v)];
                      return (
                        <button key={v} type="button" className={'sw2' + (on ? ' on' : '') + (bg ? '' : ' unk')} style={bg ? { background: bg } : undefined}
                          title={`${v} (${c})`} aria-label={`${v} (${c})`} aria-pressed={on} onClick={() => onToggle(g.key, v)} />
                      );
                    })}
                  </div>
                  {active[g.key].length > 0 && <p className="swsel">Izbrano: {active[g.key].join(', ')}</p>}
                </>
              ) : (
                g.options.map(([v, c]) => (
                  <label className="o" key={v}>
                    <input type="checkbox" checked={active[g.key].includes(v)} onChange={() => onToggle(g.key, v)} /> {v}<em>{c}</em>
                  </label>
                ))
              )}
            </section>
          ))}
        </div>
        <div className="df">
          <button className="b" onClick={onClear}>Počisti</button>
          <button className="b p" onClick={onClose}>Pokaži {total} izdelkov</button>
        </div>
      </aside>
    </>
  );
}
