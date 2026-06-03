import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n';
import { ToastProvider } from '../contexts/ToastContext';
import NotFoundPage from '../pages/NotFoundPage';

// Wrapper that provides required contexts for isolated component tests
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

describe('NotFoundPage', () => {
  it('renders 404 message', () => {
    render(<NotFoundPage />, { wrapper: TestWrapper });
    expect(screen.getByText('页面未找到')).toBeInTheDocument();
  });
});

describe('I18n', () => {
  it('I18nProvider renders children', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <div data-testid="child">hello</div>
        </I18nProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
