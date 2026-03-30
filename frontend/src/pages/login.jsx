import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, UserPlus, MapPin, Phone, Mail } from 'lucide-react';
import { Dropdown, cityOptions } from '../components/Button';
import DatePicker from '../components/datepicker';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';
import Masonry from '../components/Masonry';
import '../styles/pagestyles/login.css';

const loginItems = [
    { id: "L1", img: "https://picsum.photos/id/1015/800/1000?grayscale", flipImg: "https://picsum.photos/id/1024/800/800?grayscale", url: "#", height: 400, name: "div-l-1" },
    { id: "L2", img: "https://picsum.photos/id/1011/800/900?grayscale", flipImg: "https://picsum.photos/id/1025/800/1000?grayscale", url: "#", height: 400, name: "div-l-2" },
    { id: "L3", img: "https://picsum.photos/id/1020/800/1200?grayscale", flipImg: "https://picsum.photos/id/1031/800/900?grayscale", url: "#", height: 400, name: "div-l-3" },
    { id: "L4", img: "https://picsum.photos/id/1043/800/800?grayscale", flipImg: "https://picsum.photos/id/1032/800/1200?grayscale", url: "#", height: 400, name: "div-l-4" },
    { id: "L5", img: "https://picsum.photos/id/1035/800/1000?grayscale", flipImg: "https://picsum.photos/id/1033/800/700?grayscale", url: "#", height: 400, name: "div-l-5" },
    { id: "L6", img: "https://picsum.photos/id/1016/800/700?grayscale", flipImg: "https://picsum.photos/id/1036/800/1100?grayscale", url: "#", height: 400, name: "div-l-6" },
    { id: "L7", img: "https://picsum.photos/id/1021/800/1100?grayscale", flipImg: "https://picsum.photos/id/1037/800/800?grayscale", url: "#", height: 400, name: "div-l-7" },
    { id: "L8", img: "https://picsum.photos/id/1022/800/900?grayscale", flipImg: "https://picsum.photos/id/1038/800/1000?grayscale", url: "#", height: 400, name: "div-l-8" },
    { id: "L9", img: "https://picsum.photos/id/1023/800/800?grayscale", flipImg: "https://picsum.photos/id/1039/800/900?grayscale", url: "#", height: 400, name: "div-l-9" }
];

const signupItems = [
    { id: "S1", img: "https://picsum.photos/id/1024/800/800?grayscale", flipImg: "https://picsum.photos/id/1015/800/1000?grayscale", url: "#", height: 400, name: "div-s-1" },
    { id: "S2", img: "https://picsum.photos/id/1025/800/1000?grayscale", flipImg: "https://picsum.photos/id/1011/800/900?grayscale", url: "#", height: 400, name: "div-s-2" },
    { id: "S3", img: "https://picsum.photos/id/1031/800/900?grayscale", flipImg: "https://picsum.photos/id/1020/800/1200?grayscale", url: "#", height: 400, name: "div-s-3" },
    { id: "S4", img: "https://picsum.photos/id/1032/800/1200?grayscale", flipImg: "https://picsum.photos/id/1043/800/800?grayscale", url: "#", height: 400, name: "div-s-4" },
    { id: "S5", img: "https://picsum.photos/id/1033/800/700?grayscale", flipImg: "https://picsum.photos/id/1035/800/1000?grayscale", url: "#", height: 400, name: "div-s-5" },
    { id: "S6", img: "https://picsum.photos/id/1036/800/1100?grayscale", flipImg: "https://picsum.photos/id/1016/800/700?grayscale", url: "#", height: 400, name: "div-s-6" },
    { id: "S7", img: "https://picsum.photos/id/1037/800/800?grayscale", flipImg: "https://picsum.photos/id/1021/800/1100?grayscale", url: "#", height: 400, name: "div-s-7" },
    { id: "S8", img: "https://picsum.photos/id/1038/800/1000?grayscale", flipImg: "https://picsum.photos/id/1022/800/900?grayscale", url: "#", height: 400, name: "div-s-8" },
    { id: "S9", img: "https://picsum.photos/id/1039/800/900?grayscale", flipImg: "https://picsum.photos/id/1023/800/800?grayscale", url: "#", height: 400, name: "div-s-9" }
];

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    firstName: '',
    lastName: '',
    fatherName: '',
    dob: null,
    city: '',
    countryCode: '+91',
    phone: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [alertState, setAlertState] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const countryCodes = [
    { code: '+91', country: 'India', countryCode: 'in' },
    { code: '+65', country: 'Singapore', countryCode: 'sg' },
    { code: '+1', country: 'USA', countryCode: 'us' },
    { code: '+44', country: 'UK', countryCode: 'gb' },
    { code: '+61', country: 'Australia', countryCode: 'au' },
    { code: '+86', country: 'China', countryCode: 'cn' },
    { code: '+81', country: 'Japan', countryCode: 'jp' },
    { code: '+33', country: 'France', countryCode: 'fr' },
    { code: '+49', country: 'Germany', countryCode: 'de' },
    { code: '+39', country: 'Italy', countryCode: 'it' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setAlertState({ type: 'loading', title: 'Please wait...' });
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: formData.userId, password: formData.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      login(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setAlertState(null);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setAlertState({ type: 'loading', title: 'Sending Request...' });

    const startTime = Date.now();

    try {
      const res = await fetch(apiUrl('/api/signup/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          fatherName: formData.fatherName,
          dob: formData.dob,
          city: formData.city,
          countryCode: formData.countryCode,
          phone: formData.phone,
          email: formData.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      const elapsedTime = Date.now() - startTime;
      const remainingTime = 2000 - elapsedTime;

      setTimeout(() => {
        setAlertState({
          type: 'success',
          title: 'Request Sent',
          message: 'Request sent for admin. Wait for confirmation mail.'
        });

        // Reset form and switch to login view after a delay
        setTimeout(() => {
          setIsLogin(true);
          setFormData({
            userId: '',
            password: '',
            firstName: '',
            lastName: '',
            fatherName: '',
            dob: null,
            city: '',
            countryCode: '+91',
            phone: '',
            email: ''
          });
          setAlertState(null);
        }, 3000);
      }, Math.max(0, remainingTime));

    } catch (err) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = 2000 - elapsedTime;

      setTimeout(() => {
        setAlertState({ type: 'error', title: 'Signup Failed', message: err.message });
      }, Math.max(0, remainingTime));
    }
  };

  const handleAlertConfirm = () => {
    setAlertState(null);
  };

  return (
    <div className={`login-main-container ${!isLogin ? 'signup-active' : ''}`}>
      {alertState && (
        <Alert
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onConfirm={handleAlertConfirm}
        />
      )}
      {/* Left White Background - Form Container */}
      <div className="whole-form-container">
        <div className={`form-container ${isLogin ? 'login-mode' : 'signup-mode'}`}>
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          {isLogin && (
            <p className="form-subtitle">
              Please sign in to your account
            </p>
          )}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

          <form onSubmit={isLogin ? handleLogin : handleSignup}>
            {!isLogin && (
              <>
                <div className="form-row">
                  {/* First Name Input */}
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <div className="input-wrapper">
                      <User className="form-input-icon" size={20} />
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                  </div>

                  {/* Last Name Input */}
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <div className="input-wrapper">
                      <User className="form-input-icon" size={20} />
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Father's name (required by API for user ID / password generation) */}
                <div className="form-group">
                  <label htmlFor="fatherName">Father&apos;s name</label>
                  <div className="input-wrapper">
                    <User className="form-input-icon" size={20} />
                    <input
                      type="text"
                      id="fatherName"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter father&apos;s full name"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="form-group">
                  <label>Date of Birth</label>
                  <DatePicker
                    name="dob"
                    value={formData.dob}
                    onChange={(value) => handleInputChange({ target: { name: 'dob', value } })}
                    required={true}
                  />
                </div>

                {/* City Dropdown */}
                <div className="form-group">
                  <Dropdown
                    label="City"
                    name="city"
                    options={cityOptions}
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Select your city"
                    icon={MapPin}
                    required
                  />
                </div>

                {/* Phone Number with Country Code */}
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <div className="phone-input-wrapper">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
                      className="country-code-select"
                    >
                      {countryCodes.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.code} {item.country}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input phone-input"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-wrapper">
                    <Mail className="form-input-icon" size={20} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {isLogin && (
              <>
                {/* User ID Input */}
                <div className="form-group">
                  <label htmlFor="userId">User ID</label>
                  <div className="input-wrapper">
                    <User className="form-input-icon" size={20} />
                    <input
                      type="text"
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your user ID"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="form-group">
                  <div className="password-header">
                    <label htmlFor="password">Password</label>
                    <button type="button" className="forgot-password-link">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="input-wrapper">
                    <Lock className="form-input-icon" size={20} />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && <p className="error-message" style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}

            {/* Login/Signup Button */}
            <button type="submit" className="login-button" disabled={!!alertState}>
              <LogIn size={20} />
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Link */}
          <p className="toggle-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className="signup-link"
              onClick={() => setIsLogin(!isLogin)}
            >
              <UserPlus size={16} />
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>

      {/* Right Dark Background with Pattern */}
      <div className="pattern-container finance-pattern">
        {isLogin ? (
          <Masonry
            key="login-masonry"
            items={loginItems}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover
            hoverScale={0.95}
            blurToFocus
            colorShiftOnHover={false}
            explicitWidth={true}
            explicitPosition="absolute"
            columnCount={3}
          />
        ) : (
          <Masonry
            key="signup-masonry"
            items={signupItems}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="top"
            scaleOnHover
            hoverScale={0.95}
            blurToFocus
            colorShiftOnHover={false}
            explicitWidth={true}
            explicitPosition="absolute"
            columnCount={3}
          />
        )}
      </div>
    </div>
  );
}
