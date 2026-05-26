import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Topbar from '../../components/Topbar';
import api from '../../api/axios';

function Pill({ status }) {
  const map = {
    ACTIVE:   'bg-green-50 text-green-700',
    INACTIVE: 'bg-red-50 text-red-700',
  };
  const cls = map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

// The actions the user can take — dropdown selector pattern
const ACTIONS = [
  { key: 'view',   label: 'View all currencies'        },
  { key: 'filter', label: 'Filter by status'           },
  { key: 'update', label: 'Update currency status'     },
];

export default function SettingsCurrency() {
  const [selectedAction, setSelectedAction] = useState('');
  const [currencies, setCurrencies]         = useState([]);
  const [loading, setLoading]               = useState(false);
  const [filterStatus, setFilterStatus]     = useState('ACTIVE');
  const [updateCode, setUpdateCode]         = useState('NGN');
  const [updateStatus, setUpdateStatus]     = useState('ACTIVE');
  const [updateSuccess, setUpdateSuccess]   = useState('');
  const [updateError, setUpdateError]       = useState('');
  const [updateLoading, setUpdateLoading]   = useState(false);

  // When user selects "View all" — load immediately
  useEffect(() => {
    if (selectedAction === 'view') {
      loadAllCurrencies();
    } else {
      setCurrencies([]);
    }
  }, [selectedAction]);

  async function loadAllCurrencies() {
    setLoading(true);
    try {
      const res = await api.get('/currencies/all');
      setCurrencies(res.data.data || []);
    } catch {
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadByStatus() {
    setLoading(true);
    try {
      const res = await api.get(`/currencies/status/${filterStatus}`);
      setCurrencies(res.data.data || []);
    } catch {
      setCurrencies([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(e) {
    e.preventDefault();
    setUpdateError(''); setUpdateSuccess('');
    setUpdateLoading(true);
    try {
      await api.post('/currencies/status', {
        code:   updateCode,
        status: updateStatus,
      });
      setUpdateSuccess(`${updateCode} status updated to ${updateStatus} successfully!`);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update currency.');
    } finally {
      setUpdateLoading(false);
    }
  }

  return (
    <Layout>
      <Topbar title="Currency Management" subtitle="View and manage system currencies" />

      <main className="p-7 max-w-2xl flex flex-col gap-5">

        {/* Back link */}
        <Link to="/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <i className="ti ti-arrow-left" /> Back to settings
        </Link>

        {/* Action selector — dropdown of options */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            What would you like to do?
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Select an action from the list below
          </p>

          <div className="flex flex-col gap-2">
            {ACTIONS.map(({ key, label }) => (
              <button key={key}
                onClick={() => setSelectedAction(key === selectedAction ? '' : key)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left
                  ${selectedAction === key
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${selectedAction === key
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'}`}>
                    {selectedAction === key && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  {label}
                </div>
                <i className={`ti ti-chevron-down text-sm transition-transform
                  ${selectedAction === key ? 'rotate-180 text-blue-500' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* ── View all currencies ── */}
        {selectedAction === 'view' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">All currencies</h2>
              <button onClick={loadAllCurrencies} disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                <i className={`ti ti-refresh ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
            ) : currencies.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No currencies found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Code', 'Name', 'Symbol', 'Status'].map(h => (
                        <th key={h}
                          className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currencies.map((c, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono font-semibold text-gray-900">
                          {c.code}
                        </td>
                        <td className="px-3 py-3 text-gray-700">{c.name}</td>
                        <td className="px-3 py-3 text-gray-500">{c.symbol}</td>
                        <td className="px-3 py-3"><Pill status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Filter by status ── */}
        {selectedAction === 'filter' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Filter currencies by status
            </h2>
            <div className="flex gap-3 items-end mb-5">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </label>
                <select value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <button onClick={loadByStatus} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                {loading
                  ? <><i className="ti ti-loader animate-spin" /> Filtering...</>
                  : <><i className="ti ti-filter" /> Apply filter</>
                }
              </button>
            </div>

            {currencies.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Click "Apply filter" to see results
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Code', 'Name', 'Symbol', 'Status'].map(h => (
                        <th key={h}
                          className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currencies.map((c, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono font-semibold">{c.code}</td>
                        <td className="px-3 py-3 text-gray-700">{c.name}</td>
                        <td className="px-3 py-3 text-gray-500">{c.symbol}</td>
                        <td className="px-3 py-3"><Pill status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Update currency status ── */}
        {selectedAction === 'update' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Update currency status
            </h2>

            {updateSuccess && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-circle-check" /> {updateSuccess}
              </div>
            )}
            {updateError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-alert-circle" /> {updateError}
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Currency
                </label>
                <select value={updateCode}
                  onChange={e => setUpdateCode(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="NGN">NGN — Nigerian Naira</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  New status
                </label>
                <select value={updateStatus}
                  onChange={e => setUpdateStatus(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={updateLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                  {updateLoading
                    ? <><i className="ti ti-loader animate-spin" /> Updating...</>
                    : <><i className="ti ti-refresh" /> Update status</>
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