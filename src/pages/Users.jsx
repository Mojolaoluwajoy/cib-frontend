import { useState } from 'react';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import api from '../api/axios';

function Pill({ status }) {
  const map = {
    ACTIVE:   'bg-green-50 text-green-700',
    INACTIVE: 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

const EDITABLE_FIELDS = [
  { key: 'firstName', label: 'First name',    type: 'text',  placeholder: 'Enter new first name' },
  { key: 'lastName',  label: 'Last name',     type: 'text',  placeholder: 'Enter new last name'  },
  { key: 'email',     label: 'Email address', type: 'email', placeholder: 'Enter new email'      },
];

export default function Users() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [loaded, setLoaded]         = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [selected, setSelected]     = useState([]);
  const [form, setForm]             = useState({ firstName:'', lastName:'', email:'' });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError]     = useState('');

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get('/users/viewAll');
      setUsers(res.data.data || []);
      setLoaded(true);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(u) {
    setEditUser(u);
    setSelected([]);
    setForm({ firstName:'', lastName:'', email:'' });
    setEditError(''); setEditSuccess('');
  }

  function toggleField(key) {
    if (selected.includes(key)) {
      setSelected(selected.filter(k => k !== key));
      setForm({ ...form, [key]: '' });
    } else {
      setSelected([...selected, key]);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setEditError(''); setEditSuccess('');
    if (selected.length === 0) {
      setEditError('Please select at least one field to update.'); return;
    }
    if (selected.some(key => !form[key])) {
      setEditError('Please fill in all selected fields.'); return;
    }
    const body = {};
    selected.forEach(key => { body[key] = form[key]; });
    setEditLoading(true);
    try {
      await api.put(`/users/${editUser.userId}/profile`, body);
      setEditSuccess('Profile updated successfully!');
      setSelected([]);
      setForm({ firstName:'', lastName:'', email:'' });
      loadUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <Layout>
      <Topbar title="Users" subtitle="View and manage users in your organization" />
      <main className="p-7 flex flex-col gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">All users</h2>
              <p className="text-xs text-gray-500 mt-0.5">Users in your organization</p>
            </div>
            <button onClick={loadUsers} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
              <i className={`ti ti-refresh ${loading ? 'animate-spin' : ''}`} />
              {loaded ? 'Refresh' : 'Load users'}
            </button>
          </div>
          {!loaded ? (
            <div className="text-center py-12">
              <i className="ti ti-users text-3xl text-gray-200 block mb-2" />
              <p className="text-sm text-gray-400">Click "Load users" to view all users</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Name','Email','Role','Status','Action'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                      <td className="px-3 py-3 text-gray-500">{u.email}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">{u.role}</span>
                      </td>
                      <td className="px-3 py-3"><Pill status={u.status} /></td>
                      <td className="px-3 py-3">
                        <button onClick={() => openEdit(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all">
                          <i className="ti ti-pencil" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Edit user profile</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select which fields to update for <strong>{editUser.firstName} {editUser.lastName}</strong>
            </p>
            {editSuccess && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-circle-check" /> {editSuccess}
              </div>
            )}
            {editError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-alert-circle" /> {editError}
              </div>
            )}
            <form onSubmit={handleUpdate} className="flex flex-col gap-3">
              {EDITABLE_FIELDS.map(({ key, label, type, placeholder }) => {
                const isSel = selected.includes(key);
                return (
                  <div key={key}
                    className={`border rounded-xl p-4 transition-all ${isSel ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleField(key)}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSel ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {isSel && <i className="ti ti-check text-white" style={{ fontSize: '11px' }} />}
                      </div>
                      <span className={`text-sm font-medium ${isSel ? 'text-blue-700' : 'text-gray-700'}`}>{label}</span>
                    </div>
                    {isSel && (
                      <div className="mt-3" onClick={e => e.stopPropagation()}>
                        <input type={type} value={form[key]}
                          onChange={e => setForm({ ...form, [key]: e.target.value })}
                          placeholder={placeholder} autoFocus
                          className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all placeholder:text-gray-300" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all">
                  Cancel
                </button>
                {selected.length > 0 && (
                  <button type="submit" disabled={editLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                    {editLoading
                      ? <><i className="ti ti-loader animate-spin" /> Saving...</>
                      : <><i className="ti ti-check" /> Save changes</>
                    }
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}