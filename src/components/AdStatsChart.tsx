"use client";

import { useEffect, useState } from 'react';

type Point = { t: string; v: number };

export default function AdStatsChart({ adId }: { adId: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [impressions, setImpressions] = useState<Point[]>([]);
  const [views, setViews] = useState<Point[]>([]);
  const [clicks, setClicks] = useState<Point[]>([]);
  
  // Responsive days based on screen size: sm: 7 days, md: 14 days, lg+: 30 days
  const [days, setDays] = useState(30);

  useEffect(() => {
    const updateDays = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDays(7);  // Small screens: 7 days
      } else if (width < 1024) {
        setDays(14); // Medium screens: 14 days
      } else {
        setDays(30); // Large screens: 30 days
      }
    };
    
    updateDays();
    window.addEventListener('resize', updateDays);
    return () => window.removeEventListener('resize', updateDays);
  }, []);

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

  // Check if there's any data at all
  const hasData = impressions.length > 0 || views.length > 0 || clicks.length > 0;
  
  // Generate all dates for the full range if there's any data
  let keys: string[];
  if (hasData) {
    // Generate full date range for consistency
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    keys = [];
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      keys.push(d.toISOString().split('T')[0]);
    }
  } else {
    // No data at all, use empty array
    keys = [];
  }
  
  const byKey = (arr: Point[]) => new Map(arr.map(p => [p.t.split('T')[0], p.v] as const));
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
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-gray-400" /> Impressions</div>
          <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-blue-500" /> Views</div>
          <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-green-600" /> Clicks</div>
        </div>
        <div className="text-gray-500 font-medium">Last {days} days</div>
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


