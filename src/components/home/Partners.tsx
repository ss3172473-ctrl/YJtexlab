"use client";

import Image from "next/image";
import styles from "./Partners.module.css";

type TrustedLogo = {
  id: string;
  label: string;
  assetPath?: string;
  alt: string;
  sourceUrl: string;
};

const trustedLogos: TrustedLogo[] = [
  {
    id: "samsung-ct",
    label: "Samsung C&T",
    assetPath: "/trusted-logos/samsung-ct.svg",
    alt: "Samsung C&T wordmark",
    sourceUrl: "https://www.samsungcnt.com/assets/img/common/logo.svg",
  },
  {
    id: "beanpole",
    label: "Beanpole",
    assetPath: "/trusted-logos/beanpole.svg",
    alt: "Beanpole wordmark",
    sourceUrl: "https://www.beanpole.com/index.bp",
  },
  {
    id: "lf",
    label: "LF",
    assetPath: "/trusted-logos/lf-override.svg",
    alt: "LF wordmark",
    sourceUrl: "https://namu.wiki/w/LF%28%EA%B8%B0%EC%97%85%29",
  },
  {
    id: "e-land",
    label: "E-Land",
    assetPath: "/trusted-logos/e-land-override.jpg",
    alt: "E-Land wordmark",
    sourceUrl: "https://d15jkvm9y6e1os.cloudfront.net/images/web/logo_02.jpg",
  },
  {
    id: "parkland",
    label: "Parkland",
    assetPath: "/trusted-logos/parkland-homepage.png",
    alt: "Parkland wordmark",
    sourceUrl: "http://www.parkland.co.kr/",
  },
  {
    id: "agabang",
    label: "Agabang",
    assetPath: "/trusted-logos/agabang-override.jpg",
    alt: "Agabang wordmark",
    sourceUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFmXtu2oY7QmMtvC8uoBt2fj_mMyz5rmk4Ag&s",
  },
  {
    id: "happyland",
    label: "Happyland",
    assetPath: "/trusted-logos/happyland.png",
    alt: "Happyland wordmark",
    sourceUrl:
      "https://cdn-saas-web-81-194.cdn-nhncommerce.com/happylandmal92_godomall_com/data/skin/front/dbook_20251219/_dbook/img/top_brand_logo2.png",
  },
  {
    id: "renoma",
    label: "Renoma Shirts",
    assetPath: "/trusted-logos/renoma.png",
    alt: "Renoma Shirts wordmark",
    sourceUrl: "https://cdn.imweb.me/thumbnail/20251128/04dfe966eae85.png",
  },
  {
    id: "yejak",
    label: "Yejak",
    assetPath: "/trusted-logos/yejak.svg",
    alt: "Yejak wordmark",
    sourceUrl:
      "https://hjinc7879.cdn-nhncommerce.com/data/skin/front/hjinc_pc_2502/img/custom/header/logo_black_y_s.svg",
  },
  {
    id: "topten",
    label: "Topten",
    assetPath: "/trusted-logos/topten-fallback.png",
    alt: "Topten wordmark",
    sourceUrl:
      "https://blog.kakaocdn.net/dna/lt8Mr/btqw553U9IP/AAAAAAAAAAAAAAAAAAAAAHm3wFLfvJMujURbq9qx_tguLASJkprVFNd93N3gJ1Yf/img.jpg?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1777561199&allow_ip=&allow_referer=&signature=jsJvrk0q5sdLAMmKhKZy7JM18aQ%3D",
  },
];

function LogoMark({ logo }: { logo: TrustedLogo }) {
  if (!logo.assetPath) {
    return <span className={styles.fallbackWordmark}>{logo.label}</span>;
  }

  return (
    <Image
      alt={logo.alt}
      className={styles.logoImage}
      height={120}
      loading="lazy"
      sizes="(max-width: 639px) 44vw, (max-width: 959px) 28vw, 14vw"
      src={logo.assetPath}
      unoptimized
      width={320}
    />
  );
}

export default function Partners() {
  return (
    <section className={styles.shell} data-home-section="partners">
      <div className={styles.logoGrid}>
        {trustedLogos.map((logo) => (
          <article className={styles.logoTile} key={logo.id}>
            <div aria-label={logo.label} className={styles.logoFrame} title={logo.label}>
              <LogoMark logo={logo} />
            </div>
          </article>
        ))}
      </div>
      <div aria-hidden="true" className={styles.moreDots}>
        <span />
        <span />
        <span />
      </div>
      <p className={styles.moreNote}>among others</p>
      <p className={styles.caption}>Supplied to these brands through textile converter partners.</p>
    </section>
  );
}
