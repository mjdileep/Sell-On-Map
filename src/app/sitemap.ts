import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  // TODO: Expand with categories, locations, and latest public listings
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/me/listings`, changeFrequency: "weekly", priority: 0.5 },
  ];
}


