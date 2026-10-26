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

  describe('payout recipient', () => {
    const banks = [
      { name: 'Access Bank', code: '044' },
      { name: 'Zenith Bank', code: '057' },
    ];

    function mockBankApi(resolve) {
      api.get.mockImplementation((url, config) => {
        if (url === '/external/transaction/banks')
          return Promise.resolve({ data: { data: banks } });
        if (url === '/external/transaction/banks/resolve') return resolve(config.params);
        return Promise.resolve({ data: { data: { content: [] } } });
      });
    }

    async function fillPayout(user, accountNumber) {
      await user.type(screen.getByPlaceholderText('Internal account to debit'), '1111111111');
      await user.type(screen.getByPlaceholderText('e.g. 250000'), '500');
      await user.selectOptions(await screen.findByLabelText('Recipient bank'), '044');
      await user.type(screen.getByLabelText('Recipient account number'), accountNumber);
    }

    it('rejects an account number that is not 10 digits', async () => {
      mockBankApi(() => Promise.reject(new Error('should not be called')));
      const user = userEvent.setup();
      renderAs('MAKER', '/transactions?tab=payout');
      await fillPayout(user, '12345');
      await user.click(screen.getByRole('button', { name: /Initiate payout/ }));

      expect(
        screen.getByText(/Recipient account number must be exactly 10 digits/),
      ).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('looks up the account name and sends it with the chosen bank', async () => {
      mockBankApi(({ accountNumber, bankCode }) =>
        Promise.resolve({ data: { data: { accountNumber, bankCode, accountName: 'JANE DOE' } } }),
      );
      api.post.mockResolvedValueOnce({ data: { data: {} } });
      const user = userEvent.setup();
      renderAs('MAKER', '/transactions?tab=payout');
      await fillPayout(user, '0123456789');

      expect(await screen.findByText('JANE DOE')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Initiate payout/ }));

      await waitFor(() => expect(api.post).toHaveBeenCalled());
      expect(api.post.mock.calls[0][1]).toMatchObject({
        accountNumber: '0123456789',
        bankCode: '044',
        bankName: 'Access Bank',
        accountName: 'JANE DOE',
      });
    });

    it('will not send until the account name is confirmed', async () => {
      mockBankApi(() =>
        Promise.reject({
          response: {
            data: { message: 'No account with that number was found at the selected bank' },
          },
        }),
      );
      const user = userEvent.setup();
      renderAs('MAKER', '/transactions?tab=payout');
      await fillPayout(user, '0123456789');

      expect(
        await screen.findByText('No account with that number was found at the selected bank'),
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /Initiate payout/ }));
      expect(screen.getByText(/account name to be confirmed/)).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });
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
