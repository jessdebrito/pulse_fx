import { fireEvent, render, screen } from '@testing-library/react';
import { AppModal } from '../../../src/components/app-modal';

describe('AppModal', () => {
  it('should render a dialog named by its title with the given content when open', () => {
    render(
      <AppModal open title="USD — Dólar dos Estados Unidos" onClose={jest.fn()}>
        <p>conteúdo</p>
      </AppModal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'USD — Dólar dos Estados Unidos' });
    expect(dialog).toHaveTextContent('conteúdo');
  });

  it('should render nothing when closed', () => {
    render(
      <AppModal open={false} title="USD" onClose={jest.fn()}>
        <p>conteúdo</p>
      </AppModal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <AppModal open title="USD" onClose={onClose}>
        <p>conteúdo</p>
      </AppModal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
