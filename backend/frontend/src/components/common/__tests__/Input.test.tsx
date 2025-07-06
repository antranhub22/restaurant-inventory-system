import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="Tên" />);
    expect(screen.getByText('Tên')).toBeInTheDocument();
  });
  it('shows error', () => {
    render(<Input error="Lỗi" />);
    expect(screen.getByText('Lỗi')).toBeInTheDocument();
  });
  it('renders icon', () => {
    render(<Input icon={<span data-testid="icon">i</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
  it('calls onChange', () => {
    const fn = jest.fn();
    render(<Input onChange={fn} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    expect(fn).toHaveBeenCalled();
  });
  it('shows value', () => {
    render(<Input value="abc" onChange={() => {}} />);
    expect(screen.getByDisplayValue('abc')).toBeInTheDocument();
  });
}); 