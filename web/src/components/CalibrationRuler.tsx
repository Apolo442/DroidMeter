'use client';
import { useEffect, useState } from 'react';

const STEP        = 30;
const SZ          = '7px';
const COLOR       = '#FFD60A';
const INSET       = 1;
const RIGHT_INSET = 4;

export function CalibrationRuler() {
  const [dim, setDim] = useState({ w: 0, h: 0 });
  useEffect(() => { setDim({ w: window.innerWidth, h: window.innerHeight }); }, []);
  if (dim.w === 0) return null;
  const { w, h } = dim;

  const markers: React.ReactNode[] = [];

  for (let x = 0; x <= w; x += STEP) {
    markers.push(
      <span key={`t${x}`} style={{ position: 'absolute', left: x, top: INSET,    fontSize: SZ, color: COLOR, whiteSpace: 'nowrap', lineHeight: 1, transform: 'translateX(-50%)' }}>{x}</span>,
      <span key={`b${x}`} style={{ position: 'absolute', left: x, bottom: INSET, fontSize: SZ, color: COLOR, whiteSpace: 'nowrap', lineHeight: 1, transform: 'translateX(-50%)' }}>{x}</span>,
    );
  }
  for (let y = 0; y <= h; y += STEP) {
    markers.push(
      <span key={`l${y}`} style={{ position: 'absolute', top: y, left: INSET,  fontSize: SZ, color: COLOR, whiteSpace: 'nowrap', lineHeight: 1, transform: 'translateY(-50%)' }}>{y}</span>,
      <span key={`r${y}`} style={{ position: 'absolute', top: y, right: RIGHT_INSET, fontSize: SZ, color: COLOR, whiteSpace: 'nowrap', lineHeight: 1, transform: 'translateY(-50%)', textAlign: 'right' }}>{y}</span>,
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
      {markers}
    </div>
  );
}
