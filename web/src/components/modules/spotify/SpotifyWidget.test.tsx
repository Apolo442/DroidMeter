import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpotifyWidget } from './SpotifyWidget';
import { useDashboardStore } from '@/lib/store';

vi.mock('@/lib/store');
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

const mockUseDashboardStore = vi.mocked(useDashboardStore);

const BASE_SPOTIFY = {
  isPlaying: true,
  track: 'Numb',
  artist: 'Linkin Park',
  album: 'Meteora',
  albumYear: '2003',
  progressMs: 102_000,
  durationMs: 187_000,
  updatedAt: '2024-01-01T00:00:00Z',
  queue: [
    { track: 'In the End', artist: 'Linkin Park', album: 'Hybrid Theory', coverUrl: 'https://i.scdn.co/cover2.jpg' },
    { track: 'Crawling',   artist: 'Linkin Park', album: 'Hybrid Theory', coverUrl: 'https://i.scdn.co/cover3.jpg' },
    { track: 'Faint',      artist: 'Linkin Park', album: 'Meteora',       coverUrl: 'https://i.scdn.co/cover4.jpg' },
  ],
};

function setupStore(spotify: typeof BASE_SPOTIFY | null) {
  mockUseDashboardStore.mockImplementation((sel: any) => sel({ state: { spotify } }));
}

describe('SpotifyWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(BASE_SPOTIFY);
  });

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

describe('SpotifyWidget — queue pre-fetch / estado otimista', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(BASE_SPOTIFY);
  });

  it('exibe faixa otimista imediatamente ao clicar em next', () => {
    render(<SpotifyWidget />);

    expect(screen.getByTestId('spotify-track')).toHaveTextContent('Numb');

    fireEvent.click(screen.getByLabelText('Próxima'));

    expect(screen.getByTestId('spotify-track')).toHaveTextContent('In the End');
    expect(screen.getByTestId('spotify-artist')).toHaveTextContent('Linkin Park');
  });

  it('skips rápidos consomem itens da fila em sequência', () => {
    render(<SpotifyWidget />);

    fireEvent.click(screen.getByLabelText('Próxima'));
    expect(screen.getByTestId('spotify-track')).toHaveTextContent('In the End');

    fireEvent.click(screen.getByLabelText('Próxima'));
    expect(screen.getByTestId('spotify-track')).toHaveTextContent('Crawling');

    fireEvent.click(screen.getByLabelText('Próxima'));
    expect(screen.getByTestId('spotify-track')).toHaveTextContent('Faint');
  });

  it('oculta barra de progresso quando faixa otimista está ativa', () => {
    render(<SpotifyWidget />);
    expect(screen.getByTestId('spotify-current')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Próxima'));

    expect(screen.queryByTestId('spotify-current')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spotify-total')).not.toBeInTheDocument();
  });

  it('limpa estado otimista quando spotify.track muda via WebSocket', () => {
    const { rerender } = render(<SpotifyWidget />);

    fireEvent.click(screen.getByLabelText('Próxima'));
    expect(screen.getByTestId('spotify-track')).toHaveTextContent('In the End');

    // Simula WebSocket confirmando nova faixa
    setupStore({
      ...BASE_SPOTIFY,
      track: 'In the End',
      queue: [
        { track: 'Crawling', artist: 'Linkin Park', album: 'Hybrid Theory', coverUrl: '' },
      ],
    });
    rerender(<SpotifyWidget />);

    // Otimista foi limpo — renderiza dados reais do store
    expect(screen.getByTestId('spotify-track')).toHaveTextContent('In the End');
    // Barra de progresso volta (durationMs do store está presente)
    expect(screen.getByTestId('spotify-current')).toBeInTheDocument();
  });

  it('cai no comportamento padrão (pendingTrackAction) quando fila está vazia', () => {
    setupStore({ ...BASE_SPOTIFY, queue: [] });
    render(<SpotifyWidget />);

    // Com fila vazia, clicar em next não muda o track exibido (ainda aguarda WebSocket)
    fireEvent.click(screen.getByLabelText('Próxima'));
    expect(screen.getByTestId('spotify-track')).toHaveTextContent('Numb');
  });
});
