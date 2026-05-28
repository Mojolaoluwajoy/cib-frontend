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

export default function AllUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const [search, setSearch]   = useState('');

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get('/users/viewAll');
      // SUPER_ADMIN sees all users — backend returns all
      // filter out SUPER_ADMIN itself from the list
      const all = (res.data.data || []).filter(u => u.role !== 'SUPER_ADMIN');
      setUsers(all);
      setLoaded(true);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (u.firstName || '').toLowerCase().includes(s) ||
      (u.lastName  || '').toLowerCase().includes(s) ||
      (u.email     || '').toLowerCase().includes(s) ||
      (u.role      || '').toLowerCase().includes(s)
    );
  });

  return (
    <Layout>
      <Topbar title="All Users" subtitle="View all users registered across all organizations" />
      <main className="p-7 flex flex-col gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">All users</h2>
              <p className="text-xs text-gray-500 mt-0.5">All users across all organizations</p>
            </div>
            <button onClick={loadUsers} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
              <i className={`ti ti-refresh ${loading ? 'animate-spin' : ''}`} />
              {loaded ? 'Refresh' : 'Load all users'}
            </button>
          </div>

          {/* Search bar — only show when loaded */}
          {loaded && (
            <div className="relative mb-4">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or role..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
          )}

          {!loaded ? (
            <div className="text-center py-12">
              <i className="ti ti-users text-3xl text-gray-200 block mb-2" />
              <p className="text-sm text-gray-400">Click "Load all users" to view</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">
                {search ? 'No users match your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Name','Email','Role','Status','Organization'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="px-3 py-3 text-gray-500">{u.email}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-3 py-3"><Pill status={u.status} /></td>
                      <td className="px-3 py-3 text-gray-500">
                        {u.organizationId?.name || u.organization?.name || u.organizationName || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3 px-3">
                Showing {filtered.length} of {users.length} users
              </p>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}