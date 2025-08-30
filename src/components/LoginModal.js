import React, { useState } from 'react';
import { useUser } from '../UserContext';

const LoginModal = ({ isOpen, onClose, onLoginSuccess, title = "Login to continue", description = "Please enter your credentials to access this feature." }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { setUser } = useUser();
  
  // Signup fields
  const [signupFirstName, setSignupFirstName] = useState('');
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
    
    console.log('🔄 LoginModal - Login function called with email:', email);
    
    setError('');
    setLoading(true);
    
    // Validate form data
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }
    
    try {
      console.log('📡 LoginModal - Making direct API request to localhost:2000...');
      
      // Use direct API call to localhost:2000
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      console.log('📡 LoginModal - Login response status:', res.status);
      
      const data = await res.json();
      console.log('📦 LoginModal - Login response data:', data);
      
      if (!res.ok) {
        console.error('❌ LoginModal - Login failed with status:', res.status);
        throw new Error(data.message || data.error || 'Login failed');
      }
      
      console.log('✅ LoginModal - Login successful, fetching complete user profile...');
      
      // Always fetch complete user profile after successful login
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
          console.log('👤 LoginModal - Complete user profile fetched:', userData);
          console.log('👤 LoginModal - isMentor property:', userData.isMentor);
          setUser(userData);
        } else {
          console.warn('⚠️ LoginModal - Could not fetch user profile, using login response data');
          // Fallback to login response data if profile fetch fails
          if (data && (data.user || data._id)) {
            setUser(data.user || data);
            console.log('👤 LoginModal - User context updated from login response:', data.user || data);
          }
        }
      } catch (profileError) {
        console.error('❌ LoginModal - Error fetching user profile:', profileError);
        // Fallback to login response data if profile fetch fails
        if (data && (data.user || data._id)) {
          setUser(data.user || data);
          console.log('👤 LoginModal - User context updated from login response (fallback):', data.user || data);
        }
      }
      
      setLoading(false);
      onClose(); // Close the modal
      
      // Clear form
      setEmail('');
      setPassword('');
      setError('');
      
      console.log('🔄 LoginModal - Authentication state updated, UserContext should trigger re-render');
      
      // Call the success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      
    } catch (err) {
      console.error('❌ LoginModal - Login error:', err);
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
          fullName: signupFullName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword,
          confirmPassword: signupConfirm
        })
      });
      
      const data = await res.json();
      console.log('📦 LoginModal - Registration response:', data);
      
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
      
      console.log('✅ LoginModal - Registration successful, showing verification step');
      
    } catch (err) {
      console.error('❌ LoginModal - Registration error:', err);
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
      console.log('📦 LoginModal - Email verification response:', data);
      
      if (!res.ok) throw new Error(data.message || 'Email verification failed');
      
      // Email verified successfully
      console.log('✅ LoginModal - Email verified successfully');
      
      // Update user context with verified user data
      if (data.user) {
        setUser(data.user);
        console.log('🔄 LoginModal - User context updated with verified user');
        
        // Call the success callback
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
      
      setVerificationLoading(false);
      onClose(); // Close the modal
      
    } catch (err) {
      console.error('❌ LoginModal - Email verification error:', err);
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
          userId: verificationUserId
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
      console.error('❌ LoginModal - Resend verification error:', err);
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
      console.log('📦 LoginModal - Forgot password response:', data);
      
      if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
      
      setForgotPasswordSuccess('Check your email for password reset link');
      setForgotPasswordLoading(false);
      
      // Clear success message after 5 seconds and close modal
      setTimeout(() => {
        setForgotPasswordSuccess('');
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        onClose(); // Close the modal
      }, 5000);
      
    } catch (err) {
      console.error('❌ LoginModal - Forgot password error:', err);
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

  if (!isOpen) return null;

  // Forgot password modal
  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-8 w-full max-w-sm mx-4 relative">
          <button 
            type="button" 
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" 
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Reset Password</h2>
          
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-8 w-full max-w-sm mx-4 relative">
          <button 
            type="button" 
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" 
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Verify Your Email</h2>
          
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-8 w-full max-w-sm mx-4 relative">
        <button 
          type="button" 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none" 
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6">{description}</p>
        
        <form onSubmit={showSignup ? handleSignup : handleLogin} className="space-y-4">
          {showSignup ? (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">First Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={signupFirstName}
                  onChange={e => setSignupFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={signupFullName}
                  onChange={e => setSignupFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Phone</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={signupPhone}
                  onChange={e => setSignupPhone(e.target.value)}
                  required
                />
              </div>
              <div>
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
              <div>
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
              {signupError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {signupError}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition text-sm mb-3"
                disabled={signupLoading}
              >
                {signupLoading ? 'Creating Account...' : 'Create Account'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:underline"
                  onClick={() => setShowSignup(false)}
                >
                  Already have an account? Login
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1 font-semibold">Password</label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition text-sm mb-3"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
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
                  <p className="text-xs text-gray-500 mb-3">
                    Don't have an account?
                  </p>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => setShowSignup(true)}
                  >
                    Sign up here
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginModal; 