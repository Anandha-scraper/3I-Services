import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, ArrowUpNarrowWide, ArrowDownNarrowWide, Filter, X } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { Button, SearchBar } from '../components/Button';
import DatePicker from '../components/datepicker';
import PageLoader from '../components/loading';
import '../styles/pagestyles/view-log.css';

// Helper function to check if a field was updated
const isFieldUpdated = (item, fieldName) => {
  if (item.operation === 'insert') return false; // Initial entries not highlighted
  
  if (fieldName === 'debit') {
    return item.debit !== (item.previous_debit || 0);
  }
  if (fieldName === 'credit') {
    return item.credit !== (item.previous_credit || 0);
  }
  if (fieldName === 'comments') {
    return item.operation === 'update' && item.comments;
  }
  if (fieldName === 'date') {
    return item.operation === 'update' && item.date;
  }
  return false;
};

// Styles for updated cells with different colors for each field type
const updatedCellStyles = {
  debit: {
    backgroundColor: '#dcfce7',
  },
  credit: {
    backgroundColor: '#fee2e2',
  },
  date: {
    backgroundColor: '#ede9fe',
  },
  comments: {
    backgroundColor: '#fef3c7',
  },
};

export default function ViewLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, credit, debit, insert, update
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(20);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/ledger-logs?limit=1000');

      if (!res.ok) {
        throw new Error('Failed to load ledger logs');
      }

      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = useMemo(() => [
    {
      key: 'timestamp',
      label: 'Created At',
      sortable: true,
      width: '15%',
      align: 'center',
      render: (item) => <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
        {new Date(item.timestamp).toLocaleString('en-IN', { 
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })}
      </span>
    },
    {
      key: 'createdByUserId',
      label: 'User ID',
      width: '6%',
      align: 'center',
      render: (item) => <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{item.createdByUserId || '-'}</span>
    },
    {
      key: 'debit',
      label: 'Debit',
      width: '14%',
      align: 'center',
      render: (item) => {
        const isUpdated = isFieldUpdated(item, 'debit');
        const style = isUpdated ? updatedCellStyles.debit : {};
        return item.debit > 0 
          ? <span style={{ color: '#16a34a', fontWeight: 600, ...style }}>{item.debit.toFixed(2)}</span>
          : <span style={{ color: '#d1d5db' }}>—</span>
      }
    },
    {
      key: 'credit',
      label: 'Credit',
      width: '14%',
      align: 'center',
      render: (item) => {
        const isUpdated = isFieldUpdated(item, 'credit');
        const style = isUpdated ? updatedCellStyles.credit : {};
        return item.credit > 0 
          ? <span style={{ color: '#dc2626', fontWeight: 600, ...style }}>{item.credit.toFixed(2)}</span>
          : <span style={{ color: '#d1d5db' }}>—</span>
      }
    },
    {
      key: 'date',
      label: 'Next Call Date',
      width: '10%',
      align: 'center',
      render: (item) => {
        const isUpdated = isFieldUpdated(item, 'date');
        const style = isUpdated ? updatedCellStyles.date : {};
        return item.date ? 
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#059669', ...style }}>{item.date}</span>
          : <span style={{ color: '#d1d5db' }}>—</span>
      }
    },
    {
      key: 'comments',
      label: 'Comments & Notes',
      width: '40%',
      align: 'center',
      render: (item) => {
        const isUpdated = isFieldUpdated(item, 'comments');
        const style = isUpdated ? updatedCellStyles.comments : {};
        return item.comments ? 
          <span style={{ fontSize: '0.9rem', color: '#555', fontStyle: 'italic', ...style }}>"{item.comments}"</span>
          : <span style={{ color: '#d1d5db' }}>—</span>
      }
    },
  ], []);

  const tableMinWidth = useMemo(() => {
    return '100%';
  }, [columns]);

  // Filter logs step
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (filterType === 'credit') {
      result = result.filter(log => log.credit > 0);
    } else if (filterType === 'debit') {
      result = result.filter(log => log.debit > 0);
    } else if (filterType === 'insert') {
      result = result.filter(log => log.operation === 'insert');
    } else if (filterType === 'update') {
      result = result.filter(log => log.operation === 'update');
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(log =>
        (log.ledger_name && log.ledger_name.toLowerCase().includes(lowerTerm)) ||
        (log.ledger_id && log.ledger_id.toLowerCase().includes(lowerTerm)) ||
        (log.group && log.group.toLowerCase().includes(lowerTerm)) ||
        (log.comments && log.comments.toLowerCase().includes(lowerTerm))
      );
    }

    // Date filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        result = result.filter(log => {
          const ts = new Date(log.timestamp);
          return ts >= from && ts <= to;
        });
      } else {
        const fromEnd = new Date(dateFrom);
        fromEnd.setHours(23, 59, 59, 999);
        result = result.filter(log => {
          const ts = new Date(log.timestamp);
          return ts >= from && ts <= fromEnd;
        });
      }
    }

    // Sort by timestamp
    result.sort((a, b) => {
      const diff = new Date(b.timestamp) - new Date(a.timestamp);
      return sortOrder === 'asc' ? -diff : diff;
    });

    return result;
  }, [logs, searchTerm, filterType, dateFrom, dateTo, sortOrder]);

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  const currentLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredLogs, currentPage, rowsPerPage]);

  return (
    <div className="view-log-page">
      {showLoader && (
        <PageLoader
          pageName="Activity Logs"
          isDataLoading={loading}
          onComplete={() => setShowLoader(false)}
        />
      )}

      <div className="view-log-header">
        <h2>Ledger Activity Logs</h2>
      </div>

      <div className="view-log-filters">
        <SearchBar
          className="view-log-search"
          placeholder="Search by ledger name, ID, group, or comments..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
        <div className="view-log-date-filters" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>From</span>
          <DatePicker
            value={dateFromInput}
            onChange={(val) => { setDateFromInput(val); if (!val) setDateToInput(''); }}
            className="view-log-datepicker"
          />
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, opacity: dateFromInput ? 1 : 0.4 }}>To</span>
          <DatePicker
            value={dateToInput}
            onChange={(val) => { setDateToInput(val); }}
            disabled={!dateFromInput}
            className="view-log-datepicker"
          />
          <button
            type="button"
            title="Apply date filter"
            onClick={() => { setDateFrom(dateFromInput); setDateTo(dateToInput); setCurrentPage(1); }}
            style={{ background: dateFromInput ? '#2563eb' : 'transparent', border: dateFromInput ? '1px solid #2563eb' : '1px solid #d1d5db', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
            <Filter size={15} color={dateFromInput ? '#fff' : '#9ca3af'} />
          </button>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              title="Clear date filter"
              onClick={() => { setDateFromInput(''); setDateToInput(''); setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
              style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              <X size={15} color="#ef4444" />
            </button>
          )}
        </div>
        <div className="view-log-toggles">
          <Button 
            variant={filterType === 'all' ? 'primary' : 'outline'} 
            onClick={() => { setFilterType('all'); setCurrentPage(1); }}
          >
            All Updates
          </Button>
          <Button 
            variant={filterType === 'credit' ? 'credit' : 'outline'} 
            onClick={() => { setFilterType('credit'); setCurrentPage(1); }}
            className={filterType === 'credit' ? 'active' : ''}
          >
            Credit
          </Button>
          <Button 
            variant={filterType === 'debit' ? 'debit' : 'outline'} 
            onClick={() => { setFilterType('debit'); setCurrentPage(1); }}
            className={filterType === 'debit' ? 'active' : ''}
          >
            Debit
          </Button>
          <Button 
            variant={filterType === 'insert' ? 'primary' : 'outline'} 
            onClick={() => { setFilterType('insert'); setCurrentPage(1); }}
            className={filterType === 'insert' ? 'active' : ''}
          >
            Initial Entry
          </Button>
          <Button 
            variant={filterType === 'update' ? 'primary' : 'outline'} 
            onClick={() => { setFilterType('update'); setCurrentPage(1); }}
            className={filterType === 'update' ? 'active' : ''}
          >
            Updates
          </Button>
        </div>
      </div>

      <div className="view-log-content">
        {loading ? (
          <div className="view-log-empty">
            <p>Loading activity logs...</p>
          </div>
        ) : error ? (
          <div className="view-log-error">
            <AlertCircle size={24} style={{ display: 'inline', marginRight: '8px' }} />
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="view-log-empty">
            <AlertCircle size={48} style={{ marginBottom: '16px', color: '#ccc' }} />
            <p>No activity logs found</p>
          </div>
        ) : (
          <div className="view-log-table-container">
            <table className="view-log-custom-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{ width: col.width, textAlign: col.align || 'center', cursor: col.sortable ? 'pointer' : 'default', userSelect: col.sortable ? 'none' : 'auto' }}
                      onClick={col.sortable ? () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc') : undefined}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {col.label}
                        {col.sortable && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', height: '24px', borderRadius: '4px',
                            backgroundColor: '#f3f4f6', transition: 'background-color 0.2s'
                          }}>
                            {sortOrder === 'desc'
                              ? <ArrowDownNarrowWide size={14} color="#4b5563" />
                              : <ArrowUpNarrowWide size={14} color="#4b5563" />
                            }
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((item, rowIndex) => {
                  return (
                    <tr key={item.id || item._id || rowIndex}>
                      {columns.map((col) => {
                        const isUpdated = isFieldUpdated(item, col.key);
                        let cellStyle = {};
                        
                        // Apply appropriate style based on field type
                        if (isUpdated) {
                          if (col.key === 'debit') cellStyle = updatedCellStyles.debit;
                          else if (col.key === 'credit') cellStyle = updatedCellStyles.credit;
                          else if (col.key === 'date') cellStyle = updatedCellStyles.date;
                          else if (col.key === 'comments') cellStyle = updatedCellStyles.comments;
                        }
                        
                        return (
                          <td 
                            key={col.key} 
                            style={{ 
                              width: col.width, 
                              textAlign: col.align || 'center',
                              padding: '12px 8px',
                              borderBottom: '1px solid #e5e7eb',
                              ...cellStyle
                            }}
                          >
                            {col.render ? col.render(item, rowIndex) : (item[col.key] !== undefined ? item[col.key] : '—')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="log-pagination">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="pagination-info">
                  Page {currentPage} of {totalPages} ({filteredLogs.length} total)
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
