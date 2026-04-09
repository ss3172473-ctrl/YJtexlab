"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center text-black">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Global Error</p>
          <h1 className="text-2xl font-semibold">Something went wrong.</h1>
          <button
            type="button"
            onClick={reset}
            className="border border-black px-4 py-2 text-sm uppercase tracking-[0.18em] transition-opacity hover:opacity-70"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
