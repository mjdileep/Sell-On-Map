"use client";

// Lightweight UUID generator fallback if uuid isn't available at runtime
function generateId(): string {
  try {
    const arr = Array.from(crypto?.getRandomValues?.(new Uint8Array(16)) || []);
    return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
}

const CLIENT_ID_KEY = 'som_client_id_v1';

export function getClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = generateId();
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    return 'anon';
  }
}

function toPathWithQuery(pathname: string | null, searchParams: URLSearchParams | null): string {
  const p = pathname || '/';
  if (!searchParams) return p;
  const qs = searchParams.toString();
  return qs ? `${p}?${qs}` : p;
}

export async function logPageView(opts: {
  path: string;
  country?: string;
  hostname?: string;
}): Promise<void> {
  try {
    const body = {
      path: opts.path,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      country: opts.country || null,
      hostname: opts.hostname || (typeof location !== 'undefined' ? location.hostname : null),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      clientId: getClientId(),
      screen: typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 } : null,
    };
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
      (navigator as any).sendBeacon('/api/analytics/pageview', blob);
      return;
    }
    await fetch('/api/analytics/pageview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
  } catch {
    // ignore
  }
}

export async function logEvent(opts: {
  eventType: string;
  adId?: string | null;
  path?: string | null;
  country?: string | null;
  referrer?: string | null;
  metadata?: Record<string, any> | null;
}): Promise<void> {
  try {
    const body = {
      eventType: opts.eventType,
      adId: opts.adId || null,
      path: opts.path || (typeof location !== 'undefined' ? location.pathname : null),
      country: opts.country || null,
      referrer: opts.referrer || (typeof document !== 'undefined' ? document.referrer || null : null),
      clientId: getClientId(),
      metadata: opts.metadata || null,
    };
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
      (navigator as any).sendBeacon('/api/analytics/event', blob);
      return;
    }
    await fetch('/api/analytics/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
  } catch {
    // ignore
  }
}

export { toPathWithQuery };


