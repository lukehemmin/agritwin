import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

// Mock the useWebSocket hook
jest.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    alerts: [
      { id: 1, message: 'Test alert', severity: 'warning' }
    ]
  })
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  test('renders AgriTwin title', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('AgriTwin')).toBeInTheDocument();
  });

  test('shows connection status', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('실시간 연결')).toBeInTheDocument();
  });

  test('displays alert count when alerts exist', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    renderWithRouter(<Header />);
    expect(screen.getByRole('link', { name: /agritwin/i })).toHaveAttribute('href', '/');
  });

  test('shows user menu button', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText('관리자')).toBeInTheDocument();
  });
});