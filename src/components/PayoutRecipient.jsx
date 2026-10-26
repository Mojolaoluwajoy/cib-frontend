import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import LoadError from './LoadError';
import { loadErrorMessage } from '../utils/loadError';

const inputClass =
  'px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300';
const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';

// Recipient bank and account number for a payout. The account holder's name is looked up from
// Paystack once both are filled in, so the maker never types it by hand.
// Renders grid cells for a two-column form; `onChange` receives the fields that changed.
export default function PayoutRecipient({ recipient, onChange }) {
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  // Increases with every lookup so a slow, outdated answer cannot overwrite a newer one
  const lookupId = useRef(0);

  async function loadBanks() {
    setBanksLoading(true);
    setBanksError('');
    try {
      const res = await api.get('/external/transaction/banks');
      const list = res.data.data;
      setBanks(Array.isArray(list) ? list : []);
    } catch (err) {
      setBanksError(loadErrorMessage(err, 'the bank list'));
    } finally {
      setBanksLoading(false);
    }
  }

  useEffect(() => {
    // The loader sets state while fetching the bank list once, when the form opens
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBanks();
  }, []);

  async function lookUp(accountNumber, bankCode) {
    const id = ++lookupId.current;
    setLookupError('');
    if (!/^\d{10}$/.test(accountNumber) || !bankCode) {
      setLookingUp(false);
      return;
    }
    setLookingUp(true);
    try {
      const res = await api.get('/external/transaction/banks/resolve', {
        params: { accountNumber, bankCode },
      });
      if (id === lookupId.current) onChange({ accountName: res.data.data?.accountName || '' });
    } catch (err) {
      if (id === lookupId.current)
        setLookupError(
          err.response?.data?.message ||
            'Could not look up the account name. Check the details and try again.',
        );
    } finally {
      if (id === lookupId.current) setLookingUp(false);
    }
  }

  function changeBank(e) {
    const bank = banks.find((b) => b.code === e.target.value);
    const bankCode = bank?.code || '';
    onChange({ bankCode, bankName: bank?.name || '', accountName: '' });
    lookUp(recipient.accountNumber, bankCode);
  }

  function changeAccountNumber(e) {
    const accountNumber = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange({ accountNumber, accountName: '' });
    lookUp(accountNumber, recipient.bankCode);
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="payout-bank" className={labelClass}>
          Recipient bank
        </label>
        {banksError ? (
          <div className="border border-gray-200 rounded-lg">
            <LoadError message={banksError} onRetry={loadBanks} />
          </div>
        ) : (
          <select
            id="payout-bank"
            value={recipient.bankCode}
            onChange={changeBank}
            disabled={banksLoading}
            className={inputClass}
          >
            <option value="">{banksLoading ? 'Loading banks...' : 'Select a bank'}</option>
            {banks.map((bank) => (
              <option key={`${bank.code}-${bank.name}`} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="payout-account-number" className={labelClass}>
          Recipient account number
        </label>
        <input
          id="payout-account-number"
          inputMode="numeric"
          value={recipient.accountNumber}
          onChange={changeAccountNumber}
          placeholder="10-digit account number"
          className={inputClass}
        />
      </div>

      <div className="sm:col-span-2 flex flex-col gap-1.5">
        <span className={labelClass}>Account name</span>
        <div
          aria-live="polite"
          className="px-3 py-2.5 rounded-lg text-sm bg-gray-50 border border-gray-100 min-h-[42px] flex items-center gap-2"
        >
          {lookingUp ? (
            <span className="text-gray-400">
              <i className="ti ti-loader animate-spin" /> Looking up account name...
            </span>
          ) : lookupError ? (
            <span className="text-red-600">
              <i className="ti ti-alert-circle" /> {lookupError}
            </span>
          ) : recipient.accountName ? (
            <span className="text-green-700 font-medium">
              <i className="ti ti-circle-check" /> {recipient.accountName}
            </span>
          ) : (
            <span className="text-gray-400">
              Choose a bank and enter the account number to confirm the name
            </span>
          )}
        </div>
      </div>
    </>
  );
}
