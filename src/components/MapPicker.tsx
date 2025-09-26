"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useConfig } from "@/app/config-context";
import MapSearch from "./MapSearch";

export default function MapPicker({ 
  value = null, 
  onChange, 
  searchProvider = 'google',
  overideZoom = null,
  editMode = false,
}: { 
  value: { lat: number; lng: number } | null; 
  onChange: (v: { lat: number; lng: number }) => void;
  searchProvider?: 'google' | 'osm';
  overideZoom?: number | null;
  editMode?: boolean;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded } = useJsApiLoader({ id: 'google-map-picker', googleMapsApiKey: apiKey || '' });
  const { country, zoom: fallbackZoom } = useConfig();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [isInitialized, setIsInitialized] = useState(false);
  const userInteractedRef = useRef(false);
  const animationDoneRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const [interactive, setInteractive] = useState<boolean>(!editMode);

  const markerPosition = useMemo(() => value ? { lat: value.lat, lng: value.lng } : null, [value]);

  const zoomForKind = (kind?: string | null): number => {
    switch ((kind || '').toLowerCase()) {
      case 'poi': return 17;
      case 'address':
      case 'street': return 16;
      case 'neighbourhood': return 14;
      case 'village': return 13;
      case 'town': return 12;
      case 'city': return 11;
      case 'region': return 9;
      case 'state': return 8;
      case 'country': return 6;
      default: return 15;
    }
  };

  // Initialize map with appropriate center and zoom
  useEffect(() => {
    if (!interactive) return;
    if (!isLoaded || isInitialized) return;

    const initializeMap = async () => {
      // Edit mode with an existing location: mount centered on it
      if (interactive && editMode && value) {
        setMapCenter({ lat: value.lat, lng: value.lng });
        const z = overideZoom || 15;
        setMapZoom(z);
        setIsInitialized(true);
        return;
      }

      // Create mode or no initial location: keep current behavior
      if (value) {
        setMapCenter({ lat: value.lat, lng: value.lng });
        setMapZoom(15);
        setIsInitialized(true);
        return;
      }

      // Try to get user's current location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setMapCenter({ lat: latitude, lng: longitude });
            setMapZoom(13);
            setIsInitialized(true);
          },
          async () => {
            // Fallback to country center
            await fallbackToCountryCenter();
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
        );
      } else {
        await fallbackToCountryCenter();
      }
    };

    const fallbackToCountryCenter = async () => {
      if (!country || country === 'Unknown') {
        // Default fallback location
        setMapCenter({ lat: 0, lng: 0 });
        setMapZoom(fallbackZoom);
        setIsInitialized(true);
        return;
      }

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(country)}&limit=1`, {
          headers: {
            "Accept": "application/json",
            "User-Agent": "sellonmap.com config-fallback",
          },
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const { lat, lon } = data[0];
          const clat = parseFloat(lat);
          const clon = parseFloat(lon);
          if (Number.isFinite(clat) && Number.isFinite(clon)) {
            setMapCenter({ lat: clat, lng: clon });
            setMapZoom(fallbackZoom);
          }
        }
      } catch {
        // Final fallback
        setMapCenter({ lat: 0, lng: 0 });
        setMapZoom(fallbackZoom);
      }
      setIsInitialized(true);
    };

    initializeMap();
  }, [interactive, isLoaded, country, fallbackZoom, value, isInitialized, editMode, overideZoom]);

  // Animate to existing value on edit mode after map loads
  useEffect(() => {
    if (!editMode || !value) return;
    if (!interactive) return;
    if (!isLoaded || !isInitialized) return;
    if (!mapRef.current) return;
    if (animationDoneRef.current || userInteractedRef.current) return;

    const map = mapRef.current;
    const targetZoom = overideZoom || 15;

    const t1 = window.setTimeout(() => {
      try { map.panTo({ lat: value.lat, lng: value.lng }); } catch {}
    }, 400);
    const t2 = window.setTimeout(() => {
      try { map.setZoom(targetZoom); } catch {}
      setMapZoom(targetZoom);
    }, 1000);
    const t3 = window.setTimeout(() => {
      setMapCenter({ lat: value.lat, lng: value.lng });
    }, 1200);

    timeoutsRef.current = [t1 as unknown as number, t2 as unknown as number, t3 as unknown as number];
    animationDoneRef.current = true;

    return () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [editMode, value, isLoaded, isInitialized, overideZoom]);

  const handleLocationSelect = (
    lat: number,
    lng: number,
    meta?: { bounds?: { south: number; west: number; north: number; east: number }; kind?: string; source?: 'google' | 'osm'; types?: string[]; osmClass?: string; osmType?: string }
  ) => {
    const newPosition = { lat, lng };
    const map = mapRef.current;
    if (map) {
      if (meta?.bounds) {
        const b = meta.bounds;
        try {
          const sw = new google.maps.LatLng(b.south, b.west);
          const ne = new google.maps.LatLng(b.north, b.east);
          const glb = new google.maps.LatLngBounds(sw, ne);
          // @ts-ignore: Padding object is supported in Maps JS API
          map.fitBounds(glb, { top: 60, right: 60, bottom: 60, left: 60 });
        } catch {}
        const targetZoom = overideZoom || zoomForKind(meta?.kind);
        window.setTimeout(() => {
          try {
            const current = map.getZoom();
            const z = typeof current === 'number' ? Math.min(current, targetZoom) : targetZoom;
            map.setZoom(z);
            setMapZoom(z);
          } catch {}
        }, 400);
        try { map.panTo(newPosition); } catch {}
      } else {
        try { map.panTo(newPosition); } catch {}
        const targetZoom = overideZoom || zoomForKind(meta?.kind);
        try { map.setZoom(targetZoom); } catch {}
        setMapZoom(targetZoom);
      }
    }
    userInteractedRef.current = true;
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (typeof lat === 'number' && typeof lng === 'number') {
      onChange({ lat, lng });
      userInteractedRef.current = true;
    }
  };

  const handleMarkerDrag = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (typeof lat === 'number' && typeof lng === 'number') {
      onChange({ lat, lng });
      userInteractedRef.current = true;
    }
  };

  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  // Static preview in edit mode until user opts to edit
  if (editMode && !interactive) {
    const lat = value?.lat;
    const lng = value?.lng;
    const z = overideZoom || 15;
    const canShowStatic = apiKey && typeof lat === 'number' && typeof lng === 'number';
    const staticUrl = canShowStatic
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${z}&size=640x340&scale=2&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${apiKey}`
      : '';
    return (
      <div className="space-y-2">
        <div className="h-10 bg-gray-50 rounded flex items-center justify-between px-3">
          <div className="text-sm text-gray-700">Location</div>
          <button
            type="button"
            onClick={() => { animationDoneRef.current = true; setInteractive(true); }}
            className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Edit location
          </button>
        </div>
        <div className="h-80 w-full overflow-hidden rounded border flex items-center justify-center bg-gray-100">
          {canShowStatic ? (
            <img src={staticUrl} alt="Location preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="text-gray-500 text-sm">No location to preview</div>
          )}
        </div>
      </div>
    );
  }

  // Only show content when map is properly initialized
  if (!isLoaded || !isInitialized || !mapCenter) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
        <div className="h-52 w-full overflow-hidden rounded border">
          <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">Loading Google Map…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {interactive ? (
        <MapSearch onSelect={handleLocationSelect} provider={searchProvider} />
      ) : null}
      <div className="h-80 w-full overflow-hidden rounded-b-lg">
        <GoogleMap
          mapContainerStyle={{ height: '340px', width: '100%' }}
          center={mapCenter}
          zoom={editMode ? mapZoom : (overideZoom || mapZoom)}
          onClick={handleMapClick}
          onLoad={handleMapLoad}
          options={{ 
            disableDefaultUI: true, 
            clickableIcons: false,
            gestureHandling: 'greedy'
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={handleMarkerDrag}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}


