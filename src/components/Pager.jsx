export default function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let n = 1; n <= pages; n++) if (n === 1 || n === pages || Math.abs(n - page) <= 1) nums.push(n);
  return (
    <nav className="pager" aria-label="Paginacija">
      <button disabled={page < 2} onClick={() => onChange(page - 1)}>←</button>
      {nums.map((n, i) => (
        <span key={n} style={{ display: 'contents' }}>
          {i > 0 && n - nums[i - 1] > 1 && <span>…</span>}
          <button className={n === page ? 'cur' : ''} onClick={() => onChange(n)}>{n}</button>
        </span>
      ))}
      <button disabled={page >= pages} onClick={() => onChange(page + 1)}>→</button>
    </nav>
  );
}
