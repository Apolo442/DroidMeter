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
let reconnectTimer: number | null = null;
let visibilityHandlerInstalled = false;

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function shouldPauseSocket() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function connect() {
  clearReconnectTimer();
  if (shouldPauseSocket()) return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(SERVER_URL);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data as string) as WsMessage;
    const { setAll, setPartial } = useDashboardStore.getState();
    if (msg.event === WS_EVENTS.INIT) setAll(msg.data as DashboardState);
    else setPartial(msg.data as Partial<DashboardState>);
  };

  ws.onclose = () => {
    ws = null;
    if (!shouldPauseSocket()) {
      reconnectTimer = window.setTimeout(connect, RECONNECT_MS);
    }
  };
  ws.onerror = () => ws?.close();
}

export function initWebSocket() {
  if (typeof window === 'undefined') return;
  if (!visibilityHandlerInstalled) {
    visibilityHandlerInstalled = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        clearReconnectTimer();
        ws?.close();
        ws = null;
        return;
      }

      connect();
    });
  }
  if (!ws || ws.readyState === WebSocket.CLOSED) connect();
}
