import { useState } from 'react';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// The fields a user can choose to edit
const EDITABLE_FIELDS = [
  { key: 'firstName', label: 'First name',    type: 'text',  placeholder: 'Enter new first name'  },
  { key: 'lastName',  label: 'Last name',     type: 'text',  placeholder: 'Enter new last name'   },
  { key: 'email',     label: 'Email address', type: 'email', placeholder: 'Enter new email'       },
];

export default function Profile() {
  const { user, login } = useAuth();

  // Which fields the user has selected to edit
  const [selected, setSelected] = useState([]);

  // Form values for each field
  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // Toggle a field on/off
  function toggleField(key) {
    if (selected.includes(key)) {
      // Deselecting — clear that field's value
      setSelected(selected.filter(k => k !== key));
      setForm({ ...form, [key]: '' });
    } else {
      setSelected([...selected, key]);
    }
    setError('');
    setSuccess('');
  }

  // Select all fields at once
  function selectAll() {
    if (selected.length === EDITABLE_FIELDS.length) {
      // All selected — deselect all
      setSelected([]);
      setForm({ firstName: '', lastName: '', email: '' });
    } else {
      setSelected(EDITABLE_FIELDS.map(f => f.key));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (selected.length === 0) {
      setError('Please select at least one field to update.'); return;
    }

    // Build request body with only selected fields
    const body = {};
    selected.forEach(key => {
      if (!form[key]) {
        setError(`Please fill in the ${key} field or deselect it.`);
        return;
      }
      body[key] = form[key];
    });

    // Make sure all selected fields have values
    if (selected.some(key => !form[key])) return;

    setLoading(true);
    try {
      const res = await api.put('/users/profile', body);
      const updated = res.data.data;

      // Update the auth context with new name/email
      // so the sidebar reflects the change immediately
      login({
        ...updated,
        token:     user.token,
        role:      user.role,
        firstName: updated.firstName,
        lastName:  updated.lastName,
        email:     updated.email,
      });

      setSuccess('Profile updated successfully!');
      setSelected([]);
      setForm({ firstName: '', lastName: '', email: '' });

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Topbar title="My Profile" subtitle="View and update your profile information" />

      <main className="p-7 flex flex-col gap-6 max-w-2xl">

        {/* ── Profile display card ── */}
        <div className="bg-slate-900 rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold text-lg">{user?.name || '—'}</div>
            <div className="text-white/50 text-sm mt-0.5">{user?.email || '—'}</div>
            <span className="inline-block text-xs font-semibold bg-blue-600 text-white px-2.5 py-0.5 rounded-full mt-2">
              {user?.role || '—'}
            </span>
          </div>
        </div>

        {/* ── Current profile details ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Current details</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'First name',    value: user?.name?.split(' ')[0] || '—' },
              { label: 'Last name',     value: user?.name?.split(' ')[1] || '—' },
              { label: 'Email address', value: user?.email || '—'               },
              {
                label: 'NIN',
                value: '••••••••••• (cannot be changed)',
                muted: true,
              },
            ].map(({ label, value, muted }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {label}
                </span>
                <span className={`text-sm font-medium ${muted ? 'text-gray-300 italic' : 'text-gray-900'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Edit profile ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Update profile
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Select which fields you'd like to change. NIN cannot be modified.
          </p>

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

          {/* Select all toggle */}
          <button
            type="button"
            onClick={selectAll}
            className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 mb-4"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
              ${selected.length === EDITABLE_FIELDS.length
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300'}`}>
              {selected.length === EDITABLE_FIELDS.length && (
                <i className="ti ti-check text-white" style={{ fontSize: '10px' }} />
              )}
            </div>
            {selected.length === EDITABLE_FIELDS.length
              ? 'Deselect all'
              : 'Select all fields'}
          </button>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {EDITABLE_FIELDS.map(({ key, label, type, placeholder }) => {
              const isSelected = selected.includes(key);
              return (
                <div key={key}
                  className={`border rounded-xl p-4 transition-all cursor-pointer
                    ${isSelected
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => !isSelected && toggleField(key)}
                >
                  {/* Field header with checkbox */}
                  <div className="flex items-center justify-between mb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'}`}
                        onClick={e => { e.stopPropagation(); toggleField(key); }}
                      >
                        {isSelected && (
                          <i className="ti ti-check text-white" style={{ fontSize: '11px' }} />
                        )}
                      </div>
                      <span className={`text-sm font-medium transition-colors
                        ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {label}
                      </span>
                    </div>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); toggleField(key); }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Input field — only shown when selected */}
                  {isSelected && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <input
                        type={type}
                        value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        placeholder={placeholder}
                        autoFocus
                        className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all placeholder:text-gray-300"
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Submit button — only shows when at least one field is selected */}
            {selected.length > 0 && (
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
                >
                  {loading
                    ? <><i className="ti ti-loader animate-spin" /> Saving...</>
                    : <><i className="ti ti-check" /> Save changes</>
                  }
                </button>
              </div>
            )}

          </form>
        </div>

      </main>
    </Layout>
  );
}