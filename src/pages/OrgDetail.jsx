import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import api from '../api/axios';

function Pill({ status }) {
  const map = {
    APPROVED:  'bg-green-50 text-green-700',
    ACTIVE:    'bg-green-50 text-green-700',
    COMPLETED: 'bg-green-50 text-green-700',
    SUCCESS:   'bg-green-50 text-green-700',
    PENDING:   'bg-amber-50 text-amber-700',
    INACTIVE:  'bg-amber-50 text-amber-700',
    REJECTED:  'bg-red-50 text-red-700',
    FAILED:    'bg-red-50 text-red-700',
    DISABLED:  'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function TypePill({ type }) {
  const map = {
    INTERNAL_TRANSFER: 'bg-blue-50 text-blue-700',
    EXTERNAL_PAYOUT:   'bg-purple-50 text-purple-700',
    EXTERNAL_FUNDING:  'bg-green-50 text-green-700',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[(type||'').toUpperCase()] || 'bg-gray-100 text-gray-600'}`}>
      {(type||'').replace(/_/g,' ')}
    </span>
  );
}

function formatMoney(amount) {
  if (!amount && amount !== 0) return '—';
  return '₦' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

const TABS = [
  { key: 'overview',        label: 'Overview',        icon: 'ti-layout-dashboard' },
  { key: 'accounts',        label: 'Accounts',        icon: 'ti-building-bank'    },
  { key: 'transactions',    label: 'Transactions',    icon: 'ti-arrows-exchange'  },
  { key: 'users',           label: 'Users',           icon: 'ti-users'            },
  { key: 'create-account',  label: 'Create Account',  icon: 'ti-plus'             },
  { key: 'user-onboarding', label: 'Invite User',     icon: 'ti-user-plus'        },
];

const CURRENCIES    = ['NGN','USD','GBP','EUR'];
const ACCOUNT_TYPES = ['CURRENT','SAVINGS','PAYROLL','REVENUE','EXPENSE','ASSET'];

export default function OrgDetail() {
  const { id } = useParams();
  const orgId  = Number(id);

  const [org, setOrg]             = useState(null);
  const [accounts, setAccounts]   = useState([]);
  const [transactions, setTxns]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Create account form
  const [accForm, setAccForm]       = useState({ type: '', currencyCode: '' });
  const [accLoading, setAccLoading] = useState(false);
  const [accSuccess, setAccSuccess] = useState('');
  const [accError, setAccError]     = useState('');

  // User invitation form
  const [invite, setInvite]             = useState({ userEmail: '', role: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError]     = useState('');

  useEffect(() => {
    loadAll();
  }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      // findBy takes raw Long — send number directly
      const orgRes = await api.post('/organizations/findBy', orgId);
      setOrg(orgRes.data.data);

      const [accRes, txnRes, usrRes] = await Promise.allSettled([
        api.get(`/accounts/organization/${id}`),
        api.get(`/transactions/organization/${id}?page=0&size=20`),
        api.get('/users/viewAll'),
      ]);

      if (accRes.status === 'fulfilled')
        setAccounts(accRes.value.data.data || []);

      if (txnRes.status === 'fulfilled')
        setTxns(txnRes.value.data.data?.content || txnRes.value.data.data || []);

      if (usrRes.status === 'fulfilled') {
        const allUsers = usrRes.value.data.data || [];
        // Filter to only users belonging to this org
        // UserResponse has organizationId which is an OrganizationId object with an id field
        // Also exclude SUPER_ADMIN
        const orgUsers = allUsers.filter(u => {
          if (u.role === 'SUPER_ADMIN') return false;
          const userOrgId = u.organizationId?.id || u.organizationId;
          return Number(userOrgId) === orgId;
        });
        setUsers(orgUsers);
      }
    } catch (err) {
      console.error('Failed to load org detail:', err);
      setOrg(null);
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
        // organizationId sent so backend knows which org this is for
        // when SUPER_ADMIN creates account on behalf of an org
        organizationId: orgId,
      });
      setAccSuccess(`Account created! Number: ${res.data.data?.accountNumber || '—'}`);
      setAccForm({ type: '', currencyCode: '' });
      const accRes = await api.get(`/accounts/organization/${id}`);
      setAccounts(accRes.data.data || []);
    } catch (err) {
      setAccError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setAccLoading(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    setInviteError(''); setInviteSuccess('');
    if (!invite.userEmail || !invite.role) {
      setInviteError('Please enter email and select a role.'); return;
    }
    setInviteLoading(true);
    try {
      await api.post('/users/invitation', invite);
      setInviteSuccess(`Invitation sent to ${invite.userEmail}! They will receive a link to complete registration.`);
      setInvite({ userEmail: '', role: '' });
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInviteLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <Topbar title="Organization" subtitle="Loading..." />
        <main className="p-7 flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-400">
            <i className="ti ti-loader animate-spin text-xl" />
            <span className="text-sm">Loading organization details...</span>
          </div>
        </main>
      </Layout>
    );
  }

  if (!org) {
    return (
      <Layout>
        <Topbar title="Organization" subtitle="Not found" />
        <main className="p-7">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="text-sm font-semibold text-red-700">Organization not found</div>
            <div className="text-xs text-red-500 mt-1">ID {id} did not match any organization.</div>
          </div>
          <Link to="/organizations" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mt-4">
            <i className="ti ti-arrow-left" /> Back to organizations
          </Link>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <Topbar title={org.name} subtitle="Organization detail — acting on behalf" />
      <main className="p-7 flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <Link to="/organizations"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
            <i className="ti ti-arrow-left" /> Back to organizations
          </Link>
          <Link to={`/organizations/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-all">
            <i className="ti ti-pencil" /> Edit organization
          </Link>
        </div>

        {/* Org banner */}
        <div className="bg-slate-900 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
            {[
              { label: 'Organization',  value: org.name                              },
              { label: 'Status',        value: org.organizationStatus                },
              { label: 'DVA bank',      value: org.dvaBankName      || 'Not created' },
              { label: 'DVA account',   value: org.dvaAccountNumber || 'Not created' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1 uppercase tracking-wide">{label}</div>
                <div className="text-white text-sm font-semibold truncate">{value}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-blue-600/30 rounded-lg px-4 py-2.5 text-sm text-blue-200">
            <i className="ti ti-info-circle flex-shrink-0" />
            All actions here are on behalf of <strong className="mx-1">{org.name}</strong>. Transactions must be initiated by the organization's own MAKER.
          </div>
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

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total accounts',     value: accounts.length,     icon: 'ti-building-bank',   color: 'bg-blue-50 text-blue-600'    },
                { label: 'Total transactions', value: transactions.length, icon: 'ti-arrows-exchange', color: 'bg-green-50 text-green-600'  },
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
            {org.dvaAccountNumber && (
              <div className="bg-slate-900 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <i className="ti ti-building-bank text-white text-sm" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">Dedicated virtual account</div>
                    <div className="text-white/50 text-xs mt-0.5">Transfers here fund the organization</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Bank',           value: org.dvaBankName      },
                    { label: 'Account number', value: org.dvaAccountNumber },
                    { label: 'Account name',   value: org.name             },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 rounded-lg p-3">
                      <div className="text-white/50 text-xs mb-1 uppercase tracking-wide">{label}</div>
                      <div className="text-white text-sm font-semibold font-mono">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Accounts ── */}
        {activeTab === 'accounts' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Accounts for {org.name}</h2>
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <i className="ti ti-building-bank text-3xl text-gray-200 block mb-2" />
                <p className="text-sm text-gray-400">No accounts yet</p>
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
                        <td className="px-3 py-3 font-mono text-xs text-gray-600">{acc.accountNumber}</td>
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

        {/* ── Transactions ── */}
        {activeTab === 'transactions' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Transactions for {org.name}</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <i className="ti ti-arrows-exchange text-3xl text-gray-200 block mb-2" />
                <p className="text-sm text-gray-400">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Reference','Type','Source','Amount','Status'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono text-xs text-gray-600">{t.transactionReference || '—'}</td>
                        <td className="px-3 py-3"><TypePill type={t.type} /></td>
                        <td className="px-3 py-3 text-gray-500">{t.sourceAccount?.accountNumber || '—'}</td>
                        <td className="px-3 py-3 font-medium">{formatMoney(t.amount)}</td>
                        <td className="px-3 py-3"><Pill status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Users in {org.name}</h2>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <i className="ti ti-users text-3xl text-gray-200 block mb-2" />
                <p className="text-sm text-gray-400">No users found for this organization</p>
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
                        <td className="px-3 py-3"><Pill status={u.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Create Account ── */}
        {activeTab === 'create-account' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Create account for {org.name}</h2>
            <p className="text-xs text-gray-500 mb-5">This account will be linked to {org.name}.</p>
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
                  {accLoading ? <><i className="ti ti-loader animate-spin" /> Creating...</> : <><i className="ti ti-plus" /> Create account</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── User Onboarding / Invite User ── */}
        {activeTab === 'user-onboarding' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Invite a user to {org.name}</h2>
            <p className="text-xs text-gray-500 mb-5">
              Send an invitation email. The user receives a link to complete their registration.
              You are assigning the role on behalf of the organization admin.
            </p>
            {inviteSuccess && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-circle-check" /> {inviteSuccess}
              </div>
            )}
            {inviteError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-alert-circle" /> {inviteError}
              </div>
            )}
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">User email address</label>
                <div className="relative">
                  <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" value={invite.userEmail}
                    onChange={e => setInvite({ ...invite, userEmail: e.target.value })}
                    placeholder="e.g. john@dangote.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assign role</label>
                <select value={invite.role}
                  onChange={e => setInvite({ ...invite, role: e.target.value })}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="">Select a role</option>
                  <option value="MAKER">Maker — initiates transactions</option>
                  <option value="APPROVER">Approver — approves transactions</option>
                  <option value="ADMIN">Admin — manages the organization</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={inviteLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                  {inviteLoading ? <><i className="ti ti-loader animate-spin" /> Sending...</> : <><i className="ti ti-send" /> Send invitation</>}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </Layout>
  );
}