// Inline success or error banner; renders nothing when both are empty.
export default function Alert({ success, error }) {
  if (success)
    return (
      <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
        <i className="ti ti-circle-check" /> {success}
      </div>
    );
  if (error)
    return (
      <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium px-4 py-3 rounded-lg mb-4">
        <i className="ti ti-alert-circle" /> {error}
      </div>
    );
  return null;
}
