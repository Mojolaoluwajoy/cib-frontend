import { useState } from 'react';
import { Link } from 'react-router-dom';
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

// ══════════════════════════════════════════════
// MULTI-STEP REGISTRATION FORM
// Public — no login needed
// ══════════════════════════════════════════════
function OrgRegistrationForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    organizationEmail: '',
    registrationNumber: '',
    phoneNumber: '',
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
    if (!form.name || !form.organizationEmail ||
        !form.registrationNumber || !form.phoneNumber) {
      setError('Please fill in all organization details.'); return;
    }
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.firstName || !form.lastName ||
        !form.email || !form.password || !form.nin) {
      setError('Please fill in all admin details.'); return;
    }
    setLoading(true);
    try {
      await api.post('/organizations/create', form);
      setSuccess('Organization registered! A super admin will review and approve your request.');
      setForm({
        name: '', organizationEmail: '', registrationNumber: '',
        phoneNumber: '', firstName: '', lastName: '',
        email: '', password: '', nin: '',
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
        Fill in your organization and admin details. A super admin will approve your request.
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
        <form onSubmit={handleNext} className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Organization name
            </label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Dangote Group"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Organization email
            </label>
            <input name="organizationEmail" type="email" value={form.organizationEmail} onChange={handleChange}
              placeholder="e.g. info@dangote.com"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Phone number
            </label>
            <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange}
              placeholder="e.g. 08012345678"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Registration number
            </label>
            <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange}
              placeholder="e.g. RC-123456"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="col-span-2 flex justify-end mt-2">
            <button type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all">
              Next <i className="ti ti-arrow-right" />
            </button>
          </div>
        </form>
      )}

      {/* ── Step 2: Admin account details ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              First name
            </label>
            <input name="firstName" value={form.firstName} onChange={handleChange}
              placeholder="e.g. Chidi"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Last name
            </label>
            <input name="lastName" value={form.lastName} onChange={handleChange}
              placeholder="e.g. Okeke"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Admin email
            </label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="e.g. chidi@dangote.com"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Password
            </label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Min. 8 characters"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              NIN
            </label>
            <input name="nin" value={form.nin} onChange={handleChange}
              placeholder="11-digit National Identification Number" maxLength={11}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
          </div>
          <div className="col-span-2 flex justify-between mt-2">
            <button type="button" onClick={() => { setStep(1); setError(''); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all">
              <i className="ti ti-arrow-left" /> Back
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
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

// ══════════════════════════════════════════════
// ORG APPROVALS TABLE — SUPER_ADMIN only
// Shows all orgs, clicking one opens approval modal
// ══════════════════════════════════════════════
function OrgApprovalsTable() {
  const [orgs, setOrgs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [loaded, setLoaded]         = useState(false);
  const [modal, setModal]           = useState(null);
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
    // Pre-select based on current status
    setApprovalForm({
      organizationStatus: org.organizationStatus === 'PENDING' ? 'APPROVED' : org.organizationStatus,
      userStatus: 'ACTIVE',
    });
  }

  async function handleApprove() {
    if (!modal.adminId) {
      setApprovalError('Admin ID not found for this organization. Please check the backend mapper.');
      return;
    }
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
      setTableSuccess(`${modal.name} has been processed successfully!`);
      loadOrgs();
      setTimeout(() => setTableSuccess(''), 5000);
    } catch (err) {
      setApprovalError(
        err.response?.data?.message || 'Processing failed. Please try again.'
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
              Click any organization to review and process their registration
            </p>
          </div>
          <button onClick={loadOrgs} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
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
                  <tr key={i}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => openModal(org)}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {/* Process button — opens the approval modal */}
                        <button
                          onClick={e => { e.stopPropagation(); openModal(org); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all">
                          <i className="ti ti-check" /> Process
                        </button>
                        {/* View button — goes to OrgDetail page */}
                        <Link
                          to={`/organizations/${org.id}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all">
                          <i className="ti ti-eye" /> View
                        </Link>
                        {/* Edit button — goes to EditOrganization page */}
                        <Link
                          to={`/organizations/${org.id}/edit`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-all">
                          <i className="ti ti-pencil" /> Edit
                        </Link>
                      </div>
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

            {/* Organization details summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Organization</span>
                <span className="font-semibold text-gray-900">{modal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reg. number</span>
                <span className="font-medium">{modal.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current status</span>
                <Pill status={modal.organizationStatus} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Admin ID</span>
                <span className="font-medium text-xs font-mono">
                  {modal.adminId || 'Not found — check backend mapper'}
                </span>
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
                    ...approvalForm, organizationStatus: e.target.value,
                  })}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="APPROVED">Approved — activate organization</option>
                  <option value="REJECTED">Rejected — deny registration</option>
                  <option value="PENDING">Pending — leave for later</option>
                  <option value="DISABLED">Disabled — disable organization</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Admin account status
                </label>
                <select
                  value={approvalForm.userStatus}
                  onChange={e => setApprovalForm({
                    ...approvalForm, userStatus: e.target.value,
                  })}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                  <option value="ACTIVE">Active — admin can log in</option>
                  <option value="INACTIVE">Inactive — admin cannot log in</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-all">
                Cancel
              </button>
              <button onClick={handleApprove} disabled={approvalLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                {approvalLoading
                  ? <><i className="ti ti-loader animate-spin" /> Processing...</>
                  : <><i className="ti ti-check" /> Confirm decision</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════
// MAIN PAGE — decides what to show based on
// whether user is logged in and what their role is
// ══════════════════════════════════════════════
export default function OrgOnboarding() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isLoggedIn   = !!user?.token;

  // Not logged in — show standalone registration form
  // No sidebar, just a clean centered page like the login page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <div className="text-gray-900 font-semibold text-lg tracking-tight">
              CIB Platform
            </div>
            <div className="text-gray-400 text-xs mt-1">
              Corporate Internet Banking
            </div>
          </div>
          <OrgRegistrationForm />
          <p className="text-center text-sm text-gray-500 mt-5">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Logged in — show with sidebar
  return (
    <Layout>
      <Topbar
        title={isSuperAdmin ? 'Organization Approvals' : 'Organization Onboarding'}
        subtitle={isSuperAdmin
          ? 'Review and process organization registration requests'
          : 'Register a new organization and admin account'
        }
      />
      <main className="p-7 flex flex-col gap-6 max-w-4xl">
        {isSuperAdmin  && <OrgApprovalsTable />}
        {!isSuperAdmin && <OrgRegistrationForm />}
      </main>
    </Layout>
  );
}