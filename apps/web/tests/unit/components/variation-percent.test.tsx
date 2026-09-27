import { createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { VariationPercent } from '../../../src/components/variation-percent';

const { palette } = createTheme();

describe('VariationPercent', () => {
  it('should show a positive variation in green', () => {
    render(<VariationPercent percent={0.8066} />);

    expect(screen.getByText('+0,81%')).toHaveStyle({ color: palette.success.main });
  });

  it('should show a negative variation in red', () => {
    render(<VariationPercent percent={-16.0419} />);

    expect(screen.getByText('-16,04%')).toHaveStyle({ color: palette.error.main });
  });

  it('should keep the text color when the variation shown is zero', () => {
    render(<VariationPercent percent={0.001} />);

    const percent = screen.getByText('0,00%');
    expect(percent).not.toHaveStyle({ color: palette.success.main });
    expect(percent).not.toHaveStyle({ color: palette.error.main });
  });
});
