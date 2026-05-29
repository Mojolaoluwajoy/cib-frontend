import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
        />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <i className={`ti ${show ? 'ti-eye-off' : 'ti-eye'} text-base`} />
        </button>
      </div>
    </div>
  );
}

export default function CompleteRegistration() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const tokenFromUrl   = searchParams.get('token') || '';

  const [form, setForm] = useState({
    token:     tokenFromUrl,
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    nin:       '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.token || !form.firstName || !form.lastName ||
        !form.email || !form.password || !form.nin) {
      setError('Please fill in all fields.'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    if (form.nin.length !== 11) {
      setError('NIN must be exactly 11 digits.'); return;
    }
    setLoading(true);
    try {
      await api.post('/users/create', {
        token:     form.token,
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
        nin:       form.nin,
      });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Your token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-7">
          <div className="text-gray-900 font-semibold text-lg tracking-tight">CIB Platform</div>
          <div className="text-gray-400 text-xs mt-1">Corporate Internet Banking</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {!done ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Complete your registration
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {tokenFromUrl
                  ? 'Your invitation token has been pre-filled. Enter your details below.'
                  : 'Enter the token from your invitation email and your personal details.'
                }
              </p>

              {tokenFromUrl && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-5">
                  <i className="ti ti-circle-check" />
                  Invitation token received
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                  <i className="ti ti-alert-circle" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Invitation token
                  </label>
                  <div className="relative">
                    <i className="ti ti-key absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input name="token" type="text" value={form.token}
                      onChange={handleChange}
                      readOnly={!!tokenFromUrl}
                      placeholder="Paste token from invitation email"
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm outline-none transition-all placeholder:text-gray-300
                        ${tokenFromUrl
                          ? 'border-green-200 bg-green-50 text-green-800 cursor-not-allowed'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First name</label>
                    <input name="firstName" type="text" value={form.firstName} onChange={handleChange}
                      placeholder="e.g. Chidi"
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last name</label>
                    <input name="lastName" type="text" value={form.lastName} onChange={handleChange}
                      placeholder="e.g. Okeke"
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email address</label>
                  <div className="relative">
                    <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="e.g. chidi@dangote.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
                  </div>
                </div>

                <PasswordField
                  label="Password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NIN</label>
                  <div className="relative">
                    <i className="ti ti-id absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input name="nin" type="text" value={form.nin} onChange={handleChange}
                      placeholder="11-digit National Identification Number"
                      maxLength={11}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-2">
                  {loading
                    ? <><i className="ti ti-loader animate-spin" /> Creating account...</>
                    : <><i className="ti ti-user-check" /> Create my account</>
                  }
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <i className="ti ti-circle-check text-green-600 text-3xl" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Account created!</h2>
              <p className="text-sm text-gray-500 mb-4">Redirecting you to login in a moment...</p>
              <Link to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all">
                <i className="ti ti-login" /> Go to login now
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}