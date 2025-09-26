import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAPTILER_BASE = 'https://api.maptiler.com';

function isStyleJson(path: string): boolean {
  return /\/style\.json$/i.test(path);
}

function isTilesJson(path: string): boolean {
  return /\/tiles\.json$/i.test(path);
}

function toProxyUrl(inputUrl: string): string {
  if (!inputUrl) return inputUrl;
  let u = inputUrl;
  // Replace absolute MapTiler origin with our proxy root
  if (u.startsWith(MAPTILER_BASE)) {
    u = u.replace(MAPTILER_BASE, '/api/tiles/maptiler');
  }
  // Convert leading MapTiler absolute-path references to proxy root
  if (/^\/(maps|tiles|fonts|glyphs|data|styles)/.test(u)) {
    u = `/api/tiles/maptiler${u}`;
  }
  // Strip API key query param if present
  u = u.replace(/([?&])key=[^&"']*/g, '$1').replace(/[?&]$/g, '');
  // Return relative URL; client transformRequest will make absolute
  return u;
}

function setCachingHeaders(headers: Headers, path: string, upstream: Response) {
  const h = new Headers(headers);
  const cc = upstream.headers.get('Cache-Control');
  const etag = upstream.headers.get('ETag');
  const lm = upstream.headers.get('Last-Modified');
  if (etag) h.set('ETag', etag.replaceAll('"', ''));
  if (lm) h.set('Last-Modified', lm);
  h.set('Vary', 'Accept-Encoding');

  const lower = path.toLowerCase();
  let browserMaxAge = 86400; // 1 day default
  let sMaxAge = 604800; // 7 days default
  if (lower.endsWith('.pbf') || lower.endsWith('.mvt')) {
    browserMaxAge = 604800; // 7 days
    sMaxAge = 2592000; // 30 days
    h.set('Accept-Ranges', 'bytes');
  } else if (/(\.png|\.jpg|\.jpeg|\.webp|\.avif|\.svg)$/i.test(lower)) {
    browserMaxAge = 604800; // 7 days
    sMaxAge = 2592000; // 30 days
  } else if (isStyleJson(lower)) {
    browserMaxAge = 86400; // 1 day
    sMaxAge = 604800; // 7 days
  } else if (isTilesJson(lower)) {
    browserMaxAge = 86400; // 1 day
    sMaxAge = 604800; // 7 days
  } else if (/\/fonts\//.test(lower) || /\/glyphs\//.test(lower) || /sprite\./.test(lower)) {
    browserMaxAge = 604800; // 7 days
    sMaxAge = 2592000; // 30 days
  }

  if (cc) {
    // Respect upstream if present but clamp to our s-maxage upper bound
    h.set('Cache-Control', cc);
  } else {
    h.set('Cache-Control', `public, max-age=${browserMaxAge}, s-maxage=${sMaxAge}`);
  }
  return h;
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const joined = Array.isArray(path) ? path.join('/') : String(path || '');
  if (!joined) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const dev = process.env.NODE_ENV !== 'production';

  try {
    const url = new URL(request.url);
    const search = new URLSearchParams(url.search);
    // Never expose the key to clients; add it only for upstream
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '';
    if (!search.has('key') && apiKey) {
      search.append('key', apiKey);
    }
    const upstreamUrl = `${MAPTILER_BASE}/${joined}${search.toString() ? `?${search.toString()}` : ''}`;

    const upstream = await fetch(upstreamUrl, {
      // We revalidate via headers + nginx cache; avoid Next built-in caching here
      cache: 'no-store',
      headers: {
        'Accept': isStyleJson(joined) || isTilesJson(joined) ? 'application/json' : '*/*',
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: upstream.status });
    }

    // Special handling for style.json and tiles.json to rewrite URLs to our proxy and strip keys
    if (isStyleJson(joined)) {
      const style = await upstream.json();
      try {
        if (typeof style.sprite === 'string') {
          style.sprite = toProxyUrl(style.sprite);
        }
        if (typeof style.glyphs === 'string') {
          style.glyphs = toProxyUrl(style.glyphs);
        }
        if (style.sources && typeof style.sources === 'object') {
          for (const k of Object.keys(style.sources)) {
            const source = style.sources[k];
            if (source && typeof source === 'object') {
              if (typeof source.url === 'string') {
                source.url = toProxyUrl(source.url);
              }
              if (Array.isArray(source.tiles)) {
                source.tiles = source.tiles.map((t: string) => toProxyUrl(t));
              }
              if (typeof source.data === 'string') {
                source.data = toProxyUrl(source.data);
              }
            }
          }
        }
      } catch {}

      const headers = setCachingHeaders(new Headers({ 'Content-Type': 'application/json' }), joined, upstream);
      if (dev) headers.set('Cache-Control', 'no-store');
      return new NextResponse(JSON.stringify(style), { status: 200, headers });
    }

    if (isTilesJson(joined)) {
      const tilesIndex = await upstream.json();
      try {
        if (Array.isArray(tilesIndex.tiles)) {
          tilesIndex.tiles = tilesIndex.tiles.map((t: string) => toProxyUrl(t));
        }
      } catch {}
      const headers = setCachingHeaders(new Headers({ 'Content-Type': 'application/json' }), joined, upstream);
      if (dev) headers.set('Cache-Control', 'no-store');
      return new NextResponse(JSON.stringify(tilesIndex), { status: 200, headers });
    }

    // Stream-through for binary/text assets
    const body = upstream.body as any;
    const stream = body?.pipe ? body : (body?.transformToWebStream ? await body.transformToWebStream() : body);
    const headers = setCachingHeaders(new Headers(), joined, upstream);
    const ct = upstream.headers.get('Content-Type');
    if (ct) headers.set('Content-Type', ct);
    if (dev) headers.set('Cache-Control', 'no-store');
    return new NextResponse(stream as any, { status: 200, headers });
  } catch (_err) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}


