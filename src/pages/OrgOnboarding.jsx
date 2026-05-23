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
    IN_REVIEW:'bg-blue-50 text-blue-700',
  };
  const cls = map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

export default function OrgOnboarding() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // ── Registration form state ──
  const [form, setForm] = useState({
    name: '', organizationEmail: '', registrationNumber: '',
    firstName: '', lastName: '', email: '', password: '', nin: '',
  });
  const [formLoading, setFormLoading]   = useState(false);
  const [formSuccess, setFormSuccess]   = useState('');
  const [formError, setFormError]       = useState('');

  // ── Organizations table state ──
  const [orgs, setOrgs]           = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsLoaded, setOrgsLoaded]   = useState(false);

  // ── Approval modal state ──
  const [modal, setModal]         = useState(null); // holds the org being approved
  const [approvalForm, setApprovalForm] = useState({
    organizationStatus: 'APPROVED',
    userStatus: 'ACTIVE',
  });
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError]     = useState('');

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
    setFormSuccess('');
  }

  async function handleRegister(e) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const required = ['name','organizationEmail','registrationNumber',
                      'firstName','lastName','email','password','nin'];
    if (required.some(k => !form[k])) {
      setFormError('Please fill in all fields.'); return;
    }

    setFormLoading(true);
    try {
      await api.post('/organizations/create', form);
      setFormSuccess('Organization registered successfully! Awaiting approval.');
      setForm({ name:'', organizationEmail:'', registrationNumber:'',
                firstName:'', lastName:'', email:'', password:'', nin:'' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setFormLoading(false);
    }
  }

  async function loadOrgs() {
    setOrgsLoading(true);
    try {
      const res = await api.get('/organizations/viewAll');
      setOrgs(res.data.data || []);
      setOrgsLoaded(true);
    } catch {
      setOrgs([]);
    } finally {
      setOrgsLoading(false);
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
      loadOrgs();
    } catch (err) {
      setApprovalError(err.response?.data?.message || 'Approval failed.');
    } finally {
      setApprovalLoading(false);
    }
  }

  return (
    <Layout>
      <Topbar
        title="Organization Onboarding"
        subtitle="Register a new organization and admin account"
      />

      <main className="p-7 flex flex-col gap-6">

        {/* ── Registration form ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Register an organization
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            Fill in the details below. An admin will review and approve your request.
          </p>

          {formSuccess && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
              <i className="ti ti-circle-check" /> {formSuccess}
            </div>
          )}
          {formError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
              <i className="ti ti-alert-circle" /> {formError}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* Organization details */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="flex-1 h-px bg-gray-100" /> Organization details <span className="flex-1 h-px bg-gray-100" />
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization name</label>
                <input name="name" value={form.name} onChange={handleFormChange}
                  placeholder="e.g. Dangote Group"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization email</label>
                <input name="organizationEmail" value={form.organizationEmail} onChange={handleFormChange}
                  type="email" placeholder="e.g. info@dangote.com"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registration number</label>
                <input name="registrationNumber" value={form.registrationNumber} onChange={handleFormChange}
                  placeholder="e.g. RC-123456"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              </div>
            </div>

            {/* Admin details */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="flex-1 h-px bg-gray-100" /> Admin account details <span className="flex-1 h-px bg-gray-100" />
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First name</label>
                <input name="firstName" value={form.firstName} onChange={handleFormChange}
                  placeholder="e.g. Chidi"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last name</label>
                <input name="lastName" value={form.lastName} onChange={handleFormChange}
                  placeholder="e.g. Okeke"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin email</label>
                <input name="email" value={form.email} onChange={handleFormChange}
                  type="email" placeholder="e.g. chidi@dangote.com"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
                <input name="password" value={form.password} onChange={handleFormChange}
                  type="password" placeholder="Min. 8 characters"
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NIN</label>
                <input name="nin" value={form.nin} onChange={handleFormChange}
                  placeholder="11-digit NIN" maxLength={11}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={formLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {formLoading
                  ? <><i className="ti ti-loader animate-spin" /> Submitting...</>
                  : <><i className="ti ti-send" /> Submit registration</>}
              </button>
            </div>
          </form>
        </div>

        {/* ── Organizations table — SUPER_ADMIN only ── */}
        {isSuperAdmin && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">All organizations</h2>
                <p className="text-xs text-gray-500 mt-0.5">Review and approve registration requests</p>
              </div>
              <button onClick={loadOrgs} disabled={orgsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                <i className={`ti ti-refresh ${orgsLoading ? 'animate-spin' : ''}`} />
                {orgsLoaded ? 'Refresh' : 'Load organizations'}
              </button>
            </div>

            {!orgsLoaded ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <i className="ti ti-building text-3xl block mb-2 text-gray-300" />
                Click "Load organizations" to view all registered organizations
              </div>
            ) : orgs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <i className="ti ti-building text-3xl block mb-2 text-gray-300" />
                No organizations found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Organization','Reg. number','Org ID','Status','Action'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
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
                        <td className="px-3 py-3 text-gray-500">{org.id}</td>
                        <td className="px-3 py-3"><Pill status={org.organizationStatus} /></td>
                        <td className="px-3 py-3">
                          {(org.organizationStatus||'').toUpperCase() === 'PENDING' ? (
                            <button onClick={() => openModal(org)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all">
                              <i className="ti ti-check" /> Approve
                            </button>
                          ) : '—'}
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

      {/* ── Approval modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Process organization</h3>
            <p className="text-sm text-gray-500 mb-4">Set the status for this organization and its admin.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Organization</span>
                <span className="font-medium">{modal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reg. number</span>
                <span className="font-medium">{modal.registrationNumber}</span>
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
                <select value={approvalForm.organizationStatus}
                  onChange={e => setApprovalForm({...approvalForm, organizationStatus: e.target.value})}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500">
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Admin user status
                </label>
                <select value={approvalForm.userStatus}
                  onChange={e => setApprovalForm({...approvalForm, userStatus: e.target.value})}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
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
                  : <><i className="ti ti-check" /> Confirm</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}