export type FabricCategoryId = "stripes" | "checks" | "others";

export type FabricMotionPreset = {
  id: FabricCategoryId;
  label: string;
  title: string;
  subtitle: string;
  image: string;
  planeImages: string[];
  palette: {
    surface: string;
    border: string;
    glow: string;
    shadow: string;
  };
  chipSize: {
    major: [number, number];
    micro: [number, number];
  };
  rotationMax: number;
  pushBias: {
    x: number;
    y: number;
  };
  returnSpeed: number;
  stage: {
    anchor: { x: number; y: number };
    travel: { x: number; y: number };
    drift: { x: number; y: number };
    scale: [number, number];
    rotate: [number, number];
    depth: number;
  };
};

export const fabricMotionPresets: FabricMotionPreset[] = [
  {
    id: "stripes",
    label: "01",
    title: "Stripes",
    subtitle: "스트라이프",
    image: "/categories/fabrics/stripes/master.webp",
    planeImages: [
      "/categories/fabrics/stripes/plane-01.webp",
      "/categories/fabrics/stripes/plane-02.webp",
      "/categories/fabrics/stripes/plane-03.webp",
    ],
    palette: {
      surface: "#f7f5f0",
      border: "rgba(17, 24, 39, 0.14)",
      glow: "rgba(15, 23, 42, 0.08)",
      shadow: "rgba(15, 23, 42, 0.26)",
    },
    chipSize: {
      major: [62, 102],
      micro: [10, 22],
    },
    rotationMax: 6,
    pushBias: {
      x: 0.8,
      y: 0.15,
    },
    returnSpeed: 1.08,
    stage: {
      anchor: { x: 23, y: 34 },
      travel: { x: 18, y: -14 },
      drift: { x: 28, y: 18 },
      scale: [0.94, 1.08],
      rotate: [-8, 4],
      depth: 1.08,
    },
  },
  {
    id: "checks",
    label: "02",
    title: "Checks",
    subtitle: "체크",
    image: "/categories/fabrics/checks/master.webp",
    planeImages: [
      "/categories/fabrics/checks/plane-01.webp",
      "/categories/fabrics/checks/plane-02.webp",
      "/categories/fabrics/checks/plane-03.webp",
    ],
    palette: {
      surface: "#f3efe4",
      border: "rgba(87, 83, 78, 0.18)",
      glow: "rgba(117, 92, 38, 0.08)",
      shadow: "rgba(54, 41, 18, 0.24)",
    },
    chipSize: {
      major: [40, 62],
      micro: [9, 18],
    },
    rotationMax: 3,
    pushBias: {
      x: 0.32,
      y: 0.48,
    },
    returnSpeed: 0.98,
    stage: {
      anchor: { x: 51, y: 58 },
      travel: { x: -4, y: -20 },
      drift: { x: 12, y: 22 },
      scale: [0.98, 1.16],
      rotate: [-3, 3],
      depth: 1.18,
    },
  },
  {
    id: "others",
    label: "03",
    title: "Others",
    subtitle: "기타",
    image: "/categories/fabrics/others/master.webp",
    planeImages: [
      "/categories/fabrics/others/plane-01.webp",
      "/categories/fabrics/others/plane-02.webp",
      "/categories/fabrics/others/plane-03.webp",
    ],
    palette: {
      surface: "#edf0f3",
      border: "rgba(55, 65, 81, 0.14)",
      glow: "rgba(120, 140, 165, 0.08)",
      shadow: "rgba(43, 56, 77, 0.22)",
    },
    chipSize: {
      major: [32, 58],
      micro: [8, 16],
    },
    rotationMax: 10,
    pushBias: {
      x: 0.22,
      y: 0.74,
    },
    returnSpeed: 0.86,
    stage: {
      anchor: { x: 78, y: 36 },
      travel: { x: -20, y: 16 },
      drift: { x: 26, y: 20 },
      scale: [0.9, 1.06],
      rotate: [9, -6],
      depth: 0.96,
    },
  },
];
