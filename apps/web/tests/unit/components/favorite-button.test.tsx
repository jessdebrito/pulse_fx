import { fireEvent, render, screen } from '@testing-library/react';
import { FavoriteButton } from '../../../src/components/favorite-button';

describe('FavoriteButton', () => {
  it('should offer to add the item when it is not a favorite', () => {
    render(<FavoriteButton name="USD" active={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Adicionar USD aos favoritos', pressed: false })).toBeInTheDocument();
  });

  it('should offer to remove the item when it is a favorite', () => {
    render(<FavoriteButton name="USD" active onToggle={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Remover USD dos favoritos', pressed: true })).toBeInTheDocument();
  });

  it('should call onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(<FavoriteButton name="USD" active={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar USD aos favoritos' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
