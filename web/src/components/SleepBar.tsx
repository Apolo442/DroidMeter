'use client';

import { useRef, useState } from 'react';
import { markManualSleepWakePending, sleepScreen } from '@/lib/screen';

const DOUBLE_TAP_MS = 300;

export function SleepBar() {
  const lastTap = useRef<number>(0);
  const [blackout, setBlackout] = useState(false);

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      markManualSleepWakePending();
      setBlackout(true);
      sleepScreen().finally(() => setTimeout(() => setBlackout(false), 3000));
    } else {
      lastTap.current = now;
    }
  }

  return (
    <>
      {blackout && (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#000',
          zIndex: 99999,
          pointerEvents: 'none',
        }} />
      )}
      <div
        onPointerUp={handleTap}
        style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '151px', height: '75px',
          zIndex: 9990,
          touchAction: 'manipulation',
        }}
      />
    </>
  );
}
