import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/api';
import Table from '../components/Table';
import { Pagination, SearchBar, Button, ExpandColumnsButton } from '../components/Button';
import PageLoader from '../components/loading';
import '../styles/pagestyles/view-master.css';

function formatCell(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function ViewDataPage() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isColumnsExpanded, setIsColumnsExpanded] = useState(false);
  const rowsPerPage = 15;

  // Define default visible columns
  const defaultVisibleColumns = useMemo(() => 
    ['ledger', 'city', 'address1', 'address2', 'address3', 'pin', 'email', 'contact', 'phone1', 'phone2', 'mobile', 'tin'],
    []
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/excel/master?limit=1000');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to load');
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setColumns(Array.isArray(data.columns) ? data.columns : []);
    } catch (e) {
      setError(e.message || 'Failed to load');
      setRows([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Map each exact column key to its desired width and alignment
  const columnConfig = useMemo(() => ({
    'code': { width: '80px', align: 'center' },
    'type': { width: '100px', align: 'center' },
    'ledger': { width: '150px', align: 'center' },
    'city': { width: '120px', align: 'center' },
    'group': { width: '120px', align: 'center' },
    'name': { width: '250px', align: 'center' },
    'address1': { width: '200px', align: 'center' },
    'address2': { width: '200px', align: 'center' },
    'address3': { width: '200px', align: 'center' },
    'pin': { width: '100px', align: 'center' },
    'email': { width: '200px', align: 'center' },
    'site': { width: '200px', align: 'center' },
    'contact': { width: '150px', align: 'center' },
    'phone1': { width: '120px', align: 'center' },
    'phone2': { width: '120px', align: 'center' },
    'mobile': { width: '120px', align: 'center' },
    'resi': { width: '120px', align: 'center' },
    'fax': { width: '120px', align: 'center' },
    'licence': { width: '150px', align: 'center' },
    'tin': { width: '150px', align: 'center' },
    'stno': { width: '150px', align: 'center' },
    'panno': { width: '150px', align: 'center' },
    'mr': { width: '100px', align: 'center' },
    'area': { width: '150px', align: 'center' },
    'rout': { width: '120px', align: 'center' },
    'tpt': { width: '150px', align: 'center' },
    'tptdlv': { width: '150px', align: 'center' },
    'bank': { width: '200px', align: 'center' },
    'bankadd1': { width: '200px', align: 'center' },
    'bankadd2': { width: '200px', align: 'center' },
    'branch': { width: '150px', align: 'center' },
    'crdays': { width: '100px', align: 'center' },
    'cramount': { width: '120px', align: 'center' },
    'limitbill': { width: '120px', align: 'center' },
    'limitday': { width: '100px', align: 'center' },
    'limittype': { width: '120px', align: 'center' },
    'freez': { width: '100px', align: 'center' },
  }), []);

  const tableColumns = useMemo(
    () => {
      // Filter columns based on expansion state
      const visibleCols = isColumnsExpanded ? columns : columns.filter(col => defaultVisibleColumns.includes(col));
      
      return visibleCols.map((key) => {
        const config = columnConfig[key] || {};
        return {
          key,
          label: key,
          align: config.align || 'center',
          width: config.width || '200px',
          render: (item) => formatCell(item[key]),
        };
      });
    },
    [columns, columnConfig, isColumnsExpanded, defaultVisibleColumns]
  );

  const tableMinWidth = useMemo(
    () => {
      // Calculate total width of all dynamically mapped columns
      const totalWidth = tableColumns.reduce((sum, col) => {
        const width = col.width ? parseInt(col.width.replace(/[^0-9]/g, ''), 10) : 200;
        return sum + (isNaN(width) ? 200 : width);
      }, 0);
      return Math.max(1200, totalWidth);
    },
    [tableColumns]
  );

  // Filter rows by search query across all visible columns
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.trim().toLowerCase();
    return rows.filter(row =>
      columns.some(key => {
        const val = row[key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, columns, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const currentRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const showTable = !loading && !error && columns.length > 0;

  return (
    <div className="view-master-page">
      {showLoader && (
        <PageLoader
          pageName="Master"
          isDataLoading={loading}
          duration={1500}
          onComplete={() => setShowLoader(false)}
        />
      )}

      {error && (
        <p className="view-master-error" role="alert">
          {error}
        </p>
      )}

      {showTable && (
        <div className="view-master-table-section">
          <div className="view-master-toolbar">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
              <SearchBar
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search master data..."
              />
              {searchQuery && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                >
                  Show All
                </Button>
              )}
            </div>
            <ExpandColumnsButton
              isExpanded={isColumnsExpanded}
              onClick={() => setIsColumnsExpanded(!isColumnsExpanded)}
              className="view-master-expand-btn"
            />
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingBottom: '0' }}>
            <Table
              containerClassName="view-master-reusable-table-container"
              tableClassName="view-master-reusable-table"
              columns={tableColumns}
              data={currentRows}
              minWidth={tableMinWidth}
              striped
              headerGradient
              defaultAlign="center"
              noDataMessage="No records in Excel_master yet. Upload a file from Excel."
            />
          </div>
          <div style={{ padding: '0.5rem 0', background: 'white', borderTop: '1px solid #e2e8f0' }}>
             <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
          </div>
        </div>
      )}
    </div>
  );
}
