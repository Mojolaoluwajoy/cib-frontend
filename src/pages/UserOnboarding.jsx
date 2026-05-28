import { useState } from 'react';
import Layout from '../components/Layout';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function Pill({ status }) {
  const map = {
    ACTIVE:   'bg-green-50 text-green-700',
    INACTIVE: 'bg-amber-50 text-amber-700',
    REJECTED: 'bg-red-50 text-red-700',
  };
  const cls = map[(status||'').toUpperCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

const TABS = ['Send Invite', 'Complete Registration', 'All Users'];

export default function UserOnboarding() {
  const { user } = useAuth();
  const isAdmin = ['ADMIN','SUPER_ADMIN'].includes(user?.role);
  const [activeTab, setActiveTab] = useState(0);

  // ── Invite form ──
  const [invite, setInvite]           = useState({ userEmail: '', role: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError]     = useState('');

  // ── Registration form ──
  const [reg, setReg] = useState({
    token: '', firstName: '', lastName: '',
    email: '', password: '', nin: '', adminKey: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError]     = useState('');
  const [regDone, setRegDone]       = useState(false);

  // ── Users table ──
  const [users, setUsers]           = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded]   = useState(false);

 async function handleInvite(e) {
   e.preventDefault();
   setInviteError(''); setInviteSuccess('');
   if (!invite.userEmail || !invite.role) {
     setInviteError('Please enter email and select a role.'); return;
   }
   setInviteLoading(true);
   try {
     await api.post('/users/invitation', invite);
     setInviteSuccess(
       `Invitation sent to ${invite.userEmail}! They will receive an email with a link to complete their registration at: ${window.location.origin}/complete-registration?token=THEIR_TOKEN`
     );
     setInvite({ userEmail: '', role: '' });
   } catch (err) {
     setInviteError(err.response?.data?.message || 'Failed to send invitation.');
   } finally {
     setInviteLoading(false);
   }
 }

  async function handleRegister(e) {
    e.preventDefault();
    setRegError(''); setRegSuccess('');
    if (Object.values(reg).some(v => !v)) {
      setRegError('Please fill in all fields.'); return;
    }
    setRegLoading(true);
    try {
      await api.post('/users/create', reg);
      setRegSuccess('Account created successfully! You can now log in.');
      setRegDone(true);
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const res = await api.get('/users/viewAll');
      setUsers(res.data.data || []);
      setUsersLoaded(true);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }

  return (
    <Layout>
      <Topbar
        title="User Onboarding"
        subtitle="Invite users and complete their registration"
      />

      <main className="p-7 flex flex-col gap-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1.5 w-fit">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => { setActiveTab(i); if (i === 2) loadUsers(); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === i ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Send Invite ── */}
        {activeTab === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Send invitation</h2>
            <p className="text-xs text-gray-500 mb-5">
              An invitation token will be sent to the user's email. You assign their role here.
            </p>

            {!isAdmin ? (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg">
                <i className="ti ti-lock" /> Only ADMIN users can send invitations.
              </div>
            ) : (
              <>
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
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      User email address
                    </label>
                    <input type="email" value={invite.userEmail}
                      onChange={e => setInvite({...invite, userEmail: e.target.value})}
                      placeholder="e.g. john@dangote.com"
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Assign role
                    </label>
                    <select value={invite.role}
                      onChange={e => setInvite({...invite, role: e.target.value})}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                      <option value="">Select a role</option>
                      <option value="MAKER">Maker</option>
                      <option value="APPROVER">Approver</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={inviteLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                      {inviteLoading
                        ? <><i className="ti ti-loader animate-spin" /> Sending...</>
                        : <><i className="ti ti-send" /> Send invitation</>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* ── Tab 2: Complete Registration ── */}
        {activeTab === 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              Complete your registration
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Enter the token you received by email along with your personal details.
            </p>

            {/* Steps */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { label: 'Invite sent',    done: true  },
                { label: 'Fill details',   done: false, active: !regDone },
                { label: 'Account created',done: regDone },
              ].map(({ label, done, active }, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <div className={`h-px w-8 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                      ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {done ? <i className="ti ti-check text-xs" /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${done ? 'text-green-600' : active ? 'text-blue-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {regSuccess && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-circle-check" /> {regSuccess}
              </div>
            )}
            {regError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
                <i className="ti ti-alert-circle" /> {regError}
              </div>
            )}

            {!regDone && (
              <form onSubmit={handleRegister} className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Invitation token', key: 'token',     type: 'text',     placeholder: 'Paste token from your email', full: true },
                  { label: 'First name',        key: 'firstName', type: 'text',     placeholder: 'e.g. John' },
                  { label: 'Last name',         key: 'lastName',  type: 'text',     placeholder: 'e.g. Okeke' },
                  { label: 'Email address',     key: 'email',     type: 'email',    placeholder: 'e.g. john@dangote.com' },
                  { label: 'Password',          key: 'password',  type: 'password', placeholder: 'Min. 8 characters' },
                  { label: 'NIN',               key: 'nin',       type: 'text',     placeholder: '11-digit NIN' },
                  { label: 'Admin key',         key: 'adminKey',  type: 'text',     placeholder: 'Provided by your organization', full: true },
                ].map(({ label, key, type, placeholder, full }) => (
                  <div key={key} className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {label}
                    </label>
                    <input type={type} value={reg[key]}
                      onChange={e => setReg({...reg, [key]: e.target.value})}
                      placeholder={placeholder}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300" />
                  </div>
                ))}
                <div className="col-span-2 flex justify-end mt-2">
                  <button type="submit" disabled={regLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                    {regLoading
                      ? <><i className="ti ti-loader animate-spin" /> Creating account...</>
                      : <><i className="ti ti-user-check" /> Create account</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Tab 3: All Users ── */}
        {activeTab === 2 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">All users</h2>
                <p className="text-xs text-gray-500 mt-0.5">All registered users in the system</p>
              </div>
              <button onClick={loadUsers} disabled={usersLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all">
                <i className={`ti ti-refresh ${usersLoading ? 'animate-spin' : ''}`} />
                {usersLoaded ? 'Refresh' : 'Load users'}
              </button>
            </div>

            {!usersLoaded ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <i className="ti ti-users text-3xl block mb-2 text-gray-300" />
                Click "Load users" to view all registered users
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Name','Email','NIN','Role','Status','Organization'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-3 font-medium text-gray-900">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="px-3 py-3 text-gray-500">{u.email}</td>
                        <td className="px-3 py-3 text-gray-500">{u.nin}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-3"><Pill status={u.status} /></td>
                        <td className="px-3 py-3 text-gray-500">
                          {u.organizationId?.id || u.organization?.name || '—'}
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
    </Layout>
  );
}