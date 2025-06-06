import { render, screen } from '@testing-library/react';
import { Loading } from '../Loading';

describe('Loading Component', () => {
  test('renders default loading message', () => {
    render(<Loading />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  test('renders custom loading message', () => {
    const customMessage = '데이터를 불러오는 중...';
    render(<Loading message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('displays spinner animation', () => {
    render(<Loading />);
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  test('has proper accessibility attributes', () => {
    render(<Loading />);
    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
  });
});