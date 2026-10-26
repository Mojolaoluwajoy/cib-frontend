import { useContext } from 'react';
import { SidebarContext } from './sidebarContext';

export default function Topbar({ title, subtitle }) {
  const { openSidebar } = useContext(SidebarContext);
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-7 h-16 flex items-center justify-between gap-3 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={openSidebar}
          aria-label="Open menu"
          className="lg:hidden -ml-1 p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <i className="ti ti-menu-2 text-xl" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}
