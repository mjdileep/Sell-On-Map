"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Summary = {
  pvCount: number;
  evCount: number;
  topPaths: Array<{ path: string | null; _count: { _all: number } }>;
  topCountries: Array<{ country: string | null; _count: { _all: number } }>;
  eventsByType: Array<{ eventType: string; _count: { _all: number } }>;
};

type SeriesPoint = { t: string; v: number };

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Enhanced KPI Card component
function KPICard({ title, value, icon, trend, loading }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <div className="text-blue-500">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {trend && <div className="text-xs text-green-600">{trend}</div>}
    </div>
  );
}

// Quick date preset buttons
function DatePresets({ onSelect }: { onSelect: (from: string, to: string) => void }) {
  const presets = [
    { label: 'Last 24h', days: 1 },
    { label: 'Last 7d', days: 7 },
    { label: 'Last 30d', days: 30 },
    { label: 'Last 90d', days: 90 }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {presets.map(preset => (
        <button
          key={preset.label}
          onClick={() => {
            const to = new Date().toISOString();
            const from = new Date(Date.now() - preset.days * 86400000).toISOString();
            onSelect(from, to);
          }}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-150"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [from, setFrom] = useState<string>(() => new Date(Date.now() - 7 * 86400000).toISOString());
  const [to, setTo] = useState<string>(() => new Date().toISOString());
  const [country, setCountry] = useState<string>('');
  const [granularity, setGranularity] = useState<'day' | 'hour'>('day');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pvSeries, setPvSeries] = useState<SeriesPoint[]>([]);
  const [evSeries, setEvSeries] = useState<SeriesPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (country) params.set('country', country);

    try {
      const [sumRes, tsRes] = await Promise.all([
        fetch(`/api/analytics/summary?${params.toString()}`, { cache: 'no-store' }),
        fetch(`/api/analytics/timeseries?${new URLSearchParams({ from, to, country, granularity }).toString()}`, { cache: 'no-store' }),
      ]);
      if (sumRes.status === 401 || sumRes.status === 403 || tsRes.status === 401 || tsRes.status === 403) { router.push('/'); return; }

      const safeJson = async (res: Response) => {
        try { return await res.json(); } catch { return null as any; }
      };
      const sum = await safeJson(sumRes);
      const ts = await safeJson(tsRes);

      setSummary(sum || { pvCount: 0, evCount: 0, topPaths: [], topCountries: [], eventsByType: [] });
      setPvSeries((ts && Array.isArray(ts.pvSeries)) ? ts.pvSeries : []);
      setEvSeries((ts && Array.isArray(ts.evSeries)) ? ts.evSeries : []);
    } catch (e) {
      setSummary({ pvCount: 0, evCount: 0, topPaths: [], topCountries: [], eventsByType: [] });
      setPvSeries([]);
      setEvSeries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (status === 'authenticated') load(); }, [status, from, to, country, granularity]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !(session.user as any).isAdmin) {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your platform's performance and user engagement</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters & Date Range</h2>
          
          <DatePresets onSelect={(newFrom, newTo) => {
            setFrom(newFrom);
            setTo(newTo);
          }} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150" 
                type="datetime-local" 
                value={from.slice(0,16)} 
                onChange={(e) => {
                  const v = e.target.value; 
                  setFrom(v ? new Date(v).toISOString() : '');
                }} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150" 
                type="datetime-local" 
                value={to.slice(0,16)} 
                onChange={(e) => {
                  const v = e.target.value; 
                  setTo(v ? new Date(v).toISOString() : '');
                }} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country Filter</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150" 
                placeholder="e.g. Sri Lanka" 
                value={country} 
                onChange={(e) => setCountry(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Granularity</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150" 
                value={granularity} 
                onChange={(e) => setGranularity(e.target.value as any)}
              >
                <option value="day">Daily</option>
                <option value="hour">Hourly</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard
            title="Total Page Views"
            value={loading ? '—' : (summary?.pvCount?.toLocaleString() ?? '0')}
            loading={loading}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          <KPICard
            title="Total Events"
            value={loading ? '—' : (summary?.evCount?.toLocaleString() ?? '0')}
            loading={loading}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <KPICard
            title="Top Path"
            value={loading ? '—' : (summary?.topPaths?.[0]?.path || 'No data')}
            loading={loading}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EnhancedLineChart title="Page Views Over Time" series={pvSeries} loading={loading} color="#3b82f6" />
          <EnhancedLineChart title="Events Over Time" series={evSeries} loading={loading} color="#10b981" />
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DataTable
            title="Top Pages"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            data={(summary?.topPaths || []).map(r => ({
              label: r.path || 'Unknown',
              value: r._count._all
            }))}
            loading={loading}
          />
          <DataTable
            title="Top Countries"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            data={(summary?.topCountries || []).map(r => ({
              label: r.country || 'Unknown',
              value: r._count._all
            }))}
            loading={loading}
          />
        </div>

        {/* Events by Type */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Events by Type</h3>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(summary?.eventsByType || []).map((e, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 px-4 rounded-lg border border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-md transition-shadow duration-200">
                  <div className="font-medium text-gray-900">{e.eventType}</div>
                  <div className="text-lg font-bold text-purple-600">{e._count._all.toLocaleString()}</div>
                </div>
              ))}
              {(!summary?.eventsByType || summary.eventsByType.length === 0) && !loading && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No event data available for the selected period
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced chart component with better styling
function EnhancedLineChart({ title, series, loading, color = "#3b82f6" }: { 
  title: string; 
  series: SeriesPoint[]; 
  loading?: boolean;
  color?: string;
}) {
  const width = 600;
  const height = 240;
  const padding = 40;

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!series.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-48 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
          No data available
        </div>
      </div>
    );
  }

  const xs = series.map((p) => new Date(p.t).getTime());
  const ys = series.map((p) => p.v);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = Math.max(...ys, 1);
  
  const points = series.map((p) => {
    const x = padding + ((new Date(p.t).getTime() - minX) / Math.max(1, maxX - minX)) * (width - padding * 2);
    const y = height - padding - ((p.v - minY) / Math.max(1, maxY - minY)) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: color, stopOpacity: 0.2}} />
              <stop offset="100%" style={{stopColor: color, stopOpacity: 0}} />
            </linearGradient>
          </defs>
          
          <rect width={width} height={height} fill="url(#grid)" />
          
          {/* Area under curve */}
          <polygon
            fill="url(#chartGradient)"
            points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          />
          
          {/* Main line */}
          <polyline 
            fill="none" 
            stroke={color} 
            strokeWidth={3} 
            points={points}
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {series.map((p, i) => {
            const x = padding + ((new Date(p.t).getTime() - minX) / Math.max(1, maxX - minX)) * (width - padding * 2);
            const y = height - padding - ((p.v - minY) / Math.max(1, maxY - minY)) * (height - padding * 2);
            return (
              <circle 
                key={i} 
                cx={x} 
                cy={y} 
                r="4" 
                fill="white" 
                stroke={color} 
                strokeWidth="2"
                className="hover:r-6 transition-all duration-150"
              />
            );
          })}
          
          {/* Axes */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" strokeWidth="2" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

// Enhanced data table component
function DataTable({ title, icon, data, loading }: {
  title: string;
  icon: React.ReactNode;
  data: Array<{ label: string; value: number }>;
  loading?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <div className="text-blue-500 mr-2">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex justify-between items-center py-2">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {data.length > 0 ? data.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
              <div className="truncate max-w-[70%] text-sm font-medium text-gray-900">{item.label}</div>
              <div className="text-sm font-bold text-blue-600">{item.value.toLocaleString()}</div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              No data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}