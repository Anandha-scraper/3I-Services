import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '../utils/api';
import Table from '../components/Table';
import PageLoader from '../components/loading';
import Alert from '../components/Alert';
import '../styles/pagestyles/view-outstandings.css';
import '../styles/componentstyles/Alert.css';

function formatCurrency(value) {
  if (value == null || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}


export default function ViewOutstandingsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [alert, setAlert] = useState(null);

  const load = useCallback(async () => {
    setAlert(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/ledger-remainder?limit=1000');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to load');
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (e) {
      setAlert({
        type: 'error',
        title: 'Load Failed',
        message: e.message || 'Failed to load outstanding data',
        onConfirm: () => { setAlert(null); load(); },
        onCancel: () => setAlert(null),
      });
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
      key: 'city',
      label: 'City',
      width: '150px',
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

  ], []);

  return (
    <div className="outstandings-page">
      {showLoader && (
        <PageLoader
          pageName="Outstandings"
          isDataLoading={loading}
          duration={1500}
          onComplete={() => setShowLoader(false)}
        />
      )}

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onConfirm={alert.onConfirm}
          onCancel={alert.onCancel}
        />
      )}

      <div className="outstandings-header">
        <h1>Outstanding Data :</h1>
        <button className="page-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
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
