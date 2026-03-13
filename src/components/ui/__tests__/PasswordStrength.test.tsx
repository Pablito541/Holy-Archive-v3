import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordStrength } from '../PasswordStrength';

describe('PasswordStrength', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Schwach" for a short, simple password', () => {
    render(<PasswordStrength password="abc" />);
    expect(screen.getByText('Schwach')).toBeInTheDocument();
  });

  it('shows "Schwach" for an 8-char lowercase-only password', () => {
    render(<PasswordStrength password="abcdefgh" />);
    expect(screen.getByText('Schwach')).toBeInTheDocument();
  });

  it('shows "Mittel" for a password with length + uppercase + digit', () => {
    // length>=8 (1pt), uppercase (1pt), digit (1pt) = 3 pts → Mittel
    render(<PasswordStrength password="Abcdefg1" />);
    expect(screen.getByText('Mittel')).toBeInTheDocument();
  });

  it('shows "Stark" for a strong password with all criteria', () => {
    // length>=12, uppercase, digit, special char → 5pts → Stark
    render(<PasswordStrength password="Abcdefgh1234!" />);
    expect(screen.getByText('Stark')).toBeInTheDocument();
  });

  it('renders 3 indicator bars when password is present', () => {
    const { container } = render(<PasswordStrength password="test123" />);
    // Three bar divs are the h-1 flex-1 rounded-full elements
    const bars = container.querySelectorAll('.h-1.flex-1');
    expect(bars).toHaveLength(3);
  });
});
