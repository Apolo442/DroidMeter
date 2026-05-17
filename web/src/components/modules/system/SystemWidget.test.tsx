import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SystemWidget } from './SystemWidget';

vi.mock('@/lib/store', () => ({
  useDashboardStore: (sel: any) => sel({ state: { system: {
    cpu: 22, cpuTemp: 64, memory: 61, disk: 48, gpu: 38, gpuTemp: 58, uptime: 15153, updatedAt: '',
  }}}),
}));

describe('SystemWidget', () => {
  it('renderiza CPU', () => {
    render(<SystemWidget />);
    expect(screen.getByTestId('system-cpu')).toHaveTextContent('22% 64°');
  });

  it('renderiza RAM', () => {
    render(<SystemWidget />);
    expect(screen.getByTestId('system-memory')).toHaveTextContent('61%');
  });

  it('renderiza GPU quando presente', () => {
    render(<SystemWidget />);
    expect(screen.getByTestId('system-gpu')).toHaveTextContent('38% 58°');
  });

  it('formata uptime como hh:mm:ss', () => {
    render(<SystemWidget />);
    expect(screen.getByTestId('system-uptime')).toHaveTextContent('04h12');
  });
});
