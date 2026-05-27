import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import api from '../api/axios';

const EDITABLE_FIELDS = [
  { key: 'name',                label: 'Organization name',  type: 'text',  placeholder: 'Enter new name'             },
  { key: 'organizationEmail',   label: 'Organization email', type: 'email', placeholder: 'Enter new email'            },
  { key: 'registrationNumber',  label: 'Reg. number',        type: 'text',  placeholder: 'Enter new reg. number'      },
  { key: 'phoneNumber',         label: 'Phone number',       type: 'text',  placeholder: 'Enter new phone number'     },
];

const ORG_STATUSES = ['APPROVED', 'REJECTED', 'PENDING', 'DISABLED'];

export default function EditOrganization() {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [org, setOrg]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState([]);
  const [form, setForm]         = useState({
    name: '', organizationEmail: '', registrationNumber: '', phoneNumber: '',
  });
  const [statusChange, setStatusChange]   = useState('');
  const [changeStatus, setChangeStatus]   = useState(false);
  const [saveLoading, setSaveLoading]     = useState(false);
  const [success, setSuccess]             = useState('');
  const [error, setError]                 = useState('');

  useEffect(() => {
    loadOrg();
  }, [id]);

  async function loadOrg() {
    setLoading(true);
    try {
      const res = await api.post('/organizations/findBy', Number(id));
      setOrg(res.data.data);
      setStatusChange(res.data.data?.organizationStatus || 'APPROVED');
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }

  function toggleField(key) {
    if (selected.includes(key)) {
      setSelected(selected.filter(k => k !== key));
      setForm({ ...form, [key]: '' });
    } else {
      setSelected([...selected, key]);
    }
    setError(''); setSuccess('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (selected.length === 0 && !changeStatus) {
      setError('Please select at least one field to update or change the status.'); return;
    }
    if (selected.some(key => !form[key])) {
      setError('Please fill in all selected fields.'); return;
    }

    const body = {};
    selected.forEach(key => { body[key] = form[key]; });
    if (changeStatus) body.organizationStatus = statusChange;

    setSaveLoading(true);
    try {
      await api.put(`/organizations/${id}/profile`, body);
      setSuccess('Organization updated successfully!');
      setSelected([]);
      setForm({ name: '', organizationEmail: '', registrationNumber: '', phoneNumber: '' });
      setChangeStatus(false);
      loadOrg();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update organization.');
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <Topbar title="Edit Organization" subtitle="Loading..." />
        <main className="p-7">
          <p className="text-sm text-gray-400">Loading organization details...</p>
        </main>
      </Layout>
    );
  }

  if (!org) {
    return (
      <Layout>
        <Topbar title="Edit Organization" subtitle="Not found" />
        <main className="p-7">
          <p className="text-sm text-red-500">Organization not found.</p>
          <Link to="/org-onboarding" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            ← Back to approvals
          </Link>
        </main>
      </Layout>
    );
  }

  return (
    <Layout>
      <Topbar
        title="Edit Organization"
        subtitle={`Updating details for ${org.name}`}
      />
      <main className="p-7 max-w-2xl flex flex-col gap-6">

        <Link to="/org-onboarding"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
          <i className="ti ti-arrow-left" /> Back to approvals
        </Link>

        {/* Current org details */}
        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-white font-semibold text-base mb-4">Current details</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Name',             value: org.name                  },
              { label: 'Status',           value: org.organizationStatus    },
              { label: 'Reg. number',      value: org.registrationNumber    },
              { label: 'DVA bank',         value: org.dvaBankName || 'Not created yet' },
              { label: 'DVA account',      value: org.dvaAccountNumber || 'Not created yet' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">{label}</div>
                <div className="text-white text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Update organization</h2>
          <p className="text-xs text-gray-500 mb-5">
            Select which fields to change. Toggle status change to enable or disable the organization.
          </p>

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

          <form onSubmit={handleSave} className="flex flex-col gap-3">

            {/* Field selectors */}
            {EDITABLE_FIELDS.map(({ key, label, type, placeholder }) => {
              const isSel = selected.includes(key);
              return (
                <div key={key}
                  className={`border rounded-xl p-4 transition-all cursor-pointer
                    ${isSel ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => !isSel && toggleField(key)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3" onClick={e => { e.stopPropagation(); toggleField(key); }}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${isSel ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {isSel && <i className="ti ti-check text-white" style={{ fontSize: '11px' }} />}
                      </div>
                      <span className={`text-sm font-medium ${isSel ? 'text-blue-700' : 'text-gray-700'}`}>
                        {label}
                      </span>
                    </div>
                    {isSel && (
                      <button type="button"
                        onClick={e => { e.stopPropagation(); toggleField(key); }}
                        className="text-xs text-gray-400 hover:text-red-500">
                        Remove
                      </button>
                    )}
                  </div>
                  {isSel && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <input type={type} value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        placeholder={placeholder} autoFocus
                        className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-all placeholder:text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Status change toggle */}
            <div className={`border rounded-xl p-4 transition-all cursor-pointer
              ${changeStatus ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => !changeStatus && setChangeStatus(true)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"
                  onClick={e => { e.stopPropagation(); setChangeStatus(!changeStatus); }}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${changeStatus ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}`}>
                    {changeStatus && <i className="ti ti-check text-white" style={{ fontSize: '11px' }} />}
                  </div>
                  <span className={`text-sm font-medium ${changeStatus ? 'text-amber-700' : 'text-gray-700'}`}>
                    Change organization status
                  </span>
                </div>
                {changeStatus && (
                  <button type="button"
                    onClick={e => { e.stopPropagation(); setChangeStatus(false); }}
                    className="text-xs text-gray-400 hover:text-red-500">
                    Remove
                  </button>
                )}
              </div>
              {changeStatus && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  <select value={statusChange}
                    onChange={e => setStatusChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-sm outline-none focus:border-amber-400 bg-white transition-all">
                    {ORG_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {statusChange === 'DISABLED' && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <i className="ti ti-alert-triangle" />
                      Warning: Disabling this organization will also disable all its users.
                    </p>
                  )}
                </div>
              )}
            </div>

            {(selected.length > 0 || changeStatus) && (
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={saveLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                  {saveLoading
                    ? <><i className="ti ti-loader animate-spin" /> Saving...</>
                    : <><i className="ti ti-check" /> Save changes</>
                  }
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </Layout>
  );
}