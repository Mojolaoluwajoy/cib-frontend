import { useState } from 'react';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ACCOUNT_TYPES = ['CURRENT','SAVINGS','PAYROLL','REVENUE','EXPENSE','ASSET'];
const CURRENCIES    = ['NGN','USD','GBP','EUR'];

function typeColor(type) {
  const map = {
    CURRENT: { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'ti-building-bank' },
    SAVINGS:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'ti-piggy-bank'    },
    PAYROLL:  { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'ti-users'         },
    REVENUE:  { bg: 'bg-teal-50',   text: 'text-teal-700',   icon: 'ti-trending-up'   },
    EXPENSE:  { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'ti-trending-down' },
    ASSET:    { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'ti-briefcase'     },
  };
  return map[(type||'').toUpperCase()] || { bg:'bg-gray-50', text:'text-gray-700', icon:'ti-building-bank' };
}

function formatMoney(amount, currency = 'NGN') {
  if (amount === null || amount === undefined) return '—';
  const symbols = { NGN:'₦', USD:'$', GBP:'£', EUR:'€' };
  return (symbols[currency] || currency) +
    Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

const TABS = ['Create Account', 'Find Account', 'All Accounts'];

export default function Accounts() {
  const { user } = useAuth();
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(user?.role);
  const [activeTab, setActiveTab] = useState(0);

  // ── Create form ──
  const [form, setForm]           = useState({ type:'', currencyCode:'', organizationId:'', createdBy:'' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError]     = useState('');

  // ── Find form ──
  const [findId, setFindId]       = useState('');
  const [findResult, setFindResult] = useState(null);
  const [findLoading, setFindLoading] = useState(false);
  const [findError, setFindError]   = useState('');

  // ── All accounts ──
  const [accounts, setAccounts]   = useState([]);
  const [accsLoading, setAccsLoading] = useState(false);
  const [accsLoaded, setAccsLoaded]   = useState(false);

 async function handleCreate(e) {
   e.preventDefault();
   setCreateError(''); setCreateSuccess('');
   if (!form.type || !form.currencyCode) {
     setCreateError('Please select both account type and currency.'); return;
   }
   setCreateLoading(true);
   try {
     const res = await api.post('/accounts/create', {
       type:         form.type,
       currencyCode: form.currencyCode,
       // DO NOT send organizationId — backend gets org from logged-in user's JWT
     });
     setCreateSuccess(
       `Account created! Number: ${res.data.data?.accountNumber || '—'}`
     );
     setForm({ type: '', currencyCode: '' });
   } catch (err) {
     setCreateError(err.response?.data?.message || 'Failed to create account.');
   } finally {
     setCreateLoading(false);
   }
 }
  async function handleFind(e) {
    e.preventDefault();
    setFindError(''); setFindResult(null);
    if (!findId) { setFindError('Please enter an account ID.'); return; }
    setFindLoading(true);
    try {
      const res = await api.post('/accounts/find', Number(findId));
      setFindResult(res.data.data);
    } catch (err) {
      setFindError(err.response?.data?.message || 'Account not found.');
    } finally {
      setFindLoading(false);
    }
  }

  async function loadAccounts() {
    setAccsLoading(true);
    try {
      const res = await api.get('/accounts/all');
      setAccounts(res.data.data || []);
      setAccsLoaded(true);
    } catch {
      setAccounts([]);
    } finally {
      setAccsLoading(false);
    }
  }

  return (
    <Layout>
      <Topbar title="Accounts" subtitle="Create and manage organization accounts" />

      <main className="p-7 flex flex-col gap-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1.5 w-fit">
          {TABS.map((tab, i) => (
            <button key={tab}
              onClick={() => { setActiveTab(i); if (i === 2) loadAccounts(); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === i ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Create Account ── */}
        {activeTab === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Create a new account</h2>
            <p className="text-xs text-gray-500 mb-5">
              Accounts are linked to your organization automatically. ADMIN role required.
            </p>

            {!isAdmin ? (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg">
                <i className="ti ti-lock" /> Only ADMIN users can create accounts.
              </div>
            ) : (
              <>
                {createSuccess && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                    <i className="ti ti-circle-check" /> {createSuccess}
                  </div>
                )}
                {createError && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                    <i className="ti ti-alert-circle" /> {createError}
                  </div>
                )}
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Account type
                    </label>
                    <select value={form.type}
                      onChange={e => setForm({...form, type: e.target.value})}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                      <option value="">Select type</option>
                      {ACCOUNT_TYPES.map(t => (
                        <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Currency
                    </label>
                    <select value={form.currencyCode}
                      onChange={e => setForm({...form, currencyCode: e.target.value})}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                      <option value="">Select currency</option>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button type="submit" disabled={createLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                      {createLoading
                        ? <><i className="ti ti-loader animate-spin" /> Creating...</>
                        : <><i className="ti ti-plus" /> Create account</>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* ── Tab 2: Find Account ── */}
        {activeTab === 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Find account by ID</h2>
            <p className="text-xs text-gray-500 mb-5">Enter an account ID to look up its full details.</p>

            {findError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-alert-circle" /> {findError}
              </div>
            )}

            <form onSubmit={handleFind} className="flex gap-3 mb-5">
              <input type="number" value={findId}
                onChange={e => { setFindId(e.target.value); setFindError(''); setFindResult(null); }}
                placeholder="Enter account ID"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              <button type="submit" disabled={findLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                {findLoading
                  ? <><i className="ti ti-loader animate-spin" /> Searching...</>
                  : <><i className="ti ti-search" /> Search</>}
              </button>
            </form>

            {findResult && (() => {
              const currency = findResult.currencyCode?.currencyCode || 'NGN';
              const { bg, text, icon } = typeColor(findResult.type);
              return (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className={`${bg} px-5 py-4 flex items-center gap-3`}>
                    <div className={`w-10 h-10 rounded-lg ${bg} border border-current/20 flex items-center justify-center`}>
                      <i className={`ti ${icon} text-lg ${text}`} />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${text}`}>{findResult.type}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {findResult.accountNumber}
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: 'Total balance',     value: formatMoney(findResult.totalBalance, currency)     },
                      { label: 'Available balance', value: formatMoney(findResult.availableBalance, currency) },
                      { label: 'Currency',          value: currency                                           },
                      { label: 'Organization',      value: findResult.organizationName || '—'                 },
                      { label: 'Created by',        value: findResult.createdBy?.id || '—'                    },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center px-5 py-3 text-sm">
                        <span className="text-gray-500 text-xs">{label}</span>
                        <span className="font-medium text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Tab 3: All Accounts ── */}
        {activeTab === 2 && (
          <div className="flex flex-col gap-5">

            {/* Account cards */}
            {accsLoaded && accounts.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {accounts.map((acc, i) => {
                  const currency = acc.currencyCode?.currencyCode || 'NGN';
                  const { bg, text, icon } = typeColor(acc.type);
                  return (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                          <i className={`ti ${icon} text-lg ${text}`} />
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${bg} ${text}`}>
                          {acc.type}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-gray-400 mb-1">
                        {acc.accountNumber}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">{acc.organizationName}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                        Total balance
                      </div>
                      <div className="text-xl font-semibold text-gray-900">
                        {formatMoney(acc.totalBalance, currency)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Available: {formatMoney(acc.availableBalance, currency)}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{currency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">All accounts</h2>
                  <p className="text-xs text-gray-500 mt-0.5">All registered accounts</p>
                </div>
                <button onClick={loadAccounts} disabled={accsLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                  <i className={`ti ti-refresh ${accsLoading ? 'animate-spin' : ''}`} />
                  {accsLoaded ? 'Refresh' : 'Load accounts'}
                </button>
              </div>

              {!accsLoaded ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <i className="ti ti-building-bank text-3xl block mb-2 text-gray-300" />
                  Click "Load accounts" to view all accounts
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No accounts found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        {['Account number','Type','Organization','Currency','Total balance','Available'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc, i) => {
                        const currency = acc.currencyCode?.currencyCode || 'NGN';
                        const { bg, text } = typeColor(acc.type);
                        return (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-3 py-3 font-mono text-xs text-gray-600">
                              {acc.accountNumber}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${bg} ${text}`}>
                                {acc.type}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-gray-500">{acc.organizationName || '—'}</td>
                            <td className="px-3 py-3 text-gray-500">{currency}</td>
                            <td className="px-3 py-3 font-medium text-gray-900">
                              {formatMoney(acc.totalBalance, currency)}
                            </td>
                            <td className="px-3 py-3 text-gray-500">
                              {formatMoney(acc.availableBalance, currency)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </Layout>
  );
}