import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import Table from '../components/Table';
import PageLoader from '../components/loading';
import { SearchBar } from '../components/Button';
import '../styles/pagestyles/view-notify.css';

export default function NotifyPage() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchLedgerRemainders = useCallback(async () => {
    try {
      const res = await apiFetch('/api/ledger-remainder?limit=500');

      if (!res.ok) {
        throw new Error('Failed to load ledger remainders');
      }

      const data = await res.json();
      const sortedLedgers = (Array.isArray(data.rows) ? data.rows : []).sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      setLedgers(sortedLedgers);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedgerRemainders();
  }, [fetchLedgerRemainders]);

  const columns = useMemo(() => [
    {
      key: 'ledger_name',
      label: 'Ledger Name',
      width: '300px',
      align: 'center',
    },
    {
      key: 'nextCallDate',
      label: 'Date',
      width: '150px',
      align: 'center',
      render: (value) => {
        if (!value) return '—';
        try {
          const date = new Date(value);
          return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } catch {
          return value;
        }
      },
    },
  ], []);

  const filteredLedgers = useMemo(() => {
    if (!searchTerm.trim()) return ledgers;
    const lower = searchTerm.toLowerCase().trim();
    return ledgers.filter(l => {
      if (l.ledger_name && l.ledger_name.toLowerCase().includes(lower)) return true;
      if (l.nextCallDate) {
        try {
          const date = new Date(l.nextCallDate);
          const formatted = date.toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
          }).toLowerCase();
          if (formatted.includes(lower)) return true;
          const parts = [
            date.getFullYear().toString(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
          ];
          if (parts.some(p => p.includes(lower))) return true;
        } catch {}
      }
      return false;
    });
  }, [ledgers, searchTerm]);

  const handleRowClick = (ledger) => {
    navigate('/view-notify-detail', { state: { row: ledger } });
  };

  return (
    <div className="notify-page">
      {showLoader && (
        <PageLoader
          pageName="Notifications"
          isDataLoading={loading}
          onComplete={() => setShowLoader(false)}
        />
      )}

      {error && <div className="notify-error">⚠️ {error}</div>}

      <div className="notify-header">
        <div className="notify-header-text">
          <h1>Ledger Notifications</h1>
          <p className="notify-subtitle">Recent ledger updates and changes</p>
        </div>
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by ledger name or date (e.g. Apr, 2026, 26)..."
          className="notify-search"
        />
      </div>

      <div className="notify-table-section">
        {loading ? (
          <div className="notify-loading">Loading...</div>
        ) : (
          <div className="notify-table-container">
            <div className="notify-table-wrapper">
              {filteredLedgers.length === 0 ? (
                <div className="notify-empty">No ledger updates found</div>
              ) : (
                <table className="notify-table">
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} style={{ width: col.width, textAlign: col.align }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedgers.map((ledger, index) => (
                      <tr
                        key={ledger.id || index}
                        className="notify-table-row"
                        onClick={() => handleRowClick(ledger)}
                      >
                        {columns.map((col) => (
                          <td key={col.key} style={{ textAlign: col.align }}>
                            {col.render ? col.render(ledger[col.key]) : ledger[col.key] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
