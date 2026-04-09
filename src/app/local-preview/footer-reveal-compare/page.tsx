import type { Metadata } from "next";

import HomeFolderHub, { type FolderVariant } from "@/components/home/HomeFolderHub";
import Header from "@/components/site/Header";

type PageSearchParams = Record<string, string | string[] | undefined>;
type PickKey = "a" | "b" | "c";

function resolveFolderVariant(value: string | string[] | undefined): FolderVariant {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === "open-center" || candidate === "inline") {
    return candidate;
  }

  return "open-bottom";
}

function resolvePick(value: string | string[] | undefined): PickKey {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === "b" || candidate === "c") {
    return candidate;
  }

  return "a";
}

export const metadata: Metadata = {
  title: "Local Preview | Footer Reveal Compare",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function FooterRevealComparePage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const folderVariant = resolveFolderVariant(resolvedSearchParams.folder);
  const initialPick = resolvePick(resolvedSearchParams.pick);
  const verifyMode =
    resolvedSearchParams.verify === "1" ||
    resolvedSearchParams.freeze === "1";

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-[calc(env(safe-area-inset-top)+5rem)] md:pt-[calc(env(safe-area-inset-top)+7rem)]">
        <section className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 py-6 md:px-6">
          <div className="border border-black/10 bg-stone-50 px-4 py-4 md:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-black/45">
              Local preview
            </p>
            <h1 className="mt-3 max-w-[18ch] text-3xl font-medium tracking-[-0.05em] text-black md:text-5xl">
              Footer reveal preview fallback
            </h1>
            <p className="mt-4 max-w-[62ch] text-sm leading-7 text-black/68 md:text-base">
              The dedicated comparison module is currently unavailable, so this route now
              renders the active folder hub as a stable fallback preview. Current pick:
              {" "}
              <span className="font-medium text-black">{initialPick.toUpperCase()}</span>
              . Variant:
              {" "}
              <span className="font-medium text-black">{folderVariant}</span>
              .
            </p>
          </div>

          <HomeFolderHub folderVariant={folderVariant} verifyMode={verifyMode} />
        </section>
      </main>
    </div>
  );
}
