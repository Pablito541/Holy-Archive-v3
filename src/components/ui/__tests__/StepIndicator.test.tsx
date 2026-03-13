import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepIndicator } from '../StepIndicator';

// Mock lucide-react to avoid SVG rendering issues in jsdom
vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="check-icon" />,
}));

describe('StepIndicator', () => {
  it('renders the correct number of steps', () => {
    render(<StepIndicator currentStep={1} totalSteps={3} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders step numbers for future steps', () => {
    render(<StepIndicator currentStep={2} totalSteps={4} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows a check icon for completed steps', () => {
    render(<StepIndicator currentStep={3} totalSteps={3} />);
    // Steps 1 and 2 are completed
    expect(screen.getAllByTestId('check-icon')).toHaveLength(2);
  });

  it('does not show check icons when on step 1', () => {
    render(<StepIndicator currentStep={1} totalSteps={3} />);
    expect(screen.queryAllByTestId('check-icon')).toHaveLength(0);
  });

  it('renders labels when provided', () => {
    render(
      <StepIndicator
        currentStep={1}
        totalSteps={3}
        labels={['Konto', 'Profil', 'Fertig']}
      />
    );
    expect(screen.getByText('Konto')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Fertig')).toBeInTheDocument();
  });

  it('renders without labels when not provided', () => {
    const { container } = render(<StepIndicator currentStep={1} totalSteps={2} />);
    // No label text elements beyond step numbers
    expect(container.querySelectorAll('span.text-\\[10px\\]')).toHaveLength(0);
  });

  it('renders connector lines between steps', () => {
    const { container } = render(<StepIndicator currentStep={1} totalSteps={3} />);
    // 2 connectors for 3 steps
    const connectors = container.querySelectorAll('.h-px.flex-1');
    expect(connectors).toHaveLength(2);
  });
});
