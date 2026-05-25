import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Topbar from '../../components/Topbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

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

export default function SettingsPassword() {
  const { user } = useAuth();

  const [form, setForm]       = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.oldPassword || !form.newPassword || !form.confirm) {
      setError('Please fill in all fields.'); return;
    }
    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match.'); return;
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.'); return;
    }
    if (form.newPassword === form.oldPassword) {
      setError('New password must be different from your current password.'); return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password/reset', {
        email:       user.email,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password changed successfully!');
      setForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Topbar title="Change Password" subtitle="Update your account password" />

      <main className="p-7 max-w-lg flex flex-col gap-5">

        {/* Back link */}
        <Link to="/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <i className="ti ti-arrow-left" /> Back to settings
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">
            Change your password
          </h2>

          {success && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
              <i className="ti ti-circle-check" /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
              <i className="ti ti-alert-circle" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordField
              label="Current password"
              value={form.oldPassword}
              onChange={e => setForm({...form, oldPassword: e.target.value})}
              placeholder="Enter your current password"
            />
            <PasswordField
              label="New password"
              value={form.newPassword}
              onChange={e => setForm({...form, newPassword: e.target.value})}
              placeholder="Min. 8 characters"
            />
            <PasswordField
              label="Confirm new password"
              value={form.confirm}
              onChange={e => setForm({...form, confirm: e.target.value})}
              placeholder="Repeat new password"
            />
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                {loading
                  ? <><i className="ti ti-loader animate-spin" /> Updating...</>
                  : <><i className="ti ti-lock" /> Update password</>
                }
              </button>
            </div>
          </form>
        </div>

      </main>
    </Layout>
  );
}