export default function Topbar({ title, subtitle }) {
  return (
    <header className="bg-white border-b border-gray-200 px-7 h-16 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </header>
  );
}