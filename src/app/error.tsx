"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Unexpected Error</p>
      <h2 className="text-2xl font-semibold text-black">Something went wrong.</h2>
      <button
        type="button"
        onClick={reset}
        className="border border-black px-4 py-2 text-sm uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-70"
      >
        Try again
      </button>
    </div>
  );
}
