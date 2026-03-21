import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);

  console.log(
    "[video-debug]",
    JSON.stringify({
      event: searchParams.get("event"),
      paused: searchParams.get("paused"),
      readyState: searchParams.get("readyState"),
      networkState: searchParams.get("networkState"),
      currentTime: searchParams.get("currentTime"),
      src: searchParams.get("src"),
    })
  );

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
