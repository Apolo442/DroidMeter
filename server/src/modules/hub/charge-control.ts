import { execFile } from 'child_process';
import { promisify } from 'util';
import type { HubState } from '@shared/types.js';
import { isManualResumeOverrideActive } from './charge-override.js';

const execFileAsync = promisify(execFile);

const PAUSE_AT_PCT = 80;
const RESUME_AT_PCT = 25;
const PAUSE_TEMP_C = 42;
const MIN_COMMAND_INTERVAL_MS = 15_000;

export type ChargeDecision =
  | { action: 'pause'; reason: 'battery_high' | 'battery_hot' }
  | { action: 'resume'; reason: 'battery_low' | 'battery_critical' }
  | { action: 'hold'; reason: 'within_band' | 'already_correct' };

export function evaluateChargeControl(
  hub: HubState,
  options: { manualResumeOverride?: boolean } = {},
): ChargeDecision {
  const suspended = Boolean(hub.battery.inputSuspended) || hub.battery.chargingEnabled === false;
  const level = hub.battery.level;
  const temp = hub.battery.temperature;
  const manualResumeOverride = Boolean(options.manualResumeOverride);

  if (level <= RESUME_AT_PCT) {
    return { action: 'resume', reason: suspended ? 'battery_low' : 'battery_critical' };
  }

  if (level >= PAUSE_AT_PCT) {
    return suspended
      ? { action: 'hold', reason: 'already_correct' }
      : { action: 'pause', reason: 'battery_high' };
  }

  if (temp > PAUSE_TEMP_C) {
    if (manualResumeOverride) {
      return suspended
        ? { action: 'resume', reason: 'battery_critical' }
        : { action: 'hold', reason: 'within_band' };
    }

    return suspended
      ? { action: 'hold', reason: 'already_correct' }
      : { action: 'pause', reason: 'battery_hot' };
  }

  return { action: 'hold', reason: 'within_band' };
}

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

async function setInputSuspend(suspend: boolean) {
  const command = suspend
    ? ["D=/sys/class/dual_role_usb/otg_default; su -c 'echo ufp > /sys/class/dual_role_usb/otg_default/mode' 2>/dev/null", "D=/sys/class/dual_role_usb/otg_default; su -c 'echo sink > /sys/class/dual_role_usb/otg_default/power_role' 2>/dev/null", "D=/sys/class/dual_role_usb/otg_default; su -c 'echo device > /sys/class/dual_role_usb/otg_default/data_role' 2>/dev/null", "su -c 'echo 0 > /sys/class/power_supply/battery/input_suspend'", "su -c 'echo 0 > /sys/class/power_supply/battery/charging_enabled' 2>/dev/null", "su -c 'echo 1 > /sys/class/power_supply/usb/apsd_rerun' 2>/dev/null"].join('; ')
    : [
        "D=/sys/class/dual_role_usb/otg_default; su -c 'echo ufp > $D/mode' 2>/dev/null",
        "D=/sys/class/dual_role_usb/otg_default; su -c 'echo sink > $D/power_role' 2>/dev/null",
        "D=/sys/class/dual_role_usb/otg_default; su -c 'echo device > $D/data_role' 2>/dev/null",
        "su -c 'echo 0 > /sys/class/power_supply/battery/input_suspend'",
        "su -c 'echo 1 > /sys/class/power_supply/battery/charging_enabled' 2>/dev/null",
        "su -c 'echo 1 > /sys/class/power_supply/usb/apsd_rerun' 2>/dev/null",
        "su -c 'echo 1 > /sys/class/power_supply/battery/rerun_aicl' 2>/dev/null",
        "su -c 'echo 1 > /sys/class/power_supply/battery/force_recharge' 2>/dev/null",
      ].join('; ');

  await execFileAsync('ssh', phoneSshArgs(command), {
    timeout: 8_000,
  });
}

export function createChargeController() {
  let inFlight = false;
  let lastCommandAt = 0;

  async function handle(hub: HubState) {
    const decision = evaluateChargeControl(hub, {
      manualResumeOverride: isManualResumeOverrideActive(),
    });
    if (decision.action === 'hold') return decision;

    const now = Date.now();
    if (inFlight || now - lastCommandAt < MIN_COMMAND_INTERVAL_MS) {
      return decision;
    }

    inFlight = true;
    lastCommandAt = now;

    try {
      await setInputSuspend(decision.action === 'pause');
      console.log(`[charge-control] ${decision.action} (${decision.reason})`);
    } catch (error) {
      console.error(`[charge-control] falha ao executar ${decision.action}`, error);
    } finally {
      inFlight = false;
    }

    return decision;
  }

  return { handle };
}
