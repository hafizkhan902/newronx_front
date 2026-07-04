import React, { useState } from 'react';
import { useUser } from './UserContext';

// Decorative neural-tree illustration matching the brand visual.
function TreeIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 320 320"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Translucent geometric backdrop */}
      <g opacity="0.35">
        <polygon points="170,40 250,90 250,200 170,250 90,200 90,90" fill="#CBD5F5" />
        <polygon points="170,40 250,90 170,140 90,90" fill="#A5B4FC" opacity="0.5" />
        <polygon points="250,90 250,200 170,250 170,140" fill="#93C5FD" opacity="0.45" />
      </g>

      {/* Trunk */}
      <path
        d="M160 310 C 160 270 158 240 160 210"
        stroke="#0F172A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Main branches */}
      <path d="M160 220 C 140 200 120 180 100 150" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M160 220 C 180 200 200 180 220 150" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M160 210 C 158 180 156 150 160 110" stroke="#0F172A" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Sub-branches left */}
      <path d="M120 175 C 105 165 95 150 80 130" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M110 160 C 95 145 85 125 75 105" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M135 195 C 120 180 105 170 90 175" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Sub-branches right */}
      <path d="M200 175 C 215 165 225 150 240 130" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M210 160 C 225 145 235 125 245 105" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M185 195 C 200 180 215 170 230 175" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Center top branches */}
      <path d="M160 140 C 150 120 145 100 140 80" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M160 140 C 170 120 175 100 180 80" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M160 110 C 158 95 158 85 160 70" stroke="#0F172A" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Teal accent leaf-nodes */}
      {[
        [80, 130], [75, 105], [90, 175], [100, 150],
        [240, 130], [245, 105], [230, 175], [220, 150],
        [140, 80], [180, 80], [160, 70],
        [110, 95], [210, 95], [125, 145], [195, 145],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="6" fill="#5EEAD4" opacity="0.45" />
          <circle cx={cx} cy={cy} r="3.5" fill="#14B8A6" />
        </g>
      ))}

      {/* Subtle ground shadow */}
      <ellipse cx="160" cy="312" rx="60" ry="4" fill="#0F172A" opacity="0.08" />
    </svg>
  );
}

// Light, minimal page background: soft gradient base + two blurred brand orbs + subtle dot grid.
function PageBackground({ children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-white to-teal-50 overflow-hidden">
      {/* Soft brand orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-teal-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -right-40 w-[32rem] h-[32rem] rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-cyan-200/30 blur-3xl" />

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(15, 23, 42, 0.18) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage:
            'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)',
        }}
      />

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Reusable left brand panel for login & signup screens
function BrandPanel() {
  return (
    <div className="bg-[#EEF1FB] p-8 sm:p-12 flex flex-col justify-between min-h-[420px]">
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
          Welcome to<br />Newronx
        </h1>
        <p className="mt-6 text-gray-600 text-base max-w-sm leading-relaxed">
          Connecting visionary founders with institutional grade capital and world-class mentorship
        </p>
      </div>
      <div className="mt-10 flex justify-center">
        <TreeIllustration className="w-64 h-64 sm:w-72 sm:h-72" />
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { setUser } = useUser();

  // Signup fields
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Email verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationUserId, setVerificationUserId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🔄 LoginPage - Login attempt with email:', email);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      console.log('📡 LoginPage - Login response status:', res.status);

      const data = await res.json();
      console.log('📦 LoginPage - Login response data:', data);

      if (!res.ok) throw new Error(data.message || 'Login failed');

      console.log('✅ LoginPage - Login successful, fetching complete user profile...');

      try {
        const profileResponse = await fetch('/api/users/profile', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const userData = profileData.data || profileData.user || profileData;
          console.log('👤 LoginPage - Complete user profile fetched:', userData);

          setUser(userData);
          console.log('🔄 LoginPage - User context updated directly');

          onLogin && onLogin(userData);
        } else {
          console.warn('⚠️ LoginPage - Could not fetch user profile, using login response data');
          const userData = data.user || data;
          setUser(userData);
          onLogin && onLogin(userData);
        }
      } catch (profileError) {
        console.error('❌ LoginPage - Error fetching user profile:', profileError);
        const userData = data.user || data;
        setUser(userData);
        onLogin && onLogin(userData);
      }

      setLoading(false);
      console.log('🔄 LoginPage - Login process completed');
    } catch (err) {
      console.error('❌ LoginPage - Login error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');

    if (signupPassword !== signupConfirm) {
      setSignupError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: signupFirstName,
          lastName: signupLastName,
          fullName: signupFullName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword,
          confirmPassword: signupConfirm
        })
      });

      const data = await res.json();
      console.log('📦 LoginPage - Registration response:', data);

      if (!res.ok) {
        if (data.message && data.message.includes('verification email')) {
          throw new Error('Account created but verification email failed to send. Please try again or contact support.');
        }
        throw new Error(data.message || 'Registration failed');
      }

      const userId = data.userId || data.user?.id || data.id;
      if (!userId) {
        throw new Error('Registration successful but user ID not received. Please try again.');
      }

      setVerificationUserId(userId);
      setShowVerification(true);
      setSignupLoading(false);

      console.log('✅ LoginPage - Registration successful, showing verification step');

    } catch (err) {
      console.error('❌ LoginPage - Registration error:', err);
      setSignupError(err.message);
      setSignupLoading(false);
    }
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setVerificationError('');

    if (!otpCode || otpCode.length !== 6) {
      setVerificationError('Please enter a valid 6-digit code');
      return;
    }

    setVerificationLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: verificationUserId,
          otpCode: otpCode
        })
      });

      const data = await res.json();
      console.log('📦 LoginPage - Email verification response:', data);

      if (!res.ok) throw new Error(data.message || 'Email verification failed');

      console.log('✅ LoginPage - Email verified successfully');

      try {
        console.log('🔄 LoginPage - Auto-login after verification...');
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: signupEmail,
            password: signupPassword
          })
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          console.log('✅ LoginPage - Auto-login successful after verification');

          const profileResponse = await fetch('/api/users/profile', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const userData = profileData.data || profileData.user || profileData;
            console.log('👤 LoginPage - Complete user profile fetched after verification:', userData);

            setUser(userData);
            onLogin && onLogin(userData);
          } else {
            const userData = loginData.user || loginData;
            setUser(userData);
            onLogin && onLogin(userData);
          }
        } else {
          console.warn('⚠️ LoginPage - Auto-login failed after verification, user needs to login manually');
          if (data.user) {
            setUser(data.user);
            onLogin && onLogin(data.user);
          }
        }
      } catch (loginErr) {
        console.error('❌ LoginPage - Auto-login error after verification:', loginErr);
        if (data.user) {
          setUser(data.user);
          onLogin && onLogin(data.user);
        }
      }

      setVerificationLoading(false);

    } catch (err) {
      console.error('❌ LoginPage - Email verification error:', err);
      setVerificationError(err.message);
      setVerificationLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess('');
    setVerificationError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: signupEmail
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message && data.message.includes('verification email')) {
          throw new Error('Failed to resend verification email. Please check your email settings or contact support.');
        }
        throw new Error(data.message || 'Failed to resend verification code');
      }

      setResendSuccess('Verification code sent successfully! Check your email.');
      setResendLoading(false);

      setTimeout(() => setResendSuccess(''), 3000);

    } catch (err) {
      console.error('❌ LoginPage - Resend verification error:', err);
      setVerificationError(err.message);
      setResendLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess('');

    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      setForgotPasswordError('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      const data = await res.json();
      console.log('📦 LoginPage - Forgot password response:', data);

      if (!res.ok) throw new Error(data.message || 'Failed to send reset email');

      setForgotPasswordSuccess('Check your email for password reset link');
      setForgotPasswordLoading(false);

      setTimeout(() => {
        setForgotPasswordSuccess('');
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      }, 5000);

    } catch (err) {
      console.error('❌ LoginPage - Forgot password error:', err);
      setForgotPasswordError(err.message);
      setForgotPasswordLoading(false);
    }
  };

  const handleBackToSignup = () => {
    setShowVerification(false);
    setVerificationUserId('');
    setOtpCode('');
    setVerificationError('');
    setResendSuccess('');
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  // ---------- Forgot password screen ----------
  if (showForgotPassword) {
    return (
      <PageBackground>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-black/5 px-8 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-sm text-gray-500 mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  value={forgotPasswordEmail}
                  onChange={e => setForgotPasswordEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            {forgotPasswordError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                {forgotPasswordError}
              </div>
            )}

            {forgotPasswordSuccess && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-100 p-2.5 rounded-lg">
                {forgotPasswordSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-700 text-white py-3 rounded-lg font-semibold hover:bg-teal-800 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail('');
                  setForgotPasswordError('');
                  setForgotPasswordSuccess('');
                }}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </PageBackground>
    );
  }

  // ---------- Email verification screen ----------
  if (showVerification) {
    return (
      <PageBackground>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-black/5 px-8 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-sm text-gray-500 mb-1">We've sent a 6-digit verification code to:</p>
          <p className="text-sm font-medium text-gray-900 mb-8">{signupEmail}</p>

          <form onSubmit={handleEmailVerification} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">
                VERIFICATION CODE
              </label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-center text-lg tracking-[0.5em] text-gray-900 placeholder-gray-300 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                value={otpCode}
                onChange={handleOtpChange}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            {verificationError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                {verificationError}
              </div>
            )}

            {resendSuccess && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-100 p-2.5 rounded-lg">
                {resendSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-700 text-white py-3 rounded-lg font-semibold hover:bg-teal-800 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={verificationLoading || otpCode.length !== 6}
            >
              {verificationLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="text-center space-y-3 pt-2">
              <button
                type="button"
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>

              <div className="text-xs text-gray-500">
                <p>Having trouble receiving the email?</p>
                <p className="mt-1">
                  Check your spam folder or{' '}
                  <a
                    href={`mailto:support@studentmate.com?subject=Email Verification Issue&body=Hi, I'm having trouble receiving the verification email for account: ${signupEmail}`}
                    className="text-teal-700 hover:underline"
                  >
                    contact support
                  </a>
                </p>
              </div>

              <div>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={handleBackToSignup}
                >
                  ← Back to Sign Up
                </button>
              </div>
            </div>
          </form>
        </div>
      </PageBackground>
    );
  }

  // ---------- Main login / signup screen (two-column card) ----------
  return (
    <PageBackground>
      <div className="w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 grid grid-cols-1 md:grid-cols-2">
        <BrandPanel />

        <div className="bg-white p-8 sm:p-12 flex flex-col justify-center">
          {showSignup ? (
            <form onSubmit={handleSignup} className="w-full max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
              <p className="text-sm text-gray-500 mt-1 mb-6">Join Newronx and start building today</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">FIRST NAME</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    value={signupFirstName}
                    onChange={e => setSignupFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">LAST NAME</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    value={signupLastName}
                    onChange={e => setSignupLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">FULL NAME</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  value={signupFullName}
                  onChange={e => setSignupFullName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">EMAIL ADDRESS</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">PHONE</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  value={signupPhone}
                  onChange={e => setSignupPhone(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">PASSWORD</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zM5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">CONFIRM PASSWORD</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zM5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    value={signupConfirm}
                    onChange={e => setSignupConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {signupError && (
                <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                  {signupError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-teal-700 text-white py-3 rounded-lg font-semibold hover:bg-teal-800 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={signupLoading}
              >
                {signupLoading ? 'Creating Account...' : (
                  <>
                    Create Account
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>

              <div className="text-center mt-6 text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-teal-700 font-semibold hover:underline"
                  onClick={() => setShowSignup(false)}
                >
                  Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="w-full max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
              <p className="text-sm text-gray-500 mt-1 mb-8">Enter your credentials to access your portal</p>

              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-gray-500 tracking-wider mb-2">
                  PASSWORD
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3V7a3 3 0 10-6 0v1c0 1.657 1.343 3 3 3zM5 11h14v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end mb-5">
                <button
                  type="button"
                  className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
                <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-teal-700 text-white py-3 rounded-lg font-semibold hover:bg-teal-800 transition text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Signing in...' : (
                  <>
                    Sign In
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-500">Or Continue with</span>
                </div>
              </div>

              {/* Social login button - styled per design as LinkedIn,
                  but keeps existing Google OAuth handler so backend logic is untouched. */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect width="24" height="24" rx="3" fill="#0A66C2" />
                  <path
                    fill="#FFFFFF"
                    d="M7.4 9.6h2.4v7.6H7.4V9.6zM8.6 6.3a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM11.4 9.6h2.3v1h.03c.32-.6 1.1-1.24 2.27-1.24 2.43 0 2.88 1.6 2.88 3.68v4.16h-2.4v-3.69c0-.88-.02-2-1.22-2-1.22 0-1.4.95-1.4 1.94v3.75h-2.4V9.6z"
                  />
                </svg>
                <span>LinkedIn</span>
              </button>

              <div className="text-center mt-8 text-sm text-gray-500">
                New to Newronx?{' '}
                <button
                  type="button"
                  className="text-teal-700 font-semibold tracking-wide hover:underline"
                  onClick={() => setShowSignup(true)}
                >
                  Join the NEWRONX
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageBackground>
  );
}

export default LoginPage;
