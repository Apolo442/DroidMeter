'use client';

import { useEffect, useRef, useState } from 'react';

function useWakeTrigger() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let ready = false;
    const t = setTimeout(() => { ready = true; }, 800);
    function onVisibility() {
      if (ready && document.visibilityState === 'visible') setTick(n => n + 1);
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  return tick;
}

export function WakeAnimation() {
  const tick = useWakeTrigger();
  const [show, setShow] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (tick === 0) return;
    timers.current.forEach(clearTimeout);

    setShow(true);
    setOpaque(false);

    // fade in
    timers.current[0] = setTimeout(() => setOpaque(true), 30);
    // fade out
    timers.current[1] = setTimeout(() => setOpaque(false), 530);
    // remove
    timers.current[2] = setTimeout(() => setShow(false), 1100);

    return () => timers.current.forEach(clearTimeout);
  }, [tick]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99997,
      pointerEvents: 'none',
      background: 'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 20%, rgba(0,0,0,0.85) 100%)',
      opacity: opaque ? 1 : 0,
      transition: 'opacity 500ms ease-in-out',
    }} />
  );
}
