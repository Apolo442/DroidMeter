import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WeatherWidget } from './WeatherWidget';

vi.mock('@/lib/store', () => ({
  useDashboardStore: (sel: any) => sel({ state: { weather: {
    temperature: 28.3, feelsLike: 31.1, humidity: 72,
    windSpeed: 12.4, rainChance: 15, conditionCode: 3, updatedAt: '',
  }}}),
}));

describe('WeatherWidget', () => {
  it('renderiza temperatura', () => {
    render(<WeatherWidget />);
    expect(screen.getByTestId('weather-temp')).toHaveTextContent('28°C');
  });

  it('renderiza umidade', () => {
    render(<WeatherWidget />);
    expect(screen.getByText(/72%/)).toBeInTheDocument();
  });

  it('renderiza velocidade do vento', () => {
    render(<WeatherWidget />);
    expect(screen.getByText(/12\.4/)).toBeInTheDocument();
  });
});
