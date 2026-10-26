import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/axios';
import OrgOnboarding from './OrgOnboarding';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { token: null, role: null }, logout: vi.fn() }),
}));
vi.mock('../api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

async function fillOrganizationStep(user, orgEmail = 'info@acme.com') {
  await user.type(screen.getByPlaceholderText('e.g. Dangote Group'), 'Acme');
  await user.type(screen.getByPlaceholderText('e.g. info@dangote.com'), orgEmail);
  await user.type(screen.getByPlaceholderText('e.g. 08012345678'), '08012345678');
  await user.type(screen.getByPlaceholderText('e.g. RC-123456'), 'RC-1');
  await user.click(screen.getByRole('button', { name: /Next/ }));
}

async function fillAdminStep(user, { password = 'secret123', nin = '12345678901' } = {}) {
  await user.type(screen.getByPlaceholderText('e.g. Chidi'), 'Ada');
  await user.type(screen.getByPlaceholderText('e.g. Okeke'), 'Obi');
  await user.type(screen.getByPlaceholderText('e.g. chidi@dangote.com'), 'ada@acme.com');
  await user.type(screen.getByPlaceholderText('Min. 8 characters'), password);
  await user.type(screen.getByPlaceholderText('11-digit National Identification Number'), nin);
  await user.click(screen.getByRole('button', { name: /Submit registration/ }));
}

describe('Organization registration', () => {
  beforeEach(() => vi.clearAllMocks());

  function renderForm() {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OrgOnboarding />
      </MemoryRouter>,
    );
    return user;
  }

  it('stops on an invalid organization email', async () => {
    const user = renderForm();
    await fillOrganizationStep(user, 'info@acme');
    expect(
      screen.getByText('Organization email must be a valid email address.'),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Chidi')).not.toBeInTheDocument();
  });

  it('checks the NIN and password before submitting', async () => {
    const user = renderForm();
    await fillOrganizationStep(user);
    await fillAdminStep(user, { nin: '123' });
    expect(screen.getByText('NIN must be exactly 11 digits.')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits when everything is valid', async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    const user = renderForm();
    await fillOrganizationStep(user);
    await fillAdminStep(user);
    expect(api.post).toHaveBeenCalledWith('/organizations/create', expect.any(Object));
  });
});
