import type { ReactNode } from 'react';

export type VisualIconName =
  | 'alarm'
  | 'bolt'
  | 'calendar'
  | 'clipboard'
  | 'map-pin'
  | 'message'
  | 'search'
  | 'shield'
  | 'sprinkler'
  | 'tools';

const paths: Record<VisualIconName, ReactNode> = {
  alarm: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4M5 3 3 5m16-2 2 2"/></>,
  bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>,
  calendar: <><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></>,
  clipboard: <><rect width="16" height="18" x="4" y="4" rx="2"/><path d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5"/></>,
  'map-pin': <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 8h8M8 12h5"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M11 8v6M8 11h6"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></>,
  sprinkler: <><path d="M8 3h8M10 3v5h4V3M8 8h8l2 4H6l2-4Z"/><path d="m8 15-1 2m5-2v3m4-3 1 2M5 20h.01M12 21h.01M19 20h.01"/></>,
  tools: <><path d="m14.7 6.3 3-3a4 4 0 0 1-5 5l-7.4 7.4a2.1 2.1 0 1 0 3 3l7.4-7.4a4 4 0 0 1 5-5l-3 3-3-3Z"/><path d="m5 5 4 4"/></>,
};

export function VisualIcon({ name, className = 'size-6' }: { name: VisualIconName; className?: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}
