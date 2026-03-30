import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { apiUrl } from '../utils/api';
import Table from '../components/Table';
import '../styles/pagestyles/view-notify.css';

export default function NotifyPage() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    const loadLedgers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/ledger-remainder?limit=1000'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Failed to load ledger remainder data');
        }

        const data = await res.json();
        setLedgers(Array.isArray(data.rows) ? data.rows : []);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load data');
        setLedgers([]);
      } finally {
        setLoading(false);
      }
    };

    loadLedgers();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/ledger-remainder?limit=1000'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to refresh');
      const data = await res.json();
      setLedgers(Array.isArray(data.rows) ? data.rows : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  // Define columns for the table
  const columns = useMemo(() => [
    {
      key: 'ledger_id',
      label: 'Ledger ID',
      width: '120px',
      align: 'left',
      render: (item) => <strong style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85rem' }}>{item.ledger_id}</strong>
    },
    {
      key: 'ledger_name',
      label: 'Ledger Name',
      width: '250px',
      align: 'left',
      render: (item) => <span style={{ fontWeight: 500 }}>{item.ledger_name}</span>
    },
    {
      key: 'city',
      label: 'City',
      width: '150px',
      align: 'left',
      render: (item) => <span>{item.city || '-'}</span>
    },
    {
      key: 'debit',
      label: 'Debit',
      width: '120px',
      align: 'right',
      render: (item) => item.debit > 0 
        ? <span style={{ color: '#166534', fontWeight: 600, fontFamily: "'Courier New', monospace" }}>{item.debit.toFixed(2)}</span>
        : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
    },
    {
      key: 'credit',
      label: 'Credit',
      width: '120px',
      align: 'right',
      render: (item) => item.credit > 0 
        ? <span style={{ color: '#991b1b', fontWeight: 600, fontFamily: "'Courier New', monospace" }}>{item.credit.toFixed(2)}</span>
        : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
    },
    {
      key: 'lastTransactionDate',
      label: 'Date',
      width: '110px',
      align: 'center',
      render: (item) => item.lastTransactionDate 
        ? <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.9rem' }}>{item.lastTransactionDate}</span>
        : <span style={{ color: '#9ca3af' }}>-</span>
    },
    {
      key: 'lastComments',
      label: 'Comments',
      width: '250px',
      align: 'left',
      render: (item) => item.lastComments 
        ? <span style={{ fontSize: '0.9rem', color: '#555' }}>{item.lastComments}</span>
        : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
    }
  ], []);

  // Pagination logic
  const totalPages = Math.ceil(ledgers.length / rowsPerPage);
  const currentLedgers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return ledgers.slice(startIndex, startIndex + rowsPerPage);
  }, [ledgers, currentPage, rowsPerPage]);

  if (loading) {
    return (
      <div className="ledger-page">
        <div className="ledger-loading">
          <p>Loading ledger remainder data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ledger-page">
        <p className="ledger-error" role="alert">
          <AlertCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="ledger-page">
      <div className="ledger-header">
        <h2>Ledger Remainder Master</h2>
        <button onClick={handleRefresh} className="ledger-refresh-btn">
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="ledger-stats">
        <div className="stat-card">
          <span className="stat-label">Total Ledgers</span>
          <span className="stat-value">{ledgers.length}</span>
        </div>
      </div>

      {ledgers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <AlertCircle size={48} style={{ marginBottom: '16px', color: '#ccc' }} />
          <p style={{ color: '#999' }}>No ledger remainder records found</p>
        </div>
      ) : (
        <>
          <Table
            containerClassName="ledger-table-wrapper"
            tableClassName="ledger-table-custom"
            columns={columns}
            data={currentLedgers}
            noDataMessage="No records found"
            minWidth={900}
            striped={true}
            headerGradient={true}
            defaultAlign="left"
          />

          {totalPages > 1 && (
            <div className="ledger-pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <div className="pagination-info">
                Page {currentPage} of {totalPages} ({ledgers.length} total)
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}