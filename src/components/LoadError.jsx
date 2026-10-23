// Shown in place of a list or panel whose data failed to load, so a failure never looks like "no data".
export default function LoadError({ message, onRetry }) {
  return (
    <div className="text-center py-10">
      <i className="ti ti-alert-triangle text-3xl text-red-300 block mb-2" />
      <p className="text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <i className="ti ti-refresh" /> Retry
        </button>
      )}
    </div>
  );
}
