"use client";

import { useEffect, useState } from 'react';

type Point = { t: string; v: number };

export default function AdStatsChart({ adId, days = 14 }: { adId: string; days?: number }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [impressions, setImpressions] = useState<Point[]>([]);
  const [views, setViews] = useState<Point[]>([]);
  const [clicks, setClicks] = useState<Point[]>([]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const to = new Date();
        const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
        const qs = new URLSearchParams({ adId, from: from.toISOString(), to: to.toISOString(), granularity: 'day' }).toString();
        const res = await fetch(`/api/analytics/timeseries?${qs}`, { cache: 'no-store' });
        const json = await res.json();
        if (ignore) return;
        setImpressions(Array.isArray(json?.impressions) ? json.impressions : []);
        setViews(Array.isArray(json?.views) ? json.views : []);
        setClicks(Array.isArray(json?.clicks) ? json.clicks : []);
      } catch (e: any) {
        if (!ignore) setErr('Failed to load');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [adId, days]);

  const keys = Array.from(new Set([...(impressions||[]).map(p=>p.t), ...(views||[]).map(p=>p.t), ...(clicks||[]).map(p=>p.t)])).sort();
  const byKey = (arr: Point[]) => new Map(arr.map(p => [p.t, p.v] as const));
  const impMap = byKey(impressions);
  const viewMap = byKey(views);
  const clickMap = byKey(clicks);
  const series = keys.map(k => ({
    t: k,
    i: impMap.get(k) || 0,
    v: viewMap.get(k) || 0,
    c: clickMap.get(k) || 0,
  }));
  const maxVal = Math.max(1, ...series.map(s => Math.max(s.i, s.v, s.c)));

  if (loading) {
    return <div className="text-xs text-gray-500">Loading stats…</div>;
  }
  if (err) {
    return <div className="text-xs text-red-600">{err}</div>;
  }
  if (series.length === 0) {
    return <div className="text-xs text-gray-500">No data yet</div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-2 text-xs">
        <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-gray-400" /> Impressions</div>
        <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-blue-500" /> Views</div>
        <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-green-600" /> Clicks</div>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
        {series.map((s) => (
          <div key={s.t} className="flex flex-col justify-end h-24">
            <div className="flex items-end justify-center gap-0.5 h-full">
              <span title={`Impressions: ${s.i}`} className="inline-block w-1.5 bg-gray-400 rounded-sm" style={{ height: `${Math.round((s.i / maxVal) * 100)}%` }} />
              <span title={`Views: ${s.v}`} className="inline-block w-1.5 bg-blue-500 rounded-sm" style={{ height: `${Math.round((s.v / maxVal) * 100)}%` }} />
              <span title={`Clicks: ${s.c}`} className="inline-block w-1.5 bg-green-600 rounded-sm" style={{ height: `${Math.round((s.c / maxVal) * 100)}%` }} />
            </div>
            <div className="text-[10px] text-gray-500 text-center mt-1">
              {new Date(s.t).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


