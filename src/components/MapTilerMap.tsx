"use client";
import { useEffect, useRef } from 'react';
import maplibregl, { Popup } from 'maplibre-gl';
import type { Rental as RentalType } from '@/types/rental';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createMarkerElementForAd } from '@/components/ads/resolver';
import { logEvent } from '@/lib/analytics';
import { createMarkerPopupContent } from '@/components/ads/shared/markerPopup';
 

type Rental = RentalType;

export default function MapTilerMap({
  center,
  zoom = 13,
  rentals = [],
  userLocation,
  onBoundsChange,
  onCenterChange,
  onBoundsBoxChange,
  onSelectRental,
  style,
  targetBounds,
  targetFitOptions,
}: {
  center: [number, number];
  zoom?: number;
  rentals?: Rental[];
  userLocation?: [number, number];
  onBoundsChange?: (visibleRentals: Rental[]) => void;
  onCenterChange?: (lat: number, lng: number) => void;
  onBoundsBoxChange?: (bounds: { sw: [number, number]; ne: [number, number] }) => void;
  onSelectRental?: (rental: Rental) => void;
  style?: React.CSSProperties;
  targetBounds?: { south: number; west: number; north: number; east: number } | null;
  targetFitOptions?: { padding?: number; maxZoom?: number; duration?: number } | null;
}) {
  const mapRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerPopupsRef = useRef<Map<string, Popup>>(new Map());
  const rentalsRef = useRef<Rental[]>(rentals);
  const userMarkerRef = useRef<any | null>(null);
  const suppressEventsRef = useRef<boolean>(false);
  const initialFitDoneRef = useRef<boolean>(false);
  const suppressCenterPropRef = useRef<boolean>(false);
  const lastFitTargetRef = useRef<string | null>(null);

  useEffect(() => {
    rentalsRef.current = rentals;
  }, [rentals]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '';
    const dev = process.env.NODE_ENV !== 'production';
    const styleUrl = dev
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`
      : `/api/tiles/maptiler/maps/streets-v2/style.json`;
    const map = new (maplibregl as any).Map({
      container: containerRef.current as HTMLDivElement,
      style: styleUrl,
      center: [center[1], center[0]],
      zoom,
      transformRequest: (requestUrl: string, _resourceType: string) => {
        // Ensure absolute URLs for worker context (prod), but keep relative in dev
        if (!dev && requestUrl.startsWith('/')) {
          return { url: `${window.location.origin}${requestUrl}` } as any;
        }
        return { url: requestUrl } as any;
      },
    });
    mapRef.current = map;

    const updateVisibleRentals = () => {
      if (!onBoundsChange) return;
      const bounds = map.getBounds();
      const visible = rentalsRef.current.filter(r => bounds.contains([r.lng, r.lat]));
      onBoundsChange(visible);
    };

    const emitBounds = () => {
      if (onBoundsBoxChange) {
        const b = map.getBounds();
        onBoundsBoxChange({ sw: [b.getSouth(), b.getWest()], ne: [b.getNorth(), b.getEast()] });
      }
    };

    map.on('moveend', () => {
      if (suppressEventsRef.current) return;
      updateVisibleRentals();
      if (onCenterChange) {
        const c = map.getCenter();
        onCenterChange(c.lat, c.lng);
      }
      emitBounds();
    });
    map.on('zoomend', () => {
      if (suppressEventsRef.current) return;
      updateVisibleRentals();
      emitBounds();
    });
    map.on('load', () => {
      if (suppressEventsRef.current) return;
      updateVisibleRentals();
      if (onCenterChange) {
        const c = map.getCenter();
        onCenterChange(c.lat, c.lng);
      }
      emitBounds();
    });

    return () => {
      map.remove();
      markerPopupsRef.current.forEach(popup => popup.remove());
      markerPopupsRef.current.clear();
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, []);

  // Add or update user's current location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous marker if any
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!userLocation) return;

    // Inject pulse keyframes once
    const styleId = 'ml-user-marker-style';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `@keyframes ml-pulse { 0% { transform: translate(-50%, -50%) scale(1); opacity: .6; } 70% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; } 100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; } }`;
      document.head.appendChild(styleEl);
    }

    // Create marker element
    const el = document.createElement('div');
    el.style.cssText = 'position:relative;width:18px;height:18px;pointer-events:none;z-index:1000;';

    const dot = document.createElement('div');
    dot.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#1d4ed8;border:2px solid #ffffff;box-shadow:0 0 0 2px rgba(29,78,216,0.3);pointer-events:none;';

    const pulse = document.createElement('div');
    pulse.style.cssText = 'position:absolute;left:50%;top:50%;width:14px;height:14px;border-radius:50%;background:rgba(29,78,216,0.35);transform:translate(-50%,-50%);animation:ml-pulse 2s ease-out infinite;pointer-events:none;';

    el.appendChild(pulse);
    el.appendChild(dot);

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([userLocation[1], userLocation[0]])
      .addTo(map);
    userMarkerRef.current = marker;
  }, [userLocation?.[0], userLocation?.[1]]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // If we haven't completed initial auto-fit and we do have rentals, ignore external center changes
    if (!initialFitDoneRef.current && (rentalsRef.current?.length || 0) > 0) return;
    // During the suppression window, ignore center prop changes
    if (suppressCenterPropRef.current) return;
    // Skip animating if target center equals current center (avoids post-drag lock)
    const current = map.getCenter();
    const isSameCenter =
      Math.abs(current.lat - center[0]) < 1e-4 &&
      Math.abs(current.lng - center[1]) < 1e-4;
    if (isSameCenter) return;

    // Preserve user's zoom; only recenter when center meaningfully changed
    map.easeTo({ center: [center[1], center[0]], duration: 800 });
  }, [center[0], center[1]]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onBoundsChange) return;
    const bounds = map.getBounds();
    const visible = rentals.filter(r => bounds.contains([r.lng, r.lat]));
    onBoundsChange(visible);
  }, [rentals]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up existing markers and popups
    document.querySelectorAll('.ml-price-marker').forEach((el) => el.remove());
    document.querySelectorAll('.ml-category-marker').forEach((el) => el.remove());
    document.querySelectorAll('.ml-dot-marker').forEach((el) => el.remove());
    markerPopupsRef.current.forEach(popup => popup.remove());
    markerPopupsRef.current.clear();

    rentals.forEach((rental) => {
      const markerVariant = (rental as any).markerVariant || 'full';
      const el = createMarkerElementForAd(rental as any, markerVariant);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([rental.lng, rental.lat])
        .addTo(map);

      // Hover preview popup (only for full markers)
      const showHoverPopup = () => {
        if (markerVariant !== 'full') return;
        // Close existing
        markerPopupsRef.current.forEach(p => p.remove());
        markerPopupsRef.current.clear();

        const container = createMarkerPopupContent(rental as any, markerVariant, rental.title);

        const popup = new maplibregl.Popup({ offset: 12, closeButton: false, closeOnClick: false, className: 'hover-preview' })
          .setLngLat([rental.lng, rental.lat])
          .setDOMContent(container)
          .addTo(map);
        markerPopupsRef.current.set(rental.id, popup);
        try { logEvent({ eventType: 'ad_view', adId: rental.id, metadata: { lat: rental.lat, lng: rental.lng } }); } catch {}
      };

      const hideHoverPopup = () => {
        const popup = markerPopupsRef.current.get(rental.id);
        if (popup) {
          popup.remove();
          markerPopupsRef.current.delete(rental.id);
        }
      };

      el.addEventListener('mouseenter', showHoverPopup);
      el.addEventListener('mouseleave', hideHoverPopup);
      

      // Add click handler for popup
      el.addEventListener('click', (evt) => {
        evt.stopPropagation();
        // Close any existing popups
        markerPopupsRef.current.forEach(popup => popup.remove());
        markerPopupsRef.current.clear();

        // Open modal via callback
        if (onSelectRental) {
          onSelectRental(rental);
        }
        try { logEvent({ eventType: 'ad_click', adId: rental.id, metadata: { lat: rental.lat, lng: rental.lng } }); } catch {}
      });
    });
  }, [rentals]);

  // Initial fit to all rentals on first load only, with max zoom 15, without emitting bounds/center events
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (initialFitDoneRef.current) return;
    if (!Array.isArray(rentals) || rentals.length === 0) return;

    const points = rentals.map(r => ({ lat: r.lat, lng: r.lng }));
    const minLat = Math.min(...points.map(p => p.lat));
    const maxLat = Math.max(...points.map(p => p.lat));
    const minLng = Math.min(...points.map(p => p.lng));
    const maxLng = Math.max(...points.map(p => p.lng));

    suppressEventsRef.current = true;
    suppressCenterPropRef.current = true;
    if (points.length === 1) {
      map.easeTo({ center: [points[0].lng, points[0].lat], zoom: Math.min(15, map.getZoom() || 15), duration: 600 });
    } else {
      try {
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 12, duration: 700 });
      } catch {}
    }
    // Ensure this refocus runs last: once idle, run a zero-duration fit again and then lift suppression
    const clear = () => {
      try {
        if (points.length === 1) {
          map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: Math.min(15, map.getZoom() || 15) });
        } else {
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 12, duration: 0 });
        }
      } catch {}
      // small timeout to allow any late external center updates to flush, then mark done
      setTimeout(() => {
        suppressEventsRef.current = false;
        suppressCenterPropRef.current = false;
        initialFitDoneRef.current = true;
      }, 50);
      map.off('idle', clear);
    };
    map.on('idle', clear);
  }, [rentals.length]);

  // Imperatively fit to provided target bounds when they change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!targetBounds) return;

    const key = `${targetBounds.south},${targetBounds.west},${targetBounds.north},${targetBounds.east}`;
    if (lastFitTargetRef.current === key) return;

    const minLng = targetBounds.west;
    const minLat = targetBounds.south;
    const maxLng = targetBounds.east;
    const maxLat = targetBounds.north;

    try {
      suppressEventsRef.current = true;
      suppressCenterPropRef.current = true;
      const padding = targetFitOptions?.padding ?? 60;
      const maxZoom = targetFitOptions?.maxZoom ?? 14;
      const duration = targetFitOptions?.duration ?? 600;
      map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding, maxZoom, duration });
      const clear = () => {
        try {
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding, maxZoom, duration: 0 });
        } catch {}
        setTimeout(() => {
          suppressEventsRef.current = false;
          suppressCenterPropRef.current = false;
          lastFitTargetRef.current = key;
          try {
            if (onBoundsBoxChange) {
              const bb = map.getBounds();
              onBoundsBoxChange({ sw: [bb.getSouth(), bb.getWest()], ne: [bb.getNorth(), bb.getEast()] });
            }
          } catch {}
        }, 50);
        map.off('idle', clear);
      };
      map.on('idle', clear);
    } catch {}
  }, [targetBounds?.south, targetBounds?.west, targetBounds?.north, targetBounds?.east, targetFitOptions?.padding, targetFitOptions?.maxZoom, targetFitOptions?.duration]);

  

  return (
    <div style={style || { height: '70vh', width: '100%', borderRadius: '8px' }} className="relative overflow-hidden">
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
