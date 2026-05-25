import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ── Reusable metric card ──
function MetricCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <i className={`ti ${icon} text-base`} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {value ?? '—'}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ── Status pill ──
function Pill({ status }) {
  const map = {
    APPROVED:  'bg-green-50 text-green-700',
    ACTIVE:    'bg-green-50 text-green-700',
    COMPLETED: 'bg-green-50 text-green-700',
    SUCCESS:   'bg-green-50 text-green-700',
    PENDING:   'bg-amber-50 text-amber-700',
    DISABLED:  'bg-gray-100 text-gray-500',
    INACTIVE:  'bg-amber-50 text-amber-700',
    REJECTED:  'bg-red-50 text-red-700',
    FAILED:    'bg-red-50 text-red-700',
    IN_REVIEW: 'bg-blue-50 text-blue-700',
  };
  const cls = map[(status || '').toUpperCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

// ── Format money ──
function formatMoney(amount) {
  if (amount === null || amount === undefined) return '—';
  return '₦' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

// ══════════════════════════════════════════════════════
// SUPER_ADMIN DASHBOARD
// Shows org-level metrics only — no transactions/accounts
// ══════════════════════════════════════════════════════
function SuperAdminDashboard({ user }) {
  // stats holds the numbers from /dashboard/stats
  const [stats, setStats]   = useState(null);
  // orgs holds the actual org list for the table
  const [orgs, setOrgs]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadOrgs();
  }, []);

  // Calls /dashboard/stats — returns org counts for SUPER_ADMIN
  async function loadStats() {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch {
      setStats(null);
    }
  }

  // Calls /organizations/viewAll — returns org list for the table
  async function loadOrgs() {
    try {
      const res = await api.get('/organizations/viewAll');
      setOrgs(res.data.data || []);
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-7 flex flex-col gap-6">

      {/* Welcome banner */}
      <div className="bg-slate-900 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-white/50 text-sm mt-1">
            You're logged in as Super Admin — system oversight view
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
          {user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
      </div>

      {/* Metric cards — all numbers come from stats */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Organizations"
          value={loading ? '—' : stats?.totalOrganizations}
          sub="All registered"
          icon="ti-building"
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Pending Approval"
          value={loading ? '—' : stats?.pendingOnboarding}
          sub="Awaiting your review"
          icon="ti-clock"
          color="bg-amber-50 text-amber-600"
        />
        <MetricCard
          label="Approved"
          value={loading ? '—' : stats?.approvedOrganizations}
          sub="Active organizations"
          icon="ti-circle-check"
          color="bg-green-50 text-green-600"
        />
        <MetricCard
          label="Disabled"
          value={loading ? '—' : stats?.disabledOrganizations}
          sub="Rejected or disabled"
          icon="ti-ban"
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Organizations table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            All organizations
          </h2>
          <Link to="/org-onboarding"
            className="text-xs text-blue-600 hover:underline font-medium">
            Manage approvals →
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
        ) : orgs.length === 0 ? (
          <div className="text-center py-12">
            <i className="ti ti-building text-3xl text-gray-200 block mb-2" />
            <p className="text-sm text-gray-400">No organizations registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['Organization', 'Reg. number', 'Status'].map(h => (
                    <th key={h}
                      className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map((org, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium text-gray-900">{org.name}</td>
                    <td className="px-3 py-3 text-gray-500">{org.registrationNumber}</td>
                    <td className="px-3 py-3">
                      <Pill status={org.organizationStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'Approve organizations',
              icon:  'ti-building',
              href:  '/org-onboarding',
              color: 'text-blue-600 bg-blue-50',
            },
            {
              label: 'Manage currencies',
              icon:  'ti-currency-dollar',
              href:  '/settings',
              color: 'text-green-600 bg-green-50',
            },
          ].map(({ label, icon, href, color }) => (
            <Link key={label} to={href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <i className={`ti ${icon} text-base`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}

// ══════════════════════════════════════════════════════
// OPERATIONAL DASHBOARD (ADMIN, MAKER, APPROVER)
// Shows accounts, transfer volumes, pending approvals
// ══════════════════════════════════════════════════════
function OperationalDashboard({ user }) {
  // stats holds the numbers from /dashboard/stats
  // these are: totalAccounts, pendingTransactions,
  // transferVolume, payoutVolume
  const [stats, setStats]               = useState(null);

  // transactions holds the actual recent transaction records
  // for the recent transactions list — separate from stats
  const [transactions, setTransactions] = useState([]);

  // pending holds pending transactions for the pending list
  const [pending, setPending]           = useState([]);

  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentTransactions();
    loadPending();
  }, []);

  // ONE call to /dashboard/stats gives us all the numbers
  // totalAccounts, pendingTransactions, transferVolume, payoutVolume
  async function loadStats() {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  // Separate call for the actual transaction records
  // because stats only gives us numbers, not the list
  async function loadRecentTransactions() {
    try {
      const res = await api.get('/transactions/transactions?page=0&size=4');
      setTransactions(res.data.data?.content || res.data.data || []);
    } catch {
      setTransactions([]);
    }
  }

  // Separate call for pending transactions list
  async function loadPending() {
    try {
      const res = await api.get('/transactions/pending');
      setPending(res.data.data || []);
    } catch {
      setPending([]);
    }
  }

  const isApprover = user?.role === 'APPROVER';

  return (
    <main className="p-7 flex flex-col gap-6">

      {/* Metric cards — numbers come from stats object */}
      <div className={`grid gap-4 ${isApprover ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <MetricCard
          label="Total Accounts"
          value={loading ? '—' : stats?.totalAccounts}
          sub="Accounts registered"
          icon="ti-building-bank"
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Transfer Volume"
          value={loading ? '—' : formatMoney(stats?.transferVolume)}
          sub="Internal transfers total"
          icon="ti-arrows-exchange"
          color="bg-green-50 text-green-600"
        />
        <MetricCard
          label="External Payouts"
          value={loading ? '—' : formatMoney(stats?.payoutVolume)}
          sub="Total payout volume"
          icon="ti-send"
          color="bg-purple-50 text-purple-600"
        />
        {isApprover && (
          <MetricCard
            label="Pending Approval"
            value={loading ? '—' : stats?.pendingTransactions}
            sub="Transactions awaiting you"
            icon="ti-clock"
            color="bg-amber-50 text-amber-600"
          />
        )}
      </div>

      {/* Row: Recent transactions + Pending approvals */}
      <div className="grid grid-cols-2 gap-5">

        {/* Recent transactions list */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Recent transactions
            </h2>
            <Link to="/transactions"
              className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <i className="ti ti-arrows-exchange text-3xl text-gray-200 block mb-2" />
              <p className="text-sm text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {transactions.map((t, i) => {
                const isCredit = (t.type || '').toUpperCase() === 'EXTERNAL_FUNDING';
                return (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                      ${isCredit ? 'bg-green-50' : 'bg-blue-50'}`}>
                      <i className={`ti ${isCredit
                        ? 'ti-arrow-down text-green-600'
                        : 'ti-arrow-up text-blue-600'} text-base`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {t.sourceAccount?.accountNumber
                          || t.transactionReference
                          || '—'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {(t.type || '').replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-semibold
                        ${isCredit ? 'text-green-600' : 'text-gray-900'}`}>
                        {isCredit ? '+' : '-'}{formatMoney(t.amount)}
                      </div>
                      <Pill status={t.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending approvals list */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Pending approvals
            </h2>
            <Link to="/transactions?tab=pending"
              className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : pending.length === 0 ? (
            <div className="text-center py-10">
              <i className="ti ti-circle-check text-3xl text-gray-200 block mb-2" />
              <p className="text-sm text-gray-400">No pending transactions</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {pending.slice(0, 4).map((t, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <i className="ti ti-clock text-amber-600 text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {t.transactionReference || '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {(t.type || '').replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatMoney(t.amount)}
                    </div>
                    <Pill status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: 'New onboarding',
              icon:  'ti-user-plus',
              href:  '/org-onboarding',
              color: 'text-blue-600 bg-blue-50',
            },
            {
              label: 'New transfer',
              icon:  'ti-arrow-left-right',
              href:  '/transactions?tab=internal',
              color: 'text-green-600 bg-green-50',
            },
            {
              label: 'External funding',
              icon:  'ti-cash',
              href:  '/transactions?tab=funding',
              color: 'text-amber-600 bg-amber-50',
            },
            {
              label: 'Create payout',
              icon:  'ti-send',
              href:  '/transactions?tab=payout',
              color: 'text-purple-600 bg-purple-50',
            },
          ].map(({ label, icon, href, color }) => (
            <Link key={label} to={href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <i className={`ti ${icon} text-base`} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </main>
  );
}

// ══════════════════════════════════════════════════════
// MAIN DASHBOARD — picks the right view based on role
// ══════════════════════════════════════════════════════
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout>
      <Topbar
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
      />
      {user?.role === 'SUPER_ADMIN'
        ? <SuperAdminDashboard user={user} />
        : <OperationalDashboard user={user} />
      }
    </Layout>
  );
}