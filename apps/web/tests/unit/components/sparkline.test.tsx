import { render, screen } from '@testing-library/react';
import { Sparkline } from '../../../src/components/sparkline';

describe('Sparkline', () => {
  it('should draw an image named by the label with one line through every value', () => {
    render(<Sparkline values={[5.1717, 5.2104, 5.1991]} label="Evolução: de 5,1717 em 29/06/2026 a 5,1991 em 25/09/2026" />);

    const image = screen.getByRole('img', { name: 'Evolução: de 5,1717 em 29/06/2026 a 5,1991 em 25/09/2026' });
    expect(image.querySelector('polyline')?.getAttribute('points')?.split(' ')).toHaveLength(3);
  });

  it('should draw nothing when there are fewer than two values', () => {
    render(<Sparkline values={[5.1991]} label="Evolução" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
