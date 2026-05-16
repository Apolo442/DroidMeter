'use client';

import { useDashboardStore } from '@/lib/store';

export function GitHubWidget() {
  const github = useDashboardStore((s) => s.state.github);

  if (!github) {
    return (
      <div className="rounded-[10px] h-full flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #0d1420 0%, #161618 100%)' }}>
        <span className="text-[8px] text-dark-charcoal">Carregando...</span>
      </div>
    );
  }

  const ciColor = github.ciStatus === 'passing' ? '#30d158'
    : github.ciStatus === 'failing' ? '#ff453a' : '#86868b';
  const ciLabel = github.ciStatus === 'passing' ? 'CI passando'
    : github.ciStatus === 'failing' ? 'CI falhando' : 'CI desconhecido';

  return (
    <div className="rounded-[10px] h-full flex flex-col justify-between p-[8px_10px]"
      style={{ background: 'linear-gradient(145deg, #0d1420 0%, #161618 100%)' }}>
      <span className="text-[7px] font-semibold text-vivid-blue uppercase tracking-[0.07em]">GitHub</span>
      <div className="flex flex-col gap-[4px]">
        <div className="flex items-center gap-[5px]">
          <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: '#8668ff' }} />
          <span data-testid="github-commits" className="text-[8.5px] text-[#aeaeb2]">
            {github.commitsToday} commit{github.commitsToday !== 1 ? 's' : ''} hoje
          </span>
        </div>
        <div className="flex items-center gap-[5px]">
          <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: '#2997ff' }} />
          <span data-testid="github-prs" className="text-[8.5px] text-[#aeaeb2]">
            {github.openPRs} PR{github.openPRs !== 1 ? 's' : ''} aberto{github.openPRs !== 1 ? 's' : ''}
          </span>
        </div>
        {github.currentRepo && (
          <div className="flex items-center gap-[5px]">
            <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: '#86868b' }} />
            <span className="text-[8.5px] text-[#aeaeb2] truncate">
              {github.currentRepo} · {github.currentBranch ?? 'main'}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-[4px]">
        <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: ciColor }} />
        <span data-testid="github-ci" className="text-[7px] font-semibold" style={{ color: ciColor }}>
          {ciLabel}
        </span>
      </div>
    </div>
  );
}
