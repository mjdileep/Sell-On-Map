"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminAllAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [tab, setTab] = useState<'all' | 'active' | 'inactive' | 'approved' | 'pending' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', userEmail: '', userId: '', category: '', currency: '', minPrice: '', maxPrice: '', createdFrom: '', createdTo: '' });
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  function buildQuery() {
    const params = new URLSearchParams({ status: tab, page: String(page), pageSize: '20' });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    return params.toString();
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/ads?${buildQuery()}`, { cache: 'no-store' });
    if (res.status === 401 || res.status === 403) { router.push('/'); return; }
    const data = await res.json();
    setAds(data.ads || []);
    setPageCount(data.meta?.pageCount || 1);
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab, page]);

  async function call(path: string, id: string, body?: any) {
    const res = await fetch(`/api/admin/ads/${id}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (res.ok) { setRejectingId(null); setReason(''); await load(); }
  }

  if (status === 'loading') return null;
  if (!session?.user || !(session.user as any).isAdmin) { router.push('/'); return null; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin - All Ads</h1>

        {/* Filters */}
        <div className="mb-4 bg-white border rounded p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Search (title/desc/address)" value={filters.q} onChange={(e)=>setFilters({...filters,q:e.target.value})} className="border rounded px-2 py-1" />
          <input placeholder="User Email" value={filters.userEmail} onChange={(e)=>setFilters({...filters,userEmail:e.target.value})} className="border rounded px-2 py-1" />
          <input placeholder="User ID" value={filters.userId} onChange={(e)=>setFilters({...filters,userId:e.target.value})} className="border rounded px-2 py-1" />
          <input placeholder="Category prefix (e.g., property.rental)" value={filters.category} onChange={(e)=>setFilters({...filters,category:e.target.value})} className="border rounded px-2 py-1" />
          <input placeholder="Currency" value={filters.currency} onChange={(e)=>setFilters({...filters,currency:e.target.value})} className="border rounded px-2 py-1" />
          <div className="flex gap-2">
            <input placeholder="Min Price" value={filters.minPrice} onChange={(e)=>setFilters({...filters,minPrice:e.target.value})} className="border rounded px-2 py-1 w-full" />
            <input placeholder="Max Price" value={filters.maxPrice} onChange={(e)=>setFilters({...filters,maxPrice:e.target.value})} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="flex gap-2">
            <input type="date" placeholder="Created From" value={filters.createdFrom} onChange={(e)=>setFilters({...filters,createdFrom:e.target.value})} className="border rounded px-2 py-1 w-full" />
            <input type="date" placeholder="Created To" value={filters.createdTo} onChange={(e)=>setFilters({...filters,createdTo:e.target.value})} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="flex gap-2">
            <button onClick={()=>{ setPage(1); load(); }} className="px-3 py-2 rounded bg-blue-600 text-white">Apply</button>
            <button onClick={()=>{ setFilters({ q:'',userEmail:'',userId:'',category:'',currency:'',minPrice:'',maxPrice:'',createdFrom:'',createdTo:'' }); setPage(1); load(); }} className="px-3 py-2 rounded border">Reset</button>
          </div>
        </div>

        <div className="mb-4 bg-white border rounded p-1 flex gap-1">
          {(['all','active','inactive','approved','pending','rejected'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-3 py-2 rounded ${tab===t?'bg-blue-600 text-white':'text-gray-700 hover:bg-gray-100'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white border rounded p-8 text-center">Loading…</div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white border rounded p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">{ad.title}</div>
                    <div className="text-sm text-gray-600">{ad.address} • {(ad.user?.email)||ad.userId}</div>
                    <div className="text-xs text-gray-500">State: {ad.moderationStatus} • Active: {ad.isActive ? 'Yes' : 'No'}</div>
                    {ad.moderationStatus === 'REJECTED' && ad.rejectReason ? (
                      <div className="text-sm text-red-700 mt-1">Reason: {ad.rejectReason}</div>
                    ) : null}
                  </div>
                  <div className="text-right text-sm">
                    <div>Created: {new Date(ad.createdAt).toLocaleString()}</div>
                    <div>Expires: {ad.expiresAt ? new Date(ad.expiresAt).toLocaleDateString() : '-'}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => { setSelectedAd(ad); setDetailOpen(true); }} className="px-3 py-2 rounded border">View</button>
                  {ad.moderationStatus !== 'APPROVED' && (
                    <button onClick={() => call('approve', ad.id)} className="px-3 py-2 rounded bg-green-600 text-white">Approve</button>
                  )}
                  {ad.moderationStatus === 'REJECTED' ? (
                    <button onClick={() => call('restate', ad.id)} className="px-3 py-2 rounded bg-amber-600 text-white">Restate</button>
                  ) : (
                    <>
                      <button onClick={() => { setRejectingId(ad.id); setReason(''); }} className="px-3 py-2 rounded bg-red-600 text-white">Reject</button>
                      {rejectingId === ad.id && (
                        <div className="flex items-center gap-2">
                          <input value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Reason" className="border rounded px-2 py-1" />
                          <button onClick={() => call('reject', ad.id, { reason })} className="px-3 py-2 rounded border">Confirm</button>
                          <button onClick={() => setRejectingId(null)} className="px-3 py-2 rounded border">Cancel</button>
                        </div>
                      )}
                    </>
                  )}

                  {ad.isActive ? (
                    <button onClick={() => call('deactivate', ad.id)} className="px-3 py-2 rounded bg-gray-200">Deactivate</button>
                  ) : (
                    ad.moderationStatus === 'APPROVED' && (
                      <button onClick={() => call('activate', ad.id)} className="px-3 py-2 rounded bg-blue-600 text-white">Activate</button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page<=1} className="px-3 py-2 border rounded disabled:opacity-50">Prev</button>
            <div className="text-sm">Page {page} of {pageCount}</div>
            <button onClick={() => setPage(p=>Math.min(pageCount,p+1))} disabled={page>=pageCount} className="px-3 py-2 border rounded disabled:opacity-50">Next</button>
          </div>
        )}

        {/* Full Detail Modal reuse */}
        {detailOpen && selectedAd ? (
          // We'll reuse the existing resolver used elsewhere for detail modals
          // Dynamically import to avoid SSR mismatches
          <DynamicDetailModal ad={selectedAd} onClose={() => setDetailOpen(false)} />
        ) : null}
      </div>
    </div>
  );
}

// Dynamic wrapper to load the existing detail modal via resolver
import dynamic from 'next/dynamic';
import { resolveDetailModal } from '@/components/ads/resolver';
function DynamicDetailModalInner({ ad, onClose }: { ad: any; onClose: () => void }) {
  const DetailModal = resolveDetailModal(ad.category || 'all');
  if (!DetailModal) return null;
  return <DetailModal open={true} ad={ad} onClose={onClose} />;
}
const DynamicDetailModal = dynamic(async () => Promise.resolve(DynamicDetailModalInner as any), { ssr: false }) as any;
