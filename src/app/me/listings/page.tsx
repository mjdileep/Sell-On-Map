"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/app/providers';
import { useSession } from 'next-auth/react';
import { Edit2, Trash2, Eye, EyeOff, Calendar, MapPin, DollarSign, Plus, Home, TrendingUp, Clock, AlertCircle, BarChart3, Hash } from 'lucide-react';
import CreateAdSelectorModal from '@/components/ads/CreateAdSelectorModal';
import { resolveCreateAdModal, resolveDetailModal, resolveEditAdModal, resolveMyListingCard } from '@/components/ads/resolver';
import { formatCurrency } from '@/lib/currencyUtils';
import AdStatsChart from '@/components/AdStatsChart';

type Ad = {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  createdAt: string;
  expiresAt?: string | null;
  isActive: boolean;
  category: string;
  details: any;
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string | null;
  shortCode?: string | null;
};

export default function MyListingsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [tab, setTab] = useState<'all' | 'active' | 'inactive' | 'pending' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [categoryKey, setCategoryKey] = useState<string>('all');
  const [activeCount, setActiveCount] = useState<number>(0);
  const [maxActive, setMaxActive] = useState<number>(5);
  const [page, setPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editAdId, setEditAdId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [deleteAdId, setDeleteAdId] = useState<string | null>(null);
  const router = useRouter();
  const { status } = useSession();
  const { openAuthModal } = useAuthModal();

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/me/ads?status=${tab}&meta=1&page=${page}&pageSize=10`, { cache: 'no-store' });
    if (res.status === 401) { openAuthModal({ reason: 'Sign in to manage your listings', callbackUrl: '/me/listings' }); return; }
    const payload = await res.json();
    const data = Array.isArray(payload) ? { ads: payload, meta: { activeCount: payload.filter((a:any)=>a.isActive).length, maxActive: Number(process.env.NEXT_PUBLIC_MAX_ACTIVE_ADS_PER_USER || 5), page: 1, pageCount: 1, total: payload.length } } : payload;

    // The API now returns ads with full details, but the frontend expects the old structure
    // If the payload has an 'ads' property, use that, otherwise use the payload directly
    const adsWithDetails = data.ads || data;

    console.log(data);
    setAds(adsWithDetails);
    setActiveCount(data.meta?.activeCount || 0);
    setMaxActive(data.meta?.maxActive || 5);
    setPageCount(data.meta?.pageCount || 1);
    setTotal(data.meta?.total || data.ads?.length || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [tab, page]);
  
  const CreateModal = resolveCreateAdModal(categoryKey || 'all');
  const canCreateMore = activeCount < maxActive;
  const DetailModal = resolveDetailModal((selectedAd?.category as any) || 'all');
  const EditModal = resolveEditAdModal((editCategory as any) || 'all');


  async function reactivate(id: string) {
    const res = await fetch(`/api/ads/${id}/reactivate`, { method: 'POST' });
    if (res.status === 401) { openAuthModal({ reason: 'Sign in to manage your listings', callbackUrl: '/me/listings' }); return; }
    await load();
  }

  async function deactivate(id: string) {
    const res = await fetch(`/api/ads/${id}/deactivate`, { method: 'POST' });
    if (res.status === 401) { openAuthModal({ reason: 'Sign in to manage your listings', callbackUrl: '/me/listings' }); return; }
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
    if (res.status === 401) { openAuthModal({ reason: 'Sign in to manage your listings', callbackUrl: '/me/listings' }); return; }
    setDeleteAdId(null);
    await load();
  }

  const getTabCount = (tabType: string) => {
    if (tabType === 'all') return ads.length;
    if (tabType === 'active') return ads.filter(ad => ad.isActive).length;
    if (tabType === 'inactive') return ads.filter(ad => !ad.isActive && ad.moderationStatus !== 'PENDING' && ad.moderationStatus !== 'REJECTED').length;
    if (tabType === 'pending') return ads.filter(ad => ad.moderationStatus === 'PENDING').length;
    if (tabType === 'rejected') return ads.filter(ad => ad.moderationStatus === 'REJECTED').length;
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Enhanced Header with Stats */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">My Listings</h1>
              <p className="text-gray-600 text-center">Manage your active and expired listings</p>
            </div>
            
            {!loading && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Listings</p>
                      <p className="text-2xl font-bold text-gray-900">{total}</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active</p>
                      <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inactive</p>
                      <p className="text-2xl font-bold text-gray-500">{total - activeCount}</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 overflow-x-auto">
            <nav className="flex space-x-1 min-w-max px-1">
              {['all', 'active', 'inactive', 'pending', 'rejected'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t as any); setPage(1); }}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 relative whitespace-nowrap ${
                    tab === t
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {t[0].toUpperCase() + t.slice(1)}
                    <span className={`py-0.5 px-2 rounded-full text-xs font-semibold ${
                      tab === t 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {loading ? '...' : getTabCount(t)}
                    </span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border p-16 text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading your listings</h3>
            <p className="text-gray-500">Please wait while we fetch your data...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center">
              {tab === 'all' && <Calendar className="w-10 h-10 text-blue-600" />}
              {tab === 'active' && <TrendingUp className="w-10 h-10 text-green-600" />}
              {tab === 'inactive' && <Clock className="w-10 h-10 text-gray-500" />}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {tab === 'all' && "No listings yet"}
              {tab === 'active' && "No active listings"}
              {tab === 'inactive' && "No inactive listings"}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {tab === 'all' && "Ready to start selling? Create your first listing and reach thousands of potential buyers."}
              {tab === 'active' && "You don't have any active listings at the moment. Reactivate an existing listing or create a new one."}
              {tab === 'inactive' && "All your listings are currently active! Great job keeping your inventory up to date."}
            </p>
            {(tab === 'all' || tab === 'active') && (
              <button
                onClick={() => setSelectorOpen(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105 w-full sm:w-auto"
              >
                <Plus className="w-5 h-5 mr-2" /> Create Your First Listing
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center sm:justify-end mb-6">
              <button
                onClick={() => setSelectorOpen(true)}
                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" /> Create New Listing
              </button>
            </div>
            {ads.map((ad, index) => {
              const MyCard = resolveMyListingCard(ad.category || 'all');
              return (
              <div 
                key={ad.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-4">
                  {/* Status badges */}
                  <div className="flex justify-end mb-4">
                    <div className="flex-shrink-0">
                      {ad.moderationStatus === 'PENDING' ? (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm bg-amber-100 text-amber-800 border-2 border-amber-200">
                          <AlertCircle className="w-4 h-4 mr-1" /> Pending Approval
                        </span>
                      ) : ad.moderationStatus === 'REJECTED' ? (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm bg-red-100 text-red-800 border-2 border-red-200">
                          <AlertCircle className="w-4 h-4 mr-1" /> Rejected
                        </span>
                      ) : ad.isActive ? (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm bg-green-100 text-green-800 border-2 border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <Eye className="w-4 h-4 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm bg-gray-100 text-gray-700 border-2 border-gray-200">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          <EyeOff className="w-4 h-4 mr-1" /> Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category-specific card (fallback to generic header if not found) */}
                  {MyCard ? (
                    <MyCard ad={ad as any} />
                  ) : (
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">{ad.title}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                          <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                            <span className="truncate text-sm font-medium">{ad.address}</span>
                          </div>
                          <div className="flex items-center text-gray-900 bg-green-50 rounded-lg px-3 py-2">
                            <span className="text-lg font-bold text-green-700">
                              {formatCurrency(ad.price, (ad as any).currency || 'USD')}{ad.details?.billingPeriod ? `/${ad.details.billingPeriod}` : '/month'}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed line-clamp-3 mt-3">{ad.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Metadata - Enhanced */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center text-gray-600">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</p>
                        <p className="text-sm font-semibold text-gray-900">{new Date(ad.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="p-2 bg-orange-100 rounded-lg mr-3">
                        <Clock className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expires</p>
                        <p className="text-sm font-semibold text-gray-900">{ad.expiresAt ? new Date(ad.expiresAt).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Hash className="w-4 h-4 text-gray-700" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Code</p>
                        <p className="text-sm font-semibold text-gray-900">{(ad as any).shortCode || '-'}</p>
                      </div>
                    </div>
                    {ad.moderationStatus === 'REJECTED' && (
                      <div className="flex items-center text-red-700 bg-red-50 rounded-md px-3 py-2">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{ad.rejectReason || 'Rejected by admin'}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mb-4">
                    <AdStatsChart adId={ad.id} />
                  </div>

                  {/* Actions - Enhanced */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center sm:justify-between pt-6 border-t border-gray-200 gap-4">
                    {/* Primary Action */}
                    <div className="flex items-center">
                      {!ad.isActive && ad.moderationStatus === 'APPROVED' ? (
                        <div className="relative group">
                          <button
                            onClick={() => reactivate(ad.id)}
                            disabled={!canCreateMore}
                            className={`inline-flex items-center px-4 py-2.5 border-2 border-transparent text-sm font-semibold rounded-lg transition-all duration-200 ${
                              canCreateMore 
                                ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Reactivate
                          </button>
                          {!canCreateMore && (
                            <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-20 whitespace-nowrap">
                              You already have {activeCount}/{maxActive} active ads
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                            </div>
                          )}
                        </div>
                      ) : ad.isActive ? (
                        <button
                          onClick={() => deactivate(ad.id)}
                          className="inline-flex items-center px-4 py-2.5 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          Deactivate
                        </button>
                      ) : (
                        <div className="text-sm text-gray-600">{ad.moderationStatus === 'PENDING' ? 'Awaiting admin approval' : 'Not active'}</div>
                      )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setSelectedAd(ad); setViewOpen(true); }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">View</span>
                      </button>
                      <button
                        onClick={() => { setEditAdId(ad.id); setEditCategory(ad.category); }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Edit Ad"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteAdId(ad.id)}
                        className="inline-flex items-center px-3 py-2 border-2 border-red-200 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-300 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Delete Ad"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );})}

            {/* Pagination - Enhanced */}
            {pageCount > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600 order-2 sm:order-1 bg-gray-50 rounded-lg px-4 py-2">
                    <span className="font-medium">Showing page {page} of {pageCount}</span>
                    <span className="text-gray-500 ml-2">• {total} total listings</span>
                  </div>
                  <div className="flex items-center gap-3 order-1 sm:order-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                        page <= 1 
                          ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      ← Previous
                    </button>
                    <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border-2 border-blue-200 text-sm font-semibold">
                      {page}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                      disabled={page >= pageCount}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                        page >= pageCount 
                          ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Category selector and create modals */}
      <CreateAdSelectorModal
        open={selectorOpen}
        onCancel={() => setSelectorOpen(false)}
        onSelect={(key) => { setCategoryKey(key); setSelectorOpen(false); }}
        defaultCategory={undefined as any}
      />
      {CreateModal && (
        <CreateModal
          open={Boolean(CreateModal && categoryKey && !selectorOpen)}
          onClose={() => setCategoryKey('all')}
          onCreated={() => load()}
          category={categoryKey}
        />
      )}

      {/* View modal (detail) */}
      {DetailModal && (
        <DetailModal open={viewOpen} ad={selectedAd as any} onClose={() => setViewOpen(false)} />
      )}

      {/* Edit modal */}
      {EditModal && editAdId && editCategory ? (
        <EditModal
          open={Boolean(EditModal && editAdId)}
          onClose={() => { setEditAdId(null); setEditCategory(null); }}
          adId={editAdId}
          onSaved={() => load()}
        />
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteAdId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-200 scale-100">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Listing</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this listing? This action cannot be undone and all data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAdId(null)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(deleteAdId)}
                className="flex-1 px-4 py-2.5 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

