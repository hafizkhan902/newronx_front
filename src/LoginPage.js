import React, { useState } from 'react';
import { useUser } from './UserContext';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { setUser } = useUser(); // Direct access to user context
  
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
      
      // Fetch complete user profile after successful login
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
          
          // Directly update user context
          setUser(userData);
          console.log('🔄 LoginPage - User context updated directly');
          
          // Also call the callback for backward compatibility
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
    
    // Basic validation
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
        // Handle specific email sending errors
        if (data.message && data.message.includes('verification email')) {
          throw new Error('Account created but verification email failed to send. Please try again or contact support.');
        }
        throw new Error(data.message || 'Registration failed');
      }
      
      // Check if we have user ID for verification
      const userId = data.userId || data.user?.id || data.id;
      if (!userId) {
        throw new Error('Registration successful but user ID not received. Please try again.');
      }
      
      // Store user ID for verification
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
      
      // Email verified successfully
      console.log('✅ LoginPage - Email verified successfully');
      
      // Automatically log the user in after successful verification
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
          
          // Fetch complete user profile
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
          // Still update user context with verification data if available
          if (data.user) {
            setUser(data.user);
            onLogin && onLogin(data.user);
          }
        }
      } catch (loginErr) {
        console.error('❌ LoginPage - Auto-login error after verification:', loginErr);
        // Fallback to verification data
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
        // Handle specific resend errors
        if (data.message && data.message.includes('verification email')) {
          throw new Error('Failed to resend verification email. Please check your email settings or contact support.');
        }
        throw new Error(data.message || 'Failed to resend verification code');
      }
      
      setResendSuccess('Verification code sent successfully! Check your email.');
      setResendLoading(false);
      
      // Clear success message after 3 seconds
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
      
      // Clear success message after 5 seconds and close modal
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
    // Redirect to Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  // Forgot password modal
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 px-8 py-10 w-full max-w-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-6 text-center">Reset Password</h1>
          
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Email Address</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={forgotPasswordEmail}
                onChange={e => setForgotPasswordEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>
            
            {forgotPasswordError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {forgotPasswordError}
              </div>
            )}
            
            {forgotPasswordSuccess && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                {forgotPasswordSuccess}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition text-sm mb-3"
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                className="text-xs text-gray-500 hover:underline"
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
      </div>
    );
  }

  // Email verification step
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 px-8 py-10 w-full max-w-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-6 text-center">Verify Your Email</h1>
          
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              We've sent a 6-digit verification code to:
            </p>
            <p className="text-sm font-medium text-gray-900">{signupEmail}</p>
          </div>
          
          <form onSubmit={handleEmailVerification} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Verification Code</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-center text-lg tracking-widest"
                value={otpCode}
                onChange={handleOtpChange}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            
            {verificationError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {verificationError}
              </div>
            )}
            
            {resendSuccess && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                {resendSuccess}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition text-sm mb-3"
              disabled={verificationLoading || otpCode.length !== 6}
            >
              {verificationLoading ? 'Verifying...' : 'Verify Email'}
            </button>
            
            <div className="text-center space-y-2">
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
              
              <div className="text-xs text-gray-500 mt-4">
                <p>Having trouble receiving the email?</p>
                <p className="mt-1">
                  Check your spam folder or{' '}
                  <a 
                    href={`mailto:support@studentmate.com?subject=Email Verification Issue&body=Hi, I'm having trouble receiving the verification email for account: ${signupEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    contact support
                  </a>
                </p>
              </div>
              
              <div>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:underline"
                  onClick={handleBackToSignup}
                >
                  ← Back to Sign Up
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={showSignup ? handleSignup : handleLogin} className="bg-white border border-gray-200 px-8 py-10 w-full max-w-sm">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">{showSignup ? 'Create Account' : 'Login to Startup Validator'}</h1>
        {showSignup ? (
          <>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">First Name</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={signupFirstName}
                onChange={e => setSignupFirstName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Last Name</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={signupLastName}
                onChange={e => setSignupLastName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Full Name</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={signupFullName}
                onChange={e => setSignupFullName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Email</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Phone</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={signupPhone}
                onChange={e => setSignupPhone(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Confirm Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={signupConfirm}
                onChange={e => setSignupConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {signupError && <div className="mb-4 text-xs text-red-600">{signupError}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition text-sm mb-2"
              disabled={signupLoading}
            >
              {signupLoading ? 'Creating Account...' : 'Create Account'}
            </button>
            <button
              type="button"
              className="w-full text-xs text-gray-500 hover:underline mt-2"
              onClick={() => setShowSignup(false)}
            >
              Already have an account? Login
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Email</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 font-semibold">Password</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="mb-4 text-xs text-red-600">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition text-sm mb-2"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
            
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded font-medium hover:bg-gray-50 transition text-sm mb-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Login with Google
            </button>
            <div className="text-center space-y-2">
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
              <div>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:underline"
                  onClick={() => setShowSignup(true)}
                >
                  Don&apos;t have an account? Sign up
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

export default LoginPage; 