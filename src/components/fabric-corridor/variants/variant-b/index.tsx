import {
  CATEGORY_META,
  CATEGORY_ORDER,
  COVERAGE_CARDS,
  HERO_MEDIA,
  type CorridorRuntimeMode,
  type FabricCategoryId,
} from "../../shared";
import { FabricMediaFrame } from "../../shared/FabricMediaFrame";
import { ReviewLabel } from "../../shared/ReviewLabel";

function BridgeScene({ mode }: { mode: CorridorRuntimeMode }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(180deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
      <div className="mx-auto grid min-h-[100svh] max-w-[1680px] gap-4 px-4 py-6 md:px-8 lg:grid-cols-[0.28fr_1fr_0.28fr] lg:px-10">
        <aside className="relative flex flex-col justify-between overflow-hidden border border-black/10 bg-white p-4">
          <ReviewLabel variantId="B" mode={mode} className="w-fit" />
          <p className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/28">
            Gallery Archive
          </p>
          <p className="font-serif text-[clamp(2.8rem,5vw,4.8rem)] leading-[0.86] tracking-[-0.08em] text-black">
            Contact sheet.
          </p>
        </aside>
        <div className="relative overflow-hidden border border-black/10 bg-white p-4 shadow-[0_30px_96px_-60px_rgba(15,23,42,0.22)] md:p-5">
          <div className="absolute inset-y-0 left-[8%] w-px bg-black/10" />
          <div className="absolute inset-y-0 right-[8%] w-px bg-black/10" />
          <div className="absolute inset-x-0 top-[16%] h-px bg-black/10" />
          <div className="absolute inset-x-0 bottom-[16%] h-px bg-black/10" />
          <div className="relative grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
            <div className="relative aspect-video overflow-hidden border border-black/10">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${HERO_MEDIA.posterSrc})` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.78)_100%)]" />
            </div>
            <div className="grid gap-3">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] overflow-hidden border border-black/10 bg-white"
                >
                  <div className="absolute inset-x-[12%] top-[18%] h-px bg-black/10" />
                  <div className="absolute inset-x-[12%] bottom-[18%] h-px bg-black/10" />
                  <div className="absolute inset-y-[18%] left-[18%] w-px bg-black/10" />
                  <div className="absolute inset-y-[18%] right-[18%] w-px bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="relative flex flex-col justify-between overflow-hidden border border-black/10 bg-white p-4">
          <span className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/26">
            filing room
          </span>
          <span className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/26">
            frame continuity
          </span>
        </aside>
      </div>
    </section>
  );
}

function CategoryScene({
  mode,
  categoryId,
}: {
  mode: CorridorRuntimeMode;
  categoryId: FabricCategoryId;
}) {
  const cards = COVERAGE_CARDS[categoryId];

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-px bg-black/10" />
      <div className="mx-auto min-h-[100svh] max-w-[1680px] px-4 py-8 md:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[0.24fr_1fr]">
          <div className="flex flex-col gap-5 lg:sticky lg:top-10 lg:self-start">
            <ReviewLabel variantId="B" mode={mode} className="w-fit" />
            <span className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/30">
              {CATEGORY_META[categoryId].eyebrow}
            </span>
            <h3 className="font-serif text-[clamp(2.6rem,4.6vw,4.8rem)] leading-[0.9] tracking-[-0.08em] text-black">
              {CATEGORY_META[categoryId].title}
            </h3>
          </div>
          <div className="relative overflow-hidden border border-black/10 bg-white p-4 md:p-5">
            <div className="absolute inset-y-0 left-[5%] w-px bg-black/8" />
            <div className="absolute inset-y-0 right-[5%] w-px bg-black/8" />
            <div className="relative mb-4 flex items-center justify-between border-b border-black/10 pb-3">
              <span className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/28">
                {CATEGORY_META[categoryId].title}
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/28">
                {String(cards.length).padStart(2, "0")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
              {cards.map((card) => (
                <FabricMediaFrame
                  key={card.manifestKey}
                  card={card}
                  variantId="B"
                  categoryId={categoryId}
                  mode={mode}
                  sizes="(min-width: 1600px) 14vw, (min-width: 1280px) 15vw, (min-width: 768px) 20vw, 44vw"
                  className="shadow-[0_18px_38px_-32px_rgba(15,23,42,0.16)]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VariantBShell({
  mode = "review",
}: {
  mode?: CorridorRuntimeMode;
}) {
  return (
    <section
      data-variant-id="B"
      data-corridor-mode={mode}
      data-variant-shell="true"
      className="bg-white"
    >
      <BridgeScene mode={mode} />
      {CATEGORY_ORDER.map((categoryId) => (
        <CategoryScene key={categoryId} mode={mode} categoryId={categoryId} />
      ))}
    </section>
  );
}

export default VariantBShell;
