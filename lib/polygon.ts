const BASE_URL = 'https://api.polygon.io';

export async function polygonFetch(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error('Missing POLYGON_API_KEY');
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    // Next.js edge runtime fetch will cache automatically; override as needed
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Polygon error: ${res.status}`);
  }
  return res.json();
}
