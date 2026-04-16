import { useEffect, useState, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Module-level state — survives component re-renders and route changes
// ---------------------------------------------------------------------------
const stats = {}; // { '/view-master': { reads: 0, writes: 0, deletes: 0 } }
const listeners = new Set();

function countDocs(data) {
  if (Array.isArray(data)) return data.length;
  if (data && Array.isArray(data.data)) return data.data.length;
  if (data && Array.isArray(data.rows)) return data.rows.length;
  if (data && Array.isArray(data.logs)) return data.logs.length;
  if (data && Array.isArray(data.items)) return data.items.length;
  if (data && Array.isArray(data.records)) return data.records.length;
  if (data && typeof data === 'object') return 1;
  return 1;
}

function updateStats(page, type, count) {
  if (!stats[page]) stats[page] = { reads: 0, writes: 0, deletes: 0 };
  stats[page][type] += count;
  listeners.forEach((fn) => fn({ ...stats }));
}

function resetStats() {
  Object.keys(stats).forEach((k) => delete stats[k]);
  listeners.forEach((fn) => fn({ ...stats }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FirebaseMonitor() {
  const [open, setOpen] = useState(true);
  const [snapshot, setSnapshot] = useState({});
  const [currentPage, setCurrentPage] = useState(window.location.pathname);

  // pos: { x, y } in px from top-left, or null to use default bottom-right
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem('fb-monitor-pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const panelRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, startPosX, startPosY }
  const origFetchRef = useRef(null);

  // Track current page on navigation
  useEffect(() => {
    const onNav = () => setCurrentPage(window.location.pathname);
    window.addEventListener('popstate', onNav);
    const interval = setInterval(() => {
      setCurrentPage((prev) => {
        const next = window.location.pathname;
        return prev !== next ? next : prev;
      });
    }, 300);
    return () => {
      window.removeEventListener('popstate', onNav);
      clearInterval(interval);
    };
  }, []);

  // Subscribe to stats updates
  useEffect(() => {
    const handler = (s) => setSnapshot({ ...s });
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  // Intercept window.fetch
  useEffect(() => {
    const orig = window.fetch;
    origFetchRef.current = orig;

    window.fetch = async (...args) => {
      const res = await orig(...args);
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (url.includes('/api/')) {
        const page = window.location.pathname;
        const method = (args[1]?.method || 'GET').toUpperCase();
        const type =
          method === 'GET' ? 'reads' : method === 'DELETE' ? 'deletes' : 'writes';
        try {
          const data = await res.clone().json();
          updateStats(page, type, countDocs(data));
        } catch {
          updateStats(page, type, 1);
        }
      }
      return res;
    };

    return () => {
      window.fetch = origFetchRef.current;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Drag logic using pointer events
  // -------------------------------------------------------------------------
  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    let newX = dragRef.current.startPosX + dx;
    let newY = dragRef.current.startPosY + dy;

    // Clamp to viewport so the card can't be dragged fully off-screen
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = panelRef.current?.offsetWidth || 380;
    const ph = panelRef.current?.offsetHeight || 200;
    newX = Math.max(0, Math.min(newX, vw - pw));
    newY = Math.max(0, Math.min(newY, vh - ph));

    setPos({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    // Persist position across navigation
    setPos((current) => {
      if (current) {
        try { localStorage.setItem('fb-monitor-pos', JSON.stringify(current)); } catch {}
      }
      return current;
    });
  }, [handlePointerMove]);

  const handlePointerDown = useCallback((e) => {
    // Only drag on left-click; ignore clicks on buttons
    if (e.button !== 0 || e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: rect.left,
      startPosY: rect.top,
    };
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove, handlePointerUp]);

  // -------------------------------------------------------------------------
  // Compute table rows
  // -------------------------------------------------------------------------
  const pages = Object.keys(snapshot).sort();
  const totalReads = pages.reduce((s, p) => s + snapshot[p].reads, 0);
  const totalWrites = pages.reduce((s, p) => s + snapshot[p].writes, 0);
  const totalDeletes = pages.reduce((s, p) => s + snapshot[p].deletes, 0);

  // -------------------------------------------------------------------------
  // Styles
  // -------------------------------------------------------------------------
  const panel = pos
    ? { position: 'fixed', top: pos.y, left: pos.x, zIndex: 99999, fontFamily: 'monospace', fontSize: 12, userSelect: 'none' }
    : { position: 'fixed', bottom: 16, right: 16, zIndex: 99999, fontFamily: 'monospace', fontSize: 12, userSelect: 'none' };

  const badge = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#1e293b',
    color: '#f8fafc',
    padding: '4px 10px',
    borderRadius: 6,
    cursor: 'grab',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  };

  const box = {
    background: '#0f172a',
    color: '#f1f5f9',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: 12,
    minWidth: 360,
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    marginBottom: 8,
  };

  const dragHandle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    cursor: 'grab',
    userSelect: 'none',
  };

  const th = {
    textAlign: 'left',
    padding: '3px 8px',
    color: '#94a3b8',
    borderBottom: '1px solid #334155',
  };

  const td = (extra = {}) => ({
    padding: '3px 8px',
    whiteSpace: 'nowrap',
    ...extra,
  });

  return (
    <div ref={panelRef} style={panel}>
      {open && (
        <div style={box}>
          {/* Drag handle / Header */}
          <div style={dragHandle} onPointerDown={handlePointerDown}>
            <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 13 }}>
              ⠿ Firebase Monitor
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: '#64748b', fontSize: 11 }}>
                page: <span style={{ color: '#e2e8f0' }}>{currentPage}</span>
              </span>
              <button
                onClick={resetStats}
                style={{
                  background: '#7f1d1d',
                  color: '#fca5a5',
                  border: 'none',
                  borderRadius: 4,
                  padding: '1px 8px',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          {pages.length === 0 ? (
            <div style={{ color: '#475569', textAlign: 'center', padding: '12px 0' }}>
              No API calls recorded yet — trigger a page action.
            </div>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={th}>Route</th>
                  <th style={{ ...th, textAlign: 'center' }}>Reads</th>
                  <th style={{ ...th, textAlign: 'center' }}>Writes</th>
                  <th style={{ ...th, textAlign: 'center' }}>Deletes</th>
                  <th style={{ ...th, textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const { reads, writes, deletes } = snapshot[page];
                  const isCurrent = page === currentPage;
                  return (
                    <tr key={page} style={isCurrent ? { background: '#1e3a5f' } : {}}>
                      <td style={td({ color: isCurrent ? '#93c5fd' : '#cbd5e1' })}>
                        {isCurrent ? '▶ ' : ''}{page}
                      </td>
                      <td style={td({ textAlign: 'center', color: '#60a5fa' })}>{reads || '—'}</td>
                      <td style={td({ textAlign: 'center', color: '#4ade80' })}>{writes || '—'}</td>
                      <td style={td({ textAlign: 'center', color: '#f87171' })}>{deletes || '—'}</td>
                      <td style={td({ textAlign: 'center', color: '#e2e8f0', fontWeight: 'bold' })}>
                        {reads + writes + deletes}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ borderTop: '1px solid #334155' }}>
                  <td style={td({ color: '#94a3b8' })}>TOTAL</td>
                  <td style={td({ textAlign: 'center', color: '#93c5fd', fontWeight: 'bold' })}>{totalReads || '—'}</td>
                  <td style={td({ textAlign: 'center', color: '#86efac', fontWeight: 'bold' })}>{totalWrites || '—'}</td>
                  <td style={td({ textAlign: 'center', color: '#fca5a5', fontWeight: 'bold' })}>{totalDeletes || '—'}</td>
                  <td style={td({ textAlign: 'center', color: '#f8fafc', fontWeight: 'bold' })}>
                    {totalReads + totalWrites + totalDeletes}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Legend */}
          <div style={{ marginTop: 8, color: '#475569', fontSize: 10 }}>
            <span style={{ color: '#60a5fa' }}>■</span> Reads &nbsp;
            <span style={{ color: '#4ade80' }}>■</span> Writes (incl. updates) &nbsp;
            <span style={{ color: '#f87171' }}>■</span> Deletes &nbsp;
            · doc count estimated from response payload
          </div>
        </div>
      )}

      {/* Toggle badge */}
      <div style={badge} onPointerDown={handlePointerDown} onClick={() => setOpen((v) => !v)}>
        <span style={{ color: '#f59e0b' }}>FB</span>
        <span style={{ color: '#64748b', fontSize: 10 }}>🔍</span>
        <span style={{ color: '#94a3b8', fontSize: 10 }}>
          {open ? 'hide' : `${totalReads + totalWrites + totalDeletes} ops`}
        </span>
      </div>
    </div>
  );
}
