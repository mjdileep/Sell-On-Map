import { NextRequest, NextResponse } from 'next/server';

// Cache settings
// Reasonable cache: short TTL for suggestions, vary by input and bounds.
const BROWSER_TTL_SECONDS = 60; // 1 minute in browser
const CDN_TTL_SECONDS = 300; // 5 minutes at CDN/proxy

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  const boundsParam = searchParams.get('bounds'); // south,west,north,east
  
  if (!input) {
    return NextResponse.json({ error: 'Input parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    // Build a cache key for Next.js fetch caching layer (if enabled) and Nginx
    const normalizedInput = (input || '').trim().toLowerCase();
    const normalizedBounds = (boundsParam || '').trim();
    const cacheKey = `autocomplete:${normalizedInput}:${normalizedBounds}`;
    const dev = process.env.NODE_ENV !== 'production';
    let locationBiasQuery = '';
    if (boundsParam) {
      const parts = boundsParam.split(',').map(v => parseFloat(v));
      if (parts.length === 4 && parts.every(v => Number.isFinite(v))) {
        const [south, west, north, east] = parts as [number, number, number, number];
        const centerLat = (south + north) / 2;
        const centerLng = (west + east) / 2;
        const degToMetersLat = 111320; // approx meters per degree latitude
        const degToMetersLon = 111320 * Math.cos((centerLat * Math.PI) / 180);
        const latDelta = Math.max(0, north - south);
        const lonDelta = Math.max(0, east - west);
        const halfDiagMeters = Math.sqrt(
          Math.pow(latDelta * degToMetersLat, 2) + Math.pow(lonDelta * degToMetersLon, 2)
        ) / 2;
        // radius for bias (soft). Clamp to Google's suggested practical limit (e.g., 50000m)
        const radius = Math.max(1000, Math.min(50000, Math.round(halfDiagMeters)));
        locationBiasQuery = `&location=${centerLat},${centerLng}&radius=${radius}`;
      }
    }
    // Get place predictions for both addresses and establishments (POIs)
    const buildAutocompleteUrl = (types: string) =>
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=${types}${locationBiasQuery}&key=${apiKey}`;

    const [geoResult, estResult] = await Promise.allSettled([
      fetch(buildAutocompleteUrl('geocode'), {
        headers: { 'Content-Type': 'application/json' },
        next: dev ? undefined : { revalidate: CDN_TTL_SECONDS, tags: [cacheKey] },
      }),
      fetch(buildAutocompleteUrl('establishment'), {
        headers: { 'Content-Type': 'application/json' },
        next: dev ? undefined : { revalidate: CDN_TTL_SECONDS, tags: [cacheKey] },
      }),
    ]);

    const predictions: Array<{ place_id: string; description: string; types?: string[] }> = [];

    const pushPredictions = async (respPromise: PromiseSettledResult<Response>) => {
      if (respPromise.status !== 'fulfilled') return;
      const resp = respPromise.value;
      if (!resp.ok) return;
      const data = await resp.json();
      if (Array.isArray(data?.predictions)) {
        for (const p of data.predictions) {
          if (p?.place_id && p?.description) predictions.push({ place_id: p.place_id, description: p.description, types: Array.isArray(p?.types) ? p.types : undefined });
        }
      }
    };

    await Promise.all([pushPredictions(geoResult), pushPredictions(estResult)]);

    if (predictions.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Deduplicate by place_id while preserving order
    const seen = new Set<string>();
    const uniquePredictions = predictions.filter(p => {
      if (seen.has(p.place_id)) return false;
      seen.add(p.place_id);
      return true;
    }).slice(0, 8);

    // Get place details for coordinates and viewport bounds
    const suggestions = await Promise.allSettled(
      uniquePredictions.map(async (prediction: { place_id: string; description: string; types?: string[] }) => {
        try {
          const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address,name,types&key=${apiKey}`
          , { next: dev ? undefined : { revalidate: CDN_TTL_SECONDS, tags: [cacheKey] } });

          if (!detailsResponse.ok) {
            throw new Error(`Place details API error: ${detailsResponse.status}`);
          }

          const detailsData = await detailsResponse.json();
          const geometry = detailsData.result?.geometry;
          const location = geometry?.location;

          if (location) {
            // Prefer geometry.viewport over geometry.bounds
            const vp = geometry?.viewport;
            const b = geometry?.bounds;
            const bounds = vp || b
              ? {
                  south: (vp?.southwest?.lat ?? b?.southwest?.lat) as number,
                  west: (vp?.southwest?.lng ?? b?.southwest?.lng) as number,
                  north: (vp?.northeast?.lat ?? b?.northeast?.lat) as number,
                  east: (vp?.northeast?.lng ?? b?.northeast?.lng) as number,
                }
              : undefined;

            const types: string[] = Array.isArray(detailsData?.result?.types)
              ? (detailsData.result.types as string[])
              : (prediction.types || []);
            return {
              display_name: prediction.description,
              lat: location.lat as number,
              lon: location.lng as number,
              bounds,
              types,
            } as { display_name: string; lat: number; lon: number; bounds?: { south: number; west: number; north: number; east: number }, types?: string[] };
          }
          return null;
        } catch (error) {
          console.error('Error fetching place details:', error);
          return null;
        }
      })
    );

    // Filter out failed requests and null results
    const validSuggestions = suggestions
      .filter((result): result is PromiseFulfilledResult<{ display_name: string; lat: number; lon: number; bounds?: { south: number; west: number; north: number; east: number }, types?: string[] }> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    const res = NextResponse.json({ suggestions: validSuggestions });
    // Public cache headers so Nginx/browser can cache based on URL
    res.headers.set('Cache-Control', dev ? 'no-store' : `public, max-age=${BROWSER_TTL_SECONDS}, s-maxage=${CDN_TTL_SECONDS}`);
    res.headers.set('Vary', 'Accept-Encoding');
    res.headers.set('X-Cache-Key', cacheKey);
    return res;

  } catch (error) {
    console.error('Google Places API error:', error);
    const res = NextResponse.json(
      { error: 'Failed to fetch place suggestions' }, 
      { status: 500 }
    );
    // Make failures short-cache to shield upstream a bit
    res.headers.set('Cache-Control', 'public, max-age=5, s-maxage=5');
    return res;
  }
}
