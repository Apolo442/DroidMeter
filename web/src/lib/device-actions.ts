'use client';

export type DeviceAction =
  | 'charge_pause'
  | 'charge_resume'
  | 'kiosk_fix'
  | 'auto_kiosk_enable'
  | 'auto_kiosk_disable'
  | 'brightness';

export async function runDeviceAction(action: DeviceAction, value?: number): Promise<void> {
  const res = await fetch('/api/device/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, value }),
  });

  if (!res.ok) {
    throw new Error('device action failed');
  }
}
