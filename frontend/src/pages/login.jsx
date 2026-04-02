import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/api';
import { AnimatedButton, Dropdown, cityOptions } from '../components/Button';
import DatePicker from '../components/datepicker';
import Loader from '../components/loader';

const CONFIG = {
  carousel: {
    transitionSpeed: 0.7,
    autoplayInterval: 2000,
    scaleDropoff: 0.19,
    spreadX: 20,
    dropY: 10,
    // Card dimensions (responsive: mobile sm  / tablet md  / desktop lg )
    cardWidth: { sm: 280, md: 320, lg: 500},   // in pixels
    cardHeight: { sm: 380, md: 450, lg: 500},  // in pixels
  },
  theme: {
    accentColor: '#fbbf24',    // Golden amber - complements maroon
    panelBg: '#450a0a',        // Deep maroon
    bgLight: '#fef2f2',        // Light rose tint background
  }
};

// --- ICONS (Inline SVGs) ---
const Icons = {
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>,
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  Loader: () => <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
};

// --- CAROUSEL CARDS DATA ---
const LOGIN_CARDS = [
  { id: 1, title: 'Regulatory', keyword: 'compliance', img: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop' },
  { id: 2, title: 'Licence', keyword: 'management', img: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=800&auto=format&fit=crop' },
  { id: 3, title: 'Network', keyword: 'audit', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop' },
  { id: 4, title: 'Mobile Apps', keyword: 'development', img: 'https://images.unsplash.com/photo-1509343252989-198994fa86c4?q=80&w=800&auto=format&fit=crop' },
  { id: 5, title: 'Web Dev', keyword: 'solutions', img: 'https://images.unsplash.com/photo-1580238053412-19cce48cb262?q=80&w=800&auto=format&fit=crop' },
  { id: 6, title: 'Custom Software', keyword: 'innovation', img: 'https://images.unsplash.com/photo-1496660505504-20d0fa8ef9de?q=80&w=800&auto=format&fit=crop' },
  { id: 7, title: 'ERP Software', keyword: 'enterprise', img: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?q=80&w=800&auto=format&fit=crop' },
];

const SIGNUP_CARDS = [
  { id: 8, title: 'IoT Solutions', keyword: 'connectivity', img: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=800&auto=format&fit=crop' },
  { id: 9, title: 'RFID', keyword: 'tracking', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop' },
  { id: 10, title: 'Security', keyword: 'protection', img: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop' },
  { id: 11, title: 'Analytics', keyword: 'insights', img: 'https://images.unsplash.com/photo-1514315384763-ba401779410f?q=80&w=800&auto=format&fit=crop' },
  { id: 12, title: 'Cloud', keyword: 'scalability', img: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=800&auto=format&fit=crop' },
  { id: 13, title: 'Support', keyword: 'excellence', img: 'https://images.unsplash.com/photo-1496062031456-07b8f162a322?q=80&w=800&auto=format&fit=crop' },
  { id: 14, title: 'Consulting', keyword: 'expertise', img: 'https://images.unsplash.com/photo-1507369512168-9b7ee6caee1a?q=80&w=800&auto=format&fit=crop' },
];

const COUNTRY_OPTIONS = [
  { value: '+91', label: '+91 - India', shortLabel: '+91' },
  { value: '+65', label: '+65 - Singapore', shortLabel: '+65' },
  { value: '+1', label: '+1 - USA', shortLabel: '+1' },
  { value: '+44', label: '+44 - UK', shortLabel: '+44' },
  { value: '+61', label: '+61 - Australia', shortLabel: '+61' },
  { value: '+86', label: '+86 - China', shortLabel: '+86' },
  { value: '+81', label: '+81 - Japan', shortLabel: '+81' },
  { value: '+33', label: '+33 - France', shortLabel: '+33' },
  { value: '+49', label: '+49 - Germany', shortLabel: '+49' },
  { value: '+39', label: '+39 - Italy', shortLabel: '+39' },
];

export default function LoginPage() {
  const isScrolling = useRef(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // UI Flow State
  const [activePanel, setActivePanel] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const currentCards = useMemo(() => {
    if (activePanel === 'login' || activePanel === 'forgot') return LOGIN_CARDS;
    if (activePanel === 'signup') return SIGNUP_CARDS;
    return [...LOGIN_CARDS, ...SIGNUP_CARDS];
  }, [activePanel]);
  
  // Forms State
  const [formData, setFormData] = useState({
    userId: '', password: '', firstName: '', lastName: '', fatherName: '',
    dob: '', city: '', countryCode: '+91', phone: '', email: ''
  });
  
  const [forgotData, setForgotData] = useState({ email: '', otp: '', password: '', confirmPassword: '' });
  const [forgotStep, setForgotStep] = useState(1);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpTimer, setOtpTimer] = useState(0);

  // Toggles & Status
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  const OTP_VALID_TIME = 120;
  const OTP_RESEND_TIME = 60;

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 4000);
  };

  const handleInputChange = (e, target = 'form') => {
    const { name, value } = e.target;
    if (target === 'forgot') {
      setForgotData(prev => ({ 
        ...prev, 
        [name]: name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value 
      }));
    } else {
      if (name === 'phone') {
        setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  // --- REAL API HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.userId || !formData.password) {
      return showAlert('error', 'Please fill all required fields');
    }
    
    setIsLoading(true);
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
      showAlert('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (formData.phone.length !== 10) {
      return showAlert('error', 'Phone number must be exactly 10 digits');
    }
    
    setIsLoading(true);
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
      
      showAlert('success', 'Request sent for admin. Wait for confirmation mail.');
      setTimeout(() => {
        setActivePanel('login');
        setFormData({
          userId: '', password: '', firstName: '', lastName: '', fatherName: '',
          dob: '', city: '', countryCode: '+91', phone: '', email: ''
        });
      }, 2500);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Flow
  const handleForgotSendOtp = async (e) => {
    e?.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotData.email)) {
      return showAlert('error', 'Please enter a valid email');
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/password/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      
      setForgotStep(2);
      setOtpTimer(OTP_VALID_TIME);
      setResendTimer(OTP_RESEND_TIME);
      setForgotData(prev => ({ ...prev, otp: '' }));
      showAlert('success', `OTP sent to ${forgotData.email}`);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/password/resend-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP');
      
      setOtpTimer(OTP_VALID_TIME);
      setResendTimer(OTP_RESEND_TIME);
      setForgotData(prev => ({ ...prev, otp: '' }));
      showAlert('success', 'OTP resent to your email');
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    if (forgotData.otp.length !== 6) {
      return showAlert('error', 'OTP must be 6 digits');
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/password/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotData.email, otp: forgotData.otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid OTP');
      
      setForgotStep(3);
      setForgotData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      showAlert('success', 'OTP verified. Set new password.');
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    
    if (forgotData.password.length < 6) {
      return showAlert('error', 'Password must be at least 6 characters');
    }
    if (forgotData.password !== forgotData.confirmPassword) {
      return showAlert('error', 'Passwords do not match');
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/password/reset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotData.email,
          otp: forgotData.otp,
          newPassword: forgotData.password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      
      showAlert('success', 'Password reset successfully!');
      setForgotData({ email: '', otp: '', password: '', confirmPassword: '' });
      setForgotStep(1);
      setTimeout(() => setActivePanel('login'), 2000);
    } catch (err) {
      showAlert('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    setActiveIndex(0);
  }, [activePanel]);

  useEffect(() => {
    let interval;
    if (resendTimer > 0 && forgotStep === 2) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, forgotStep]);

  useEffect(() => {
    let interval;
    if (otpTimer > 0 && forgotStep === 2) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer, forgotStep]);

  const generateLongShadow = (length = 15) => {
    let shadow = '';
    const color = '#fecdd3';  // Rose-200 for maroon theme
    for (let i = 1; i <= length; i++) shadow += `${i}px ${i}px 0 ${color}${i === length ? '' : ','}`;
    return shadow;
  };

  // Carousel Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') setActiveIndex((prev) => (prev + 1) % currentCards.length);
      else if (e.key === 'ArrowLeft') setActiveIndex((prev) => (prev - 1 + currentCards.length) % currentCards.length);
    };

    const handleWheel = (e) => {
      if (isScrolling.current) return;
      isScrolling.current = true;
      setTimeout(() => { isScrolling.current = false; }, Math.max(400, CONFIG.carousel.transitionSpeed * 500));
      if (e.deltaY > 0 || e.deltaX > 0) setActiveIndex((prev) => (prev + 1) % currentCards.length);
      else if (e.deltaY < 0 || e.deltaX < 0) setActiveIndex((prev) => (prev - 1 + currentCards.length) % currentCards.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    const autoplayTimer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % currentCards.length);
    }, CONFIG.carousel.autoplayInterval);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      clearInterval(autoplayTimer);
    };
  }, [currentCards.length]);

  // Shared Form Styles - Deep Maroon Theme. 
  // Added custom autofill targeting classes to suppress native browser yellow background
  const inputStyle = "w-full bg-transparent border-b border-rose-300/30 text-white py-2 focus:outline-none focus:border-amber-400 transition-colors placeholder:text-rose-200/50 text-sm md:text-base autofill:!bg-transparent autofill:shadow-[inset_0_0_0px_1000px_transparent] autofill:[-webkit-text-fill-color:white] [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#450a0a] [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:transition-all [&:-webkit-autofill]:duration-5000";
  const btnStyle = "w-full py-3 bg-amber-400 text-rose-950 font-bold rounded-md hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <Loader />
      <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center font-sans bg-rose-50">
      
      {/* Dynamic Background Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #fecdd3 1px, transparent 1px),
            linear-gradient(to bottom, #fecdd3 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)",
          maskImage: "radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)",
        }}
      />

      {/* Alert Banner */}
      <div className={`absolute top-0 left-0 w-full z-[100] transition-all duration-500 ${alert.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className={`p-4 text-center text-white font-bold tracking-wide shadow-xl ${alert.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {alert.message}
        </div>
      </div>

      {/* Top Right Toggle Button */}
      <button
        onClick={() => setActivePanel(activePanel ? null : 'login')}
        className="absolute top-6 right-6 md:top-8 md:right-10 z-[60] text-rose-900 font-bold text-lg md:text-xl tracking-wide hover:text-rose-600 transition-colors"
      >
        {activePanel ? 'CLOSE' : 'LOGIN'}
      </button>

      {/* LEFT SLIDING PANEL (LOGIN / FORGOT PASS) */}
      <div 
        className={`absolute top-0 left-0 h-full w-full md:w-[450px] bg-gradient-to-br from-[#450a0a] to-[#7f1d1d] shadow-[20px_0_50px_rgba(127,29,29,0.4)] z-[55] flex flex-col justify-center px-8 md:px-12 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          (activePanel === 'login' || activePanel === 'forgot') ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGIN VIEW */}
        {activePanel === 'login' && (
          <div className="animate-fadeIn">
            <h2 className="text-4xl md:text-5xl font-black text-amber-400 mb-2 tracking-tighter">WELCOME.</h2>
            <p className="text-rose-200/70 mb-10 font-light">Enter your credentials to access the portal.</p>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <input name="userId" value={formData.userId} onChange={handleInputChange} className={inputStyle} type="text" placeholder="User ID" required />
              
              <div className="relative">
                <input name="password" value={formData.password} onChange={handleInputChange} className={inputStyle} type={showPassword ? 'text' : 'password'} placeholder="Password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-rose-200/60 hover:text-white">
                  {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={() => setActivePanel('forgot')} className="text-sm text-rose-200/60 hover:text-amber-400 transition-colors">Forgot Password?</button>
              </div>

              <AnimatedButton variant="maroon" loading={isLoading} loadingText="SIGNING IN...">
                SIGN IN
              </AnimatedButton>
            </form>
            
            <p className="mt-8 text-center text-sm text-rose-200/60 font-light">
              Don&apos;t have an account? 
              <button onClick={() => setActivePanel('signup')} className="text-amber-400 hover:text-white font-bold ml-2 transition-colors">Sign Up</button>
            </p>
          </div>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {activePanel === 'forgot' && (
          <div className="animate-fadeIn">
            <button onClick={() => { setActivePanel('login'); setForgotStep(1); }} className="text-rose-200/60 hover:text-white mb-8 flex items-center gap-2">
              <Icons.ArrowLeft /> Back to Login
            </button>
            
            <h2 className="text-3xl md:text-4xl font-black text-amber-400 mb-2 tracking-tighter">RECOVER.</h2>
            <p className="text-rose-200/70 mb-10 font-light">
              {forgotStep === 1 ? 'Enter your email to receive an OTP.' : forgotStep === 2 ? 'Enter the 6-digit code sent to your email.' : 'Secure your account with a new password.'}
            </p>

            {/* STEP 1: Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotSendOtp} className="flex flex-col gap-6">
                <input name="email" value={forgotData.email} onChange={(e) => handleInputChange(e, 'forgot')} className={inputStyle} type="email" placeholder="Email Address" required />
                <button type="submit" disabled={isLoading} className={btnStyle}>{isLoading ? <Icons.Loader /> : 'SEND OTP'}</button>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerifyOtp} className="flex flex-col gap-6">
                <input name="otp" value={forgotData.otp} onChange={(e) => handleInputChange(e, 'forgot')} className={`${inputStyle} text-center tracking-[0.5em] text-2xl font-bold`} type="text" maxLength={6} placeholder="------" required />
                {otpTimer > 0 && (
                  <p className="text-center text-sm text-rose-200/60">OTP valid for {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</p>
                )}
                <button type="submit" disabled={isLoading} className={btnStyle}>{isLoading ? <Icons.Loader /> : 'VERIFY OTP'}</button>
                <div className="text-center mt-4">
                  <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0 || isLoading} className={`text-sm ${resendTimer > 0 ? 'text-rose-300/50' : 'text-amber-400 hover:text-white'}`}>
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Reset Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleForgotReset} className="flex flex-col gap-6">
                <div className="relative">
                  <input name="password" value={forgotData.password} onChange={(e) => handleInputChange(e, 'forgot')} className={inputStyle} type={showPassword ? 'text' : 'password'} placeholder="New Password (min 6 chars)" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-rose-200/60 hover:text-white">{showPassword ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                </div>
                <div className="relative">
                  <input name="confirmPassword" value={forgotData.confirmPassword} onChange={(e) => handleInputChange(e, 'forgot')} className={inputStyle} type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" required minLength={6} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-rose-200/60 hover:text-white">{showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                </div>
                <button type="submit" disabled={isLoading} className={btnStyle}>{isLoading ? <Icons.Loader /> : 'RESET PASSWORD'}</button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SLIDING PANEL (SIGNUP) */}
      <div 
        className={`absolute top-0 right-0 h-full w-full md:w-[450px] md:min-w-[450px] bg-gradient-to-bl from-[#450a0a] to-[#7f1d1d] shadow-[-20px_0_50px_rgba(127,29,29,0.4)] z-[55] flex flex-col py-12 px-8 md:px-12 overflow-y-auto [&::-webkit-scrollbar]:hidden transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          activePanel === 'signup' ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <h2 className="text-4xl md:text-5xl font-black text-amber-400 mb-2 tracking-tighter">JOIN US.</h2>
        <p className="text-rose-200/70 mb-8 font-light">Create an account to become part of our network.</p>
        
        <form onSubmit={handleSignup} className="flex flex-col gap-6 mt-auto mb-auto">
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputStyle} type="text" placeholder="First Name" required />
            <input name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputStyle} type="text" placeholder="Last Name" required />
          </div>
          
          <input name="fatherName" value={formData.fatherName} onChange={handleInputChange} className={inputStyle} type="text" placeholder="Father's Name" required />
          
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="relative">
              <DatePicker
                value={formData.dob}
                onChange={(value) => handleInputChange({ target: { name: 'dob', value } })}
                required
                variant="signup"
                className={`w-full bg-transparent border-b border-rose-300/30 text-white py-2 focus:outline-none focus:border-amber-400 transition-colors placeholder:text-rose-200/50 text-sm md:text-base`}
              />
            </div>
            <div className="relative">
              <Dropdown
                options={cityOptions}
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Select City"
                name="city"
                required
                variant="signup"
                className={`w-full bg-transparent border-b border-rose-300/30 text-white py-2 focus:outline-none focus:border-amber-400 transition-colors placeholder:text-rose-200/50 text-sm md:text-base`}
              />
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="w-[70px] shrink-0 relative">
              <Dropdown
                options={COUNTRY_OPTIONS}
                value={formData.countryCode}
                onChange={handleInputChange}
                placeholder="+91"
                name="countryCode"
                required
                variant="signup"
                className={`w-full bg-transparent border-b border-rose-300/30 text-white py-2 focus:outline-none focus:border-amber-400 transition-colors placeholder:text-rose-200/50 text-sm md:text-base`}
              />
            </div>
            <input name="phone" value={formData.phone} onChange={handleInputChange} className={`${inputStyle} flex-1`} type="tel" placeholder="Phone (10 digits)" maxLength={10} required />
          </div>

          <input name="email" value={formData.email} onChange={handleInputChange} className={inputStyle} type="email" placeholder="Email Address" required />

          <AnimatedButton variant="maroon" loading={isLoading} loadingText="CREATING ACCOUNT...">
            CREATE ACCOUNT
          </AnimatedButton>
        </form>
        
        <p className="mt-8 text-center text-sm text-rose-200/60 font-light">
          Already have an account? 
          <button onClick={() => setActivePanel('login')} className="text-amber-400 hover:text-white font-bold ml-2 transition-colors">Log In</button>
        </p>
      </div>

      {/* Top Left Background Heading */}
      <div className="absolute top-6 left-6 md:top-8 md:left-10 select-none pointer-events-none z-10">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-rose-900 leading-none tracking-tighter whitespace-nowrap" style={{ textShadow: generateLongShadow(10) }}>
          7FS - 3i SERVICES
        </h1>
      </div>

      {/* Main Carousel Area */}
      <div className={`absolute inset-0 z-40 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        (activePanel === 'login' || activePanel === 'forgot') ? 'md:translate-x-[225px]' : activePanel === 'signup' ? 'md:-translate-x-[225px]' : 'translate-x-0'
      }`} style={{ perspective: '1200px' }}>
        {currentCards.map((card, index) => {
          const totalCards = currentCards.length;
          let offset = ((index - activeIndex) % totalCards + totalCards) % totalCards;
          if (offset > Math.floor(totalCards / 2)) offset -= totalCards;
          
          const absOffset = Math.abs(offset);
          const scale = Math.max(0.4, 1 - absOffset * CONFIG.carousel.scaleDropoff);
          const translateXpx = offset * CONFIG.carousel.spreadX * 10; // Convert to pixels (approx)
          const translateY = absOffset * CONFIG.carousel.dropY; 
          const zIndex = 50 - absOffset;
          const opacity = Math.max(0, 1 - absOffset * 0.35);

          return (
            <div
              key={card.id}
              onClick={() => setActiveIndex(index)}
              className="absolute cursor-pointer"
              style={{
                left: '50%',
                top: '50%',
                transition: `all ${CONFIG.carousel.transitionSpeed}s cubic-bezier(0.25, 1, 0.5, 1)`,
                transform: `translate(-50%, -50%) translateX(${translateXpx}px) translateY(${translateY}vh) scale(${scale})`,
                zIndex: zIndex, 
                opacity: opacity, 
                pointerEvents: opacity === 0 ? 'none' : 'auto',
              }}
            >
              <div 
                className="relative overflow-hidden shadow-2xl group bg-black rounded-lg border border-white/10"
                style={{
                  width: `${CONFIG.carousel.cardWidth.lg}px`,
                  height: `${CONFIG.carousel.cardHeight.lg}px`,
                }}
              >
                <img src={card.img} alt={card.title} className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" draggable={false} />
                <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-transparent" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Sentence Footer */}
      <div className={`absolute bottom-12 flex z-40 text-center px-4 drop-shadow-lg transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        (activePanel === 'login' || activePanel === 'forgot') ? 'md:translate-x-[225px]' : activePanel === 'signup' ? 'md:-translate-x-[225px]' : 'translate-x-0'
      }`}>
        <p className="text-lg sm:text-2xl text-rose-700/70 font-light tracking-wide">
          Empowering your business with <span className="font-black text-rose-900 uppercase transition-all duration-500 inline-block min-w-[150px]">{currentCards[activeIndex]?.keyword}</span>.
        </p>
      </div>

    </div>
    </>
  );
}
