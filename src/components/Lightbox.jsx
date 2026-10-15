import { useCallback, useEffect, useRef } from 'react';

export default function Lightbox({ images, index, onIndex, onClose, alt }) {
  const n = images.length;
  const touch = useRef(null);
  const prev = useCallback(() => onIndex((index - 1 + n) % n), [index, n, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % n), [index, n, onIndex]);

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', key);
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = old; };
  }, [onClose, prev, next]);

  // preload neighbours so arrows feel instant
  useEffect(() => {
    [(index + 1) % n, (index - 1 + n) % n].forEach((i) => { const im = new Image(); im.src = images[i]; });
  }, [index, n, images]);

  const onTouchEnd = (e) => {
    if (touch.current == null) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
  };

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label="Povečana slika" onClick={onClose}>
      <button className="lb-x" onClick={onClose} aria-label="Zapri">×</button>
      {n > 1 && <button className="lb-nav l" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Prejšnja slika">‹</button>}
      <figure
        className="lb-fig"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={onTouchEnd}
      >
        <img key={images[index]} src={images[index]} alt={alt} />
        <figcaption>{index + 1} / {n}</figcaption>
      </figure>
      {n > 1 && <button className="lb-nav r" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Naslednja slika">›</button>}
    </div>
  );
}
