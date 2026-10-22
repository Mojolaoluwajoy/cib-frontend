import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { Pill, TypePill } from '../components/Pill';
import Alert from '../components/Alert';
import { formatMoney } from '../utils/format';
import api from '../api/axios';

function Flow({ steps }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 mb-5 flex-wrap">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <i className="ti ti-chevron-right text-gray-300 text-sm" />}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold
              ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              {step}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, full }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
      />
    </div>
  );
}

// Returns the idempotency key for a request. Retrying the exact same request reuses its key so
// the backend can drop the duplicate; any change to the request gets a fresh key.
function idempotencyKeyFor(keyRef, payload) {
  const body = JSON.stringify(payload);
  if (keyRef.current?.body !== body) {
    keyRef.current = { body, key: crypto.randomUUID() };
  }
  return keyRef.current.key;
}

export default function Transactions() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isMaker = user?.role === 'MAKER';
  const isApprover = user?.role === 'APPROVER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const TABS = [
    // Only MAKER can initiate transactions
    ...(isMaker
      ? [
          { key: 'internal', label: 'Internal Transfer', icon: 'ti-refresh' },
          { key: 'payout', label: 'External Payout', icon: 'ti-send' },
          { key: 'funding', label: 'External Funding', icon: 'ti-cash' },
        ]
      : []),
    // APPROVER, ADMIN and SUPER_ADMIN see pending approval tab
    ...(isApprover || isAdmin
      ? [{ key: 'pending', label: 'Pending Approval', icon: 'ti-clock' }]
      : []),
    // Everyone sees all transactions
    { key: 'all', label: 'All Transactions', icon: 'ti-list' },
  ];

  const defaultTab = isApprover ? 'pending' : 'all';
  const tabFromUrl = searchParams.get('tab') || defaultTab;

  function setTab(key) {
    setSearchParams({ tab: key });
  }

  // ── Internal transfer state ──
  const [intForm, setIntForm] = useState({
    sourceAccount: '',
    destinationAccount: '',
    amount: '',
  });
  const intKeyRef = useRef(null);
  const [intLoading, setIntLoading] = useState(false);
  const [intSuccess, setIntSuccess] = useState('');
  const [intError, setIntError] = useState('');

  // ── External payout state ──
  const [payForm, setPayForm] = useState({
    sourceAccount: '',
    amount: '',
    accountNumber: '',
    bankCode: '',
    bankName: '',
    accountName: '',
  });
  const payKeyRef = useRef(null);
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState('');
  const [payError, setPayError] = useState('');

  // ── External funding state ──
  const [fundForm, setFundForm] = useState({
    destinationAccount: '',
    amount: '',
    email: '',
  });
  const fundKeyRef = useRef(null);
  const [fundLoading, setFundLoading] = useState(false);
  const [fundSuccess, setFundSuccess] = useState('');
  const [fundError, setFundError] = useState('');

  // ── Pending transactions state ──
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingSuccess, setPendingSuccess] = useState('');
  const [approvalModal, setApprovalModal] = useState(null);
  // SUCCESS = approve, REJECTED = reject
  const [approvalStatus, setApprovalStatus] = useState('SUCCESS');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');

  // ── All transactions state ──
  const [allTxns, setAllTxns] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // ── Webhook simulator state ──
  const [webhookRef, setWebhookRef] = useState('');
  const [webhookEvent, setWebhookEvent] = useState('transfer.success');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState('');
  const [webhookError, setWebhookError] = useState('');

  useEffect(() => {
    if (tabFromUrl === 'pending') loadPending();
    if (tabFromUrl === 'all') loadAll();
  }, [tabFromUrl]);

  async function handleInternal(e) {
    e.preventDefault();
    setIntError('');
    setIntSuccess('');
    if (!intForm.sourceAccount || !intForm.destinationAccount || !intForm.amount) {
      setIntError('Please fill in all fields.');
      return;
    }
    setIntLoading(true);
    try {
      const payload = {
        sourceAccount: intForm.sourceAccount,
        destinationAccount: intForm.destinationAccount,
        amount: Number(intForm.amount),
        type: 'INTERNAL_TRANSFER',
      };
      const res = await api.post('/transactions/initiate', {
        ...payload,
        idempotencyKey: idempotencyKeyFor(intKeyRef, payload),
      });
      setIntSuccess(
        `Transfer initiated! Ref: ${res.data.data?.transactionReference || '—'}. Waiting for approver.`,
      );
      intKeyRef.current = null;
      setIntForm({ sourceAccount: '', destinationAccount: '', amount: '' });
    } catch (err) {
      setIntError(err.response?.data?.message || 'Transfer failed.');
    } finally {
      setIntLoading(false);
    }
  }

  async function handlePayout(e) {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');
    if (
      !payForm.sourceAccount ||
      !payForm.amount ||
      !payForm.accountNumber ||
      !payForm.bankCode ||
      !payForm.bankName ||
      !payForm.accountName
    ) {
      setPayError('Please fill in all fields.');
      return;
    }
    setPayLoading(true);
    try {
      const payload = {
        ...payForm,
        amount: Number(payForm.amount),
        type: 'EXTERNAL_PAYOUT',
      };
      await api.post('/external/payout', {
        ...payload,
        idempotencyKey: idempotencyKeyFor(payKeyRef, payload),
      });
      setPaySuccess('Payout initiated! Waiting for approver.');
      payKeyRef.current = null;
      setPayForm({
        sourceAccount: '',
        amount: '',
        accountNumber: '',
        bankCode: '',
        bankName: '',
        accountName: '',
      });
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payout failed.');
    } finally {
      setPayLoading(false);
    }
  }

  async function handleFunding(e) {
    e.preventDefault();
    setFundError('');
    setFundSuccess('');
    if (!fundForm.destinationAccount || !fundForm.amount || !fundForm.email) {
      setFundError('Please fill in all fields.');
      return;
    }
    setFundLoading(true);
    try {
      const payload = {
        ...fundForm,
        amount: Number(fundForm.amount),
        type: 'EXTERNAL_FUNDING',
      };
      const res = await api.post('/external/fund', {
        ...payload,
        idempotencyKey: idempotencyKeyFor(fundKeyRef, payload),
      });
      const paymentUrl = res.data.data?.authorization_url || res.data.data?.paymentUrl;
      if (paymentUrl) {
        setFundSuccess('Funding initiated! Opening Paystack...');
        setTimeout(() => window.open(paymentUrl, '_blank'), 1500);
      } else {
        setFundSuccess(`Funding initiated! Ref: ${res.data.data?.reference || '—'}`);
      }
      fundKeyRef.current = null;
      setFundForm({ destinationAccount: '', amount: '', email: '' });
    } catch (err) {
      setFundError(err.response?.data?.message || 'Funding failed.');
    } finally {
      setFundLoading(false);
    }
  }

  async function loadPending() {
    setPendingLoading(true);
    try {
      const res = await api.get('/transactions/pending');
      setPending(res.data.data || []);
    } catch {
      setPending([]);
    } finally {
      setPendingLoading(false);
    }
  }

  async function loadAll() {
    setAllLoading(true);
    try {
      const res = await api.get('/transactions/transactions?page=0&size=50');
      setAllTxns(res.data.data?.content || res.data.data || []);
      setAllLoaded(true);
    } catch {
      setAllTxns([]);
    } finally {
      setAllLoading(false);
    }
  }

  async function confirmApproval() {
    setApprovalLoading(true);
    setApprovalError('');
    try {
      await api.post('/transactions/approve', {
        transactionId: approvalModal.id,
        status: approvalStatus, // SUCCESS or REJECTED
      });
      const msg =
        approvalStatus === 'SUCCESS'
          ? 'Transaction approved successfully!'
          : 'Transaction rejected.';
      setPendingSuccess(msg);
      setApprovalModal(null);
      loadPending();
    } catch (err) {
      setApprovalError(err.response?.data?.message || 'Could not process transaction.');
    } finally {
      setApprovalLoading(false);
    }
  }

  async function simulateWebhook(e) {
    e.preventDefault();
    setWebhookError('');
    setWebhookSuccess('');
    if (!webhookRef) {
      setWebhookError('Please enter a transaction reference.');
      return;
    }
    setWebhookLoading(true);
    try {
      await api.post('/webhook/paystack', {
        event: webhookEvent,
        data: {
          reference: webhookRef,
          status: webhookEvent === 'transfer.success' ? 'success' : 'failed',
        },
      });
      setWebhookSuccess(`Webhook simulated! Event "${webhookEvent}" sent for ref: ${webhookRef}`);
      setWebhookRef('');
      loadPending();
    } catch (err) {
      setWebhookError(err.response?.data?.message || 'Webhook simulation failed.');
    } finally {
      setWebhookLoading(false);
    }
  }

  return (
    <Layout>
      <Topbar title="Transactions" subtitle="Manage and view transactions" />
      <main className="p-7 flex flex-col gap-6">
        {/* Tabs — only show tabs relevant to role */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1.5 flex-wrap w-fit">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  tabFromUrl === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <i className={`ti ${icon} text-base`} /> {label}
            </button>
          ))}
        </div>

        {/* ── Internal Transfer ── */}
        {tabFromUrl === 'internal' && isMaker && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Initiate internal transfer</h2>
            <p className="text-xs text-gray-500 mb-4">
              Transfer funds between accounts within the platform.
            </p>
            <Flow steps={['Maker initiates', 'Approver reviews', 'Transfer complete']} />
            <Alert success={intSuccess} error={intError} />
            <form onSubmit={handleInternal} className="grid grid-cols-2 gap-4">
              <Field
                label="Source account number"
                value={intForm.sourceAccount}
                onChange={(e) => setIntForm({ ...intForm, sourceAccount: e.target.value })}
                placeholder="e.g. 1234567890"
              />
              <Field
                label="Destination account number"
                value={intForm.destinationAccount}
                onChange={(e) => setIntForm({ ...intForm, destinationAccount: e.target.value })}
                placeholder="e.g. 0987654321"
              />
              <Field
                label="Amount"
                type="number"
                value={intForm.amount}
                onChange={(e) => setIntForm({ ...intForm, amount: e.target.value })}
                placeholder="e.g. 500000"
              />
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={intLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
                >
                  {intLoading ? (
                    <>
                      <i className="ti ti-loader animate-spin" /> Initiating...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-arrow-right" /> Initiate transfer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── External Payout ── */}
        {tabFromUrl === 'payout' && isMaker && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Initiate external payout</h2>
            <p className="text-xs text-gray-500 mb-4">
              Send funds to an external bank account via Paystack.
            </p>
            <Flow
              steps={['Maker initiates', 'Approver reviews', 'Paystack confirms', 'Complete']}
            />
            <div className="flex items-start gap-2 bg-blue-50 text-blue-700 text-xs px-4 py-3 rounded-lg mb-4">
              <i className="ti ti-info-circle flex-shrink-0 mt-0.5" />
              After approval this payout stays Pending until Paystack confirms via webhook.
            </div>
            <Alert success={paySuccess} error={payError} />
            <form onSubmit={handlePayout} className="grid grid-cols-2 gap-4">
              <Field
                label="Source account number"
                value={payForm.sourceAccount}
                onChange={(e) => setPayForm({ ...payForm, sourceAccount: e.target.value })}
                placeholder="Internal account to debit"
              />
              <Field
                label="Amount"
                type="number"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                placeholder="e.g. 250000"
              />
              <Field
                label="Recipient account number"
                value={payForm.accountNumber}
                onChange={(e) => setPayForm({ ...payForm, accountNumber: e.target.value })}
                placeholder="Recipient's account number"
              />
              <Field
                label="Bank code"
                value={payForm.bankCode}
                onChange={(e) => setPayForm({ ...payForm, bankCode: e.target.value })}
                placeholder="e.g. 044"
              />
              <Field
                label="Bank name"
                value={payForm.bankName}
                onChange={(e) => setPayForm({ ...payForm, bankName: e.target.value })}
                placeholder="e.g. Access Bank"
              />
              <Field
                label="Account name"
                value={payForm.accountName}
                onChange={(e) => setPayForm({ ...payForm, accountName: e.target.value })}
                placeholder="Recipient's full name"
              />
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={payLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
                >
                  {payLoading ? (
                    <>
                      <i className="ti ti-loader animate-spin" /> Initiating...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send" /> Initiate payout
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── External Funding ── */}
        {tabFromUrl === 'funding' && isMaker && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">External funding</h2>
            <p className="text-xs text-gray-500 mb-4">
              Fund a system account from an external source via Paystack.
            </p>
            <Flow steps={['Submit request', 'Paystack processes', 'Account credited']} />
            <Alert success={fundSuccess} error={fundError} />
            <form onSubmit={handleFunding} className="grid grid-cols-2 gap-4">
              <Field
                label="Destination account number"
                value={fundForm.destinationAccount}
                onChange={(e) => setFundForm({ ...fundForm, destinationAccount: e.target.value })}
                placeholder="Account to credit"
              />
              <Field
                label="Amount"
                type="number"
                value={fundForm.amount}
                onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })}
                placeholder="e.g. 1000000"
              />
              <Field
                label="Email"
                type="email"
                value={fundForm.email}
                onChange={(e) => setFundForm({ ...fundForm, email: e.target.value })}
                placeholder="Payer's email for Paystack"
              />
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={fundLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
                >
                  {fundLoading ? (
                    <>
                      <i className="ti ti-loader animate-spin" /> Initiating...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-cash" /> Initiate funding
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Pending Approval ── */}
        {tabFromUrl === 'pending' && (isApprover || isAdmin) && (
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Pending transactions</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Transactions waiting for approval</p>
                </div>
                <button
                  onClick={loadPending}
                  disabled={pendingLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
                >
                  <i className={`ti ti-refresh ${pendingLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {pendingSuccess && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                  <i className="ti ti-circle-check" /> {pendingSuccess}
                </div>
              )}

              {pendingLoading ? (
                <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
              ) : pending.length === 0 ? (
                <div className="text-center py-12">
                  <i className="ti ti-circle-check text-3xl text-gray-200 block mb-2" />
                  <p className="text-sm text-gray-400">No pending transactions</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        {[
                          'Reference',
                          'Type',
                          'Source',
                          'Destination',
                          'Amount',
                          'Status',
                          ...(isApprover ? ['Action'] : []),
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((t, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-3 py-3 font-mono text-xs text-gray-600">
                            {t.transactionReference || '—'}
                          </td>
                          <td className="px-3 py-3">
                            <TypePill type={t.type} />
                          </td>
                          <td className="px-3 py-3 text-gray-500">
                            {t.sourceAccount?.accountNumber || '—'}
                          </td>
                          <td className="px-3 py-3 text-gray-500">
                            {t.destinationAccount?.accountNumber || '—'}
                          </td>
                          <td className="px-3 py-3 font-medium">{formatMoney(t.amount)}</td>
                          <td className="px-3 py-3">
                            <Pill status={t.status} />
                          </td>
                          {isApprover && (
                            <td className="px-3 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setApprovalModal(t);
                                    setApprovalStatus('SUCCESS');
                                    setApprovalError('');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all"
                                >
                                  <i className="ti ti-check" /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setApprovalModal(t);
                                    setApprovalStatus('REJECTED');
                                    setApprovalError('');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all"
                                >
                                  <i className="ti ti-x" /> Reject
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Webhook simulator — only rendered by the Vite dev server, never in production builds */}
            {import.meta.env.DEV && (
              <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-1">
                  <i className="ti ti-flask text-amber-600 text-lg" />
                  <h2 className="text-sm font-semibold text-amber-800">Testing Tools</h2>
                  <span className="text-xs font-semibold bg-amber-500 text-white px-2.5 py-0.5 rounded-full">
                    DEV ONLY
                  </span>
                </div>
                <p className="text-xs text-amber-700 mb-5">
                  Simulate a Paystack webhook for external payout testing.
                  <strong className="ml-1">Remove before going live.</strong>
                </p>
                <Alert success={webhookSuccess} error={webhookError} />
                <form onSubmit={simulateWebhook} className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      Transaction reference
                    </label>
                    <input
                      value={webhookRef}
                      onChange={(e) => setWebhookRef(e.target.value)}
                      placeholder="Paste reference from approved payout"
                      className="px-3 py-2.5 border border-amber-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white placeholder:text-gray-300"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      Simulate event
                    </label>
                    <select
                      value={webhookEvent}
                      onChange={(e) => setWebhookEvent(e.target.value)}
                      className="px-3 py-2.5 border border-amber-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white"
                    >
                      <option value="transfer.success">transfer.success</option>
                      <option value="transfer.failed">transfer.failed</option>
                      <option value="transfer.reversed">transfer.reversed</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={webhookLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-all"
                    >
                      {webhookLoading ? (
                        <>
                          <i className="ti ti-loader animate-spin" /> Simulating...
                        </>
                      ) : (
                        <>
                          <i className="ti ti-player-play" /> Simulate webhook
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── All Transactions ── */}
        {tabFromUrl === 'all' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">All transactions</h2>
                <p className="text-xs text-gray-500 mt-0.5">Full transaction history</p>
              </div>
              <button
                onClick={loadAll}
                disabled={allLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
              >
                <i className={`ti ti-refresh ${allLoading ? 'animate-spin' : ''}`} />
                {allLoaded ? 'Refresh' : 'Load transactions'}
              </button>
            </div>

            {!allLoaded ? (
              <div className="text-center py-12">
                <i className="ti ti-list text-3xl text-gray-200 block mb-2" />
                <p className="text-sm text-gray-400">Click "Load transactions" to view history</p>
              </div>
            ) : allTxns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Reference', 'Type', 'Source', 'Destination', 'Amount', 'Status'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {allTxns.map((t, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono text-xs text-gray-600">
                          {t.transactionReference || '—'}
                        </td>
                        <td className="px-3 py-3">
                          <TypePill type={t.type} />
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {t.sourceAccount?.accountNumber || '—'}
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {t.destinationAccount?.accountNumber || '—'}
                        </td>
                        <td className="px-3 py-3 font-medium">{formatMoney(t.amount)}</td>
                        <td className="px-3 py-3">
                          <Pill status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Approval Modal ── */}
      {approvalModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Process transaction</h3>
            <p className="text-sm text-gray-500 mb-4">
              Review the details then confirm your decision.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-xs font-medium">
                  {approvalModal.transactionReference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <TypePill type={approvalModal.type} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">{formatMoney(approvalModal.amount)}</span>
              </div>
            </div>

            {approvalError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4">
                <i className="ti ti-alert-circle" /> {approvalError}
              </div>
            )}

            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Your decision
              </label>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
              >
                <option value="SUCCESS">Approve this transaction</option>
                <option value="REJECTED">Reject this transaction</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmApproval}
                disabled={approvalLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
              >
                {approvalLoading ? (
                  <>
                    <i className="ti ti-loader animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check" /> Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
