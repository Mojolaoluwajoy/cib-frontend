import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Shown for any address the app doesn't have, so a broken or mistyped link is noticed
// instead of quietly landing on the dashboard.
export default function NotFound() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const signedIn = Boolean(user?.token);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center">
        <p className="text-4xl font-bold text-gray-200 mb-2">404</p>
        <h1 className="text-base font-semibold text-gray-900 mb-1">Page not found</h1>
        <p className="text-sm text-gray-500 mb-6">
          There's no page at <span className="font-mono text-gray-700 break-all">{pathname}</span>.
          The link may be mistyped or out of date.
        </p>
        <Link
          to={signedIn ? '/dashboard' : '/login'}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"
        >
          <i className={`ti ${signedIn ? 'ti-home' : 'ti-login'}`} />
          {signedIn ? 'Go to dashboard' : 'Go to sign in'}
        </Link>
      </div>
    </div>
  );
}
