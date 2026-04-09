import type { MetadataRoute } from "next";
import { routeMatrix } from "@/lib/route-matrix";
import { absoluteUrl } from "@/lib/seo";

const LAST_MODIFIED = new Date("2026-03-26T00:00:00+09:00");
const EXCLUDED_SITEMAP_ROUTES = new Set(["/privacy", "/terms", "/link"]);

const changeFrequencyMap: Record<string, MetadataRoute.Sitemap[number]["changeFrequency"]> = {
  "/": "weekly",
  "/products": "weekly",
  "/about": "monthly",
  "/contact": "monthly",
  "/milestones": "monthly",
  "/privacy": "yearly",
  "/terms": "yearly",
};

const priorityMap: Record<string, number> = {
  "/": 1,
  "/products": 0.9,
  "/about": 0.7,
  "/contact": 0.7,
  "/milestones": 0.6,
  "/privacy": 0.2,
  "/terms": 0.2,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return routeMatrix
    .filter((entry) => entry.phase === "baseline" && entry.expectedStatus === 200)
    .filter((entry) => !EXCLUDED_SITEMAP_ROUTES.has(entry.href))
    .map((entry) => ({
      url: absoluteUrl(entry.href),
      lastModified: LAST_MODIFIED,
      changeFrequency: changeFrequencyMap[entry.href] ?? "monthly",
      priority: priorityMap[entry.href] ?? 0.5,
    }))
    .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.url === entry.url) === index);
}
