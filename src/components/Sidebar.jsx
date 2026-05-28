import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin      = user?.role === 'ADMIN';
  const isMaker      = user?.role === 'MAKER';
  const isApprover   = user?.role === 'APPROVER';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function NavItem({ to, icon, label }) {
    return (
      <NavLink to={to} className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
        ${isActive
          ? 'bg-blue-600 text-white font-medium'
          : 'text-white/55 hover:bg-white/10 hover:text-white'}`
      }>
        <i className={`ti ${icon} text-lg`} /> {label}
      </NavLink>
    );
  }

  function SectionLabel({ label }) {
    return (
      <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-2 pt-3 pb-1">
        {label}
      </p>
    );
  }

  function TransactionDropdown({ links }) {
    return (
      <>
        <button
          onClick={() => setTransactionsOpen(!transactionsOpen)}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-white/55 hover:bg-white/10 hover:text-white transition-all w-full"
        >
          <div className="flex items-center gap-2.5">
            <i className="ti ti-arrow-left-right text-lg" /> Transactions
          </div>
          <i className={`ti ti-chevron-down text-sm transition-transform ${transactionsOpen ? 'rotate-180' : ''}`} />
        </button>
        {transactionsOpen && (
          <div className="pl-3 flex flex-col gap-0.5 mt-0.5">
            {links.map(({ to, icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all
                  ${isActive ? 'text-blue-400 font-medium' : 'text-white/45 hover:bg-white/10 hover:text-white'}`
                }>
                <i className={`ti ${icon} text-sm`} /> {label}
              </NavLink>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col min-h-screen fixed top-0 left-0 bottom-0">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-white font-semibold text-base tracking-tight">CIB Platform</div>
        <div className="text-white/40 text-xs mt-1">Corporate Internet Banking</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">

        {/* ══════════════════════════════ */}
        {/* SUPER_ADMIN                    */}
        {/* ══════════════════════════════ */}
        {isSuperAdmin && (
          <>
            <SectionLabel label="Overview" />
            <NavItem to="/dashboard"      icon="ti-layout-dashboard" label="Dashboard"     />

            <SectionLabel label="Organizations" />
            <NavItem to="/org-onboarding" icon="ti-building-check"   label="Approvals"     />

            <SectionLabel label="System" />
            <NavItem to="/profile"        icon="ti-user"             label="My Profile"    />
            <NavItem to="/settings"       icon="ti-settings"         label="Settings"      />
          </>
        )}

        {/* ══════════════════════════════ */}
        {/* ADMIN                          */}
        {/* ══════════════════════════════ */}
        {isAdmin && (
          <>
            <SectionLabel label="Overview" />
            <NavItem to="/dashboard"       icon="ti-layout-dashboard" label="Dashboard"       />

            <SectionLabel label="Organization" />
            <NavItem to="/user-onboarding" icon="ti-user-plus"        label="User Onboarding" />
            <NavItem to="/users"           icon="ti-users"            label="Users"           />
            <NavItem to="/accounts"        icon="ti-building-bank"    label="Accounts"        />

            <SectionLabel label="Transactions" />
            <TransactionDropdown links={[
              { to: '/transactions?tab=internal', icon: 'ti-refresh', label: 'Internal Transfer' },
              { to: '/transactions?tab=payout',   icon: 'ti-send',   label: 'External Payout'   },
              { to: '/transactions?tab=funding',  icon: 'ti-cash',   label: 'External Funding'  },
              { to: '/transactions?tab=pending',  icon: 'ti-clock',  label: 'Pending Approval'  },
              { to: '/transactions?tab=all',      icon: 'ti-list',   label: 'All Transactions'  },
            ]} />

            <SectionLabel label="System" />
            <NavItem to="/profile"         icon="ti-user"             label="My Profile"      />
            <NavItem to="/settings"        icon="ti-settings"         label="Settings"        />
          </>
        )}

        {/* ══════════════════════════════ */}
        {/* MAKER                          */}
        {/* ══════════════════════════════ */}
        {isMaker && (
          <>
            <SectionLabel label="Overview" />
            <NavItem to="/dashboard" icon="ti-layout-dashboard" label="Dashboard" />

            <SectionLabel label="Accounts" />
            <NavItem to="/accounts"  icon="ti-building-bank"   label="Accounts"  />

            <SectionLabel label="Transactions" />
            <TransactionDropdown links={[
              { to: '/transactions?tab=internal', icon: 'ti-refresh', label: 'Internal Transfer' },
              { to: '/transactions?tab=payout',   icon: 'ti-send',   label: 'External Payout'   },
              { to: '/transactions?tab=funding',  icon: 'ti-cash',   label: 'External Funding'  },
            ]} />

            <SectionLabel label="System" />
            <NavItem to="/profile"   icon="ti-user"            label="My Profile" />
            <NavItem to="/settings"  icon="ti-settings"        label="Settings"   />
          </>
        )}

        {/* ══════════════════════════════ */}
        {/* APPROVER                       */}
        {/* ══════════════════════════════ */}
        {isApprover && (
          <>
            <SectionLabel label="Overview" />
            <NavItem to="/dashboard" icon="ti-layout-dashboard" label="Dashboard" />

            <SectionLabel label="Accounts" />
            <NavItem to="/accounts"  icon="ti-building-bank"   label="Accounts"  />

            <SectionLabel label="Transactions" />
            <TransactionDropdown links={[
              { to: '/transactions?tab=pending', icon: 'ti-clock', label: 'Pending Approval'  },
              { to: '/transactions?tab=all',     icon: 'ti-list',  label: 'All Transactions'  },
            ]} />

            <SectionLabel label="System" />
            <NavItem to="/profile"   icon="ti-user"            label="My Profile" />
            <NavItem to="/settings"  icon="ti-settings"        label="Settings"   />
          </>
        )}

      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white/80 text-sm font-medium truncate">{user?.name || 'Guest'}</div>
            <div className="text-white/35 text-xs truncate">{user?.role || 'Not logged in'}</div>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/55 hover:bg-red-500/20 hover:text-red-400 transition-all w-full">
          <i className="ti ti-logout text-lg" /> Sign out
        </button>
      </div>

    </aside>
  );
}