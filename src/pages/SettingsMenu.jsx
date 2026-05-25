import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Topbar from '../../components/Topbar';
import { useAuth } from '../../context/AuthContext';

export default function SettingsMenu() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const options = [
    {
      label:    'Change password',
      sub:      'Update your account password',
      icon:     'ti-lock',
      color:    'bg-blue-50 text-blue-600',
      href:     '/settings/password',
      roles:    'all',
    },
    {
      label:    'Currency management',
      sub:      'Enable or disable currencies — view, filter and update status',
      icon:     'ti-currency-dollar',
      color:    'bg-green-50 text-green-600',
      href:     '/settings/currency',
      roles:    'SUPER_ADMIN',
    },
  ].filter(o => o.roles === 'all' || o.roles === user?.role);

  return (
    <Layout>
      <Topbar title="Settings" subtitle="Manage your account and system settings" />

      <main className="p-7 max-w-2xl flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          Select a setting to configure
        </p>

        {options.map(({ label, sub, icon, color, href }) => (
          <Link key={label} to={href}
            className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <i className={`ti ${icon} text-lg`} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
            </div>
            <i className="ti ti-chevron-right text-gray-300 group-hover:text-blue-400 transition-colors" />
          </Link>
        ))}
      </main>
    </Layout>
  );
}