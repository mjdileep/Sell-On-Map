"use client";

import { useEffect, useMemo, useState } from "react";
import ResponsiveImg from "@/components/ResponsiveImg";
import { flattenCategories, categoryTree } from "@/lib/categories";

type PublicProfile = {
  id: string;
  name: string | null;
  image: string | null;
  companyName: string | null;
  licenseNumber: string | null;
  registrationNumber: string | null;
  joinedDate: string;
  joinedYears: number;
  activeAds: number;
  totalAds: number;
  specialties: string[];
  lastActiveAt: string | null;
};

function formatRelative(date: Date | null): string {
  if (!date) return "—";
  const now = new Date().getTime();
  const ts = date.getTime();
  const diff = Math.max(0, now - ts);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export default function AdvertiserProfileCard({ userId }: { userId: string }) {
  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(userId)}/profile`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((json) => { if (mounted) { setData(json); setError(null); } })
      .catch((e) => { if (mounted) setError(e?.message || 'Error'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [userId]);

  const categoryMap = useMemo(() => {
    const flat = flattenCategories(categoryTree);
    const map = new Map<string, string>();
    for (const n of flat) map.set(n.key, n.label);
    return map;
  }, []);

  const specialtiesLabels = useMemo(() => {
    const input = data?.specialties || [];
    const labels = new Set<string>();
    for (const key of input) {
      const parts = String(key).split('.');
      const preferKeys = [
        parts.slice(0, 3).join('.'),
        parts.slice(0, 2).join('.'),
        parts[0],
      ];
      let label: string | undefined;
      for (const k of preferKeys) {
        const v = categoryMap.get(k);
        if (v) { label = v; break; }
      }
      labels.add(label || key);
    }
    return Array.from(labels);
  }, [data?.specialties, categoryMap]);

  if (loading) return <div className="p-4 border rounded-xl bg-white">Loading advertiser…</div>;
  if (error || !data) return null;

  const years = data.joinedYears;
  const joined = new Date(data.joinedDate);
  const lastActive = data.lastActiveAt ? new Date(data.lastActiveAt) : null;

  return (
    <div className="p-4 border border-gray-200 rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 border">
          {data.image ? (
            <ResponsiveImg src={data.image} alt={data.name || 'Advertiser'} className="w-full h-full object-cover" sizesAttr="56px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{data.name || 'Advertiser'}</div>
          {data.companyName ? (
            <div className="text-xs text-gray-600 truncate">{data.companyName}</div>
          ) : null}
          <div className="text-xs text-gray-500">Joined {joined.toLocaleDateString()} {years > 0 ? `(${years} ${years === 1 ? 'year' : 'years'})` : ''}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="p-2 rounded-lg bg-gray-50">
          <div className="text-xs text-gray-500">Active ads</div>
          <div className="text-lg font-semibold text-blue-700">{data.activeAds}</div>
        </div>
        <div className="p-2 rounded-lg bg-gray-50">
          <div className="text-xs text-gray-500">Total ads</div>
          <div className="text-lg font-semibold text-emerald-700">{data.totalAds}</div>
        </div>
        <div className="p-2 rounded-lg bg-gray-50">
          <div className="text-xs text-gray-500">Last active</div>
          <div className="text-sm font-medium text-gray-800">{formatRelative(lastActive)}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-1 text-sm text-gray-700">
        {data.licenseNumber ? (
          <div className="flex gap-2 items-center"><span>🪪</span><span className="text-gray-500">License:</span><span className="font-medium">{data.licenseNumber}</span></div>
        ) : null}
        {data.registrationNumber ? (
          <div className="flex gap-2 items-center"><span>🏷️</span><span className="text-gray-500">Registration:</span><span className="font-medium">{data.registrationNumber}</span></div>
        ) : null}
      </div>

      {specialtiesLabels.length > 0 ? (
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Specialties</div>
          <div className="flex flex-wrap gap-2">
            {specialtiesLabels.map((label) => (
              <span key={label} className="px-2 py-1 rounded-full text-xs bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 text-gray-800">{label}</span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}


