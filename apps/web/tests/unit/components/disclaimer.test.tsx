import { render, screen } from '@testing-library/react';
import { Disclaimer } from '../../../src/components/disclaimer';

describe('Disclaimer', () => {
  it('should tell the user the information is educational and not an investment recommendation', () => {
    render(<Disclaimer />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent('Informação educacional. Não constitui recomendação de investimento.');
  });

  it('should name the data sources and warn that the data may be delayed', () => {
    render(<Disclaimer />);

    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      'Fontes: Banco Central do Brasil (PTAX e SGS) e FRED, Federal Reserve Bank of St. Louis. Os dados podem ter atraso em relação à publicação oficial.',
    );
  });

  it('should stay fixed at the bottom of the screen so it is always visible', () => {
    render(<Disclaimer />);

    expect(screen.getByRole('contentinfo')).toHaveStyle({ position: 'fixed', bottom: '0px' });
  });
});
