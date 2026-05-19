'use client';

import { useEffect } from 'react';

export function OrientationGuard() {
  useEffect(() => {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: 'landscape') => Promise<void>;
    };
    orientation.lock?.('landscape').catch(() => {});
  }, []);

  return null;
}
