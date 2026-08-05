import Image from "next/image";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import styles from "./page.module.css";

const PRIVATE_OPENING_URL = "https://link.yjtexlab.com/프라이빗개방";

const NAVER_RESERVATION_URL =
  "https://pcmap.place.naver.com/place/2096794271/ticket?bookingRedirectUrl=https%3A%2F%2Fm.booking.naver.com%2Fbooking%2F12%2Fbizes%2F1592258&theme=place&entry=pll&lang=ko&service-target=map-pc&pcmap=1&fromPanelNum=2&timestamp=202608052210&locale=ko&svcName=map_pcv5&searchText=%EC%98%81%EC%A7%84%EC%9B%90%EB%8B%A8&area=pll";

export const metadata: Metadata = createPageMetadata({
  title: "영진원단 비공개 창고 프라이빗 개방",
  path: "/프라이빗개방",
  description: "영진원단 비공개 창고 프라이빗 개방 예약 안내",
  keywords: ["영진원단", "비공개 창고", "프라이빗 개방", "네이버 예약"],
  absoluteTitle: true,
  noIndex: true,
});

export default function PrivateOpeningPage() {
  return (
    <main className={styles.pageShell}>
      <div className={styles.page}>
        <div className={styles.frame}>
          <header className={styles.header}>
            <Image
              className={styles.logoImage}
              src="/link/logo-white.png"
              alt="영진원단"
              width={2286}
              height={1048}
              priority
              sizes="(max-width: 452px) 210px, 240px"
            />
            <p>SINCE 1962</p>
          </header>

          <section className={styles.winnerCard} aria-labelledby="winner-title">
            <div className={styles.cardTopline}>
              <span className={styles.luckyLabel}>LUCKY TICKET</span>
              <span className={styles.dotMark} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
            <p className={styles.eyebrow}>영진원단 비공개 창고 프라이빗 초대권</p>
            <h1 id="winner-title">
              축하드려요!<br />
              초대권을 찾으셨네요.
            </h1>
            <p className={styles.winnerCopy}>
              랜덤박스 안에 숨어 있던 특별한 한 장이에요.<br />
              이제 창고의 문을 열어보세요.
            </p>
          </section>

          <section className={styles.infoSection} aria-label="프라이빗 개방 일정">
            <p className={styles.sectionLabel}>PRIVATE OPENING</p>
            <div className={styles.infoGrid}>
              <article className={`${styles.infoCard} ${styles.infoCardAccent}`}>
                <p>DATE</p>
                <strong>8.16</strong>
                <span>토요일</span>
              </article>
              <article className={styles.infoCard}>
                <p>TIME</p>
                <strong>15:00</strong>
                <span>오후 3시</span>
              </article>
              <article className={styles.infoCard}>
                <p>STAY</p>
                <strong>1H</strong>
                <span>이용시간 1시간</span>
              </article>
            </div>
          </section>

          <section className={styles.reserveSection} aria-labelledby="reserve-title">
            <div>
              <p className={styles.sectionLabel}>RESERVATION</p>
              <h2 id="reserve-title">예약하고, 창고에서 만나요.</h2>
              <p>아래 버튼을 누르면 네이버 예약으로 바로 이동합니다.</p>
            </div>
            <a className={styles.reserveButton} href={NAVER_RESERVATION_URL}>
              <span>네이버 예약하기</span>
              <span aria-hidden="true">›</span>
            </a>
          </section>

          <section className={styles.qrSection} aria-labelledby="qr-title">
            <div className={styles.qrCopy}>
              <p className={styles.sectionLabel}>INVITATION QR</p>
              <h2 id="qr-title">초대 페이지를 저장해두세요.</h2>
              <p>QR을 스캔하면 이 안내 페이지로 다시 들어올 수 있어요.</p>
              <a href="/private-opening-qr.png" download>
                QR 이미지 다운로드
              </a>
            </div>
            <a
              className={styles.qrLink}
              href={PRIVATE_OPENING_URL}
              aria-label="영진원단 비공개 창고 프라이빗 개방 페이지 열기"
            >
              <Image
                src="/private-opening-qr.png"
                alt="link.yjtexlab.com 프라이빗 개방 페이지 QR 코드"
                width={256}
                height={256}
              />
            </a>
          </section>

          <p className={styles.footerNote}>영진원단 · 비공개 창고 프라이빗 개방</p>
        </div>
      </div>
    </main>
  );
}
