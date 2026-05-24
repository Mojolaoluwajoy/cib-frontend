import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function Alert({ success, error }) {
  if (success) return (
    <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
      <i className="ti ti-circle-check" /> {success}
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
      <i className="ti ti-alert-circle" /> {error}
    </div>
  );
  return null;
}

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter token + new password
  const [email, setEmail]       = useState('');
  const [token, setToken]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Success, setStep1Success] = useState('');
  const [step1Error, setStep1Error]     = useState('');

  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Success, setStep2Success] = useState('');
  const [step2Error, setStep2Error]     = useState('');
  const [done, setDone]                 = useState(false);

  async function handleRequestToken(e) {
    e.preventDefault();
    setStep1Error(''); setStep1Success('');
    if (!email) { setStep1Error('Please enter your email address.'); return; }
    setStep1Loading(true);
    try {
      await api.post('/auth/password/token', email);
      setStep1Success(`Token sent to ${email}! Check your inbox.`);
      setTimeout(() => setStep(2), 1500);
    } catch (err) {
      setStep1Error(err.response?.data?.message || 'Email not found. Please try again.');
    } finally {
      setStep1Loading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setStep2Error(''); setStep2Success('');
    if (!token || !newPassword) {
      setStep2Error('Please fill in both fields.'); return;
    }
    if (newPassword.length < 8) {
      setStep2Error('Password must be at least 8 characters.'); return;
    }
    setStep2Loading(true);
    try {
      await api.post('/auth/forgotten/password', { email, token, newPassword });
      setStep2Success('Password reset successfully! Redirecting to login...');
      setDone(true);
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (err) {
      setStep2Error(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setStep2Loading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors">
          <i className="ti ti-arrow-left" /> Back to login
        </Link>

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="text-gray-900 font-semibold text-lg">CIB Platform</div>
          <div className="text-gray-400 text-xs mt-1">Corporate Internet Banking</div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-7">
          {[
            { num: 1, label: 'Enter email'   },
            { num: 2, label: 'Enter token'   },
            { num: 3, label: 'New password'  },
          ].map(({ num, label }, i) => {
            const isDone   = step > num;
            const isActive = step === num;
            return (
              <div key={num} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`h-px w-8 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                    ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {isDone ? <i className="ti ti-check text-xs" /> : num}
                  </div>
                  <span className={`text-xs font-medium
                    ${isDone ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

          {/* ── Step 1: Enter email ── */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Forgot your password?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email and we'll send you a token to reset your password.
              </p>

              <Alert success={step1Success} error={step1Error} />

              <form onSubmit={handleRequestToken} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Email address
                  </label>
                  <div className="relative">
                    <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setStep1Error(''); }}
                      placeholder="e.g. chidi@dangote.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>
                <button type="submit" disabled={step1Loading}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                  {step1Loading
                    ? <><i className="ti ti-loader animate-spin" /> Sending...</>
                    : <><i className="ti ti-send" /> Send reset token</>
                  }
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Enter token + new password ── */}
          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Reset your password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter the token from your email and choose a new password.
              </p>

              <Alert success={step2Success} error={step2Error} />

              {!done && (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Reset token
                    </label>
                    <div className="relative">
                      <i className="ti ti-key absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                      <input
                        type="text"
                        value={token}
                        onChange={e => { setToken(e.target.value); setStep2Error(''); }}
                        placeholder="Paste the token from your email"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                      />
                    </div>
                    <span className="text-xs text-gray-400">Check your inbox and spam folder</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      New password
                    </label>
                    <div className="relative">
                      <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setStep2Error(''); }}
                        placeholder="Min. 8 characters"
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} text-base`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-1">
                    <button type="submit" disabled={step2Loading}
                      className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                      {step2Loading
                        ? <><i className="ti ti-loader animate-spin" /> Resetting...</>
                        : <><i className="ti ti-lock-check" /> Reset password</>
                      }
                    </button>
                    <button type="button" onClick={() => setStep(1)}
                      className="text-xs text-center text-blue-600 hover:underline">
                      ← Use a different email
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Remember your password?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}