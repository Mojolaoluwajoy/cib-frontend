import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-56 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}