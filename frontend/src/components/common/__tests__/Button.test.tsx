import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Nhấn</Button>);
    expect(screen.getByText('Nhấn')).toBeInTheDocument();
  });
  it('calls onClick', () => {
    const fn = jest.fn();
    render(<Button onClick={fn}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(fn).toHaveBeenCalled();
  });
  it('shows loading spinner', () => {
    render(<Button loading>Đang xử lý</Button>);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
  it('is disabled when loading', () => {
    render(<Button loading>Đang xử lý</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('is disabled when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  it('applies variant classes', () => {
    render(<Button variant="danger">Xóa</Button>);
    expect(screen.getByText('Xóa')).toHaveClass('bg-red-600');
  });
}); 