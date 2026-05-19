'use client';

export async function sleepScreen(): Promise<void> {
  const res = await fetch('/api/screen', {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Falha ao apagar tela');
  }
}
