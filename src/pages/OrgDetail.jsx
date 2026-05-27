import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import api from '../api/axios';

function Pill({ status, type }) {
  if (type === 'status') {
    const map = {
      APPROVED: 'bg-green-50 text-green-700', ACTIVE: 'bg-green-50 text-green-700',
      PENDING:  'bg-amber-50 text-amber-700', INACTIVE: 'bg-amber-50 text-amber-700',
      REJECTED: 'bg-red-50 text-red-700',     FAILED:   'bg-red-50 text-red-700',
      DISABLED: 'bg-gray-100 text-gray-500',
    };
    return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
  }
  const map = {
    INTERNAL_TRANSFER: 'bg-blue-50 text-blue-700',
    EXTERNAL_PAYOUT:   'bg-purple-50 text-purple-700',
    EXTERNAL_FUNDING:  'bg-green-50 text-green-700',
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>{(status||'').replace(/_/g,' ')}</span>;
}

function formatMoney(amount) {
  if (!amount && amount !== 0) return '—';
  return '₦' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

const TABS = [
  { key: 'overview',      label: 'Overview',      icon: 'ti-layout-dashboard' },
  { key: 'accounts',      label: 'Accounts',      icon: 'ti-building-bank'    },
  { key: 'transactions',  label: 'Transactions',  icon: 'ti-arrows-exchange'  },
  { key: 'users',         label: 'Users',         icon: 'ti-users'            },
  { key: 'create-account',label: 'Create Account',icon: 'ti-plus'             },
];

export default function OrgDetail() {
  const { id } = useParams();
  const [org, setOrg]               = useState(null);
  const [accounts, setAccounts]     = useState([]);
  const [transactions, setTxns]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('overview');

  // Create account form
  const CURRENCIES = ['NGN','USD','GBP','EUR'];
  const ACCOUNT_TYPES = ['CURRENT','SAVINGS','PAYROLL','REVENUE','EXPENSE','ASSET'];
  const [accForm, setAccForm]         = useState({ type: '', currencyCode: '' });
  const [accLoading, setAccLoading]   = useState(false);
  const [accSuccess, setAccSuccess]   = useState('');
  const [accError, setAccError]       = useState('');

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      const [orgRes, accRes, txnRes, usrRes] = await Promise.allSettled([
        api.post('/organizations/findBy', Number(id)),
        api.get(`/accounts/organization/${id}`),
        api.get(`/transactions/organization/${id}?page=0&size=20`),
        api.get('/users/viewAll'),
      ]);
      if (orgRes.status === 'fulfilled') setOrg(orgRes.value.data.data);
      if (accRes.status === 'fulfilled') setAccounts(accRes.value.data.data || []);
      if (txnRes.status === 'fulfilled') setTxns(txnRes.value.data.data?.content || txnRes.value.data.data || []);
      if (usrRes.status === 'fulfilled') setUsers(usrRes.value.data.data || []);
    } catch {
      // individual errors handled above
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAccount(e) {
    e.preventDefault();
    setAccError(''); setAccSuccess('');
    if (!accForm.type || !accForm.currencyCode) {
      setAccError('Please select account type and currency.'); return;
    }
    setAccLoading(true);
    try {
      const res = await api.post('/accounts/create', {
        type: accForm.type,
        currencyCode: { currencyCode: accForm.currencyCode },
        organizationId: Number(id),
      });
      setAccSuccess(`Account created! Number: ${res.data.data?.accountNumber || '—'}`);
      setAccForm({ type: '', currencyCode: '' });
      loadAll();
    } catch (err) {
      setAccError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setAccLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <Topbar title="Organization Detail" subtitle="Loading..." />
        <main className="p-7"><p className="text-sm text-gray-400">Loading...</p></main>
      </Layout>
    );
  }

  if (!org) {
    return (
      <Layout>
        <Topbar title="Organization Detail" subtitle="Not found" />
        <main className="p-7">
          <p className="text-sm text-red-500">Organization not found.</p>
          <Link to="/org-onboarding" className="text-blue-600 text-sm hover:underline mt-2 inline-block">← Back</Link>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <Topbar
        title={org.name}
        subtitle="Acting on behalf of this organization"
      />
      <main className="p-7 flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <Link to="/org-onboarding"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <i className="ti ti-arrow-left" /> Back to approvals
          </Link>
          <Link to={`/organizations/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all">
            <i className="ti ti-pencil" /> Edit organization
          </Link>
        </div>

        {/* Org summary banner */}
        <div className="bg-slate-900 rounded-xl p-6 grid grid-cols-4 gap-4">
          {[
            { label: 'Organization',  value: org.name                        },
            { label: 'Status',        value: org.organizationStatus          },
            { label: 'DVA bank',      value: org.dvaBankName || 'Pending'    },
            { label: 'DVA account',   value: org.dvaAccountNumber || 'Pending' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-lg p-3">
              <div className="text-white/50 text-xs mb-1">{label}</div>
              <div className="text-white text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1.5 flex-wrap w-fit">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <i className={`ti ${icon} text-base`} /> {label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total accounts',     value: accounts.length,     icon: 'ti-building-bank',  color: 'bg-blue-50 text-blue-600'   },
              { label: 'Total transactions', value: transactions.length, icon: 'ti-arrows-exchange', color: 'bg-green-50 text-green-600' },
              { label: 'Total users',        value: users.length,        icon: 'ti-users',           color: 'bg-purple-50 text-purple-600'},
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <i className={`ti ${icon} text-base`} />
                  </div>
                </div>
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Accounts tab ── */}
        {activeTab === 'accounts' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Accounts for {org.name}</h2>
            {accounts.length === 0 ? (
              <div className="text-center py-10">
                <i className="ti ti-building-bank text-3xl text-gray-200 block mb-2" />
                <p className="text-sm text-gray-400">No accounts found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Account number','Type','Currency','Total balance','Available'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono text-xs">{acc.accountNumber}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">{acc.type}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-500">{acc.currencyCode?.currencyCode || '—'}</td>
                        <td className="px-3 py-3 font-medium">{formatMoney(acc.totalBalance)}</td>
                        <td className="px-3 py-3 text-gray-500">{formatMoney(acc.availableBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Transactions tab ── */}
        {activeTab === 'transactions' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Transactions for {org.name}</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <i className="ti ti-arrows-exchange text-3xl text-gray-200 block mb-2" />
                <p className="text-sm text-gray-400">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Reference','Type','Amount','Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono text-xs">{t.transactionReference || '—'}</td>
                        <td className="px-3 py-3"><Pill status={t.type} type="type" /></td>
                        <td className="px-3 py-3 font-medium">{formatMoney(t.amount)}</td>
                        <td className="px-3 py-3"><Pill status={t.status} type="status" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Users tab ── */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Users for {org.name}</h2>
            {users.length === 0 ? (
              <div className="text-center py-10">
                <i className="ti ti-users text-3xl text-gray-200 block mb-2" />
                <p className="text-sm text-gray-400">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Name','Email','Role','Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-medium">{u.firstName} {u.lastName}</td>
                        <td className="px-3 py-3 text-gray-500">{u.email}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">{u.role}</span>
                        </td>
                        <td className="px-3 py-3"><Pill status={u.status} type="status" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Create account tab ── */}
        {activeTab === 'create-account' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Create account for {org.name}
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              This account will be linked to {org.name} automatically.
            </p>

            {accSuccess && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-circle-check" /> {accSuccess}
              </div>
            )}
            {accError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-alert-circle" /> {accError}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account type</label>
                <select value={accForm.type}
                  onChange={e => setAccForm({ ...accForm, type: e.target.value })}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="">Select type</option>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Currency</label>
                <select value={accForm.currencyCode}
                  onChange={e => setAccForm({ ...accForm, currencyCode: e.target.value })}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="">Select currency</option>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={accLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                  {accLoading
                    ? <><i className="ti ti-loader animate-spin" /> Creating...</>
                    : <><i className="ti ti-plus" /> Create account</>
                  }
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </Layout>
  );
}