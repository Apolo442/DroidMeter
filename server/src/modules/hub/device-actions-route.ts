import type { FastifyInstance } from 'fastify';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { disableManualResumeOverride, enableManualResumeOverride } from './charge-override.js';

const execFileAsync = promisify(execFile);

type DeviceAction =
  | 'charge_pause'
  | 'charge_resume'
  | 'kiosk_fix'
  | 'auto_kiosk_enable'
  | 'auto_kiosk_disable'
  | 'brightness';

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

async function runPhoneCommand(command: string) {
  await execFileAsync('ssh', phoneSshArgs(command), { timeout: 8_000 });
}

function brightnessToRaw(value: number) {
  const pct = Math.max(1, Math.min(100, Math.round(value)));
  return Math.round(1 + (pct / 100) ** 2 * 254);
}

function commandForAction(action: DeviceAction, value?: number) {
  if (action === 'charge_pause') {
    return ["D=/sys/class/dual_role_usb/otg_default; su -c 'echo ufp > /sys/class/dual_role_usb/otg_default/mode' 2>/dev/null", "D=/sys/class/dual_role_usb/otg_default; su -c 'echo sink > /sys/class/dual_role_usb/otg_default/power_role' 2>/dev/null", "D=/sys/class/dual_role_usb/otg_default; su -c 'echo device > /sys/class/dual_role_usb/otg_default/data_role' 2>/dev/null", "su -c 'echo 0 > /sys/class/power_supply/battery/input_suspend'", "su -c 'echo 0 > /sys/class/power_supply/battery/charging_enabled' 2>/dev/null", "su -c 'echo 1 > /sys/class/power_supply/usb/apsd_rerun' 2>/dev/null"].join('; ');
  }

  if (action === 'charge_resume') {
    return [
      "D=/sys/class/dual_role_usb/otg_default; su -c 'echo ufp > $D/mode' 2>/dev/null",
      "D=/sys/class/dual_role_usb/otg_default; su -c 'echo sink > $D/power_role' 2>/dev/null",
      "D=/sys/class/dual_role_usb/otg_default; su -c 'echo device > $D/data_role' 2>/dev/null",
      "su -c 'echo 0 > /sys/class/power_supply/battery/input_suspend'",
      "su -c 'echo 1 > /sys/class/power_supply/battery/charging_enabled' 2>/dev/null",
      "su -c 'echo 1 > /sys/class/power_supply/usb/apsd_rerun' 2>/dev/null",
      "su -c 'echo 1 > /sys/class/power_supply/battery/rerun_aicl' 2>/dev/null",
    ].join('; ');
  }

  if (action === 'brightness') {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('brightness value invalid');
    }
    return `su -c 'settings put system screen_brightness ${brightnessToRaw(value)}'`;
  }

  if (action === 'auto_kiosk_enable') {
    return "touch ~/.droidmeter-auto-kiosk";
  }

  if (action === 'auto_kiosk_disable') {
    return "rm -f ~/.droidmeter-auto-kiosk";
  }

  return [
    "su -c 'settings put global policy_control immersive.full=*' 2>/dev/null",
    "su -c 'settings put secure back_gesture_inset_scale_left 0' 2>/dev/null",
    "su -c 'settings put secure back_gesture_inset_scale_right 0' 2>/dev/null",
    "su -c 'settings put system accelerometer_rotation 0' 2>/dev/null",
    "su -c 'settings put system user_rotation 1' 2>/dev/null",
    "su -c 'wm dismiss-keyguard' 2>/dev/null",
    'source ~/.hub-health.conf 2>/dev/null; su -c "am start -a android.intent.action.VIEW -d \\"http://${PC_IP:-127.0.0.1}:3000\\" -p de.ozerov.fully"',
  ].join('; ');
}

export async function registerDeviceActionsRoute(app: FastifyInstance) {
  app.post('/device/action', async (request, reply) => {
    const body = request.body as { action?: DeviceAction; value?: number } | null;
    const action = body?.action;

    if (!action || !['charge_pause', 'charge_resume', 'kiosk_fix', 'auto_kiosk_enable', 'auto_kiosk_disable', 'brightness'].includes(action)) {
      return reply.status(400).send({ error: 'action invalida' });
    }

    try {
      await runPhoneCommand(commandForAction(action, body.value));
      if (action === 'charge_resume') enableManualResumeOverride();
      if (action === 'charge_pause') disableManualResumeOverride();
      console.log(`[device-action] ${action}`);
      return { ok: true };
    } catch (err) {
      console.error(`[device-action] falha em ${action}`, err);
      return reply.status(500).send({ error: 'falha ao executar comando' });
    }
  });
}
