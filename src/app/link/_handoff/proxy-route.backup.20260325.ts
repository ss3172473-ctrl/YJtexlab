import { NextResponse } from "next/server";

const UPSTREAM_URL = "https://yjtexlab-fabric-profile-landing.vercel.app/";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await fetch(UPSTREAM_URL, {
    cache: "no-store",
    headers: {
      "user-agent": "yjtexlab-link-proxy/1.0",
    },
  });

  const html = await response.text();

  return new NextResponse(html, {
    status: response.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
