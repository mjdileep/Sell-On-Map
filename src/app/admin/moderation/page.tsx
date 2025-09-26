"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Ad = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  address: string;
  category: string;
  userId: string;
  createdAt: string;
  details?: any;
  user?: { id: string; email?: string | null; name?: string | null };
};

export default function ModerationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/moderation/pending?page=${page}&pageSize=20`, { cache: 'no-store' });
    if (res.status === 401 || res.status === 403) { router.push('/'); return; }
    const data = await res.json();
    setAds(data.ads || []);
    setPageCount(data.meta?.pageCount || 1);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page]);

  async function approve(adId: string) {
    const res = await fetch('/api/admin/moderation/approve', { method: 'POST', body: JSON.stringify({ adId }), headers: { 'Content-Type': 'application/json' } });
    if (res.ok) { await load(); }
  }

  async function reject(adId: string, r: string) {
    const res = await fetch('/api/admin/moderation/reject', { method: 'POST', body: JSON.stringify({ adId, reason: r }), headers: { 'Content-Type': 'application/json' } });
    if (res.ok) { setRejectingId(null); setReason(''); await load(); }
  }

  if (status === 'loading') return null;
  if (!session?.user || !(session.user as any).isAdmin) {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Moderation</h1>
        {loading ? (
          <div className="bg-white border rounded p-8 text-center">Loading…</div>
        ) : ads.length === 0 ? (
          <div className="bg-white border rounded p-8 text-center">No pending ads</div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white border rounded p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">{ad.title}</div>
                    <div className="text-sm text-gray-600">{ad.address} • {(ad.user?.email) || ad.userId}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{(ad.currency || 'USD')} {ad.price}</div>
                    <div className="text-xs text-gray-500">{new Date(ad.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <p className="mt-2 text-gray-700 line-clamp-3">{ad.description}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => approve(ad.id)} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
                  {rejectingId === ad.id ? (
                    <div className="flex gap-2 items-center">
                      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reject reason" className="border rounded px-2 py-1" />
                      <button onClick={() => reject(ad.id, reason)} className="px-3 py-2 bg-red-600 text-white rounded">Confirm Reject</button>
                      <button onClick={() => { setRejectingId(null); setReason(''); }} className="px-3 py-2 border rounded">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setRejectingId(ad.id)} className="px-3 py-2 bg-red-600 text-white rounded">Reject</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-2 border rounded disabled:opacity-50">Prev</button>
            <div className="text-sm">Page {page} of {pageCount}</div>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount} className="px-3 py-2 border rounded disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}


