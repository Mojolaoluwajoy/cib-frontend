import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/axios';
import Dashboard from './Dashboard';

let mockUser;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn() }),
}));
vi.mock('../api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

function renderAs(role) {
  mockUser = { token: 't', role, name: 'Test User' };
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

const requested = (url) => api.get.mock.calls.some(([u]) => u === url);

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: [] } });
  });

  it('does not ask a MAKER for pending approvals', async () => {
    renderAs('MAKER');
    await waitFor(() => expect(requested('/dashboard/stats')).toBe(true));
    expect(requested('/transactions/pending')).toBe(false);
    expect(screen.queryByText('Pending approvals')).not.toBeInTheDocument();
  });

  it('shows an APPROVER the pending approvals', async () => {
    renderAs('APPROVER');
    await waitFor(() => expect(requested('/transactions/pending')).toBe(true));
    expect(screen.getByText('Pending approvals')).toBeInTheDocument();
  });

  it('loads the organization for a MAKER so the dedicated account can show', async () => {
    api.get.mockImplementation((url) =>
      Promise.resolve({
        data: {
          data:
            url === '/organizations/viewAll'
              ? [{ name: 'Acme', dvaAccountNumber: '9876543210', dvaBankName: 'Test Bank' }]
              : [],
        },
      }),
    );
    renderAs('MAKER');
    expect(await screen.findByText('9876543210')).toBeInTheDocument();
  });
});
