const STATUS_COLORS = {
  APPROVED: 'bg-green-50 text-green-700',
  ACTIVE: 'bg-green-50 text-green-700',
  COMPLETED: 'bg-green-50 text-green-700',
  SUCCESS: 'bg-green-50 text-green-700',
  PENDING: 'bg-amber-50 text-amber-700',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700',
  INACTIVE: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-red-50 text-red-700',
  FAILED: 'bg-red-50 text-red-700',
  DISABLED: 'bg-gray-100 text-gray-500',
  EXPIRED: 'bg-gray-100 text-gray-500',
  REVERSED: 'bg-purple-50 text-purple-700',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
};

const TYPE_COLORS = {
  INTERNAL_TRANSFER: 'bg-blue-50 text-blue-700',
  EXTERNAL_PAYOUT: 'bg-purple-50 text-purple-700',
  EXTERNAL_FUNDING: 'bg-green-50 text-green-700',
};

const FALLBACK = 'bg-gray-100 text-gray-600';

// Status badge. `colors` overrides individual statuses for pages that need different meaning,
// e.g. an inactive currency shown in red rather than amber.
export function Pill({ status, colors }) {
  const key = (status || '').toUpperCase();
  const cls = colors?.[key] || STATUS_COLORS[key] || FALLBACK;
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>{status}</span>
  );
}

// Transaction type badge, e.g. INTERNAL_TRANSFER → "INTERNAL TRANSFER".
export function TypePill({ type }) {
  const cls = TYPE_COLORS[(type || '').toUpperCase()] || FALLBACK;
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>
      {(type || '').replace(/_/g, ' ')}
    </span>
  );
}
