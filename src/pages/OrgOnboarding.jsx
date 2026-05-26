import { useState } from 'react';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function Pill({ status }) {
  const map = {
    APPROVED: 'bg-green-50 text-green-700',
    PENDING:  'bg-amber-50 text-amber-700',
    REJECTED: 'bg-red-50 text-red-700',
    DISABLED: 'bg-gray-100 text-gray-500',
  };
  const cls = map[(status || '').toUpperCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

// ── Multi step form for organization registration ──
function OrgRegistrationForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Step 1 — org details
    name: '',
    organizationEmail: '',
    registrationNumber: '',
    // Step 2 — admin details
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    nin: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  function handleNext(e) {
    e.preventDefault();
    setError('');
    // Validate step 1 fields before moving to step 2
    if (!form.name || !form.organizationEmail || !form.registrationNumber) {
      setError('Please fill in all organization details.'); return;
    }
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.nin) {
      setError('Please fill in all admin details.'); return;
    }
    setLoading(true);
    try {
      await api.post('/organizations/create', form);
      setSuccess('Organization registered successfully! Awaiting approval.');
      setForm({
        name: '', organizationEmail: '', registrationNumber: '',
        firstName: '', lastName: '', email: '', password: '', nin: '',
      });
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">
        Register an organization
      </h2>
      <p className="text-xs text-gray-500 mb-5">
        Fill in the details below. A super admin will review and approve your request.
      </p>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-6">
        {[
          { num: 1, label: 'Organization details' },
          { num: 2, label: 'Admin account'        },
        ].map(({ num, label }, i) => {
          const isDone   = step > num;
          const isActive = step === num;
          return (
            <div key={num} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-10 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                  ${isDone   ? 'bg-green-500 text-white'  : ''}
                  ${isActive ? 'bg-blue-600 text-white'   : ''}
                  ${!isDone && !isActive ? 'bg-gray-100 text-gray-400' : ''}`}>
                  {isDone ? <i className="ti ti-check text-xs" /> : num}
                </div>
                <span className={`text-xs font-medium
                  ${isDone   ? 'text-green-600' : ''}
                  ${isActive ? 'text-blue-600'  : ''}
                  ${!isDone && !isActive ? 'text-gray-400' : ''}`}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
          <i className="ti ti-circle-check" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
          <i className="ti ti-alert-circle" /> {error}
        </div>
      )}

      {/* ── Step 1: Organization details ── */}
      {step === 1 && (
        <form onSubmit={handleNext} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Organization name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Dangote Group"
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Organization email
              </label>
              <input
                name="organizationEmail"
                type="email"
                value={form.organizationEmail}
                onChange={handleChange}
                placeholder="e.g. info@dangote.com"
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Registration number
              </label>
              <input
                name="registrationNumber"
                value={form.registrationNumber}
                onChange={handleChange}
                placeholder="e.g. RC-123456"
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all">
              Next <i className="ti ti-arrow-right" />
            </button>
          </div>
        </form>
      )}

      {/* ── Step 2: Admin account details ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                First name
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="e.g. Chidi"
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Last name
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="e.g. Okeke"
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Admin email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. chidi@dangote.com"
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                NIN
              </label>
              <input
                name="nin"
                value={form.nin}
                onChange={handleChange}
                placeholder="11-digit National Identification Number"
                maxLength={11}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all"
            >
              <i className="ti ti-arrow-left" /> Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
            >
              {loading
                ? <><i className="ti ti-loader animate-spin" /> Submitting...</>
                : <><i className="ti ti-send" /> Submit registration</>
              }
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Approvals table for SUPER_ADMIN ──
function OrgApprovalsTable() {
  const [orgs, setOrgs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const [modal, setModal]         = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    organizationStatus: 'APPROVED',
    userStatus: 'ACTIVE',
  });
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError]     = useState('');
  const [tableSuccess, setTableSuccess]       = useState('');

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

  function openModal(org) {
    setModal(org);
    setApprovalError('');
    setApprovalForm({ organizationStatus: 'APPROVED', userStatus: 'ACTIVE' });
  }

  async function handleApprove() {
    setApprovalLoading(true);
    setApprovalError('');
    try {
     await api.post('/organizations/approve', {
         organizationId:     modal.id,
         adminId:            modal.adminId,
         organizationStatus: approvalForm.organizationStatus,
         userStatus:         approvalForm.userStatus,
        });
      setModal(null);
      setTableSuccess('Organization processed successfully!');
      loadOrgs();
      setTimeout(() => setTableSuccess(''), 5000);
    } catch (err) {
      setApprovalError(
        err.response?.data?.message || 'Approval failed. Please try again.'
      );
    } finally {
      setApprovalLoading(false);
    }
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Organization approvals
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and process organization registration requests
            </p>
          </div>
          <button
            onClick={loadOrgs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
          >
            <i className={`ti ti-refresh ${loading ? 'animate-spin' : ''}`} />
            {loaded ? 'Refresh' : 'Load organizations'}
          </button>
        </div>

        {tableSuccess && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
            <i className="ti ti-circle-check" /> {tableSuccess}
          </div>
        )}

        {!loaded ? (
          <div className="text-center py-12">
            <i className="ti ti-building text-3xl text-gray-200 block mb-2" />
            <p className="text-sm text-gray-400">
              Click "Load organizations" to view registrations
            </p>
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-12">
            <i className="ti ti-circle-check text-3xl text-gray-200 block mb-2" />
            <p className="text-sm text-gray-400">No organizations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  {['Organization', 'Reg. number', 'Status', 'Action'].map(h => (
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
                    <td className="px-3 py-3 font-medium text-gray-900">
                      {org.name}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {org.registrationNumber}
                    </td>
                    <td className="px-3 py-3">
                      <Pill status={org.organizationStatus} />
                    </td>
                    <td className="px-3 py-3">
                      {(org.organizationStatus || '').toUpperCase() === 'PENDING' ? (
                        <button
                          onClick={() => openModal(org)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all"
                        >
                          <i className="ti ti-check" /> Process
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Already processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Approval modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Process organization
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Set the status for this organization and its admin account.
            </p>

            {/* Organization details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Organization</span>
                <span className="font-medium">{modal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reg. number</span>
                <span className="font-medium">{modal.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current status</span>
                <Pill status={modal.organizationStatus} />
              </div>
            </div>

            {approvalError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4">
                <i className="ti ti-alert-circle" /> {approvalError}
              </div>
            )}

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Organization status
                </label>
                <select
                  value={approvalForm.organizationStatus}
                  onChange={e => setApprovalForm({
                    ...approvalForm,
                    organizationStatus: e.target.value,
                  })}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                >
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PENDING">Pending</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Admin user status
                </label>
                <select
                  value={approvalForm.userStatus}
                  onChange={e => setApprovalForm({
                    ...approvalForm,
                    userStatus: e.target.value,
                  })}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approvalLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
              >
                {approvalLoading
                  ? <><i className="ti ti-loader animate-spin" /> Processing...</>
                  : <><i className="ti ti-check" /> Confirm</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main OrgOnboarding page ──
export default function OrgOnboarding() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isLoggedIn   = !!user?.token;

  // ── Not logged in — show registration form without sidebar ──
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <div className="text-gray-900 font-semibold text-lg">CIB Platform</div>
            <div className="text-gray-400 text-xs mt-1">Corporate Internet Banking</div>
          </div>
          <OrgRegistrationForm />
          <p className="text-center text-sm text-gray-500 mt-4">
            Already registered?{' '}
            <a href="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Logged in — show with sidebar ──
  return (
    <Layout>
      <Topbar
        title={isSuperAdmin ? 'Organization Approvals' : 'Organization Onboarding'}
        subtitle={isSuperAdmin
          ? 'Review and process organization registration requests'
          : 'Register a new organization and admin account'
        }
      />
      <main className="p-7 flex flex-col gap-6 max-w-3xl">
        {isSuperAdmin && <OrgApprovalsTable />}
        {!isSuperAdmin && <OrgRegistrationForm />}
      </main>
    </Layout>
  );
}
       <Topbar
        title={isSuperAdmin ? 'Organization Approvals' : 'Organization Onboarding'}
        subtitle={isSuperAdmin
          ? 'Review and process organization registration requests'
          : 'Register a new organization and admin account'
        }
      />

      <main className="p-7 flex flex-col gap-6 max-w-3xl">
        {/* SUPER_ADMIN only sees approvals table */}
        {isSuperAdmin && <OrgApprovalsTable />}

        {/* Everyone else sees the registration form */}
        {!isSuperAdmin && <OrgRegistrationForm />}
      </main>
    </Layout>
  );
}