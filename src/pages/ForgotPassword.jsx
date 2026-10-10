import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:3001/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email.');
      }

      setSentToEmail(email.trim());
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
        {/* Left Form Section */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>

            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
              <KeyRound className="w-7 h-7" />
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-800 mb-2">
              Forgot Password?
            </h2>
            <p className="text-slate-500 text-sm lg:text-base">
              No worries! Enter your registered email address and we'll send you a secure link to reset your password.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold text-sm border border-red-100 flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-6 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Check Your Inbox</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                We've sent a password reset link to{' '}
                <strong className="text-slate-900 font-semibold">{sentToEmail}</strong>.
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Please check your inbox (and spam or junk folder). Click the link in the email to set your new password.
              </p>
              
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => { setSuccess(false); }}
                  className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-all shadow-sm"
                >
                  Resend Link
                </button>
                <Link
                  to="/login"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                >
                  Return to Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder-slate-400"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex justify-center items-center gap-2 disabled:bg-slate-400 cursor-pointer"
              >
                {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-slate-600 text-sm">
            Remembered your credentials?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Right Informational Banner */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative flex-col justify-center items-center text-center p-12 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="z-10 max-w-sm"
          >
            <div className="w-20 h-20 bg-blue-500/30 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl">
              <KeyRound className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Account Recovery</h3>
            <p className="text-blue-100 text-base leading-relaxed">
              We ensure your healthcare profile and personal health records remain private and secure at all times.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
