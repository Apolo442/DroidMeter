import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GitHubWidget } from './GitHubWidget';

vi.mock('@/lib/store', () => ({
  useDashboardStore: (sel: any) => sel({ state: { github: {
    commitsToday: 3, openPRs: 1,
    currentRepo: 'finswarm', currentBranch: 'main',
    ciStatus: 'passing', updatedAt: '',
  }}}),
}));

describe('GitHubWidget', () => {
  it('renderiza commits de hoje', () => {
    render(<GitHubWidget />);
    expect(screen.getByTestId('github-commits')).toHaveTextContent('3 commits hoje');
  });

  it('renderiza PRs abertos', () => {
    render(<GitHubWidget />);
    expect(screen.getByTestId('github-prs')).toHaveTextContent('1 PR aberto');
  });

  it('mostra CI passando', () => {
    render(<GitHubWidget />);
    expect(screen.getByTestId('github-ci')).toHaveTextContent('CI passando');
  });
});
