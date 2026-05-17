'use client';
import { WS_EVENTS } from '@shared/types';
import type { WsMessage, DashboardState } from '@shared/types';
import { useDashboardStore } from './store';

const SERVER_URL = process.env.NEXT_PUBLIC_WS_URL
  ?? (typeof window !== 'undefined'
    ? `ws://${window.location.hostname}:3333/ws`
    : 'ws://localhost:3333/ws');
const RECONNECT_MS = 3_000;

let ws: WebSocket | null = null;

function connect() {
  ws = new WebSocket(SERVER_URL);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string) as WsMessage;
    const { setAll, setPartial } = useDashboardStore.getState();
    if (msg.event === WS_EVENTS.INIT) setAll(msg.data as DashboardState);
    else setPartial(msg.data as Partial<DashboardState>);
  };

  ws.onclose = () => setTimeout(connect, RECONNECT_MS);
  ws.onerror = () => ws?.close();
}

export function initWebSocket() {
  if (typeof window === 'undefined') return;
  if (!ws || ws.readyState === WebSocket.CLOSED) connect();
}
