import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/axios';
import Users from './Users';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { token: 't', role: 'ADMIN', name: 'Test User' }, logout: vi.fn() }),
}));
vi.mock('../api/axios', () => ({ default: { get: vi.fn(), put: vi.fn() } }));

describe('Users', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a load failure and recovers on retry', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce({
      data: { data: [{ id: 1, firstName: 'Ada', lastName: 'Obi', role: 'MAKER' }] },
    });
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Load users/ }));
    expect(
      await screen.findByText('Could not reach the server to load users. Check your connection.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No users found')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Retry/ }));
    expect(await screen.findByText(/Ada/)).toBeInTheDocument();
  });
});
