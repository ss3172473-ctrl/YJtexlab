import {
  CATEGORY_META,
  CATEGORY_ORDER,
  COVERAGE_CARDS,
  HERO_MEDIA,
  type CorridorRuntimeMode,
  type FabricCategoryId,
  type FabricCoverageCard,
} from "../../shared";
import { FabricMediaFrame } from "../../shared/FabricMediaFrame";
import { ReviewLabel } from "../../shared/ReviewLabel";

function chunkCards(cards: FabricCoverageCard[], size: number) {
  const rows: FabricCoverageCard[][] = [];

  for (let index = 0; index < cards.length; index += size) {
    rows.push(cards.slice(index, index + size));
  }

  return rows;
}

function BridgeScene({ mode }: { mode: CorridorRuntimeMode }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(15,23,42,0.06),transparent_22%),radial-gradient(circle_at_18%_84%,rgba(15,23,42,0.04),transparent_24%)]" />
      <div className="fabric-corridor-ribbon absolute left-[-12%] top-[18%] h-px w-[65%] rotate-[-7deg] bg-black/12" />
      <div className="fabric-corridor-ribbon absolute right-[-14%] top-[44%] h-px w-[58%] rotate-[11deg] bg-black/10 [animation-delay:-5s]" />
      <div className="fabric-corridor-ribbon absolute left-[-10%] bottom-[20%] h-px w-[62%] rotate-[9deg] bg-black/8 [animation-delay:-9s]" />
      <div className="mx-auto grid min-h-[100svh] max-w-[1680px] items-center gap-6 px-4 py-6 md:px-8 lg:grid-cols-[1.18fr_0.82fr] lg:px-10">
        <div className="relative overflow-hidden border border-black/10 bg-white p-3 shadow-[0_48px_150px_-84px_rgba(15,23,42,0.32)] md:p-5">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(255,255,255,0)_36%,rgba(15,23,42,0.04)_100%)]" />
          <div className="relative grid gap-3">
            <div className="relative aspect-video overflow-hidden border border-black/10">
              <div
                className="absolute inset-0 bg-cover bg-center scale-[1.08]"
                style={{ backgroundImage: `url(${HERO_MEDIA.posterSrc})` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_34%,rgba(255,255,255,0.74)_100%)]" />
            </div>
            <div className="grid gap-3 md:grid-cols-[1.08fr_0.92fr]">
                <div className="relative aspect-[4/3] overflow-hidden border border-black/10 bg-[linear-gradient(180deg,#fcfcfc_0%,#ffffff_100%)]">
                <div className="fabric-corridor-ribbon absolute left-[-12%] top-[28%] h-px w-[66%] bg-black/12" />
                <div className="fabric-corridor-ribbon absolute right-[-10%] bottom-[28%] h-px w-[58%] bg-black/8 [animation-delay:-3s]" />
              </div>
              <div className="grid gap-3">
                <div className="relative aspect-[4/3] overflow-hidden border border-black/10 bg-white">
                  <div className="fabric-corridor-pulse absolute left-[12%] top-[18%] h-[56%] w-[56%] rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.08),transparent_72%)]" />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden border border-black/10 bg-white">
                  <div className="fabric-corridor-trace absolute inset-x-[12%] top-[24%] h-px bg-black/10" />
                  <div className="fabric-corridor-trace absolute inset-x-[20%] bottom-[30%] h-px bg-black/10 [animation-delay:-7s]" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between py-4">
          <ReviewLabel variantId="C" mode={mode} className="w-fit" />
          <div className="space-y-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/30">
              Runway Kinetic
            </p>
            <h2 className="max-w-[8ch] font-serif text-[clamp(3.6rem,7vw,7.4rem)] leading-[0.84] tracking-[-0.08em] text-black">
              Motion becomes framing.
            </h2>
          </div>
        </div>
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
  const rows = chunkCards(cards, 5);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-px bg-black/8" />
      <div className="mx-auto min-h-[100svh] max-w-[1680px] px-4 py-8 md:px-8 lg:px-10 lg:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="space-y-3">
            <ReviewLabel variantId="C" mode={mode} className="w-fit" />
            <h3 className="font-serif text-[clamp(2.8rem,5vw,5.4rem)] leading-[0.88] tracking-[-0.08em] text-black">
              {CATEGORY_META[categoryId].title}
            </h3>
          </div>
          <span className="hidden font-sans text-[10px] uppercase tracking-[0.42em] text-black/28 md:block">
            {CATEGORY_META[categoryId].eyebrow}
          </span>
        </div>
        <div className="relative overflow-hidden border border-black/10 bg-white p-4 md:p-6">
          <div className="absolute inset-y-0 left-[6%] w-px bg-black/8" />
          <div className="absolute inset-y-0 right-[6%] w-px bg-black/8" />
          <div className="space-y-5 [perspective:1800px]">
            {rows.map((row, rowIndex) => (
              <div
                key={`${categoryId}-${rowIndex}`}
                className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4"
                style={{
                  transform: `translate3d(${rowIndex % 2 === 0 ? 12 : -12}px, 0, 0) rotate(${rowIndex % 2 === 0 ? -1 : 1}deg)`,
                }}
              >
                {row.map((card) => (
                  <FabricMediaFrame
                    key={card.manifestKey}
                    card={card}
                    variantId="C"
                    categoryId={categoryId}
                    mode={mode}
                    sizes="(min-width: 1600px) 14vw, (min-width: 1280px) 15vw, (min-width: 768px) 18vw, 44vw"
                    className="shadow-[0_24px_54px_-40px_rgba(15,23,42,0.24)]"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function VariantCShell({
  mode = "review",
}: {
  mode?: CorridorRuntimeMode;
}) {
  return (
    <section
      data-variant-id="C"
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

export default VariantCShell;
