import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col min-h-screen fixed top-0 left-0 bottom-0">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-white font-semibold text-base tracking-tight">
          CIB Platform
        </div>
        <div className="text-white/40 text-xs mt-1">
          Corporate Internet Banking
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">

        {/* Overview */}
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-2 pt-2 pb-1">
          Overview
        </p>
        <NavLink to="/dashboard" className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
          ${isActive ? 'bg-blue-600 text-white font-medium' : 'text-white/55 hover:bg-white/10 hover:text-white'}`
        }>
          <i className="ti ti-layout-dashboard text-lg" /> Dashboard
        </NavLink>

        {/* Clients */}
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-2 pt-3 pb-1">
          Clients
        </p>
        <NavLink to="/org-onboarding" className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
          ${isActive ? 'bg-blue-600 text-white font-medium' : 'text-white/55 hover:bg-white/10 hover:text-white'}`
        }>
          <i className="ti ti-building text-lg" /> Org Onboarding
        </NavLink>
        <NavLink to="/user-onboarding" className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
          ${isActive ? 'bg-blue-600 text-white font-medium' : 'text-white/55 hover:bg-white/10 hover:text-white'}`
        }>
          <i className="ti ti-user-plus text-lg" /> User Onboarding
        </NavLink>
        <NavLink to="/accounts" className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
          ${isActive ? 'bg-blue-600 text-white font-medium' : 'text-white/55 hover:bg-white/10 hover:text-white'}`
        }>
          <i className="ti ti-building-bank text-lg" /> Accounts
        </NavLink>

        {/* Transactions dropdown */}
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-2 pt-3 pb-1">
          Transactions
        </p>
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
          <div className="pl-3 flex flex-col gap-1 mt-1">
            <NavLink to="/transactions?tab=internal" className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all
              ${isActive ? 'text-blue-400 font-medium' : 'text-white/45 hover:bg-white/10 hover:text-white'}`
            }>
              <i className="ti ti-refresh text-sm" /> Internal Transfer
            </NavLink>
            <NavLink to="/transactions?tab=payout" className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all
              ${isActive ? 'text-blue-400 font-medium' : 'text-white/45 hover:bg-white/10 hover:text-white'}`
            }>
              <i className="ti ti-send text-sm" /> External Payout
            </NavLink>
            <NavLink to="/transactions?tab=funding" className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all
              ${isActive ? 'text-blue-400 font-medium' : 'text-white/45 hover:bg-white/10 hover:text-white'}`
            }>
              <i className="ti ti-cash text-sm" /> External Funding
            </NavLink>
            <NavLink to="/transactions?tab=pending" className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all
              ${isActive ? 'text-blue-400 font-medium' : 'text-white/45 hover:bg-white/10 hover:text-white'}`
            }>
              <i className="ti ti-clock text-sm" /> Pending Approval
            </NavLink>
            <NavLink to="/transactions?tab=all" className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all
              ${isActive ? 'text-blue-400 font-medium' : 'text-white/45 hover:bg-white/10 hover:text-white'}`
            }>
              <i className="ti ti-list text-sm" /> All Transactions
            </NavLink>
          </div>
        )}

        {/* System */}
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-2 pt-3 pb-1">
          System
        </p>
        <NavLink to="/settings" className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
          ${isActive ? 'bg-blue-600 text-white font-medium' : 'text-white/55 hover:bg-white/10 hover:text-white'}`
        }>
          <i className="ti ti-settings text-lg" /> Settings
        </NavLink>

      </nav>

      {/* User info + logout at bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white/80 text-sm font-medium truncate">
              {user?.name || 'Guest'}
            </div>
            <div className="text-white/35 text-xs truncate">
              {user?.role || 'Not logged in'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/55 hover:bg-red-500/20 hover:text-red-400 transition-all w-full"
        >
          <i className="ti ti-logout text-lg" /> Sign out
        </button>
      </div>

    </aside>
  );
}