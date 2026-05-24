import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function Pill({ status }) {
  const map = {
    APPROVED:  'bg-green-50 text-green-700',
    SUCCESS:   'bg-green-50 text-green-700',
    COMPLETED: 'bg-green-50 text-green-700',
    PENDING:   'bg-amber-50 text-amber-700',
    AWAITING_APPROVAL: 'bg-amber-50 text-amber-700',
    REJECTED:  'bg-red-50 text-red-700',
    FAILED:    'bg-red-50 text-red-700',
  };
  const cls = map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
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
  const cls = map[(type||'').toUpperCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {type}
    </span>
  );
}

function formatMoney(amount) {
  if (!amount && amount !== 0) return '—';
  return '₦' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

const TABS = [
  { key: 'internal', label: 'Internal Transfer' },
  { key: 'payout',   label: 'External Payout'   },
  { key: 'funding',  label: 'External Funding'   },
  { key: 'pending',  label: 'Pending Approval'   },
  { key: 'all',      label: 'All Transactions'   },
];

export default function Transactions() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'internal';
  const activeTab = TABS.findIndex(t => t.key === tabParam);

  function setTab(key) {
    setSearchParams({ tab: key });
  }

  // ── Internal transfer ──
  const [internal, setInternal] = useState({
    sourceAccount: '', destinationAccount: '', amount: '', idempotencyKey: '',
  });
  const [intLoading, setIntLoading] = useState(false);
  const [intSuccess, setIntSuccess] = useState('');
  const [intError,   setIntError]   = useState('');

  // ── External payout ──
  const [payout, setPayout] = useState({
    sourceAccount: '', amount: '', accountNumber: '',
    bankCode: '', bankName: '', accountName: '', idempotencyKey: '',
  });
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState('');
  const [payError,   setPayError]   = useState('');

  // ── External funding ──
  const [funding, setFunding] = useState({
    sourceAccount: '', amount: '', email: '', idempotencyKey: '',
  });
  const [fundLoading, setFundLoading] = useState(false);
  const [fundSuccess, setFundSuccess] = useState('');
  const [fundError,   setFundError]   = useState('');

  // ── Pending transactions ──
  const [pending, setPending]           = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingLoaded, setPendingLoaded]   = useState(false);
  const [approveSuccess, setApproveSuccess] = useState('');
  const [approveError,   setApproveError]   = useState('');

  // ── All transactions ──
  const [all, setAll]               = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allLoaded, setAllLoaded]   = useState(false);

  // ── Approval modal ──
  const [modal, setModal]           = useState(null);
  const [modalStatus, setModalStatus] = useState('APPROVED');
  const [modalLoading, setModalLoading] = useState(false);

  // ── Webhook simulator ──
  const [webhookRef,    setWebhookRef]    = useState('');
  const [webhookEvent,  setWebhookEvent]  = useState('transfer.success');
  const [webhookLoading,setWebhookLoading]= useState(false);
  const [webhookSuccess,setWebhookSuccess]= useState('');
  const [webhookError,  setWebhookError]  = useState('');

  // Auto load pending when tab switches to pending
  useEffect(() => {
    if (tabParam === 'pending') loadPending();
    if (tabParam === 'all')     loadAll();
  }, [tabParam]);

  const isMaker    = user?.role === 'MAKER';
  const isApprover = ['APPROVER','ADMIN'].includes(user?.role);

  // ── Submit internal transfer ──
  async function handleInternal(e) {
    e.preventDefault();
    setIntError(''); setIntSuccess('');
    if (Object.values(internal).some(v => !v)) {
      setIntError('Please fill in all fields.'); return;
    }
    setIntLoading(true);
    try {
      const res = await api.post('/transactions/initiate', {
        ...internal,
        amount: Number(internal.amount),
        type: 'INTERNAL_TRANSFER',
      });
      setIntSuccess(`Transfer initiated! Ref: ${res.data.data?.transactionReference || '—'}. Waiting for approver.`);
      setInternal({ sourceAccount:'', destinationAccount:'', amount:'', idempotencyKey:'' });
    } catch (err) {
      setIntError(err.response?.data?.message || 'Transfer failed.');
    } finally {
      setIntLoading(false);
    }
  }

  // ── Submit external payout ──
  async function handlePayout(e) {
    e.preventDefault();
    setPayError(''); setPaySuccess('');
    if (Object.values(payout).some(v => !v)) {
      setPayError('Please fill in all fields.'); return;
    }
    setPayLoading(true);
    try {
      await api.post('/external/payout', {
        ...payout,
        amount: Number(payout.amount),
        type: 'EXTERNAL_PAYOUT',
      });
      setPaySuccess('Payout initiated! Waiting for approver. Status updates once Paystack confirms.');
      setPayout({ sourceAccount:'', amount:'', accountNumber:'', bankCode:'', bankName:'', accountName:'', idempotencyKey:'' });
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payout failed.');
    } finally {
      setPayLoading(false);
    }
  }

  // ── Submit external funding ──
  async function handleFunding(e) {
    e.preventDefault();
    setFundError(''); setFundSuccess('');
    if (Object.values(funding).some(v => !v)) {
      setFundError('Please fill in all fields.'); return;
    }
    setFundLoading(true);
    try {
      const res = await api.post('/external/fund', {
        ...funding,
        amount: Number(funding.amount),
        type: 'EXTERNAL_FUNDING',
      });
      const paymentUrl = res.data.data?.authorization_url || res.data.data?.paymentUrl;
      if (paymentUrl) {
        setFundSuccess('Funding initiated! Opening Paystack payment page...');
        setTimeout(() => window.open(paymentUrl, '_blank'), 1500);
      } else {
        setFundSuccess(`Funding initiated! Ref: ${res.data.data?.reference || '—'}`);
      }
      setFunding({ sourceAccount:'', amount:'', email:'', idempotencyKey:'' });
    } catch (err) {
      setFundError(err.response?.data?.message || 'Funding request failed.');
    } finally {
      setFundLoading(false);
    }
  }

  // ── Load pending ──
  async function loadPending() {
    setPendingLoading(true);
    try {
      const res = await api.get('/transactions/pending');
      setPending(res.data.data || []);
      setPendingLoaded(true);
    } catch {
      setPending([]);
    } finally {
      setPendingLoading(false);
    }
  }

  // ── Load all ──
  async function loadAll() {
    setAllLoading(true);
    try {
      const res = await api.get('/transactions/transactions?page=0&size=50');
      setAll(res.data.data?.content || res.data.data || []);
      setAllLoaded(true);
    } catch {
      setAll([]);
    } finally {
      setAllLoading(false);
    }
  }

  // ── Confirm approval ──
  async function confirmApproval() {
    setModalLoading(true);
    setApproveError('');
    try {
      await api.post('/transactions/approve', {
        transactionId: modal.id,
        status: modalStatus,
      });
      setModal(null);
      const msg = modalStatus === 'APPROVED'
        ? 'Transaction approved! For external payouts use Testing Tools to simulate Paystack webhook.'
        : 'Transaction rejected.';
      setApproveSuccess(msg);
      loadPending();
    } catch (err) {
      setApproveError(err.response?.data?.message || 'Could not process transaction.');
      setModal(null);
    } finally {
      setModalLoading(false);
    }
  }

  // ── Simulate webhook ──
  async function simulateWebhook(e) {
    e.preventDefault();
    setWebhookError(''); setWebhookSuccess('');
    if (!webhookRef) {
      setWebhookError('Please enter a transaction reference.'); return;
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

  const inputCls = "px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300 w-full";

  function Alert({ type, message }) {
    if (!message) return null;
    const styles = {
      success: 'bg-green-50 text-green-700',
      error:   'bg-red-50 text-red-700',
    };
    const icons = { success: 'ti-circle-check', error: 'ti-alert-circle' };
    return (
      <div className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg mb-4 ${styles[type]}`}>
        <i className={`ti ${icons[type]}`} /> {message}
      </div>
    );
  }

  function RoleNotice({ role }) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg mb-4">
        <i className="ti ti-lock" /> Only <strong className="mx-1">{role}</strong> users can perform this action.
      </div>
    );
  }

  return (
    <Layout>
      <Topbar
        title="Transactions"
        subtitle="Internal transfers, external payouts, funding and approvals"
      />

      <main className="p-7 flex flex-col gap-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1.5 w-fit flex-wrap">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${tabParam === key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Internal Transfer ── */}
        {tabParam === 'internal' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Initiate internal transfer</h2>
            <p className="text-xs text-gray-500 mb-4">Transfer funds between accounts within the system.</p>

            {/* Flow */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 mb-5">
              {['Maker initiates','Approver reviews','Transfer complete'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <i className="ti ti-chevron-right text-gray-300 text-xs" />}
                  <div className={`flex items-center gap-1.5 text-xs font-medium
                    ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold
                      ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {i + 1}
                    </div>
                    {step}
                  </div>
                </div>
              ))}
            </div>

            {!isMaker
              ? <RoleNotice role="MAKER" />
              : (
                <>
                  <Alert type="success" message={intSuccess} />
                  <Alert type="error"   message={intError}   />
                  <form onSubmit={handleInternal} className="flex flex-col gap-4">
                    {[
                      { label: 'Source account number',      key: 'sourceAccount',      placeholder: 'e.g. 1234567890' },
                      { label: 'Destination account number', key: 'destinationAccount', placeholder: 'e.g. 0987654321' },
                      { label: 'Amount',                     key: 'amount',             placeholder: 'e.g. 500000', type: 'number' },
                      { label: 'Idempotency key',            key: 'idempotencyKey',     placeholder: 'e.g. TXN-20240510-001',
                        hint: 'A unique value per transaction to prevent duplicates' },
                    ].map(({ label, key, placeholder, type, hint }) => (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                        <input type={type || 'text'} value={internal[key]}
                          onChange={e => setInternal({...internal, [key]: e.target.value})}
                          placeholder={placeholder} className={inputCls} />
                        {hint && <span className="text-xs text-gray-400">{hint}</span>}
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <button type="submit" disabled={intLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                        {intLoading
                          ? <><i className="ti ti-loader animate-spin" /> Initiating...</>
                          : <><i className="ti ti-arrow-right" /> Initiate transfer</>}
                      </button>
                    </div>
                  </form>
                </>
              )}
          </div>
        )}

        {/* ── External Payout ── */}
        {tabParam === 'payout' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Initiate external payout</h2>
            <p className="text-xs text-gray-500 mb-4">Send funds to an external bank account via Paystack.</p>

            {/* Flow */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 mb-4">
              {['Maker initiates','Approver reviews','Paystack confirms','Complete'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <i className="ti ti-chevron-right text-gray-300 text-xs" />}
                  <div className={`flex items-center gap-1.5 text-xs font-medium
                    ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold
                      ${i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {i + 1}
                    </div>
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-blue-50 text-blue-700 text-xs px-4 py-3 rounded-lg mb-5">
              <i className="ti ti-info-circle mt-0.5" />
              After approval this payout stays <strong className="mx-1">Pending</strong>
              until Paystack confirms via webhook. Use Testing Tools in Pending Approval tab during development.
            </div>

            {!isMaker
              ? <RoleNotice role="MAKER" />
              : (
                <>
                  <Alert type="success" message={paySuccess} />
                  <Alert type="error"   message={payError}   />
                  <form onSubmit={handlePayout} className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Source account number',    key: 'sourceAccount',  placeholder: 'Internal account to debit' },
                      { label: 'Amount',                   key: 'amount',         placeholder: 'e.g. 250000', type: 'number' },
                      { label: 'Recipient account number', key: 'accountNumber',  placeholder: "Recipient's bank account" },
                      { label: 'Bank code',                key: 'bankCode',       placeholder: 'e.g. 044' },
                      { label: 'Bank name',                key: 'bankName',       placeholder: 'e.g. Access Bank' },
                      { label: 'Account name',             key: 'accountName',    placeholder: "Recipient's full name" },
                      { label: 'Idempotency key',          key: 'idempotencyKey', placeholder: 'e.g. PAY-20240510-001', full: true },
                    ].map(({ label, key, placeholder, type, full }) => (
                      <div key={key} className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                        <input type={type || 'text'} value={payout[key]}
                          onChange={e => setPayout({...payout, [key]: e.target.value})}
                          placeholder={placeholder} className={inputCls} />
                      </div>
                    ))}
                    <div className="col-span-2 flex justify-end mt-2">
                      <button type="submit" disabled={payLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                        {payLoading
                          ? <><i className="ti ti-loader animate-spin" /> Initiating...</>
                          : <><i className="ti ti-send" /> Initiate payout</>}
                      </button>
                    </div>
                  </form>
                </>
              )}
          </div>
        )}

        {/* ── External Funding ── */}
        {tabParam === 'funding' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">External funding</h2>
            <p className="text-xs text-gray-500 mb-4">Fund a system account from an external source via Paystack.</p>

            <div className="flex items-start gap-2 bg-blue-50 text-blue-700 text-xs px-4 py-3 rounded-lg mb-5">
              <i className="ti ti-info-circle mt-0.5" />
              This initiates a funding request through Paystack. The account will be credited once Paystack confirms payment.
            </div>

            <Alert type="success" message={fundSuccess} />
            <Alert type="error"   message={fundError}   />

            <form onSubmit={handleFunding} className="flex flex-col gap-4">
              {[
                { label: 'Source account number', key: 'sourceAccount',  placeholder: 'Account to credit' },
                { label: 'Amount',                key: 'amount',         placeholder: 'e.g. 1000000', type: 'number' },
                { label: 'Email address',         key: 'email',          placeholder: 'e.g. payer@company.com', type: 'email',
                  hint: 'Used by Paystack to send payment confirmation' },
                { label: 'Idempotency key',       key: 'idempotencyKey', placeholder: 'e.g. FUND-20240510-001' },
              ].map(({ label, key, placeholder, type, hint }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                  <input type={type || 'text'} value={funding[key]}
                    onChange={e => setFunding({...funding, [key]: e.target.value})}
                    placeholder={placeholder} className={inputCls} />
                  {hint && <span className="text-xs text-gray-400">{hint}</span>}
                </div>
              ))}
              <div className="flex justify-end">
                <button type="submit" disabled={fundLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                  {fundLoading
                    ? <><i className="ti ti-loader animate-spin" /> Initiating...</>
                    : <><i className="ti ti-cash" /> Initiate funding</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Pending Approval ── */}
        {tabParam === 'pending' && (
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Pending transactions</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Transactions waiting for approval</p>
                </div>
                <button onClick={loadPending} disabled={pendingLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                  <i className={`ti ti-refresh ${pendingLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>

              {!isApprover && <RoleNotice role="APPROVER" />}

              <Alert type="success" message={approveSuccess} />
              <Alert type="error"   message={approveError}   />

              {!pendingLoaded ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <i className="ti ti-clock text-3xl block mb-2 text-gray-300" />
                  Click refresh to load pending transactions
                </div>
              ) : pending.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <i className="ti ti-circle-check text-3xl block mb-2 text-gray-300" />
                  No pending transactions
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        {['Reference','Type','Source','Destination','Amount','Status','Action'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((t, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-3 py-3 font-mono text-xs text-gray-700">{t.transactionReference || '—'}</td>
                          <td className="px-3 py-3"><TypePill type={t.type} /></td>
                          <td className="px-3 py-3 text-gray-600">{t.sourceAccount?.accountNumber || '—'}</td>
                          <td className="px-3 py-3 text-gray-600">{t.destinationAccount?.accountNumber || '—'}</td>
                          <td className="px-3 py-3 font-medium text-gray-900">{formatMoney(t.amount)}</td>
                          <td className="px-3 py-3"><Pill status={t.status} /></td>
                          <td className="px-3 py-3">
                            {isApprover ? (
                              <div className="flex gap-2">
                                <button onClick={() => { setModal(t); setModalStatus('APPROVED'); }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all">
                                  <i className="ti ti-check" /> Approve
                                </button>
                                <button onClick={() => { setModal(t); setModalStatus('REJECTED'); }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all">
                                  <i className="ti ti-x" /> Reject
                                </button>
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Testing Tools */}
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <i className="ti ti-flask text-amber-600 text-lg" />
                <h2 className="text-sm font-semibold text-amber-800">Testing Tools</h2>
                <span className="text-xs font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  DEV ONLY
                </span>
              </div>
              <p className="text-xs text-amber-700 mb-5">
                Simulate a Paystack webhook to test the full external payout flow.
                Paystack cannot reach your localhost during development.
                <strong className="ml-1">Remove this section before going live.</strong>
              </p>

              <Alert type="success" message={webhookSuccess} />
              <Alert type="error"   message={webhookError}   />

              <form onSubmit={simulateWebhook} className="grid grid-cols-2 gap-4 max-w-lg">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Transaction reference
                  </label>
                  <input value={webhookRef} onChange={e => setWebhookRef(e.target.value)}
                    placeholder="Paste reference from approved payout"
                    className="px-3 py-2.5 border border-amber-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white placeholder:text-gray-300" />
                  <span className="text-xs text-amber-600">Get this from the payout response or All Transactions tab</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Simulate event
                  </label>
                  <select value={webhookEvent} onChange={e => setWebhookEvent(e.target.value)}
                    className="px-3 py-2.5 border border-amber-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white">
                    <option value="transfer.success">transfer.success — payout succeeded</option>
                    <option value="transfer.failed">transfer.failed — payout failed</option>
                    <option value="transfer.reversed">transfer.reversed — payout reversed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <button type="submit" disabled={webhookLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-all">
                    {webhookLoading
                      ? <><i className="ti ti-loader animate-spin" /> Simulating...</>
                      : <><i className="ti ti-player-play" /> Simulate Paystack webhook</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── All Transactions ── */}
        {tabParam === 'all' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">All transactions</h2>
                <p className="text-xs text-gray-500 mt-0.5">Full transaction history</p>
              </div>
              <button onClick={loadAll} disabled={allLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                <i className={`ti ti-refresh ${allLoading ? 'animate-spin' : ''}`} />
                {allLoaded ? 'Refresh' : 'Load transactions'}
              </button>
            </div>

            {!allLoaded ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <i className="ti ti-list text-3xl block mb-2 text-gray-300" />
                Click "Load transactions" to view all transactions
              </div>
            ) : all.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No transactions found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Reference','Type','Source','Destination','Amount','Status','Creator'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {all.map((t, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono text-xs text-gray-700">{t.transactionReference || '—'}</td>
                        <td className="px-3 py-3"><TypePill type={t.type} /></td>
                        <td className="px-3 py-3 text-gray-600">{t.sourceAccount?.accountNumber || '—'}</td>
                        <td className="px-3 py-3 text-gray-600">{t.destinationAccount?.accountNumber || '—'}</td>
                        <td className="px-3 py-3 font-medium text-gray-900">{formatMoney(t.amount)}</td>
                        <td className="px-3 py-3"><Pill status={t.status} /></td>
                        <td className="px-3 py-3 text-gray-600">{t.creator?.id || '—'}</td>
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
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Process transaction</h3>
            <p className="text-sm text-gray-500 mb-4">Review the details then confirm your decision.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 flex flex-col gap-2 text-sm">
              {[
                { label: 'Reference', value: modal.transactionReference },
                { label: 'Type',      value: modal.type },
                { label: 'Amount',    value: formatMoney(modal.amount) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{value || '—'}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Your decision
              </label>
              <select value={modalStatus} onChange={e => setModalStatus(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500">
                <option value="APPROVED">Approve this transaction</option>
                <option value="REJECTED">Reject this transaction</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all">
                Cancel
              </button>
              <button onClick={confirmApproval} disabled={modalLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                {modalLoading
                  ? <><i className="ti ti-loader animate-spin" /> Processing...</>
                  : <><i className="ti ti-check" /> Confirm</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}