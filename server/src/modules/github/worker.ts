import type { DashboardState, GitHubState } from '@shared/types.js';
import { WS_EVENTS } from '@shared/types.js';

type Deps = {
  updateState: (p: Partial<DashboardState>) => DashboardState;
  broadcast: (m: { event: string; data: unknown }) => void;
};

type GhEvent = {
  type: string;
  created_at: string;
  payload: { commits?: unknown[] };
  repo: { name: string };
};

export function createWorker({ updateState, broadcast }: Deps) {
  return {
    intervalMs: 5 * 60 * 1000,

    async fetch() {
      const username = process.env.GITHUB_USERNAME!;
      const token = process.env.GITHUB_TOKEN!;
      const headers = { Authorization: `Bearer ${token}` };
      const today = new Date().toISOString().slice(0, 10);

      const [eventsRes, prsRes] = await Promise.all([
        globalThis.fetch(`https://api.github.com/users/${username}/events?per_page=100`, { headers }),
        globalThis.fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr+state:open`, { headers }),
      ]);

      const events = await eventsRes.json() as GhEvent[];
      const prs = await prsRes.json() as { total_count: number };

      const todayPushes = events.filter(
        (e) => e.type === 'PushEvent' && e.created_at.startsWith(today),
      );
      const commitsToday = todayPushes.reduce((sum, e) => sum + (e.payload.commits?.length ?? 0), 0);
      const [, repoName] = (todayPushes[0]?.repo.name ?? '/').split('/');

      const github: GitHubState = {
        commitsToday,
        openPRs: prs.total_count,
        currentRepo: repoName || undefined,
        ciStatus: 'unknown',
        updatedAt: new Date().toISOString(),
      };

      updateState({ github });
      broadcast({ event: WS_EVENTS.GITHUB_UPDATE, data: { github } });
    },
  };
}
