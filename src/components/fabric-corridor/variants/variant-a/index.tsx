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

function columnOffset(index: number) {
  const rhythm = [0, 16, 30, 16, 0];
  return rhythm[index % rhythm.length];
}

function BridgeScene({ mode }: { mode: CorridorRuntimeMode }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(15,23,42,0.06),transparent_24%),radial-gradient(circle_at_82%_84%,rgba(15,23,42,0.05),transparent_28%)]" />
      <div className="mx-auto grid min-h-[100svh] max-w-[1680px] items-center gap-6 px-4 py-6 md:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:px-10">
        <div className="relative z-10 flex h-full flex-col justify-between py-4">
          <ReviewLabel variantId="A" mode={mode} className="w-fit" />
          <div className="space-y-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/30">
              Minimal Luxury
            </p>
            <h2 className="max-w-[7ch] font-serif text-[clamp(3.5rem,8vw,8rem)] leading-[0.84] tracking-[-0.08em] text-black">
              Fade into fabric.
            </h2>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-[-8%] border border-black/8" />
          <div className="relative overflow-hidden border border-black/10 bg-white p-3 shadow-[0_42px_140px_-80px_rgba(15,23,42,0.28)] md:p-5">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(255,255,255,0)_26%,rgba(15,23,42,0.03)_100%)]" />
            <div className="grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
              <div className="relative aspect-video overflow-hidden border border-black/10">
                <div
                  className="absolute inset-0 bg-cover bg-center scale-[1.04]"
                  style={{ backgroundImage: `url(${HERO_MEDIA.posterSrc})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.22)_44%,rgba(255,255,255,0.86)_100%)]" />
                <div className="fabric-corridor-bridge-float absolute inset-x-[10%] top-[18%] h-px bg-black/12" />
                <div className="fabric-corridor-bridge-float absolute inset-x-[16%] top-[28%] h-px bg-black/8 [animation-delay:-4s]" />
                <div className="fabric-corridor-bridge-sheen absolute inset-y-[8%] right-[12%] w-[24%] bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.72),rgba(255,255,255,0))]" />
              </div>
              <div className="grid gap-3">
                <div className="relative aspect-[4/3] overflow-hidden border border-black/10 bg-white">
                  <div className="absolute inset-[16%] border border-black/10" />
                  <div className="absolute left-[18%] right-[18%] top-[28%] h-px bg-black/10" />
                  <div className="absolute left-[18%] right-[18%] bottom-[28%] h-px bg-black/10" />
                </div>
                <div className="relative aspect-[4/3] overflow-hidden border border-black/10 bg-[linear-gradient(180deg,#fcfcfc_0%,#ffffff_100%)]">
                  <div className="fabric-corridor-pulse absolute left-[16%] top-[18%] h-[48%] w-[48%] rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.08),transparent_72%)]" />
                  <div className="fabric-corridor-pulse absolute bottom-[8%] right-[10%] h-[42%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.05),transparent_72%)] [animation-delay:-7s]" />
                </div>
              </div>
            </div>
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

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-px bg-black/8" />
      <div className="mx-auto grid min-h-[100svh] max-w-[1680px] gap-8 px-4 py-8 md:px-8 lg:grid-cols-[0.34fr_1fr] lg:px-10 lg:py-10">
        <div className="flex flex-col justify-between gap-8 lg:sticky lg:top-10 lg:h-[calc(100svh-5rem)]">
          <div className="space-y-4">
            <ReviewLabel variantId="A" mode={mode} className="w-fit" />
            <p className="font-sans text-[10px] uppercase tracking-[0.42em] text-black/28">
              {CATEGORY_META[categoryId].eyebrow}
            </p>
            <h3 className="font-serif text-[clamp(3rem,7vw,7rem)] leading-[0.85] tracking-[-0.08em] text-black">
              {CATEGORY_META[categoryId].title}
            </h3>
          </div>
          <div className="hidden h-[26rem] border-l border-black/8 lg:block" />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 md:gap-x-4 md:gap-y-5 xl:grid-cols-5">
          {cards.map((card, index) => (
            <div
              key={card.manifestKey}
              style={{ transform: `translate3d(0, ${columnOffset(index)}px, 0)` }}
            >
              <FabricMediaFrame
                card={card}
                variantId="A"
                categoryId={categoryId}
                mode={mode}
                sizes="(min-width: 1600px) 15vw, (min-width: 1280px) 16vw, (min-width: 768px) 20vw, 44vw"
                className="shadow-[0_22px_52px_-38px_rgba(15,23,42,0.2)]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VariantAShell({
  mode = "review",
}: {
  mode?: CorridorRuntimeMode;
}) {
  return (
    <section
      data-variant-id="A"
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

export default VariantAShell;
