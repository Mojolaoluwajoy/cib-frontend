import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Layout from './Layout';

let mockUser;
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn() }),
}));

function renderAs(role) {
  mockUser = { token: 't', role, name: 'Test User' };
  render(
    <MemoryRouter>
      <Layout>content</Layout>
    </MemoryRouter>,
  );
}

const supportLink = () => screen.queryByTitle('Chat with support on WhatsApp');

describe('Layout support button', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('links ADMIN users to the configured number', () => {
    vi.stubEnv('VITE_SUPPORT_WHATSAPP', '2348000000000');
    renderAs('ADMIN');
    expect(supportLink()).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/wa\.me\/2348000000000\?text=/),
    );
  });

  it('is hidden when no number is configured', () => {
    vi.stubEnv('VITE_SUPPORT_WHATSAPP', '');
    renderAs('ADMIN');
    expect(supportLink()).not.toBeInTheDocument();
  });

  it('is hidden from other roles', () => {
    vi.stubEnv('VITE_SUPPORT_WHATSAPP', '2348000000000');
    renderAs('MAKER');
    expect(supportLink()).not.toBeInTheDocument();
  });
});
