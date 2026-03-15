import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ─── Domain formula tests (pure, no mocks needed) ─────────────────────────
describe('computePercentDiff', () => {
  function computePercentDiff(baseline: number, comparison: number): number {
    if (baseline === 0) return 0;
    return ((comparison / baseline) - 1) * 100;
  }

  it('returns 0 for identical values', () => {
    expect(computePercentDiff(91.0, 91.0)).toBe(0);
  });

  it('returns negative when comparison < baseline', () => {
    expect(computePercentDiff(91.0, 88.0)).toBeLessThan(0);
  });

  it('returns positive when comparison > baseline', () => {
    expect(computePercentDiff(88.0, 93.5)).toBeGreaterThan(0);
  });

  it('handles zero baseline gracefully', () => {
    expect(computePercentDiff(0, 10)).toBe(0);
  });
});

describe('computeCB formula', () => {
  const TARGET = 89.3368;
  const ENERGY_PER_TONNE = 41_000;

  function computeCB(ghg: number, fuelConsumption: number) {
    return (TARGET - ghg) * (fuelConsumption * ENERGY_PER_TONNE);
  }

  it('LNG route R002 yields positive CB (surplus)', () => {
    expect(computeCB(88.0, 4800)).toBeGreaterThan(0);
  });

  it('HFO route R001 yields negative CB (deficit)', () => {
    expect(computeCB(91.0, 5000)).toBeLessThan(0);
  });

  it('MGO route R003 at 93.5 yields deficit', () => {
    expect(computeCB(93.5, 5100)).toBeLessThan(0);
  });

  it('exact target yields near-zero CB', () => {
    expect(Math.abs(computeCB(TARGET, 5000))).toBeLessThan(0.001);
  });
});

// ─── Shared component tests ───────────────────────────────────────────────
import { Badge, KpiCard, Alert, Button } from '../adapters/ui/components/shared';

describe('Badge component', () => {
  it('renders children', () => {
    render(<Badge>LNG</Badge>);
    expect(screen.getByText('LNG')).toBeInTheDocument();
  });

  it('applies green variant classes', () => {
    const { container } = render(<Badge variant="green">Compliant</Badge>);
    expect(container.firstChild).toHaveClass('text-emerald-300');
  });

  it('applies red variant classes', () => {
    const { container } = render(<Badge variant="red">Deficit</Badge>);
    expect(container.firstChild).toHaveClass('text-red-300');
  });
});

describe('KpiCard component', () => {
  it('renders label and value', () => {
    render(<KpiCard label="Current CB" value="123,456" sub="gCO₂e" />);
    expect(screen.getByText('Current CB')).toBeInTheDocument();
    expect(screen.getByText('123,456')).toBeInTheDocument();
    expect(screen.getByText('gCO₂e')).toBeInTheDocument();
  });

  it('applies positive color for surplus', () => {
    const { container } = render(<KpiCard label="CB" value="+50000" positive={true} />);
    const valueEl = container.querySelector('p:nth-child(2)');
    expect(valueEl).toHaveClass('text-emerald-400');
  });

  it('applies negative color for deficit', () => {
    const { container } = render(<KpiCard label="CB" value="-30000" positive={false} />);
    const valueEl = container.querySelector('p:nth-child(2)');
    expect(valueEl).toHaveClass('text-red-400');
  });
});

describe('Alert component', () => {
  it('renders error message', () => {
    render(<Alert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders success message with correct classes', () => {
    const { container } = render(<Alert message="Success!" variant="success" />);
    expect(container.firstChild).toHaveClass('text-emerald-300');
  });
});

describe('Button component', () => {
  it('renders label and fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick} disabled>Disabled</Button>);
    fireEvent.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ─── Pool validation logic ─────────────────────────────────────────────────
describe('Pool validation rules', () => {
  interface Member { shipId: string; cb: number }

  function validatePool(members: Member[]): { valid: boolean; reason?: string } {
    if (members.length < 2) return { valid: false, reason: 'Pool requires at least 2 members' };
    const sum = members.reduce((s, m) => s + m.cb, 0);
    if (sum < 0) return { valid: false, reason: 'Pool sum must be ≥ 0 (Art. 21)' };
    return { valid: true };
  }

  it('rejects single-member pool', () => {
    const result = validatePool([{ shipId: 'R001', cb: -100 }]);
    expect(result.valid).toBe(false);
  });

  it('rejects pool with negative sum', () => {
    const result = validatePool([
      { shipId: 'R001', cb: -500 },
      { shipId: 'R003', cb: -200 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/≥ 0/);
  });

  it('accepts pool where surplus covers deficit', () => {
    const result = validatePool([
      { shipId: 'R002', cb: 800 },
      { shipId: 'R001', cb: -500 },
    ]);
    expect(result.valid).toBe(true);
  });

  it('accepts pool with all-surplus members', () => {
    const result = validatePool([
      { shipId: 'R002', cb: 200 },
      { shipId: 'R004', cb: 50 },
    ]);
    expect(result.valid).toBe(true);
  });
});
