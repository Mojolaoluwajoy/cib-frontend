import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      const loginData = res.data.data || res.data;
      console.log('loginData:', loginData);  // ← add this

      login(loginData);
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex min-h-[560px]">

        {/* ── Left brand panel ── */}
        <div className="w-80 flex-shrink-0 bg-slate-900 p-10 flex flex-col justify-between">
          <div>
            <div className="text-white font-semibold text-lg tracking-tight">
              CIB Platform
            </div>
            <div className="text-white/40 text-xs mt-1">
              Corporate Internet Banking
            </div>
          </div>

          <div>
            <h2 className="text-white text-2xl font-semibold leading-snug tracking-tight">
              Banking operations,{' '}
              <span className="text-blue-400">simplified.</span>
            </h2>
            <p className="text-white/45 text-sm mt-3 leading-relaxed">
              Manage onboarding, accounts, transfers and payouts — all in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: 'ti-shield-check', label: 'Role-based access control' },
              { icon: 'ti-arrows-exchange', label: 'Internal & external transfers' },
              { icon: 'ti-building', label: 'Organization onboarding' },
              { icon: 'ti-cash', label: 'Paystack-powered funding' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-white/60 text-sm">
                <i className={`ti ${icon} text-blue-400 text-base`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <h3 className="text-gray-900 text-xl font-semibold tracking-tight">
            Welcome back
          </h3>
          <p className="text-gray-500 text-sm mt-1 mb-7">
            Sign in to your CIB account to continue
          </p>

          {/* Error alert */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-5">
              <i className="ti ti-alert-circle text-base" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email address
              </label>
              <div className="relative">
                <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. chidi@dangote.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} text-base`} />
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-1"
            >
              {loading
                ? <><i className="ti ti-loader animate-spin" /> Signing in...</>
                : <><i className="ti ti-login" /> Sign in</>
              }
            </button>

          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            New organization?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}