const CURRENCY_SYMBOLS = { NGN: '₦', USD: '$', GBP: '£', EUR: '€', CAD: 'C$', AUD: 'A$' };

// Formats an amount with its currency symbol, e.g. 1500 → "₦1,500.00". Missing amounts show "—".
export function formatMoney(amount, currency = 'NGN') {
  if (amount === null || amount === undefined || amount === '') return '—';
  return (
    (CURRENCY_SYMBOLS[currency] || currency) +
    Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })
  );
}
