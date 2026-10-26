import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function Broken() {
  throw new Error('missing field');
}

// Switches pages like the router does: the boundary's resetKey follows the current page
function Pages() {
  const [page, setPage] = useState('broken');
  return (
    <>
      <button onClick={() => setPage('home')}>Go home</button>
      <ErrorBoundary resetKey={page}>
        {page === 'broken' ? <Broken /> : <p>Home page</p>}
      </ErrorBoundary>
    </>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React and the boundary both log the caught error; keep the test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an error screen instead of a blank page when a page crashes', () => {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload page/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to dashboard/ })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('recovers when the user moves to another page', async () => {
    render(<Pages />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Go home' }));
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('renders the page normally when nothing goes wrong', () => {
    render(
      <ErrorBoundary>
        <p>Fine</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Fine')).toBeInTheDocument();
  });
});
