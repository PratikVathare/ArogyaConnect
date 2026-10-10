import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowRight, ShieldAlert, KeyRound, Check, X } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fallback OTP flow fields (in case token is missing or expired)
  const [accessToken, setAccessToken] = useState('');
  const [manualOtpMode, setManualOtpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Check for token in URL hash (#access_token=...)
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;

    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(window.location.search);

    const tokenFromHash = hashParams.get('access_token');
    const tokenFromQuery = searchParams.get('access_token') || searchParams.get('token');
    const errorFromHash = hashParams.get('error_description') || hashParams.get('error');
    const errorFromQuery = searchParams.get('error_description') || searchParams.get('error');

    if (errorFromHash || errorFromQuery) {
      const decodedError = decodeURIComponent(errorFromHash || errorFromQuery).replace(/\+/g, ' ');
      setError(decodedError || 'Password reset link has expired or is invalid.');
    } else if (tokenFromHash || tokenFromQuery) {
      setAccessToken(tokenFromHash || tokenFromQuery);
    } else {
      // No token found in URL, enable manual code entry mode as fallback
      setManualOtpMode(true);
    }
  }, [location]);

  // Password requirements calculation
  const hasMinLength = password.length >= 6;
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!accessToken && (!email || !otpCode)) {
      setError('Missing authentication session. Please enter your email and verification code or request a new link.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        password,
        ...(accessToken ? { accessToken } : { email: email.trim(), otp: otpCode.trim() })
      };

      const headers = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch('http://127.0.0.1:3001/api/users/reset-password', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-6 lg:p-12 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex border border-slate-100"
      >
        {/* Left Form Area */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
              <Lock className="w-7 h-7" />
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-800 mb-2">
              Set New Password
            </h2>
            <p className="text-slate-500 text-sm lg:text-base">
              Choose a strong and secure password to protect your account.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold text-sm border border-red-100 flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                <div className="mt-2">
                  <Link to="/forgot-password" className="text-xs text-red-700 underline font-bold hover:text-red-800">
                    Request a new password reset link &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-8 text-center space-y-5"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Password Reset Complete!</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your password has been securely updated. You can now log into your account using your new credentials.
              </p>
              
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Log In to Your Account
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              {/* If in manual fallback mode without URL token */}
              {manualOtpMode && !accessToken && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-4 mb-2">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                    <KeyRound className="w-4 h-4" />
                    <span>Enter Email & Reset Code from Email</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your registered email"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Verification Code</label>
                    <input 
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium tracking-widest font-mono"
                    />
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-800"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-800"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Badges */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                  )}
                  <span className={hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    At least 6 characters
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasNumberOrSymbol ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                  )}
                  <span className={hasNumberOrSymbol ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    Contains a number or symbol
                  </span>
                </div>

                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-2">
                    {passwordsMatch ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-medium'}>
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={loading || (confirmPassword.length > 0 && !passwordsMatch)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex justify-center items-center gap-2 disabled:bg-slate-400 cursor-pointer"
              >
                {loading ? 'Saving New Password...' : 'Reset Password'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-slate-600 text-sm">
            Remember your credentials?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Right Informational Banner */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 relative flex-col justify-center items-center text-center p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="z-10 max-w-sm"
          >
            <div className="w-20 h-20 bg-blue-500/30 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Enterprise Security</h3>
            <p className="text-blue-100 text-base leading-relaxed">
              Passwords are cryptographically hashed and never stored in plain text. Your account safety is our highest priority.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
