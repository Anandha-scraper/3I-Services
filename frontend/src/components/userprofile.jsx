import React, { useState, useEffect } from 'react';
import { User, Lock, Pencil, X, Save, Eye, EyeOff, Settings, CheckCircle2, AlertCircle, MapPin, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import Alert from './Alert';
import '../styles/componentstyles/userprofile.css';

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

// ── Reusable Input Component
const InputField = ({ label, name, value, onChange, placeholder, type = "text", maxLength, readOnly }) => (
  <div className="profile-field">
    <label className="profile-field-label">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      readOnly={readOnly}
      className="profile-input"
    />
  </div>
);

// Reusable View Field Component
const ViewField = ({ label, value, isMasked }) => {
  const displayValue = emptyVal(value);
  const isEmpty = displayValue === '—';

  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className={`profile-field-value ${isEmpty ? 'empty' : isMasked ? 'masked' : ''}`}>
        {displayValue}
      </span>
    </div>
  );
};

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
        const res = await apiFetch('/user/profile');
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
      const res = await apiFetch('/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
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
      const res = await apiFetch('/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="profile-loading-container">
        <div className="profile-loading-content">
          <div className="profile-spinner"></div>
          <p className="profile-loading-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || '—';

  return (
    <div className="profile-container">
      <div className="profile-wrapper">

        {/* ── Header Card ───────────────────────────────────────────────── */}
        <div className="profile-header">
          <div className="profile-header-banner"></div>

          <div className="profile-header-content">
            <div className="profile-header-inner">
              {/* Avatar */}
              <div className="profile-avatar">
                <User size={48} style={{ color: 'inherit' }} />
              </div>

              {/* Title & Badge */}
              <div className="profile-title-block">
                <div>
                  <h1 className="profile-title">
                    {profile?.userId || 'User Profile'}
                  </h1>
                  <div className="profile-title-row">
                    {profile?.role && (
                      <span className="profile-role-badge">
                        {profile.role}
                      </span>
                    )}
                    <span className="profile-email">{profile?.email || 'No email provided'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="profile-actions">
                {!isEditing && (
                  <button
                    onClick={handleEditToggle}
                    className="profile-btn-edit"
                  >
                    <Pencil size={18} />
                    <span>Edit Profile</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`profile-btn-settings ${showSettings ? 'active' : ''}`}
                  title="Settings / Password"
                >
                  <Settings size={20} />
                </button>
                <button
                  disabled={profile?.userId === 'admin'}
                  className="profile-btn-delete"
                  title={profile?.userId === 'admin' ? 'Admin users cannot be deleted' : 'Delete Account'}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-content">

          {/* Personal Information Card */}
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="profile-section-icon">
                <User size={20} />
              </div>
              <h2 className="profile-section-title">Personal Information</h2>
            </div>

            {/* View Mode */}
            {!isEditing && (
              <div>
                {/* Basic Info */}
                <div className="profile-fields-grid">
                  <ViewField label="First Name" value={profile?.firstName} />
                  <ViewField label="Last Name" value={profile?.lastName} />
                  <ViewField label="Father Name" value={profile?.fatherName} />
                  <ViewField label="Date of Birth" value={profile?.dob ? formatDob(profile.dob) : ''} />
                  <ViewField label="Phone" value={profile?.phone ? `${profile.countryCode || ''} ${profile.phone}`.trim() : ''} />
                  <ViewField label="Email" value={profile?.email} />
                </div>

                {/* Address Section */}
                <div className="profile-subsection">
                  <div className="profile-section-header">
                    <div className="profile-section-icon">
                      <MapPin size={20} />
                    </div>
                    <h3 className="profile-section-title">Address Details</h3>
                  </div>
                  <div className="profile-address-grid">
                    <ViewField label="Door No" value={profile?.doorNo} />
                    <ViewField label="Street" value={profile?.street} />
                    <ViewField label="City" value={profile?.city} />
                    <ViewField label="State" value={profile?.state} />
                    <ViewField label="Pincode" value={profile?.pincode} />
                  </div>
                </div>

                {/* Identity Section */}
                <div className="profile-subsection">
                  <div className="profile-section-header">
                    <div className="profile-section-icon">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="profile-section-title">Identity Documents</h3>
                  </div>
                  <div className="profile-subsection-content">
                    <ViewField label="Aadhaar Number" value={maskAadhar(profile?.aadhar)} isMasked />
                    <ViewField label="PAN Card" value={maskPan(profile?.pan)} isMasked />
                  </div>
                </div>
              </div>
            )}

            {/* Edit Mode Form */}
            {isEditing && (
              <form onSubmit={handleSave} style={{ animation: 'fadeIn 0.3s' }}>

                {/* Basic Info */}
                <div className="profile-fields-grid">
                  <InputField label="Email (Read Only)" value={profile?.email || ''} readOnly />
                  <InputField label="First Name" name="firstName" value={form.firstName} onChange={handleFormChange} placeholder="John" />
                  <InputField label="Last Name" name="lastName" value={form.lastName} onChange={handleFormChange} placeholder="Doe" />
                  <InputField label="Father Name" name="fatherName" value={form.fatherName} onChange={handleFormChange} placeholder="Father's Name" />
                  <InputField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleFormChange} />
                  <div className="profile-input-group">
                    <div>
                      <InputField label="Code" name="countryCode" value={form.countryCode} onChange={handleFormChange} placeholder="+91" />
                    </div>
                    <div>
                      <InputField label="Phone Number" name="phone" value={form.phone} onChange={handleFormChange} placeholder="9876543210" maxLength={10} />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="profile-subsection">
                  <div className="profile-section-header">
                    <div className="profile-section-icon">
                      <MapPin size={20} />
                    </div>
                    <h3 className="profile-section-title">Address Details</h3>
                  </div>
                  <div className="profile-address-grid">
                    <InputField label="Door No / Flat" name="doorNo" value={form.doorNo} onChange={handleFormChange} placeholder="40B" />
                    <InputField label="Street / Area" name="street" value={form.street} onChange={handleFormChange} placeholder="Main Road" />
                    <InputField label="City" name="city" value={form.city} onChange={handleFormChange} placeholder="Chennai" />
                    <InputField label="State" name="state" value={form.state} onChange={handleFormChange} placeholder="Tamil Nadu" />
                    <InputField label="Pincode" name="pincode" value={form.pincode} onChange={handleFormChange} placeholder="600001" maxLength={6} />
                  </div>
                </div>

                {/* Identity Section */}
                <div className="profile-subsection">
                  <div className="profile-section-header">
                    <div className="profile-section-icon">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="profile-section-title">Identity Documents</h3>
                  </div>
                  <div className="profile-fields-grid">
                    <InputField label="Aadhaar (12 Digits)" name="aadhar" value={form.aadhar} onChange={handleFormChange} placeholder="123456789012" maxLength={12} />
                    <InputField label="PAN Card" name="pan" value={form.pan} onChange={handleFormChange} placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                </div>

                {/* Error & Actions */}
                {profileError && (
                  <div className="profile-error">
                    <AlertCircle size={18} /> {profileError}
                  </div>
                )}

                <div className="profile-action-row">
                  <button type="button" onClick={handleCancel} disabled={saving} className="profile-btn profile-btn-secondary">
                    <X size={18} /> Cancel
                  </button>
                  <button type="submit" disabled={saving} className="profile-btn profile-btn-primary">
                    <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Settings / Password Modal ───── */}
      {showSettings && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <button
              onClick={() => setShowSettings(false)}
              className="profile-modal-close"
            >
              <X size={20} />
            </button>

            <div className="profile-section-header">
              <div className="profile-section-icon">
                <Lock size={20} />
              </div>
              <h2 className="profile-section-title">Security Settings</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="profile-password-fields">
                <div className="profile-field">
                  <label className="profile-field-label">Current Password</label>
                  <div className="profile-password-wrap">
                    <input
                      type={showPw.old ? 'text' : 'password'}
                      name="oldPassword"
                      value={pwForm.oldPassword}
                      onChange={handlePwChange}
                      placeholder="Enter current password"
                      className="profile-input"
                    />
                    <button type="button" onClick={() => toggleShowPw('old')} className="profile-password-toggle">
                      {showPw.old ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-field-label">New Password</label>
                  <div className="profile-password-wrap">
                    <input
                      type={showPw.new ? 'text' : 'password'}
                      name="newPassword"
                      value={pwForm.newPassword}
                      onChange={handlePwChange}
                      placeholder="Min. 6 characters"
                      className="profile-input"
                    />
                    <button type="button" onClick={() => toggleShowPw('new')} className="profile-password-toggle">
                      {showPw.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-field-label">Confirm New Password</label>
                  <div className="profile-password-wrap">
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={pwForm.confirmPassword}
                      onChange={handlePwChange}
                      placeholder="Re-enter new password"
                      className="profile-input"
                    />
                    <button type="button" onClick={() => toggleShowPw('confirm')} className="profile-password-toggle">
                      {showPw.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {pwError && (
                <div className="profile-error border" style={{ marginTop: '1.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {pwError}
                </div>
              )}

              <button type="submit" disabled={pwSaving} className="profile-btn profile-btn-primary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}>
                <Lock size={18} /> {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {alert && <Alert {...alert} />}
    </div>
  );
}
