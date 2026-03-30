import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, Mail, Check, X, Trash2, IdCard, Shield, User as UserIcon, ArrowUpRight, ArrowDownRight, MapPin, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';
import Alert from '../components/Alert';
import '../styles/pagestyles/home.css';

function formatRequestDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function initials(first, last) {
  const a = (first || '').trim().charAt(0);
  const b = (last || '').trim().charAt(0);
  return (a + b).toUpperCase() || '?';
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeList, setActiveList] = useState('employees');
  const [alertState, setAlertState] = useState(null);

  const promptDeleteUser = (userId, userName) => {
    setAlertState({
      type: 'warning',
      title: 'Delete User?',
      message: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      onConfirm: async () => {
        setAlertState({ type: 'loading', title: 'Deleting User...' });
        await handleDeleteUser(userId);
      },
      onCancel: () => setAlertState(null),
    });
  };

  const promptRejectRequest = (requestId, userName) => {
    setAlertState({
      type: 'warning',
      title: 'Reject Request?',
      message: `Are you sure you want to reject the registration for ${userName}?`,
      onConfirm: () => handleRequestAction(requestId, 'reject'),
      onCancel: () => setAlertState(null),
    });
  };

  const handleDeleteUser = async (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[DELETE] No token found in localStorage');
      setAlertState({ type: 'error', title: 'Deletion Failed', message: 'Authentication error: No token found' });
      return;
    }

    console.log(`[DELETE] Starting deletion for userId: ${userId}`);
    const startTime = Date.now();
    const apiEndpoint = apiUrl(`/api/admin/users/${userId}`);
    console.log(`[DELETE] API Endpoint: ${apiEndpoint}`);

    try {
      console.log(`[DELETE] Sending DELETE request to ${apiEndpoint}`);
      const res = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log(`[DELETE] Response status: ${res.status}`);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`[DELETE] Server error response:`, err);
        throw new Error(err.error || err.message || `Server error (${res.status})`);
      }

      console.log(`[DELETE] Deletion successful, waiting minimum 2 seconds...`);
      const elapsedTime = Date.now() - startTime;
      const remainingTime = 2000 - elapsedTime;

      setTimeout(() => {
        console.log(`[DELETE] Showing success message and refreshing data`);
        setAlertState({
          type: 'success',
          title: 'User Deleted',
          message: 'The user has been successfully removed.',
        });
        load();
      }, Math.max(0, remainingTime));

    } catch (e) {
      console.error(`[DELETE] Error during deletion:`, e.message);
      const elapsedTime = Date.now() - startTime;
      const remainingTime = 2000 - elapsedTime;

      setTimeout(() => {
        setAlertState({ type: 'error', title: 'Deletion Failed', message: e.message });
      }, Math.max(0, remainingTime));
    }
  };

  const handleRequestAction = async (id, action) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const isApprove = action === 'approve';
    const loadingTitle = isApprove ? 'Approving...' : 'Rejecting...';
    setAlertState({ type: 'loading', title: loadingTitle });

    const startTime = Date.now();

    try {
      const res = await fetch(apiUrl(`/api/signup/${action}/${id}`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Action failed');
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = 2000 - elapsedTime;

      setTimeout(() => {
        if (isApprove) {
          setAlertState({
            type: 'success',
            title: 'User Approved',
            message: 'The user has been successfully approved and notified.',
          });
        } else {
          setAlertState({
            type: 'warning',
            title: 'User Rejected',
            message: 'The user registration has been rejected.',
          });
        }
        load();
      }, Math.max(0, remainingTime));

    } catch (e) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = 2000 - elapsedTime;

      setTimeout(() => {
        setAlertState({ type: 'error', title: 'Action Failed', message: e.message });
      }, Math.max(0, remainingTime));
    }
  };

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not signed in.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/dashboard'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setError('You do not have admin access.');
        setData(null);
        return;
      }
      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to load');
      }
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setAlertState({
        type: 'success',
        title: 'Copied!',
        message: `${label} copied to clipboard`
      });
      setTimeout(() => setAlertState(null), 2000);
    }).catch(() => {
      setAlertState({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy to clipboard'
      });
    });
  };

  return (
    <div className="admin-dash">
      {alertState && (
        <Alert
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onConfirm={alertState.onConfirm || (() => setAlertState(null))}
          onCancel={alertState.onCancel || (() => setAlertState(null))}
        />
      )}
      {error && (
        <div className="admin-dash__alert" role="alert">
          {error}
        </div>
      )}

      {loading && !data && !error && (
        <div className="admin-dash__loading">Loading dashboard…</div>
      )}

      {data && (
        <>
          <section className="admin-dash__panel">
            <div className="admin-dash__panel-head">
              <div className="admin-dash__toggle">
                <button
                  type="button"
                  className={`admin-dash__toggle-btn ${activeList === 'employees' ? 'admin-dash__toggle-btn--active' : ''}`}
                  onClick={() => setActiveList('employees')}
                >
                  <Users size={16} />
                  Employees
                </button>
                <button
                  type="button"
                  className={`admin-dash__toggle-btn ${activeList === 'requests' ? 'admin-dash__toggle-btn--active' : ''}`}
                  onClick={() => setActiveList('requests')}
                >
                  <UserPlus size={16} />
                  Requests
                  {data.pendingRequests?.length > 0 && (
                    <span className="admin-dash__badge admin-dash__badge--pending">{data.pendingRequests.length}</span>
                  )}
                </button>
              </div>
            </div>

            {activeList === 'employees' && (
              <div className="admin-dash__table-wrap">
                <table className="admin-dash__table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Emp ID</th>
                      <th>City</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Last login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.employees || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="admin-dash__table-empty">
                          No employees yet.
                        </td>
                      </tr>
                    ) : (
                      (data.employees || []).map((row) => (
                        <tr key={row.empId}>
                          <td>
                            <div className="admin-dash__person">
                              <span className="admin-dash__person-name">
                                {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <code 
                              className="admin-dash__code"
                            >
                              {row.empId || '—'}
                            </code>
                          </td>
                          <td>{row.city || '—'}</td>
                          <td>
                            {row.phone ? (
                              <code 
                                className="admin-dash__code admin-dash__code--clickable" 
                                onClick={() => copyToClipboard(`${row.countryCode}${row.phone}`, 'Phone Number')}
                                title="Click to copy"
                              >
                                {row.countryCode}{row.phone}
                              </code>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                row.role === 'admin'
                                  ? 'admin-dash__badge admin-dash__badge--admin'
                                  : 'admin-dash__badge admin-dash__badge--emp'
                              }
                            >
                              {row.role || 'employee'}
                            </span>
                          </td>
                          <td>
                            <span className="admin-dash__login">
                              <Clock size={14} />
                              {row.lastLogin || 'Never'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="admin-dash__action-btn admin-dash__action-btn--delete"
                              onClick={() => promptDeleteUser(row.empId, [row.firstName, row.lastName].filter(Boolean).join(' '))}
                              disabled={!!alertState}
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeList === 'requests' && (
              <div className="admin-dash__requests">
                {(data.pendingRequests || []).length === 0 ? (
                  <div className="admin-dash__requests-empty">
                    <UserPlus size={40} strokeWidth={1.25} />
                    <p>No pending signup requests.</p>
                    <span>New registrations will appear here.</span>
                  </div>
                ) : (
                  <ul className="admin-dash__request-list">
                    {(data.pendingRequests || []).map((req) => (
                      <li key={req.id} className="admin-dash__request-card">
                        <div className="admin-dash__request-top">
                          <div className="admin-dash__request-who">
                            <strong>
                              {[req.firstName, req.lastName].filter(Boolean).join(' ') || '—'}
                            </strong>
                          </div>
                          <div className="admin-dash__request-actions">
                            <button
                              type="button"
                              className="admin-dash__action-btn admin-dash__action-btn--approve"
                              onClick={() => handleRequestAction(req.id, 'approve')}
                              disabled={!!alertState}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              className="admin-dash__action-btn admin-dash__action-btn--decline"
                              onClick={() => promptRejectRequest(req.id, [req.firstName, req.lastName].filter(Boolean).join(' '))}
                              disabled={!!alertState}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="admin-dash__request-meta">
                          <span>
                            <Mail size={14} />
                            {req.email}
                          </span>
                          <span>{req.city || '—'}</span>
                          {req.phone ? (
                            <span>
                              {req.countryCode}{req.phone}
                            </span>
                          ) : null}
                          <span className="admin-dash__request-time">
                            <Clock size={14} />
                            {formatRequestDate(req.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function EmployeeHome({ user }) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.userId || 'there';
  return (
    <div className="home-welcome-employee">
      <div className="home-welcome-employee__card">
        <h1 className="home-welcome-employee__title">Welcome back</h1>
        <p className="home-welcome-employee__name">{name}</p>
        <p className="home-welcome-employee__hint">Use the sidebar to open Excel tools or view data.</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  return (
    <div className={`home-page-container`}>
      <UserGreetingBanner user={user} />
      {isAdmin ? <AdminDashboard /> : <EmployeeHome user={user} />}
    </div>
  );
}

function UserGreetingBanner({ user }) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const role = user?.role || 'Employee';
  const idValue = user?.empId || user?.userId || 'N/A';
  
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  const workflows = [
    { label: 'System Check', value: 'All Optimal', icon: Activity, color: 'text-blue', bg: 'bg-blue-light' },
    { label: 'Pending Docs', value: '3 Awaiting', icon: Clock, color: 'text-orange', bg: 'bg-orange-light' },
    { label: 'Data Sync', value: 'Up to date', icon: Check, color: 'text-green', bg: 'bg-green-light' },
  ];
  const [flowIdx, setFlowIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlowIdx((prev) => (prev + 1) % workflows.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [workflows.length]);

  const CurrentFlow = workflows[flowIdx];

  return (
    <div className="user-greeting-banner">
      <div className="user-greeting__top-row">
        <div className="user-greeting__profile">
          <h1 className="user-greeting__title">{greeting}, {name}!</h1>
          <div className="user-greeting__badges">
            <span className="user-greeting__badge">
              <IdCard size={14} /> ID: {idValue}
            </span>
            <span className="user-greeting__badge" style={{ textTransform: 'capitalize' }}>
              <Shield size={14} /> {role}
            </span>
          </div>
        </div>
      </div>
      
      <div className="user-greeting__stats">
        {role !== 'admin' && (
          <div className="user-greeting__stat">
            <div className="user-greeting__stat-icon bg-blue-light">
              <MapPin size={18} className="text-blue" />
            </div>
            <div className="user-greeting__stat-text">
              <p className="user-greeting__stat-val">{user?.location || 'Not Set'}</p>
              <p className="user-greeting__stat-lbl">Location</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
