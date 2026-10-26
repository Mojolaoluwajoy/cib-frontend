import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { loadErrorMessage } from '../utils/loadError';

const SELECT_CLASS =
  'px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-gray-50 disabled:text-gray-400';

// Currency dropdown filled from the backend, so it only offers currencies that exist there.
// By default only active currencies are listed (accounts can't be opened in an inactive one);
// `includeInactive` lists every currency, for turning them on and off. Changing `reloadKey` reloads the list.
export default function CurrencySelect({
  id,
  value,
  onChange,
  includeInactive = false,
  reloadKey = 0,
}) {
  const { user } = useAuth();
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get(includeInactive ? '/currencies/all' : '/currencies/status/ACTIVE')
      .then((res) => {
        if (cancelled) return;
        setCurrencies(res.data.data || []);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(loadErrorMessage(err, 'currencies'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [includeInactive, attempt, reloadKey]);

  function retry() {
    setLoading(true);
    setAttempt((n) => n + 1);
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        <span>
          <i className="ti ti-alert-circle" /> {error}
        </span>
        <button type="button" onClick={retry} className="text-xs font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  if (!loading && currencies.length === 0) {
    return (
      <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg">
        <i className="ti ti-info-circle mt-0.5" />
        {includeInactive ? (
          <span>No currencies are set up on the server.</span>
        ) : user?.role === 'SUPER_ADMIN' ? (
          <span>
            No currency is active yet.{' '}
            <Link to="/settings/currency" className="font-semibold underline">
              Turn one on in currency settings
            </Link>{' '}
            to open accounts.
          </span>
        ) : (
          <span>
            No currency is active yet, so accounts can't be opened. Ask your platform administrator
            to turn one on.
          </span>
        )}
      </div>
    );
  }

  return (
    <select id={id} value={value} onChange={onChange} disabled={loading} className={SELECT_CLASS}>
      <option value="">{loading ? 'Loading currencies...' : 'Select currency'}</option>
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
          {includeInactive && c.status !== 'ACTIVE' ? ' (inactive)' : ''}
        </option>
      ))}
    </select>
  );
}
