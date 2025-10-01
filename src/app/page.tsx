"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Plus } from "lucide-react";
import MapSearch from "@/components/MapSearch";
import CategoryTabs, { type CategoryKey } from "@/components/ads/CategoryTabs";
import { resolveCreateAdModal, resolveDetailModal, isPropertyCategory } from "@/components/ads/resolver";
import CreateAdSelectorModal from "@/components/ads/CreateAdSelectorModal";
import type { Rental as RentalType } from "@/types/rental";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuthModal } from "@/app/providers";
import { useConfig } from "@/app/config-context";

const MapWithNoSSR = dynamic(() => import("@/components/MapTilerMap"), { ssr: false });

interface Rental {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  price: number;
  address: string;
  createdAt: string;
  category?: string;
}

export default function Marketplace() {
  const { country, zoom: fallbackZoom } = useConfig();
  const { status } = useSession();
  const { openAuthModal } = useAuthModal();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [bounds, setBounds] = useState<{ sw: [number, number]; ne: [number, number] } | null>(null);
  const [targetBounds, setTargetBounds] = useState<{ south: number; west: number; north: number; east: number } | null>(null);
  const [targetFitOptions, setTargetFitOptions] = useState<{ padding?: number; maxZoom?: number; duration?: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [selectedLeaves, setSelectedLeaves] = useState<CategoryKey[]>([]);
  const [selected, setSelected] = useState<RentalType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPickerOpen, setCreatePickerOpen] = useState(false);
  const [createCategory, setCreateCategory] = useState<CategoryKey | null>(null);
  const [zoom, setZoom] = useState(fallbackZoom);

  function handleCategoryChange(newKey: CategoryKey) {
    const key = String(newKey || '');
    if (Array.isArray(selectedLeaves) && selectedLeaves.length > 0) {
      if (key === 'all') {
        setSelectedLeaves([]);
      } else {
        const prefix = key + '.';
        const allUnderNew = selectedLeaves.every((k) => typeof k === 'string' && k.startsWith(prefix));
        if (allUnderNew) setSelectedLeaves([]);
      }
    }
    setActiveCategory(newKey);
  }
  // Default category for Create picker: if exactly one leaf is selected under current parent, use it
  const createDefaultCategory: CategoryKey = (() => {
    const parent = String(activeCategory || '');
    if (!parent || parent === 'all') return activeCategory as CategoryKey;
    const pref = parent + '.';
    if (Array.isArray(selectedLeaves) && selectedLeaves.length === 1 && String(selectedLeaves[0]).startsWith(pref)) {
      return selectedLeaves[0] as CategoryKey;
    }
    return activeCategory as CategoryKey;
  })();

  const lastFetchCategoryRef = useRef<CategoryKey | null>(null);
  const lastFetchFiltersRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const lastBoundsRef = useRef<{ sw: [number, number]; ne: [number, number] } | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const firstLoadRef = useRef(true);
  const hadGeoSuccessRef = useRef(false);
  // Wrapped usage of useSearchParams in Suspense below via SearchParamSync

  function SearchParamSync() {
    const searchParams = useSearchParams();
    useEffect(() => {
      const fromQuery = (searchParams?.get("category") || "").trim();
      if (fromQuery) {
        setActiveCategory(fromQuery as CategoryKey);
      }
      // Read multiple categories (leaf selections)
      const cats = (searchParams?.getAll('categories') || []).flatMap((c) => (c || '').split(',')).map((s) => s.trim()).filter(Boolean);
      if (Array.isArray(cats) && cats.length > 0) {
        setSelectedLeaves(Array.from(new Set(cats)) as CategoryKey[]);
      }
    }, [searchParams]);
    useEffect(() => {
      const create = (searchParams?.get('create') || '').trim();
      if (create === '1') {
        if (status !== 'authenticated') {
          openAuthModal({ reason: 'Sign In First', callbackUrl: '/?create=1' });
        } else {
          setCreatePickerOpen(true);
        }
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('create');
          window.history.replaceState({}, '', url.toString());
        } catch {}
      }
    }, [searchParams, status, openAuthModal]);
    return null;
  }
  // Keep selected leaves in sync with current parent scope
  useEffect(() => {
    const parent = String(activeCategory || '');
    if (!parent || parent === 'all') {
      if (selectedLeaves.length > 0) setSelectedLeaves([]);
      return;
    }
    const pref = parent + '.';
    const pruned = selectedLeaves.filter((k) => typeof k === 'string' && k.startsWith(pref));
    if (pruned.length !== selectedLeaves.length) setSelectedLeaves(pruned);
  }, [activeCategory]);


  function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    async function fallbackToCountryCenter() {
      if (!country || country === 'Unknown') return;
      // Try cached bounds first
      try {
        const storageKey = `som_country_bounds_${country}`;
        const cached = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        if (cached) {
          const parsed = JSON.parse(cached) as { south: number; west: number; north: number; east: number };
          if (
            parsed &&
            typeof parsed.south === 'number' &&
            typeof parsed.north === 'number' &&
            typeof parsed.west === 'number' &&
            typeof parsed.east === 'number'
          ) {
            const midLat = (parsed.south + parsed.north) / 2;
            const midLng = (parsed.west + parsed.east) / 2;
            setCenter([midLat, midLng]);
            setZoom(fallbackZoom);
            setTargetBounds(parsed);
            setBounds({ sw: [parsed.south, parsed.west], ne: [parsed.north, parsed.east] });
            return;
          }
        }
      } catch { /* ignore */ }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(country)}&limit=1&addressdetails=0&polygon_geojson=0`,
          {
            headers: {
              "Accept": "application/json",
              "User-Agent": "sellonmap.com config-fallback",
            },
          }
        );
        const data: Array<{ lat?: string; lon?: string; boundingbox?: [string, string, string, string] }> = await res.json();
        const bbox = data?.[0]?.boundingbox;
        if (Array.isArray(bbox) && bbox.length === 4) {
          const parsed = {
            south: parseFloat(bbox[0] as string),
            north: parseFloat(bbox[1] as string),
            west: parseFloat(bbox[2] as string),
            east: parseFloat(bbox[3] as string),
          } as { south: number; west: number; north: number; east: number };
          const midLat = (parsed.south + parsed.north) / 2;
          const midLng = (parsed.west + parsed.east) / 2;
          setCenter([midLat, midLng]);
          setZoom(fallbackZoom);
          setTargetBounds(parsed);
          setBounds({ sw: [parsed.south, parsed.west], ne: [parsed.north, parsed.east] });
          try { localStorage.setItem(`som_country_bounds_${country}`, JSON.stringify(parsed)); } catch {}
          return;
        }
        const { lat, lon } = data?.[0] || {};
        const clat = parseFloat(lat || '0');
        const clon = parseFloat(lon || '0');
        if (Number.isFinite(clat) && Number.isFinite(clon)) {
          setCenter([clat, clon]);
          setZoom(fallbackZoom);
          const tb = boundsFromCenterRadiusMeters(clat, clon, 500000);
          setTargetBounds(tb);
          setBounds({ sw: [tb.south, tb.west], ne: [tb.north, tb.east] });
        }
      } catch {
        /* ignore */
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCenter([latitude, longitude]);
          setUserLocation([latitude, longitude]);
          setZoom(13);
          try {
            const tb = boundsFromCenterRadiusMeters(latitude, longitude, 5000);
            setTargetBounds(tb);
            setBounds({ sw: [tb.south, tb.west], ne: [tb.north, tb.east] });
          } catch {}
          hadGeoSuccessRef.current = true;
        },
        (err) => {
          console.log('geolocation error', err);
          fallbackToCountryCenter();
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
      );
    } else {
      fallbackToCountryCenter();
    }
  }, [country]);

  function boundsFromCenterRadiusMeters(lat: number, lng: number, radiusMeters: number): { south: number; west: number; north: number; east: number } {
    const earthRadius = 6378137; // meters
    const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
    const dLng = (radiusMeters / (earthRadius * Math.cos((Math.PI * lat) / 180))) * (180 / Math.PI);
    return {
      south: lat - dLat,
      north: lat + dLat,
      west: lng - dLng,
      east: lng + dLng,
    };
  }

  function fitOptionsForKind(kind?: string | null): { padding?: number; maxZoom?: number; duration?: number } {
    switch ((kind || '').toLowerCase()) {
      case 'poi':
        return { padding: 60, maxZoom: 17, duration: 600 };
      case 'address':
      case 'street':
        return { padding: 60, maxZoom: 16, duration: 600 };
      case 'neighbourhood':
        return { padding: 60, maxZoom: 14, duration: 600 };
      case 'village':
        return { padding: 60, maxZoom: 13, duration: 600 };
      case 'town':
        return { padding: 60, maxZoom: 12, duration: 600 };
      case 'city':
        return { padding: 60, maxZoom: 11, duration: 600 };
      case 'region':
        return { padding: 60, maxZoom: 9, duration: 600 };
      case 'state':
        return { padding: 60, maxZoom: 8, duration: 600 };
      case 'country':
        return { padding: 60, maxZoom: 6, duration: 600 };
      default:
        return { padding: 60, maxZoom: 14, duration: 600 };
    }
  }

  function fallbackRadiusForKindMeters(kind?: string | null): number {
    switch ((kind || '').toLowerCase()) {
      case 'poi':
        return 1000;
      case 'address':
      case 'street':
        return 1800;
      case 'neighbourhood':
        return 4000;
      case 'village':
        return 8000;
      case 'town':
        return 15000;
      case 'city':
        return 25000;
      case 'region':
        return 75000;
      case 'state':
        return 150000;
      case 'country':
        return 500000;
      default:
        return 12000;
    }
  }

  useEffect(() => {
    if (!bounds) return;
    // First fetch should happen immediately without debounce
    if (!lastBoundsRef.current) {
      fetchListingsByBounds(bounds);
      lastBoundsRef.current = bounds;
      lastFetchCategoryRef.current = activeCategory;
      lastFetchFiltersRef.current = (selectedLeaves || []).join(',');
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      const categoryChanged = lastFetchCategoryRef.current !== activeCategory;
      const leavesChanged = lastFetchFiltersRef.current !== (selectedLeaves || []).join(',');
      const prev = lastBoundsRef.current;
      let changedByViewport = true;
      if (prev) {
        const currHeight = Math.abs(bounds.ne[0] - bounds.sw[0]);
        const currWidth = Math.abs(bounds.ne[1] - bounds.sw[1]);
        const prevHeight = Math.abs(prev.ne[0] - prev.sw[0]);
        const prevWidth = Math.abs(prev.ne[1] - prev.sw[1]);
        const eps = 1e-9;
        const latShift = Math.max(
          Math.abs(prev.sw[0] - bounds.sw[0]),
          Math.abs(prev.ne[0] - bounds.ne[0])
        ) / (currHeight || eps);
        const lngShift = Math.max(
          Math.abs(prev.sw[1] - bounds.sw[1]),
          Math.abs(prev.ne[1] - bounds.ne[1])
        ) / (currWidth || eps);
        const heightChange = prevHeight > 0 ? Math.abs(currHeight - prevHeight) / prevHeight : 1;
        const widthChange = prevWidth > 0 ? Math.abs(currWidth - prevWidth) / prevWidth : 1;
        changedByViewport = Math.max(latShift, lngShift, heightChange, widthChange) >= 0.10;
      }
      if (categoryChanged || leavesChanged || changedByViewport) {
        fetchListingsByBounds(bounds);
        lastBoundsRef.current = bounds;
        lastFetchCategoryRef.current = activeCategory;
        lastFetchFiltersRef.current = (selectedLeaves || []).join(',');
      }
    }, 600);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [bounds, activeCategory, selectedLeaves]);

  function fetchParamsFromBounds(b: { sw: [number, number]; ne: [number, number] }): URLSearchParams {
    const params = new URLSearchParams();
    params.append('swLat', String(b.sw[0]));
    params.append('swLng', String(b.sw[1]));
    params.append('neLat', String(b.ne[0]));
    params.append('neLng', String(b.ne[1]));
    return params;
  }

  function boundsFromPoints(points: Array<{ lat: number; lng: number } | [number, number]>): { south: number; west: number; north: number; east: number } | null {
    if (!Array.isArray(points) || points.length === 0) return null;
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const p of points) {
      const plat = Array.isArray(p) ? p[0] : p.lat;
      const plng = Array.isArray(p) ? p[1] : p.lng;
      if (!Number.isFinite(plat) || !Number.isFinite(plng)) continue;
      if (plat < minLat) minLat = plat;
      if (plat > maxLat) maxLat = plat;
      if (plng < minLng) minLng = plng;
      if (plng > maxLng) maxLng = plng;
    }
    if (!Number.isFinite(minLat) || !Number.isFinite(minLng) || !Number.isFinite(maxLat) || !Number.isFinite(maxLng)) return null;
    return { south: minLat, west: minLng, north: maxLat, east: maxLng };
  }

  

  async function fetchListingsByBounds(b: { sw: [number, number]; ne: [number, number] }) {
    setIsFetching(true);
    try {
      fetchControllerRef.current?.abort();
      const controller = new AbortController();
      fetchControllerRef.current = controller;
      const params = fetchParamsFromBounds(b);
      params.append('category', activeCategory);
      // include selected leaf categories within current parent
      try {
        const pref = String(activeCategory || '') + '.';
        if (Array.isArray(selectedLeaves) && selectedLeaves.length > 0 && activeCategory && activeCategory !== 'all') {
          const inScope = selectedLeaves.filter((k) => typeof k === 'string' && k.startsWith(pref));
          for (const k of inScope) params.append('categories', k);
        }
      } catch {}
      // Pass viewport size so server can choose K full markers
      try {
        const vw = Math.max(320, Math.round((window as any).innerWidth || 0));
        const vh = Math.max(320, Math.round((window as any).innerHeight || 0));
        params.append('vw', String(vw));
        params.append('vh', String(vh));
      } catch {}
      const res = await fetch(`/api/ads?${params.toString()}`, { signal: controller.signal });
      const data = await res.json();
      setRentals(data);
      // First load fitting logic
      if (firstLoadRef.current) {
        if (hadGeoSuccessRef.current && userLocation) {
          const points: Array<[number, number]> = [[userLocation[0], userLocation[1]]];
          if (Array.isArray(data) && data.length > 0) {
            for (const r of data as any[]) {
              if (Number.isFinite(r?.lat) && Number.isFinite(r?.lng)) points.push([r.lat, r.lng]);
            }
          }
          let fitB = boundsFromPoints(points);
          if (!fitB) {
            fitB = boundsFromCenterRadiusMeters(userLocation[0], userLocation[1], 5000);
          }
          if (fitB) {
            setTargetBounds(fitB);
            setTargetFitOptions({ padding: 60, maxZoom: 14, duration: 600 });
          }
        } else {
          if (Array.isArray(data) && data.length > 0) {
            const points = (data as any[]).map((r) => ({ lat: r.lat, lng: r.lng }));
            const fitB = boundsFromPoints(points);
            if (fitB) {
              setTargetBounds(fitB);
              setTargetFitOptions({ padding: 60, maxZoom: 12, duration: 700 });
            }
          }
        }
        firstLoadRef.current = false;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen relative">
      <Suspense fallback={null}>
        <SearchParamSync />
      </Suspense>
      <MapWithNoSSR 
        center={center} 
        zoom={zoom} 
        rentals={rentals as any} 
        userLocation={userLocation || undefined}
        targetBounds={targetBounds}
        targetFitOptions={targetFitOptions || { padding: 60, maxZoom: 14, duration: 600 }}
        onBoundsBoxChange={(b) => setBounds(b)}
        onCenterChange={(lat: number, lng: number) => setCenter([lat, lng])}
        onSelectRental={(rental: RentalType) => { setSelected(rental); setDetailOpen(true); }}
        style={{ height: '100vh', width: '100vw' }} 
      />

      {initialLoading && (
        <div className="absolute inset-0 z-[1005] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Loading listings on the map...</p>
          </div>
        </div>
      )}

      <div className="hidden ml-12 lg:flex absolute top-4 left-4 z-[1002] max-w-[95vw] gap-3 items-start">
        <div className="shadow-lg rounded-lg w-[380px]">
          <MapSearch onSelect={(lat, lon, meta) => {
            setCenter([lat, lon]);
            const radius = fallbackRadiusForKindMeters(meta?.kind);
            const b = meta?.bounds || boundsFromCenterRadiusMeters(lat, lon, radius);
            setTargetBounds(b);
            setBounds({ sw: [b.south, b.west], ne: [b.north, b.east] });
            setTargetFitOptions(fitOptionsForKind(meta?.kind));
          }} onLocate={(lat, lon) => { setUserLocation([lat, lon]); setCenter([lat, lon]); const b = boundsFromCenterRadiusMeters(lat, lon, 8000); setTargetBounds(b); setBounds({ sw: [b.south, b.west], ne: [b.north, b.east] }); }} provider="google" />
        </div>
        <div className="max-w-[60vw] overflow-x-auto mt-0.5">
          <CategoryTabs active={activeCategory} onChange={handleCategoryChange} selectedLeaves={selectedLeaves} onSelectedLeavesChange={setSelectedLeaves} />
        </div>
      </div>

      <div className="lg:hidden ml-10 fixed top-4 left-1/4 -translate-x-1/4 z-[1002] w-[calc(100vw-64px)] max-w-md space-y-2">
        <div className="shadow-[0_4px_15px_rgba(0,0,0,0.1)] rounded-xl">
          <MapSearch onSelect={(lat, lon, meta) => {
            setCenter([lat, lon]);
            const radius = fallbackRadiusForKindMeters(meta?.kind);
            const b = meta?.bounds || boundsFromCenterRadiusMeters(lat, lon, radius);
            setTargetBounds(b);
            setBounds({ sw: [b.south, b.west], ne: [b.north, b.east] });
            setTargetFitOptions(fitOptionsForKind(meta?.kind));
          }} onLocate={(lat, lon) => { setUserLocation([lat, lon]); setCenter([lat, lon]); const b = boundsFromCenterRadiusMeters(lat, lon, 8000); setTargetBounds(b); setBounds({ sw: [b.south, b.west], ne: [b.north, b.east] }); }} />
        </div>
      </div>

      <div className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100vw-8px)] z-[1002]">
        <div className="overflow-x-auto">
          <CategoryTabs active={activeCategory} onChange={handleCategoryChange} compact={false} selectedLeaves={selectedLeaves} onSelectedLeavesChange={setSelectedLeaves} />
        </div>
      </div>

      <button 
        onClick={() => {
          if (status !== 'authenticated') {
            openAuthModal({ reason: 'Sign In First', callbackUrl: '/?create=1' });
            return;
          }
          setCreatePickerOpen(true);
        }} 
        className="absolute right-3 top-16 md:top-4 z-[1001] bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg flex items-center justify-center rounded-full md:rounded-lg px-2 py-2"
        aria-label="Create a new ad"
      >
        <Plus className="h-6 w-6 md:mr-1" />
        <span className="hidden md:inline pr-1">Create Free Ad</span>
      </button>
      <CreateAdSelectorModal
        open={createPickerOpen}
        defaultCategory={createDefaultCategory}
        onCancel={() => setCreatePickerOpen(false)}
        onSelect={(cat) => {
          setCreatePickerOpen(false);
          setCreateCategory(cat);
          setCreateOpen(true);
        }}
      />

      {(() => {
        if (!selected) return null;
        const cat = (selected as any).category || '';
        if (!isPropertyCategory(cat)) return null;
        const DetailModal = resolveDetailModal(cat);
        if (!DetailModal) return null;
        return (
          <DetailModal open={detailOpen} ad={selected} onClose={() => setDetailOpen(false)} />
        );
      })()}

      {(() => {
        if (!createOpen) return null;
        const catForCreate = (createCategory || activeCategory) as CategoryKey;
        if (!isPropertyCategory(catForCreate)) return null;
        const CreateModal = resolveCreateAdModal(catForCreate);
        if (!CreateModal) return null;
        return (
          <CreateModal 
            open={createOpen} 
            onClose={() => { setCreateOpen(false); setCreateCategory(null); }} 
            onCreated={() => { const b = bounds || lastBoundsRef.current; if (b) { fetchListingsByBounds(b); } }} 
            category={catForCreate} 
          />
        );
      })()}
    </div>
  );
}


