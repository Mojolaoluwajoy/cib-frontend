import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/axios';
import Transactions from './Transactions';

let mockUser;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn() }),
}));
vi.mock('../api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const pendingTxn = {
  id: 1,
  transactionReference: 'TXN-1',
  type: 'INTERNAL_TRANSFER',
  amount: 100,
  status: 'PENDING_APPROVAL',
};

function renderAs(role, path = '/transactions') {
  mockUser = { token: 't', role, name: 'Test User' };
  render(
    <MemoryRouter initialEntries={[path]}>
      <Transactions />
    </MemoryRouter>,
  );
}

const tab = (name) => screen.queryByRole('button', { name: new RegExp(name) });

describe('Transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((url) =>
      Promise.resolve({
        data: { data: url === '/transactions/pending' ? [pendingTxn] : { content: [] } },
      }),
    );
  });

  it('shows MAKER the initiate tabs and no approval tab', () => {
    renderAs('MAKER');
    expect(tab('Internal Transfer')).toBeInTheDocument();
    expect(tab('External Payout')).toBeInTheDocument();
    expect(tab('External Funding')).toBeInTheDocument();
    expect(tab('All Transactions')).toBeInTheDocument();
    expect(tab('Pending Approval')).not.toBeInTheDocument();
  });

  it('lets APPROVER approve pending transactions but not initiate', async () => {
    renderAs('APPROVER');
    expect(tab('Internal Transfer')).not.toBeInTheDocument();
    expect(await screen.findByText('TXN-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve/ })).toBeInTheDocument();
  });

  it('shows ADMIN pending transactions read-only', async () => {
    renderAs('ADMIN', '/transactions?tab=pending');
    expect(await screen.findByText('TXN-1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reject/ })).not.toBeInTheDocument();
  });

  it('does not show ADMIN the transfer form even via the URL', () => {
    renderAs('ADMIN', '/transactions?tab=internal');
    expect(screen.queryByText('Initiate internal transfer')).not.toBeInTheDocument();
  });

  it('reuses the idempotency key when a failed transfer is retried', async () => {
    const user = userEvent.setup();
    api.post
      .mockRejectedValueOnce({ response: { data: { message: 'Network down' } } })
      .mockResolvedValueOnce({ data: { data: { transactionReference: 'TXN-9' } } });

    renderAs('MAKER', '/transactions?tab=internal');
    await user.type(screen.getByPlaceholderText('e.g. 1234567890'), '1111111111');
    await user.type(screen.getByPlaceholderText('e.g. 0987654321'), '2222222222');
    await user.type(screen.getByPlaceholderText('e.g. 500000'), '500');

    const submit = screen.getByRole('button', { name: /Initiate transfer/ });
    await user.click(submit);
    expect(await screen.findByText(/Network down/)).toBeInTheDocument();
    await user.click(submit);
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2));

    const [firstCall, retryCall] = api.post.mock.calls;
    expect(firstCall[0]).toBe('/transactions/initiate');
    expect(firstCall[1].idempotencyKey).toEqual(expect.any(String));
    expect(retryCall[1].idempotencyKey).toBe(firstCall[1].idempotencyKey);
  });

  it('rejects a payout to an account number that is not 10 digits', async () => {
    const user = userEvent.setup();
    renderAs('MAKER', '/transactions?tab=payout');
    await user.type(screen.getByPlaceholderText('Internal account to debit'), '1111111111');
    await user.type(screen.getByPlaceholderText('e.g. 250000'), '500');
    await user.type(screen.getByPlaceholderText("Recipient's account number"), '12345');
    await user.type(screen.getByPlaceholderText('e.g. 044'), '044');
    await user.type(screen.getByPlaceholderText('e.g. Access Bank'), 'Access Bank');
    await user.type(screen.getByPlaceholderText("Recipient's full name"), 'Jane Doe');
    await user.click(screen.getByRole('button', { name: /Initiate payout/ }));

    expect(
      screen.getByText(/Recipient account number must be exactly 10 digits/),
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('names the field when the backend rejects a transfer', async () => {
    const user = userEvent.setup();
    api.post.mockRejectedValueOnce({
      response: { status: 400, data: { data: { destinationAccount: 'must not be blank' } } },
    });
    renderAs('MAKER', '/transactions?tab=internal');
    await user.type(screen.getByPlaceholderText('e.g. 1234567890'), '1111111111');
    await user.type(screen.getByPlaceholderText('e.g. 0987654321'), '2222222222');
    await user.type(screen.getByPlaceholderText('e.g. 500000'), '500');
    await user.click(screen.getByRole('button', { name: /Initiate transfer/ }));

    expect(
      await screen.findByText(/Destination account number must not be blank/),
    ).toBeInTheDocument();
  });
});
