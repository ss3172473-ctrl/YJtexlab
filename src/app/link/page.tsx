import Image from "next/image";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

type PromoItem = {
  title: string;
  href: string;
  expiresAt: string;
};

type LinkCard = {
  label: string;
  title: string;
  description?: string;
  href: string;
  iconSrc: string;
  iconAlt: string;
  iconVariant?: "default" | "kakao";
};

const NAVER_PLACE_URL =
  "https://m.place.naver.com/place/2096794271/home?entry=pll&bk_query=%EB%8F%99%EB%8C%80%EB%AC%B8%20%EC%9B%90%EB%8B%A8";

const PROMO_ITEMS: PromoItem[] = [
  {
    title: "3차 온라인 판매 🎉",
    href: "https://tally.so/r/Gx07yk",
    expiresAt: "2026-03-24T01:00:00+09:00",
  },
  {
    title: "3차 창고 대개방 예약🎉",
    href: NAVER_PLACE_URL,
    expiresAt: "2026-03-28T17:00:00+09:00",
  },
];

const CONTACT_CARD: LinkCard = {
  label: "Contact Us",
  title: "카카오톡 채널",
  description: "1:1 문의",
  href: "http://pf.kakao.com/_LRAAX/chat",
  iconSrc: "/link/kakaotalk.svg",
  iconAlt: "카카오톡 아이콘",
  iconVariant: "kakao",
};

const LOCATION_CARD: LinkCard = {
  label: "Location",
  title: "네이버 지도",
  description: "종로, 동대문 창고 (1,2층)",
  href: NAVER_PLACE_URL,
  iconSrc: "/link/navermap.png",
  iconAlt: "네이버 지도 아이콘",
};

const COMMUNITY_CARDS: LinkCard[] = [
  {
    label: "Community",
    title: "밴드",
    href: "https://band.us/@yjtexlab",
    iconSrc: "/link/band.png",
    iconAlt: "밴드 아이콘",
  },
  {
    label: "Community",
    title: "오픈채팅방",
    href: "https://open.kakao.com/o/gRa7iRbi",
    iconSrc: "/link/kakaotalk.svg",
    iconAlt: "카카오톡 아이콘",
    iconVariant: "kakao",
  },
];

const SOCIAL_CARD: LinkCard = {
  label: "Social",
  title: "영진원단 딸내미",
  description: "@yjtexlab",
  href: "https://x.com/yjtexlab?s=20",
  iconSrc: "/link/x.jpg",
  iconAlt: "X 아이콘",
};

export const metadata: Metadata = createPageMetadata({
  title: "영진원단 | 공식 링크",
  path: "/link",
  description:
    "아카이브 드롭, 코어 셀렉션, 브랜드 바잉, 예약 쇼룸을 운영하고, 거래형 물량은 별도 트레이딩 라인으로 분리하는 영진원단 공식 링크 페이지",
  keywords: ["영진원단", "Youngjin Fabric", "link page", "fabric drop", "동대문 원단"],
  absoluteTitle: true,
  noIndex: true,
});

export const dynamic = "force-dynamic";

function isPromoVisible(expiresAt: string, now: number) {
  return now < Date.parse(expiresAt);
}

function cardClassName(compact: boolean) {
  return compact ? `${styles.cta} ${styles.ctaCompact}` : styles.cta;
}

function renderCard(card: LinkCard, compact = false) {
  return (
    <a
      className={cardClassName(compact)}
      href={card.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span
        className={`${styles.iconBox} ${card.iconVariant === "kakao" ? styles.iconBoxKakao : ""}`}
        aria-hidden="true"
      >
        <Image
          className={styles.iconImage}
          src={card.iconSrc}
          alt={card.iconAlt}
          width={40}
          height={40}
        />
      </span>
      <span className={styles.ctaCopy}>
        <strong>{card.title}</strong>
        {card.description ? <span>{card.description}</span> : null}
      </span>
      <span className={styles.arrow} aria-hidden="true">
        ›
      </span>
    </a>
  );
}

export default function LinkPage() {
  const now = Date.now();
  const visiblePromos = PROMO_ITEMS.filter((promo) => isPromoVisible(promo.expiresAt, now));

  return (
    <main className={styles.pageShell}>
      <div className={styles.page}>
        <div className={styles.frame}>
          {visiblePromos.map((promo) => (
            <section key={promo.title} className={styles.promoStack}>
              <a
                className={styles.promoLink}
                href={promo.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.promoTitle}>{promo.title}</span>
                <span className={styles.arrow} aria-hidden="true">
                  ›
                </span>
              </a>
            </section>
          ))}

          <section className={styles.section}>
            <div className={styles.logoStage}>
              <Image
                className={styles.logoImage}
                src="/link/logo-white.png"
                alt="영진원단 로고"
                width={2286}
                height={1048}
                priority
                sizes="(max-width: 452px) 100vw, 248px"
              />
            </div>
            <div className={styles.introCopy}>
              <span>1962년 대구에서 시작해 3대째 이어온 영진원단입니다.</span>
              <span>60년 넘게 체크와 스트라이프 선염 원단을 만들어왔습니다.</span>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <p className={styles.sectionTitle}>주요 납품처 이력 · 수출국</p>
            </div>
            <div className={styles.proofBoard}>
              <article className={styles.proofCard}>
                <p className={styles.proofLabel}>주요 납품처 이력</p>
                <p className={styles.proofText}>
                  <strong>삼성물산 / LF</strong>
                </p>
              </article>
              <article className={styles.proofCard}>
                <p className={styles.proofLabel}>수출국</p>
                <p className={styles.proofText}>일본 / 미국 / 베트남</p>
              </article>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.actionLayout}>
              <div className={styles.actionBlock}>
                <p className={styles.actionLabel}>{CONTACT_CARD.label}</p>
                {renderCard(CONTACT_CARD)}
              </div>

              <div className={styles.actionBlock}>
                <p className={styles.actionLabel}>{LOCATION_CARD.label}</p>
                {renderCard(LOCATION_CARD)}
              </div>

              <div className={styles.actionBlock}>
                <p className={styles.actionLabel}>Community</p>
                <p className={styles.communityNote}>
                  온라인 판매 및 오프라인 창고개방 일정 공지를 받아보고 싶다면?
                </p>
                <div className={styles.communityGrid}>
                  {COMMUNITY_CARDS.map((card) => (
                    <div key={card.title}>{renderCard(card, true)}</div>
                  ))}
                </div>
              </div>

              <div className={styles.actionBlock}>
                <p className={styles.actionLabel}>{SOCIAL_CARD.label}</p>
                {renderCard(SOCIAL_CARD)}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <p className={styles.sectionTitle}>■ 비즈니스 협업</p>
            </div>
            <div className={styles.businessCopy}>
              <p>
                현재 sns 통합 7k+ 팔로워 분들과
                <br />
                원단에 대한 이야기를 함께 나누고 있습니다.
              </p>
              <p>
                우리의 철학에 공감하시는 분들
                <br />
                그리고 고품질 원단이 필요한
                <br />
                모든 형태의 협업을 언제나 환영합니다.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
