import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpotifyWidget } from './SpotifyWidget';

vi.mock('@/lib/store', () => ({
  useDashboardStore: (sel: any) => sel({ state: { spotify: {
    isPlaying: true, track: 'Numb', artist: 'Linkin Park',
    album: 'Meteora', albumYear: '2003',
    progressMs: 102_000, durationMs: 187_000, updatedAt: '',
  }}}),
}));

describe('SpotifyWidget', () => {
  it('renderiza nome da faixa', () => {
    render(<SpotifyWidget />);
    expect(screen.getByTestId('spotify-track')).toHaveTextContent('Numb');
  });

  it('renderiza artista', () => {
    render(<SpotifyWidget />);
    expect(screen.getByTestId('spotify-artist')).toHaveTextContent('Linkin Park');
  });

  it('renderiza timestamps de progresso', () => {
    render(<SpotifyWidget />);
    expect(screen.getByTestId('spotify-current')).toHaveTextContent('1:42');
    expect(screen.getByTestId('spotify-total')).toHaveTextContent('3:07');
  });
});
