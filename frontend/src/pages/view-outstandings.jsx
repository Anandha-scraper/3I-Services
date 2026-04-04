import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../utils/api';
import Table from '../components/Table';
import PageLoader from '../components/loading';
import '../styles/pagestyles/view-outstandings.css';

function formatCurrency(value) {
  if (value == null || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}


export default function ViewOutstandingsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [error, setError] = useState(null);


  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not logged in.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/ledger-remainder?limit=1000'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to load');
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e) {
      setError(e.message || 'Failed to load');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(() => [
    {
      key: 'ledger_name',
      label: 'Ledger Name',
      width: '300px',
      align: 'center',
    },
    {
      key: 'debit',
      label: 'Debit',
      width: '150px',
      align: 'center',
      render: (item) => formatCurrency(item.debit),
    },
    {
      key: 'credit',
      label: 'Credit',
      width: '150px',
      align: 'center',
      render: (item) => formatCurrency(item.credit),
    },
    {
      key: 'city',
      label: 'City',
      width: '150px',
      align: 'center',
    },
  ], []);

  return (
    <div className="outstandings-page">
      {showLoader && (
        <PageLoader
          pageName="Outstandings"
          isDataLoading={loading}
          onComplete={() => setShowLoader(false)}
        />
      )}

      {error && <div className="outstandings-error">{error}</div>}
      
      <div className="outstandings-header">
        <h1>Ledger Remainders</h1>
      </div>

      <div className="outstandings-table-section">
        {loading ? (
          <div className="outstandings-loading">Loading...</div>
        ) : (
          <div className="outstandings-table-container">
            <Table
              columns={columns}
              data={rows}
              noDataMessage="No ledger remainders found"
              striped={true}
              headerGradient={true}
              tableClassName="outstandings-table"
              containerClassName="outstandings-scroll-container"
              minWidth={600}
            />
          </div>
        )}
      </div>
    </div>
  );
}
