import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

type Study = {
  slug:
    | "hero-shear"
    | "triptych-rise"
    | "fan-stack"
    | "loom-grid"
    | "ribbon-passage"
    | "shutter-window"
    | "swatch-beacon"
    | "dual-pillars"
    | "cascade-notes"
    | "panorama-rail";
  title: string;
  note: string;
  images: string[];
};

type FabricImageProps = {
  src: string;
  alt: string;
  className: string;
  sizes?: string;
  priority?: boolean;
  objectPosition?: string;
};

export const metadata: Metadata = {
  title: "Local Preview | Loading Image Studies",
  robots: {
    index: false,
    follow: false,
  },
};

const studies: Study[] = [
  {
    slug: "hero-shear",
    title: "01. Hero Shear",
    note: "단일 원단 히어로를 세로 슬릿과 함께 절제되게 노출하는 방향.",
    images: ["/homepage-fabrics/slow-field-first-frame/desktop/ck_d-ck_d03.webp"],
  },
  {
    slug: "triptych-rise",
    title: "02. Triptych Rise",
    note: "세 장의 세로 스택이 서로 다른 속도로 올라오는 갤러리형 로더.",
    images: [
      "/homepage-fabrics/slow-field-first-frame/desktop/ck_o-ck_o03.webp",
      "/homepage-fabrics/slow-field-first-frame/desktop/st_n-st_n06.webp",
      "/homepage-fabrics/slow-field-first-frame/desktop/ck_af-ck_af03.webp",
    ],
  },
  {
    slug: "fan-stack",
    title: "03. Fan Stack",
    note: "겹쳐진 fabric card가 부채처럼 벌어지는 패션 아카이브형 방향.",
    images: [
      "/homepage-fabrics/slow-field-first-frame/desktop/st_g-st_g05.webp",
      "/homepage-fabrics/slow-field-first-frame/desktop/ck_ac-ck_ac03.webp",
      "/homepage-fabrics/slow-field-first-frame/desktop/st_b-st_b04.webp",
    ],
  },
  {
    slug: "loom-grid",
    title: "04. Loom Grid",
    note: "4면 그리드와 미세한 라인 스캔으로 직조감이 느껴지는 방향.",
    images: [
      "/new-stage-fabrics/checks/26-ck_d04.webp",
      "/new-stage-fabrics/checks/37-ck_o04.webp",
      "/new-stage-fabrics/stripes/28-st_n08.webp",
      "/new-stage-fabrics/checks/11-ck_af03.webp",
    ],
  },
  {
    slug: "ribbon-passage",
    title: "05. Ribbon Passage",
    note: "가로 리본이 지나가며 fabric strip를 순차 노출하는 방향.",
    images: [
      "/new-stage-fabrics/stripes/17-st_g06.webp",
      "/new-stage-fabrics/checks/07-ck_ac04.webp",
      "/new-stage-fabrics/stripes/09-st_b05.webp",
    ],
  },
  {
    slug: "shutter-window",
    title: "06. Shutter Window",
    note: "한 장의 원단을 여러 셔터로 분할해 느리게 열어주는 방향.",
    images: ["/homepage-fabrics/slow-field-first-frame/desktop/ck_t-ck_t05.webp"],
  },
  {
    slug: "swatch-beacon",
    title: "07. Swatch Beacon",
    note: "중앙 스와치와 주변 미니 swatch가 동시에 맥박치는 방향.",
    images: [
      "/new-stage-fabrics/checks/16-ck_ai03.webp",
      "/new-stage-fabrics/checks/44-ck_s04.webp",
      "/new-stage-fabrics/others/03-etc_b03.webp",
      "/homepage-fabrics/slow-field-first-frame/desktop/ck_am-ck_am01.webp",
    ],
  },
  {
    slug: "dual-pillars",
    title: "08. Dual Pillars",
    note: "좌우 두 개의 tall fabric pillar가 서로 교차 드리프트하는 방향.",
    images: [
      "/homepage-fabrics/slow-field-first-frame/desktop/ck_ai-ck_ai02.webp",
      "/homepage-fabrics/slow-field-first-frame/desktop/ck_s-ck_s03.webp",
    ],
  },
  {
    slug: "cascade-notes",
    title: "09. Cascade Notes",
    note: "캡션 카드와 fabric tile이 계단식으로 떨어지는 에디토리얼 방향.",
    images: [
      "/homepage-fabrics/slow-field-first-frame/desktop/st_a-st_a04.webp",
      "/homepage-fabrics/slow-field-first-frame/desktop/etc_b-etc_b02.webp",
      "/homepage-fabrics/slow-field-first-frame/desktop/ck_am-ck_am01.webp",
    ],
  },
  {
    slug: "panorama-rail",
    title: "10. Panorama Rail",
    note: "긴 파노라마 rail 안에서 fabric portrait가 이어지는 쇼케이스형 방향.",
    images: [
      "/new-stage-fabrics/checks/25-ck_d03.webp",
      "/new-stage-fabrics/stripes/26-st_n06.webp",
      "/new-stage-fabrics/checks/18-ck_am01.webp",
      "/new-stage-fabrics/others/02-etc_b02.webp",
    ],
  },
];

function FabricImage({
  src,
  alt,
  className,
  sizes = "(max-width: 900px) 100vw, 33vw",
  priority = false,
  objectPosition = "center",
}: FabricImageProps) {
  return (
    <div className={className}>
      <Image
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
        style={{ objectFit: "cover", objectPosition }}
      />
    </div>
  );
}

function StudyCanvas({ study, index }: { study: Study; index: number }) {
  switch (study.slug) {
    case "hero-shear":
      return (
        <div className={`${styles.canvas} ${styles.heroShear}`}>
          <FabricImage alt={study.title} className={styles.heroShearImage} priority={index < 2} src={study.images[0]} />
          <div className={styles.heroShearBeam} />
          <div className={styles.heroShearLabel}>Preparing fabric field</div>
        </div>
      );
    case "triptych-rise":
      return (
        <div className={`${styles.canvas} ${styles.triptychRise}`}>
          {study.images.map((src, imageIndex) => (
            <FabricImage
              alt={`${study.title} ${imageIndex + 1}`}
              className={styles[`triptychPanel${imageIndex + 1}` as keyof typeof styles] as string}
              key={src}
              priority={index === 0}
              src={src}
            />
          ))}
        </div>
      );
    case "fan-stack":
      return (
        <div className={`${styles.canvas} ${styles.fanStack}`}>
          {study.images.map((src, imageIndex) => (
            <FabricImage
              alt={`${study.title} ${imageIndex + 1}`}
              className={styles[`fanCard${imageIndex + 1}` as keyof typeof styles] as string}
              key={src}
              src={src}
            />
          ))}
        </div>
      );
    case "loom-grid":
      return (
        <div className={`${styles.canvas} ${styles.loomGrid}`}>
          {study.images.map((src, imageIndex) => (
            <FabricImage
              alt={`${study.title} ${imageIndex + 1}`}
              className={styles[`gridCell${imageIndex + 1}` as keyof typeof styles] as string}
              key={src}
              src={src}
            />
          ))}
          <div className={styles.loomScan} />
        </div>
      );
    case "ribbon-passage":
      return (
        <div className={`${styles.canvas} ${styles.ribbonPassage}`}>
          {study.images.map((src, imageIndex) => (
            <FabricImage
              alt={`${study.title} ${imageIndex + 1}`}
              className={styles[`ribbonStrip${imageIndex + 1}` as keyof typeof styles] as string}
              key={src}
              objectPosition={imageIndex === 1 ? "center top" : "center"}
              src={src}
            />
          ))}
          <div className={styles.ribbonGuide} />
        </div>
      );
    case "shutter-window":
      return (
        <div className={`${styles.canvas} ${styles.shutterWindow}`}>
          <FabricImage alt={study.title} className={styles.shutterImage} src={study.images[0]} />
          <div className={styles.shutterMaskTop} />
          <div className={styles.shutterMaskMiddle} />
          <div className={styles.shutterMaskBottom} />
        </div>
      );
    case "swatch-beacon":
      return (
        <div className={`${styles.canvas} ${styles.swatchBeacon}`}>
          <FabricImage alt={study.title} className={styles.beaconCore} src={study.images[0]} />
          <FabricImage alt={`${study.title} mini 1`} className={styles.beaconMini1} src={study.images[1]} />
          <FabricImage alt={`${study.title} mini 2`} className={styles.beaconMini2} src={study.images[2]} />
          <FabricImage alt={`${study.title} mini 3`} className={styles.beaconMini3} src={study.images[3]} />
        </div>
      );
    case "dual-pillars":
      return (
        <div className={`${styles.canvas} ${styles.dualPillars}`}>
          <FabricImage alt={`${study.title} left`} className={styles.pillarLeft} src={study.images[0]} />
          <FabricImage alt={`${study.title} right`} className={styles.pillarRight} src={study.images[1]} />
          <div className={styles.pillarBaseline} />
        </div>
      );
    case "cascade-notes":
      return (
        <div className={`${styles.canvas} ${styles.cascadeNotes}`}>
          {study.images.map((src, imageIndex) => (
            <FabricImage
              alt={`${study.title} ${imageIndex + 1}`}
              className={styles[`cascadeTile${imageIndex + 1}` as keyof typeof styles] as string}
              key={src}
              src={src}
            />
          ))}
          <div className={styles.cascadeNoteCard}>
            <span>YJ TEXLAB</span>
            <span>Loading frame study</span>
          </div>
        </div>
      );
    case "panorama-rail":
      return (
        <div className={`${styles.canvas} ${styles.panoramaRail}`}>
          {study.images.map((src, imageIndex) => (
            <FabricImage
              alt={`${study.title} ${imageIndex + 1}`}
              className={styles[`railPanel${imageIndex + 1}` as keyof typeof styles] as string}
              key={src}
              src={src}
            />
          ))}
          <div className={styles.railTrack} />
        </div>
      );
  }
}

export default function LoadingStudiesPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Local Preview</p>
        <h1 className={styles.title}>Categories Loader Image Studies</h1>
        <p className={styles.summary}>
          `Categories`의 portrait crop, white-space, editorial rhythm을 유지하면서 로더용으로 압축한 10개 시안입니다.
          각 카드 안의 fabric 사진은 로컬 원단 자산만 사용합니다.
        </p>
        <div className={styles.heroMeta}>
          <span>10 concepts</span>
          <span>fabric-sourced</span>
          <Link href="/">Return Home</Link>
        </div>
      </section>

      <section className={styles.grid}>
        {studies.map((study, index) => (
          <article className={styles.card} key={study.slug}>
            <StudyCanvas index={index} study={study} />
            <div className={styles.cardBody}>
              <h2>{study.title}</h2>
              <p>{study.note}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
