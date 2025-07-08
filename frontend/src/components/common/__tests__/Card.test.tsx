import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card', () => {
  it('renders header', () => {
    render(<Card header="Tiêu đề">Nội dung</Card>);
    expect(screen.getByText('Tiêu đề')).toBeInTheDocument();
  });
  it('renders children', () => {
    render(<Card>Nội dung</Card>);
    expect(screen.getByText('Nội dung')).toBeInTheDocument();
  });
  it('applies shadow', () => {
    const { container } = render(<Card shadow>abc</Card>);
    expect(container.firstChild).toHaveClass('shadow-md');
  });
  it('no shadow when shadow=false', () => {
    const { container } = render(<Card shadow={false}>abc</Card>);
    expect(container.firstChild).not.toHaveClass('shadow-md');
  });
}); 