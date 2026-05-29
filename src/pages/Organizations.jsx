import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import api from '../api/axios';

function Pill({ status }) {
  const map = {
    APPROVED: 'bg-green-50 text-green-700',
    PENDING:  'bg-amber-50 text-amber-700',
    REJECTED: 'bg-red-50 text-red-700',
    DISABLED: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function Organizations() {
  const [orgs, setOrgs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('ALL');

  async function loadOrgs() {
    setLoading(true);
    try {
      const res = await api.get('/organizations/viewAll');
      setOrgs(res.data.data || []);
      setLoaded(true);
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = orgs.filter(o => {
    const matchesSearch = !search ||
      (o.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.registrationNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' ||
      (o.organizationStatus || '').toUpperCase() === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <Topbar title="Organizations" subtitle="All registered organizations — click any row to manage" />
      <main className="p-7 flex flex-col gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">All organizations</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Click an organization to view accounts, transactions, users and perform actions on their behalf
              </p>
            </div>
            <button onClick={loadOrgs} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
              <i className={`ti ti-refresh ${loading ? 'animate-spin' : ''}`} />
              {loaded ? 'Refresh' : 'Load organizations'}
            </button>
          </div>

          {/* Filters — only show when loaded */}
          {loaded && (
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or reg. number..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all placeholder:text-gray-300" />
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {['ALL','PENDING','APPROVED','REJECTED','DISABLED'].map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                      ${filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loaded ? (
            <div className="text-center py-12">
              <i className="ti ti-building text-3xl text-gray-200 block mb-2" />
              <p className="text-sm text-gray-400">Click "Load organizations" to view all</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">
                {search || filter !== 'ALL' ? 'No organizations match your filter' : 'No organizations found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Organization','Reg. number','Status','DVA account','Actions'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium text-gray-900">{org.name}</td>
                      <td className="px-3 py-3 text-gray-500">{org.registrationNumber}</td>
                      <td className="px-3 py-3"><Pill status={org.organizationStatus} /></td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">
                        {org.dvaAccountNumber || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/organizations/${org.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all">
                            <i className="ti ti-building" /> Manage
                          </Link>
                          <Link to={`/organizations/${org.id}/edit`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-all">
                            <i className="ti ti-pencil" /> Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3 px-3">
                Showing {filtered.length} of {orgs.length} organizations
              </p>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}