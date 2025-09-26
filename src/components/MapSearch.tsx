"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Search, LocateFixed, X } from "lucide-react";
import { useConfig } from "@/app/config-context";

/**
 * MapSearch component with switchable location providers
 * 
 * @example
 * // Use OpenStreetMap (default)
 * <MapSearch onSelect={handleSelect} />
 * 
 * // Use Google Places
 * <MapSearch onSelect={handleSelect} provider="google" />
 */

type LocationProvider = 'google' | 'osm';
type SuggestionKind =
  | 'poi'
  | 'street'
  | 'address'
  | 'neighbourhood'
  | 'village'
  | 'town'
  | 'city'
  | 'region'
  | 'state'
  | 'country'
  | 'unknown';

interface Bounds { south: number; west: number; north: number; east: number }

interface BaseSuggestion {
  display_name: string;
  lat: number;
  lon: number;
  bounds?: Bounds;
  // Optional classification/meta
  kind?: SuggestionKind;
  source?: LocationProvider;
  types?: string[]; // Google types
  osmClass?: string; // OSM class
  osmType?: string; // OSM type
}

interface OSMSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  boundingbox?: [string, string, string, string]; // [south, north, west, east]
}

// Types for Google Places API responses (not used directly in current implementation)

export default function MapSearch({ 
  onSelect, 
  onLocate,
  provider = 'google'
}: { 
  onSelect: (lat: number, lon: number, meta?: { bounds?: Bounds; kind?: SuggestionKind; source?: LocationProvider; types?: string[]; osmClass?: string; osmType?: string }) => void;
  onLocate?: (lat: number, lon: number) => void;
  provider?: LocationProvider;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BaseSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { country } = useConfig();
  const [countryBounds, setCountryBounds] = useState<Bounds | null>(null);

  const isWithinBounds = (lat: number, lon: number, bounds: Bounds | null): boolean => {
    if (!bounds) return false;
    return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
  };

  // Load country bounds from localStorage or fetch via OSM
  useEffect(() => {
    if (!country) return;
    const storageKey = `som_country_bounds_${country}`;
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (cached) {
        const parsed = JSON.parse(cached) as Bounds;
        if (
          parsed &&
          typeof parsed.south === 'number' &&
          typeof parsed.north === 'number' &&
          typeof parsed.west === 'number' &&
          typeof parsed.east === 'number'
        ) {
          setCountryBounds(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    let aborted = false;
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(country)}&limit=1&addressdetails=0&polygon_geojson=0`,
          {
            headers: {
              "Accept": "application/json",
              "User-Agent": "sellonmap.com demo",
            },
          }
        );
        const data: Array<{ boundingbox?: [string, string, string, string] }> = await res.json();
        const bbox = data?.[0]?.boundingbox;
        if (!aborted && Array.isArray(bbox) && bbox.length === 4) {
          // Nominatim order: [south, north, west, east]
          const bounds: Bounds = {
            south: parseFloat(bbox[0]),
            north: parseFloat(bbox[1]),
            west: parseFloat(bbox[2]),
            east: parseFloat(bbox[3]),
          };
          setCountryBounds(bounds);
          try {
            localStorage.setItem(`som_country_bounds_${country}`, JSON.stringify(bounds));
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    })();

    return () => { aborted = true; };
  }, [country]);

  // Fetch suggestions from OpenStreetMap Nominatim (address-like + POIs, soft-prioritized by country bounds)
  const fetchOSMSuggestions = useCallback(async (query: string, signal: AbortSignal, bounds?: Bounds | null): Promise<BaseSuggestion[]> => {
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      addressdetails: '1',
      limit: '8',
    });
    if (bounds) {
      // viewbox order expected by Nominatim: left (west), top (north), right (east), bottom (south)
      params.set('viewbox', `${bounds.west},${bounds.north},${bounds.east},${bounds.south}`);
      // do not set bounded=1 to avoid hard restriction; let it bias ranking
    }
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "sellonmap.com demo",
      },
      signal,
    });
    const data: OSMSuggestion[] = await res.json();
    const isAddressLike = (s: OSMSuggestion) => {
      const cls = s.class || '';
      const typ = s.type || '';
      // Address-like
      if (cls === 'place') return true; // city, town, village, hamlet, suburb, neighbourhood, locality, etc.
      if (cls === 'highway') return true; // streets and routes
      if (cls === 'boundary' && typ === 'administrative') return true; // admin boundaries
      if (cls === 'address') return true; // house numbers etc.
      // Landmarks / POIs commonly used as landmarks
      if (cls === 'amenity') return true; // schools, hospitals, police, fire_station, bank, post_office, etc.
      if (cls === 'tourism') return true; // attractions, museums, viewpoints
      if (cls === 'leisure') return true; // parks, stadiums
      if (cls === 'shop') return true; // malls, supermarkets
      if (cls === 'aeroway') return true; // airports, terminals
      if (cls === 'railway') return true; // stations
      if (cls === 'public_transport') return true; // major stops / stations
      if (cls === 'building' && ['public', 'school', 'hospital'].includes(typ)) return true; // prominent buildings
      return false;
    };
    const classifyOsm = (s: OSMSuggestion): SuggestionKind => {
      const cls = (s.class || '').toLowerCase();
      const typ = (s.type || '').toLowerCase();
      if (cls === 'amenity' || cls === 'tourism' || cls === 'leisure' || cls === 'shop' || cls === 'aeroway' || cls === 'railway' || cls === 'public_transport') return 'poi';
      if (cls === 'building' && ['public', 'school', 'hospital'].includes(typ)) return 'poi';
      if (cls === 'highway') return 'street';
      if (cls === 'address') return 'address';
      if (cls === 'place') {
        if (typ === 'city') return 'city';
        if (typ === 'town') return 'town';
        if (typ === 'village') return 'village';
        if (['hamlet','suburb','neighbourhood','quarter','locality'].includes(typ)) return 'neighbourhood';
        if (['county','region','district'].includes(typ)) return 'region';
        if (['state','province'].includes(typ)) return 'state';
        if (typ === 'country') return 'country';
      }
      if (cls === 'boundary' && typ === 'administrative') return 'region';
      return 'unknown';
    };
    const mapped: BaseSuggestion[] = Array.isArray(data)
      ? data
          .filter(isAddressLike)
          .map(item => {
            const south = item.boundingbox ? parseFloat(item.boundingbox[0]) : undefined;
            const north = item.boundingbox ? parseFloat(item.boundingbox[1]) : undefined;
            const west = item.boundingbox ? parseFloat(item.boundingbox[2]) : undefined;
            const east = item.boundingbox ? parseFloat(item.boundingbox[3]) : undefined;
            const bb = (Number.isFinite(south as number) && Number.isFinite(north as number) && Number.isFinite(west as number) && Number.isFinite(east as number))
              ? { south: south as number, west: west as number, north: north as number, east: east as number }
              : undefined;
            const kind = classifyOsm(item);
            return {
              display_name: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              bounds: bb,
              kind,
              source: 'osm',
              osmClass: item.class,
              osmType: item.type,
            } as BaseSuggestion;
          })
      : [];
    if (bounds) {
      // soft-prioritize: inside-bounds first, keep original order otherwise
      return mapped.slice().sort((a, b) => {
        const ai = isWithinBounds(a.lat, a.lon, bounds) ? 0 : 1;
        const bi = isWithinBounds(b.lat, b.lon, bounds) ? 0 : 1;
        return ai - bi;
      });
    }
    return mapped;
  }, []);

  // Fetch suggestions from Google Places via our API endpoint
  const fetchGoogleSuggestions = useCallback(async (query: string, signal: AbortSignal, bounds?: Bounds | null): Promise<BaseSuggestion[]> => {
    try {
      const boundsParam = bounds ? `&bounds=${bounds.south},${bounds.west},${bounds.north},${bounds.east}` : '';
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}${boundsParam}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn('Google Places API failed, falling back to OSM');
        return fetchOSMSuggestions(query, signal, bounds);
      }
      
      const data = await response.json();
      const classifyGoogleTypes = (types?: string[]): SuggestionKind => {
        if (!Array.isArray(types)) return 'unknown';
        const tset = new Set(types);
        if (tset.has('point_of_interest') || tset.has('establishment') || tset.has('tourist_attraction')) return 'poi';
        if (tset.has('street_address') || tset.has('premise') || tset.has('subpremise')) return 'address';
        if (tset.has('route')) return 'street';
        if (tset.has('neighborhood') || tset.has('sublocality') || tset.has('sublocality_level_1')) return 'neighbourhood';
        if (tset.has('locality') || tset.has('postal_town')) return 'city';
        if (tset.has('administrative_area_level_3')) return 'town';
        if (tset.has('administrative_area_level_2')) return 'region';
        if (tset.has('administrative_area_level_1')) return 'state';
        if (tset.has('country')) return 'country';
        return 'unknown';
      };
      const suggestions: BaseSuggestion[] = (data.suggestions || []).map((s: any) => ({
        display_name: s.display_name,
        lat: s.lat,
        lon: s.lon,
        bounds: s.bounds,
        types: s.types,
        source: 'google',
        kind: classifyGoogleTypes(s.types),
      }));
      if (bounds) {
        return suggestions.slice().sort((a: BaseSuggestion, b: BaseSuggestion) => {
          const ai = isWithinBounds(a.lat, a.lon, bounds) ? 0 : 1;
          const bi = isWithinBounds(b.lat, b.lon, bounds) ? 0 : 1;
          return ai - bi;
        });
      }
      return suggestions;
    } catch (error) {
      console.warn('Google Places API error:', error);
      return fetchOSMSuggestions(query, signal, bounds);
    }
  }, [fetchOSMSuggestions]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    // Only fetch suggestions if the input is focused
    if (inputRef.current && document.activeElement !== inputRef.current) {
      return;
    }
    
    const handler = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      
      try {
        let suggestions: BaseSuggestion[] = [];
        
        if (provider === 'google') {
          suggestions = await fetchGoogleSuggestions(query, controller.signal, countryBounds);
        } else {
          suggestions = await fetchOSMSuggestions(query, controller.signal, countryBounds);
        }
        
        setResults(suggestions);
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 300);
    
    return () => clearTimeout(handler);
  }, [query, provider, countryBounds, fetchGoogleSuggestions, fetchOSMSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (onLocate) {
          onLocate(latitude, longitude);
        } else {
          onSelect(latitude, longitude);
        }
      },
      () => {
        /* ignore */
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder="Search a location..."
        className="text-black w-full pl-10 pr-20 md:pr-24 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-10 md:right-12 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 text-gray-500"
          onClick={() => {
            setQuery("");
            setResults([]);
            setOpen(false);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        aria-label="Use my location"
        onClick={handleLocate}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded bg-white hover:bg-gray-100 text-gray-700"
      >
        <LocateFixed className="h-5 w-5" />
      </button>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow border max-h-72 overflow-auto z-[1002]">
          {results.map((r, index) => (
            <button
              key={`${r.lat},${r.lon}-${index}`}
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                controllerRef.current?.abort();
                setQuery(r.display_name);
                setOpen(false);
                setResults([]);
                inputRef.current?.blur();
                onSelect(r.lat, r.lon, { bounds: r.bounds, kind: r.kind, source: r.source, types: r.types, osmClass: r.osmClass, osmType: r.osmType });
              }}
            >
              <div className="text-sm text-gray-900 truncate">{r.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
