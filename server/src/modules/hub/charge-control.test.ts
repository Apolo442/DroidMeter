import { describe, expect, it } from 'vitest';
import type { HubState } from '@shared/types.js';
import { evaluateChargeControl } from './charge-control.js';

function hub(overrides: Partial<HubState['battery']>): HubState {
  return {
    battery: {
      level: 50,
      status: 'discharging',
      plugged: 'usb',
      temperature: 35,
      inputSuspended: false,
      ...overrides,
    },
    wifi: { rssi: -55, signalLabel: 'Forte', latencyMs: 30, linkSpeedMbps: 100 },
    screen: { brightnessPercent: 50, onTimeSec: 3600 },
    cpuTemp: 45,
    cpuUsage: 12,
    memory: 50,
    memoryUsedGb: 2,
    updatedAt: '2026-05-18T12:00:00Z',
  };
}

describe('charge control', () => {
  it('pausa quando bateria chega a 80%', () => {
    expect(evaluateChargeControl(hub({ level: 80, inputSuspended: false }))).toEqual({
      action: 'pause',
      reason: 'battery_high',
    });
  });

  it('mantem pausado entre 25% e 80%', () => {
    expect(evaluateChargeControl(hub({ level: 51, inputSuspended: true }))).toEqual({
      action: 'hold',
      reason: 'within_band',
    });
  });

  it('retoma quando bateria chega a 25%', () => {
    expect(evaluateChargeControl(hub({ level: 25, temperature: 35, inputSuspended: true }))).toEqual({
      action: 'resume',
      reason: 'battery_low',
    });
  });

  it('retoma em 25% mesmo com bateria morna (38-42 graus)', () => {
    expect(evaluateChargeControl(hub({ level: 25, temperature: 40, inputSuspended: true }))).toEqual({
      action: 'resume',
      reason: 'battery_low',
    });
  });

  it('retoma em 25% mesmo com bateria acima de 42 graus', () => {
    expect(evaluateChargeControl(hub({ level: 25, temperature: 43, inputSuspended: true }))).toEqual({
      action: 'resume',
      reason: 'battery_low',
    });
  });

  it('forca retomada em 25% mesmo se input_suspend vier como 0', () => {
    expect(evaluateChargeControl(hub({ level: 25, temperature: 35, inputSuspended: false }))).toEqual({
      action: 'resume',
      reason: 'battery_critical',
    });
  });

  it('pausa quando bateria passa de 42 graus', () => {
    expect(evaluateChargeControl(hub({ level: 50, temperature: 43, inputSuspended: false }))).toEqual({
      action: 'pause',
      reason: 'battery_hot',
    });
  });

  it('nao pausa por temperatura quando override manual de retomada esta ativo', () => {
    expect(
      evaluateChargeControl(
        hub({ level: 50, temperature: 43, inputSuspended: false }),
        { manualResumeOverride: true },
      ),
    ).toEqual({
      action: 'hold',
      reason: 'within_band',
    });
  });

  it('retoma por temperatura quando override manual esta ativo e carga esta suspensa', () => {
    expect(
      evaluateChargeControl(
        hub({ level: 50, temperature: 43, inputSuspended: true }),
        { manualResumeOverride: true },
      ),
    ).toEqual({
      action: 'resume',
      reason: 'battery_critical',
    });
  });
});
