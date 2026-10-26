import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/axios';
import CurrencySelect from './CurrencySelect';

let mockUser;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));
vi.mock('../api/axios', () => ({ default: { get: vi.fn() } }));

const naira = { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', status: 'ACTIVE' };
const cad = { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', status: 'INACTIVE' };

function renderSelect(props = {}, role = 'ADMIN') {
  mockUser = { token: 't', role };
  const onChange = vi.fn();
  render(
    <MemoryRouter>
      <CurrencySelect value="" onChange={onChange} {...props} />
    </MemoryRouter>,
  );
  return onChange;
}

describe('CurrencySelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers only the active currencies from the backend', async () => {
    api.get.mockResolvedValue({ data: { data: [naira] } });
    const onChange = renderSelect();
    expect(await screen.findByRole('option', { name: 'NGN — Nigerian Naira' })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/currencies/status/ACTIVE');
    expect(screen.queryByRole('option', { name: /GBP/ })).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox'), 'NGN');
    expect(onChange).toHaveBeenCalled();
  });

  it('lists every currency, marking inactive ones, when managing them', async () => {
    api.get.mockResolvedValue({ data: { data: [naira, cad] } });
    renderSelect({ includeInactive: true }, 'SUPER_ADMIN');
    expect(
      await screen.findByRole('option', { name: 'CAD — Canadian Dollar (inactive)' }),
    ).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/currencies/all');
  });

  it('explains that no currency is active instead of showing an empty list', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderSelect();
    expect(await screen.findByText(/Ask your platform administrator/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('points a super admin to currency settings when none is active', async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    renderSelect({}, 'SUPER_ADMIN');
    expect(await screen.findByRole('link', { name: /currency settings/ })).toHaveAttribute(
      'href',
      '/settings/currency',
    );
  });

  it('shows the load error and retries', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Boom' } } });
    api.get.mockResolvedValueOnce({ data: { data: [naira] } });
    renderSelect();
    expect(await screen.findByText('Boom')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('option', { name: 'NGN — Nigerian Naira' })).toBeInTheDocument();
  });
});
