'use client';

const MANUAL_SLEEP_WAKE_KEY = 'droidmeter.manualSleepWakePending';

export function markManualSleepWakePending() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MANUAL_SLEEP_WAKE_KEY, '1');
  } catch {}
}

export function consumeManualSleepWakePending() {
  if (typeof window === 'undefined') return false;
  try {
    const pending = window.localStorage.getItem(MANUAL_SLEEP_WAKE_KEY) === '1';
    if (pending) window.localStorage.removeItem(MANUAL_SLEEP_WAKE_KEY);
    return pending;
  } catch {
    return false;
  }
}

export async function sleepScreen(): Promise<void> {
  const res = await fetch('/api/screen', {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Falha ao apagar tela');
  }
}
