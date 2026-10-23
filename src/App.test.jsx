import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './App';

let mockUser;
vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
  AuthProvider: ({ children }) => children,
}));

function renderAt(path, allowedRoles) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
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

  it('sends users without an allowed role to the dashboard', () => {
    mockUser = { token: 't', role: 'MAKER' };
    renderAt('/secret', ['SUPER_ADMIN']);
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
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
