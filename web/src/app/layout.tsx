import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'DroidMeter' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        {/* Moldura decorativa — valores calibrados para o Redmi Note 8 */}
        <div style={{ position: 'fixed', inset: 0, borderRadius: '36px 42px 42px 36px', border: '1.5px solid rgba(255,255,255,0.13)', pointerEvents: 'none', zIndex: 9997 }} />
      </body>
    </html>
  );
}
