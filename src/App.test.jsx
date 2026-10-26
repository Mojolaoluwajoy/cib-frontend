import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App, { NO_ACCESS_NOTICE, ProtectedRoute } from './App';

let mockUser;
vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
  AuthProvider: ({ children }) => children,
}));

function DashboardStub() {
  const notice = useLocation().state?.notice;
  return <p>Dashboard page{notice && `: ${notice}`}</p>;
}

function renderAt(path, allowedRoles) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<DashboardStub />} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <p>Secret page</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUser = { token: null, role: null };
  });

  it('sends signed-out users to the login page', () => {
    renderAt('/secret', ['SUPER_ADMIN']);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('sends users without an allowed role to the dashboard, saying why', () => {
    mockUser = { token: 't', role: 'MAKER' };
    renderAt('/secret', ['SUPER_ADMIN']);
    expect(screen.getByText(`Dashboard page: ${NO_ACCESS_NOTICE}`)).toBeInTheDocument();
  });

  it('shows the page to users with an allowed role', () => {
    mockUser = { token: 't', role: 'SUPER_ADMIN' };
    renderAt('/secret', ['SUPER_ADMIN']);
    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });

  it('lets any signed-in user through when no roles are listed', () => {
    mockUser = { token: 't', role: 'APPROVER' };
    renderAt('/secret');
    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });
});

describe('unknown addresses', () => {
  it('show a page-not-found page instead of redirecting', () => {
    mockUser = { token: 't', role: 'ADMIN' };
    window.history.pushState({}, '', '/no-such-page');
    render(<App />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByText('/no-such-page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to dashboard/ })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('offer signed-out visitors the sign-in page', () => {
    mockUser = { token: null, role: null };
    window.history.pushState({}, '', '/no-such-page');
    render(<App />);
    expect(screen.getByRole('link', { name: /Go to sign in/ })).toHaveAttribute('href', '/login');
  });
});
