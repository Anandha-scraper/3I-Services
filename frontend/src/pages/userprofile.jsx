import { useState, useEffect } from 'react';
import { User, Lock, Pencil, X, Save, Eye, EyeOff, Shield, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';
import Alert from '../components/Alert';
import '../styles/pagestyles/userprofile.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskAadhar(val) {
  if (!val || val.length < 4) return val || '—';
  return 'XXXX-XXXX-' + val.slice(-4);
}

function maskPan(val) {
  if (!val || val.length < 4) return val || '—';
  return val.slice(0, 2) + 'XXXXXXX' + val.slice(-1);
}

function formatDob(val) {
  if (!val) return '—';
  const parts = val.split('-');
  if (parts.length !== 3) return val;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function emptyVal(v) {
  return v === undefined || v === null || v === '' ? '—' : v;
}

const EMPTY_FORM = {
  firstName: '', lastName: '', fatherName: '', dob: '',
  phone: '', countryCode: '', city: '', street: '',
  doorNo: '', state: '', pincode: '', aadhar: '', pan: ''
};

function profileToForm(profile) {
  return {
    firstName:   profile?.firstName   || '',
    lastName:    profile?.lastName    || '',
    fatherName:  profile?.fatherName  || '',
    dob:         profile?.dob         || '',
    phone:       profile?.phone       || '',
    countryCode: profile?.countryCode || '',
    city:        profile?.city        || '',
    street:      profile?.street      || '',
    doorNo:      profile?.doorNo      || '',
    state:       profile?.state       || '',
    pincode:     profile?.pincode     || '',
    aadhar:      profile?.aadhar      || '',
    pan:         profile?.pan         || '',
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  useAuth();

  const [profile, setProfile]       = useState(null);
  const [isEditing, setIsEditing]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [pwForm, setPwForm]         = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw]         = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [pwSaving, setPwSaving]     = useState(false);
  const [alert, setAlert]           = useState(null);
  const [profileError, setProfileError] = useState('');
  const [pwError, setPwError]       = useState('');

  // ── Fetch profile ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/user/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) { window.location.href = '/login'; return; }
        const data = await res.json();
        
        if (!res.ok) throw new Error('API failed, falling back to mock data');
        
        setProfile(data.user);
        setForm(profileToForm(data.user));
      } catch {
        // Mock data fallback
        const mockProfile = {
          role: 'Admin',
          firstName: 'Decanode',
          lastName: 'Dev',
          fatherName: 'Jamesh',
          dob: '1995-10-15',
          phone: '9876543210',
          countryCode: '+91',
          email: 'abc@gmail.com',
          userId: 'dev001',
          doorNo: 'Flat 40B',
          street: 'Main Tech Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          aadhar: '123456789012',
          pan: 'ABCDE1234F'
        };
        setProfile(mockProfile);
        setForm(profileToForm(mockProfile));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Edit handlers ──────────────────────────────────────────────────────────

  const handleEditToggle = () => {
    setForm(profileToForm(profile));
    setProfileError('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm(profileToForm(profile));
    setProfileError('');
    setIsEditing(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'pan' ? value.toUpperCase() : value }));
  };

  const validateForm = () => {
    const { phone, pincode, aadhar, pan } = form;
    if (phone && !/^\d{10}$/.test(phone)) return 'Phone number must be exactly 10 digits.';
    if (pincode && !/^\d{6}$/.test(pincode)) return 'Pincode must be exactly 6 digits.';
    if (aadhar && !/^\d{12}$/.test(aadhar)) return 'Aadhaar must be exactly 12 digits.';
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) return 'PAN format invalid (e.g., ABCDE1234F).';
    if (form.dob) {
      const d = new Date(form.dob);
      if (isNaN(d.getTime()) || d >= new Date()) return 'Date of birth must be a past date.';
    }
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setProfileError(err); return; }
    setProfileError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/user/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.status === 401) { window.location.href = '/login'; return; }
      const data = await res.json();
      if (!res.ok) { setProfileError(data.message || 'Failed to update profile.'); return; }
      setProfile(data.user);
      setIsEditing(false);
      setAlert({ type: 'success', title: 'Profile Updated', message: 'Your profile has been saved successfully.', onConfirm: () => setAlert(null) });
    } catch {
      setProfileError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Password handlers ──────────────────────────────────────────────────────

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleShowPw = (key) => {
    setShowPw(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    const { oldPassword, newPassword, confirmPassword } = pwForm;
    if (!oldPassword || !newPassword || !confirmPassword) { setPwError('All password fields are required.'); return; }
    if (newPassword !== confirmPassword) { setPwError('New password and confirmation do not match.'); return; }
    if (newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (oldPassword === newPassword) { setPwError('New password must differ from the current password.'); return; }

    setPwSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/user/password'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword })
      });
      if (res.status === 401) {
        const data = await res.json();
        // Distinguish wrong password vs expired token
        if (data.message === 'Current password is incorrect') {
          setPwError('Current password is incorrect.');
        } else {
          window.location.href = '/login';
        }
        return;
      }
      const data = await res.json();
      if (!res.ok) { setPwError(data.message || 'Failed to change password.'); return; }
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setAlert({ type: 'success', title: 'Password Changed', message: 'Your password has been updated successfully.', onConfirm: () => setAlert(null) });
    } catch {
      setPwError('Network error. Please try again.');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="up">
        <div className="up__loading">
          <div className="up__spinner" />
          <span>Loading profile…</span>
        </div>
      </div>
    );
  }

  const displayVal = (v) => {
    const raw = emptyVal(v);
    if (raw === '—') return <span className="up__field-value up__field-value--empty">—</span>;
    return <span className="up__field-value">{raw}</span>;
  };

  return (
    <div className="up">
      {/* Header */}
      <div className="up__header">
        <div className="up__header-inner">
          <div className="up__header-icon">
            <User size={22} />
          </div>
          <div className="up__title-block">
            <h1>My Profile</h1>
            <p>View and manage your personal information(Under Development improving UI / UX and backend flow )</p>
          </div>
        </div>
      </div>

      <div className="up__body">

        {/* ── Card 1: Personal Info ───────────────────────────────────────── */}
        <div className="up__section">
          <div className="up__section-header">
            <div className="up__section-title-row">
              <div className="up__section-icon">
                <User size={16} />
              </div>
              <h2 className="up__section-title">Personal Information</h2>
            </div>
            <div className="up__header-actions">
              {!isEditing && (
                <button className="up__icon-btn" onClick={handleEditToggle} title="Edit Profile">
                  <Pencil size={18} />
                </button>
              )}
              <button className="up__icon-btn" onClick={() => setShowSettings(!showSettings)} title="Settings / Change Password">
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* ── View Mode ── */}
          {!isEditing && (
            <div className="up__fields-grid">
              <div className="up__field">
                <span className="up__field-label">Full Name</span>
                {displayVal([profile?.firstName, profile?.lastName].filter(Boolean).join(' '))}
              </div>

              <div className="up__field">
                <span className="up__field-label">Father Name</span>
                {displayVal(profile?.fatherName)}
              </div>

              <div className="up__field">
                <span className="up__field-label">Date of Birth</span>
                {displayVal(profile?.dob ? formatDob(profile.dob) : '')}
              </div>

              <div className="up__field">
                <span className="up__field-label">Phone</span>
                {displayVal(profile?.phone ? `${profile.countryCode || ''} ${profile.phone}`.trim() : '')}
              </div>

              <div className="up__field">
                <span className="up__field-label">Email</span>
                {displayVal(profile?.email)}
              </div>

              {/* Address */}
              <span className="up__section-label">Address Details</span>

              <div className="up__field">
                <span className="up__field-label">Door No</span>
                {displayVal(profile?.doorNo)}
              </div>

              <div className="up__field">
                <span className="up__field-label">Street</span>
                {displayVal(profile?.street)}
              </div>

              <div className="up__field">
                <span className="up__field-label">City</span>
                {displayVal(profile?.city)}
              </div>

              <div className="up__field">
                <span className="up__field-label">State</span>
                {displayVal(profile?.state)}
              </div>

              <div className="up__field">
                <span className="up__field-label">Pincode</span>
                {displayVal(profile?.pincode)}
              </div>

              {/* Identity */}
              <span className="up__section-label">Identity Documents</span>

              <div className="up__field">
                <span className="up__field-label">Aadhaar</span>
                {displayVal(maskAadhar(profile?.aadhar))}
              </div>

              <div className="up__field">
                <span className="up__field-label">PAN</span>
                {displayVal(maskPan(profile?.pan))}
              </div>
            </div>
          )}

          {/* ── Edit Mode ── */}
          {isEditing && (
            <form onSubmit={handleSave}>
              <div className="up__fields-grid">
                {/* Read-only: email, role */}
                <div className="up__field">
                  <span className="up__field-label">Email (read-only)</span>
                  <span className="up__field-value--readonly">{profile?.email || '—'}</span>
                </div>

                <div className="up__field">
                  <span className="up__field-label">First Name</span>
                  <input className="up__input" name="firstName" value={form.firstName} onChange={handleFormChange} placeholder="First name" />
                </div>

                <div className="up__field">
                  <span className="up__field-label">Last Name</span>
                  <input className="up__input" name="lastName" value={form.lastName} onChange={handleFormChange} placeholder="Last name" />
                </div>

                <div className="up__field">
                  <span className="up__field-label">Father Name</span>
                  <input className="up__input" name="fatherName" value={form.fatherName} onChange={handleFormChange} placeholder="Father's name" />
                </div>

                <div className="up__field">
                  <span className="up__field-label">Date of Birth</span>
                  <input className="up__input" type="date" name="dob" value={form.dob} onChange={handleFormChange} />
                </div>

                <div className="up__field">
                  <span className="up__field-label">Country Code</span>
                  <input className="up__input" name="countryCode" value={form.countryCode} onChange={handleFormChange} placeholder="+91" />
                </div>

                <div className="up__field">
                  <span className="up__field-label">Phone</span>
                  <input className="up__input" name="phone" value={form.phone} onChange={handleFormChange} placeholder="10-digit phone number" maxLength={10} />
                </div>

                {/* Address */}
                <span className="up__section-label">Address Details</span>

                <div className="up__field">
                  <span className="up__field-label">Door No</span>
                  <input className="up__input" name="doorNo" value={form.doorNo} onChange={handleFormChange} placeholder="Door / Flat number" />
                </div>

                <div className="up__field">
                  <span className="up__field-label">Street</span>
                  <input className="up__input" name="street" value={form.street} onChange={handleFormChange} placeholder="Street / Area" />
                </div>

                <div className="up__field">
                  <span className="up__field-label">City</span>
                  <input className="up__input" name="city" value={form.city} onChange={handleFormChange} placeholder="City" />
                </div>

                <div className="up__field">
                  <span className="up__field-label">State</span>
                  <input className="up__input" name="state" value={form.state} onChange={handleFormChange} placeholder="State" />
                </div>

                <div className="up__field">
                  <span className="up__field-label">Pincode</span>
                  <input className="up__input" name="pincode" value={form.pincode} onChange={handleFormChange} placeholder="6-digit pincode" maxLength={6} />
                </div>

                {/* Identity */}
                <span className="up__section-label">Identity Documents</span>

                <div className="up__field">
                  <span className="up__field-label">Aadhaar (12 digits)</span>
                  <input className="up__input" name="aadhar" value={form.aadhar} onChange={handleFormChange} placeholder="123456789012" maxLength={12} />
                </div>

                <div className="up__field">
                  <span className="up__field-label">PAN</span>
                  <input className="up__input" name="pan" value={form.pan} onChange={handleFormChange} placeholder="ABCDE1234F" maxLength={10} />
                </div>
              </div>

              {profileError && <p className="up__error">{profileError}</p>}

              <div className="up__action-row">
                <button type="submit" className="up__save-btn" disabled={saving}>
                  <Save size={15} />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" className="up__cancel-btn" onClick={handleCancel} disabled={saving}>
                  <X size={15} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Card 2: Change Password ─────────────────────────────────────── */}
        {showSettings && (
        <div className="up__section">
          <div className="up__section-header">
            <div className="up__section-title-row">
              <div className="up__section-icon up__section-icon--lock">
                <Lock size={16} />
              </div>
              <h2 className="up__section-title">Change Password</h2>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="up__pw-fields">
              <div className="up__field">
                <span className="up__field-label">Current Password</span>
                <div className="up__pw-input-wrap">
                  <input
                    className="up__input"
                    type={showPw.old ? 'text' : 'password'}
                    name="oldPassword"
                    value={pwForm.oldPassword}
                    onChange={handlePwChange}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button type="button" className="up__pw-toggle" onClick={() => toggleShowPw('old')}>
                    {showPw.old ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="up__field">
                <span className="up__field-label">New Password</span>
                <div className="up__pw-input-wrap">
                  <input
                    className="up__input"
                    type={showPw.new ? 'text' : 'password'}
                    name="newPassword"
                    value={pwForm.newPassword}
                    onChange={handlePwChange}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" className="up__pw-toggle" onClick={() => toggleShowPw('new')}>
                    {showPw.new ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="up__field">
                <span className="up__field-label">Confirm New Password</span>
                <div className="up__pw-input-wrap">
                  <input
                    className="up__input"
                    type={showPw.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={pwForm.confirmPassword}
                    onChange={handlePwChange}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="up__pw-toggle" onClick={() => toggleShowPw('confirm')}>
                    {showPw.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {pwError && <p className="up__error">{pwError}</p>}

            <div className="up__action-row">
              <button type="submit" className="up__save-btn" disabled={pwSaving}>
                <Lock size={15} />
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
        )}

      </div>

      {alert && <Alert {...alert} />}
    </div>
  );
}
