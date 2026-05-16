import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClockWidget } from './ClockWidget';

vi.mock('@/lib/store', () => ({
  useDashboardStore: (sel: any) => sel({ state: { weather: { temperature: 28.3 } } }),
}));

describe('ClockWidget', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renderiza hora em formato HH:MM', () => {
    render(<ClockWidget />);
    expect(screen.getByTestId('clock-time').textContent).toMatch(/^\d{2}:\d{2}$/);
  });

  it('mostra temperatura do estado do clima', () => {
    render(<ClockWidget />);
    expect(screen.getByTestId('clock-weather')).toHaveTextContent('28°C');
  });

  it('atualiza a hora a cada segundo', async () => {
    render(<ClockWidget />);
    const before = screen.getByTestId('clock-time').textContent;
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(screen.getByTestId('clock-time').textContent).not.toBe(before);
  });
});
