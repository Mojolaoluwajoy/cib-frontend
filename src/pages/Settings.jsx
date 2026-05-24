import { useState } from 'react';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
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

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <i className={`ti ${show ? 'ti-eye-off' : 'ti-eye'} text-base`} />
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // ── Change password ──
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError]     = useState('');

  // ── Currency management ──
  const [currCode, setCurrCode]     = useState('NGN');
  const [currStatus, setCurrStatus] = useState('ACTIVE');
  const [currLoading, setCurrLoading] = useState(false);
  const [currSuccess, setCurrSuccess] = useState('');
  const [currError, setCurrError]     = useState('');

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError(''); setPwSuccess('');

    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirm) {
      setPwError('Please fill in all fields.'); return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError('New passwords do not match.'); return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.'); return;
    }
    if (pwForm.newPassword === pwForm.oldPassword) {
      setPwError('New password must be different from current password.'); return;
    }

    setPwLoading(true);
    try {
      await api.post('/auth/password/reset', {
        email:       user.email,
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess('Password changed successfully!');
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password. Check your current password.');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleCurrencyStatus(e) {
    e.preventDefault();
    setCurrError(''); setCurrSuccess('');
    setCurrLoading(true);
    try {
      await api.post('/currencies/status', { code: currCode, status: currStatus });
      setCurrSuccess(`${currCode} status updated to ${currStatus} successfully!`);
    } catch (err) {
      setCurrError(err.response?.data?.message || 'Failed to update currency status.');
    } finally {
      setCurrLoading(false);
    }
  }

  function handleLogout() {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      window.location.href = '/login';
    }
  }

  return (
    <Layout>
      <Topbar title="Settings" subtitle="Manage your account and system settings" />

      <main className="p-7 flex flex-col gap-6 max-w-2xl">

        {/* ── Profile banner ── */}
        <div className="bg-slate-900 rounded-xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-white font-semibold text-lg">{user?.name || '—'}</div>
            <div className="text-white/50 text-sm mt-0.5">{user?.email || '—'}</div>
            <span className="inline-block text-xs font-semibold bg-blue-600 text-white px-2.5 py-0.5 rounded-full mt-2">
              {user?.role || '—'}
            </span>
          </div>
        </div>

        {/* ── Change password ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <i className="ti ti-lock text-blue-600 text-base" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Change password</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Update your account password
                </div>
              </div>
            </div>

            {/* This button toggles the form — hidden until clicked */}
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all"
              >
                <i className="ti ti-pencil" /> Change password
              </button>
            )}
          </div>

          {/* Form only appears when showPasswordForm is true */}
          {showPasswordForm && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <Alert success={pwSuccess} error={pwError} />
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <PasswordField
                  label="Current password"
                  value={pwForm.oldPassword}
                  onChange={e => setPwForm({...pwForm, oldPassword: e.target.value})}
                  placeholder="Enter your current password"
                />
                <PasswordField
                  label="New password"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
                  placeholder="Min. 8 characters"
                />
                <PasswordField
                  label="Confirm new password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({...pwForm, confirm: e.target.value})}
                  placeholder="Repeat new password"
                />
                <div className="flex gap-3 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
                      setPwError(''); setPwSuccess('');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
                  >
                    {pwLoading
                      ? <><i className="ti ti-loader animate-spin" /> Updating...</>
                      : <><i className="ti ti-lock" /> Update password</>
                    }
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Currency management — SUPER_ADMIN only ── */}
        {isSuperAdmin && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <i className="ti ti-currency-dollar text-green-600 text-base" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Currency management</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Enable or disable currencies in the system
                </div>
              </div>
            </div>

            <Alert success={currSuccess} error={currError} />

            <form onSubmit={handleCurrencyStatus} className="flex gap-3 items-end flex-wrap">
              <div className="flex flex-col gap-1.5 flex-1 min-w-36">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Currency
                </label>
                <select
                  value={currCode}
                  onChange={e => setCurrCode(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="NGN">NGN — Nigerian Naira</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-36">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  New status
                </label>
                <select
                  value={currStatus}
                  onChange={e => setCurrStatus(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={currLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-all"
              >
                {currLoading
                  ? <><i className="ti ti-loader animate-spin" /> Updating...</>
                  : <><i className="ti ti-refresh" /> Update status</>
                }
              </button>
            </form>
          </div>
        )}

        {/* ── Sign out ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <i className="ti ti-logout text-red-500 text-base" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Sign out</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  You will be returned to the login page
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all"
            >
              <i className="ti ti-logout" /> Sign out
            </button>
          </div>
        </div>

      </main>
    </Layout>
  );
}
