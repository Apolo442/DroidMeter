import type { FastifyInstance } from 'fastify';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function phoneSshArgs(command: string) {
  const host = process.env.PHONE_HOST ?? '192.168.15.73';
  const port = process.env.PHONE_PORT ?? '8022';
  const user = process.env.PHONE_USER ?? 'u0_a160';
  return [
    '-p', port,
    '-o', 'ConnectTimeout=3',
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=no',
    `${user}@${host}`,
    command,
  ];
}

export async function registerScreenRoute(app: FastifyInstance) {
  app.post('/screen', async (request, reply) => {
    const body = request.body as { action?: string } | null;
    if (body?.action !== 'sleep') {
      return reply.status(400).send({ error: 'action deve ser "sleep"' });
    }
    try {
      await execFileAsync('ssh', phoneSshArgs("su -c 'input keyevent KEYCODE_POWER'"), { timeout: 8_000 });
      console.log('[screen] tela adormecida');
      return { ok: true };
    } catch (err) {
      console.error('[screen] falha ao dormir tela', err);
      return reply.status(500).send({ error: 'falha ao executar comando' });
    }
  });
}
