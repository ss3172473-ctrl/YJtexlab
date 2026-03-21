import manifest from "../../../public/stage-fabrics/manifest.json";

export type StageCategoryId = "checks" | "stripes" | "others";
export type StageSceneId = "handoff" | StageCategoryId;
export type StageVariantId = "A" | "B" | "C";

export type StageFabricItem = {
  src: string;
  name: string;
  category: StageCategoryId;
};

export type StageCategoryMeta = {
  id: StageCategoryId;
  label: string;
  title: string;
  sceneTitle: string;
  summary: string;
};

export type StageHandoffCard = {
  src: string;
  alt: string;
  caption: string;
  note: string;
};

export type StageVariant = {
  id: StageVariantId;
  label: string;
  mood: string;
  title: string;
  intro: string;
  bridge: string;
  accent: string;
  handoffCards: StageHandoffCard[];
};

const rawManifest = manifest as Record<StageCategoryId, StageFabricItem[]>;

function normalizeCategory(category: StageCategoryId) {
  return (rawManifest[category] ?? []).map((item) => ({
    ...item,
    category,
  }));
}

export const stageCatalog: Record<StageCategoryId, StageFabricItem[]> = {
  checks: normalizeCategory("checks"),
  stripes: normalizeCategory("stripes"),
  others: normalizeCategory("others"),
};

export const stageSceneOrder: StageSceneId[] = ["handoff", "checks", "stripes", "others"];

export const stageCategories: Record<StageCategoryId, StageCategoryMeta> = {
  checks: {
    id: "checks",
    label: "Scene 02",
    title: "Checks",
    sceneTitle: "Checks comparison wall",
    summary:
      "Every checks fabric from the manifest appears once, arranged as a measured field of uniform 4:3 cards.",
  },
  stripes: {
    id: "stripes",
    label: "Scene 03",
    title: "Stripes",
    sceneTitle: "Stripes comparison wall",
    summary:
      "The stripe program follows with the same exact cadence on desktop and mobile, preserving sequence and full image fidelity.",
  },
  others: {
    id: "others",
    label: "Scene 04",
    title: "Others",
    sceneTitle: "Others comparison wall",
    summary:
      "Oxford and dobby fabrics close each variant in a clean white archive, with every item shown once and only once.",
  },
};

export const stageVariants: StageVariant[] = [
  {
    id: "A",
    label: "Variant A",
    mood: "Minimal Luxury",
    title: "Quiet precision with generous white space",
    intro:
      "A restrained corridor that turns the hero handoff into a premium comparison sequence with sharp typography, open margins, and calm product framing.",
    bridge:
      "The video handoff dissolves into a white editorial rail before the fabric families arrive one by one: checks, stripes, then others.",
    accent: "#151515",
    handoffCards: [
      {
        src: "/hero/homepage-loop-original-poster.jpg",
        alt: "Homepage hero poster",
        caption: "Hero handoff",
        note: "Poster frame bridging the video to the corridor.",
      },
      {
        src: "/hero/fabric-check-beige-olive.webp",
        alt: "Checks handoff detail",
        caption: "Checks arrive first",
        note: "Structured pattern preview for Scene 02.",
      },
      {
        src: "/hero/fabric-stripe-charcoal-blue.webp",
        alt: "Stripes handoff detail",
        caption: "Stripes follow",
        note: "Directional texture preview for Scene 03.",
      },
      {
        src: "/hero/fabric-dobby-grey-ivory.webp",
        alt: "Others handoff detail",
        caption: "Others close",
        note: "Oxford and dobby preview for Scene 04.",
      },
    ],
  },
  {
    id: "B",
    label: "Variant B",
    mood: "Gallery Archive",
    title: "Museum-style sequencing for fabric comparison",
    intro:
      "This variation reframes the corridor like a curated archive wall, using restrained labels and evenly paced rows to emphasize comparison over spectacle.",
    bridge:
      "The hero resolves into a catalog table of contents, then steps through checks, stripes, and others in the same order on every breakpoint.",
    accent: "#5c4633",
    handoffCards: [
      {
        src: "/hero/homepage-loop-original-poster.jpg",
        alt: "Homepage hero poster archive view",
        caption: "Archive opener",
        note: "A framed handoff from moving image to still comparison.",
      },
      {
        src: "/hero/fabric-check-beige-olive.webp",
        alt: "Checks archive detail",
        caption: "Checks index",
        note: "Editorial preview card for the second scene.",
      },
      {
        src: "/hero/fabric-stripe-charcoal-blue.webp",
        alt: "Stripes archive detail",
        caption: "Stripes index",
        note: "A catalog plate introducing the third scene.",
      },
      {
        src: "/hero/fabric-oxford-blue.webp",
        alt: "Others archive detail",
        caption: "Others index",
        note: "Oxford-led preview for the closing scene.",
      },
    ],
  },
  {
    id: "C",
    label: "Variant C",
    mood: "Runway Kinetic",
    title: "Forward motion without sacrificing comparison clarity",
    intro:
      "The final option adds controlled motion cues through layout rhythm and card offsets while keeping every photo clean, white-backed, and fully opaque.",
    bridge:
      "A runway-like opener hands the user from the top film into checks, then stripes, then others with stronger directional energy and visible labels.",
    accent: "#1f4f8c",
    handoffCards: [
      {
        src: "/hero/homepage-loop-original-poster.jpg",
        alt: "Homepage hero poster runway view",
        caption: "Runway opener",
        note: "The hero frame becomes the first comparison beat.",
      },
      {
        src: "/hero/fabric-check-beige-olive.webp",
        alt: "Checks runway detail",
        caption: "Checks beat",
        note: "Scene 02 enters with a stronger directional cue.",
      },
      {
        src: "/hero/fabric-stripe-charcoal-blue.webp",
        alt: "Stripes runway detail",
        caption: "Stripes beat",
        note: "Scene 03 keeps the sequence intact.",
      },
      {
        src: "/hero/fabric-dobby-grey-ivory.webp",
        alt: "Others runway detail",
        caption: "Others beat",
        note: "Scene 04 lands with the final product family.",
      },
    ],
  },
];
