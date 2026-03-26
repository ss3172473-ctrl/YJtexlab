"use client";

import Link from "next/link";
const milestones = [
  {
    year: "1990s",
    title: "국내 최초 양면 스트라이프 원단 개발",
    body: "앞뒤가 다른 조직감과 컬러를 구현한 양면 스트라이프 원단을 국내 최초로 개발하여 셔츠 시장의 새로운 패러다임을 제시했습니다.",
  },
  {
    year: "2000s",
    title: "앵커(Anchor) 패턴의 대중화",
    body: "클래식한 해양 모티브인 앵커 패턴을 정교한 직조 기술로 풀어내어 국내 유수의 캐주얼 브랜드들의 메가 히트 아이템을 탄생시켰습니다.",
  },
  {
    year: "2010s",
    title: "액체 암모니아 가공 기술 상용화",
    body: "원단의 광택과 방축(Shrink-resistance) 성능을 극대화하는 액체 암모니아 공법을 선제적으로 도입하여 글로벌 수준의 품질력을 확보했습니다.",
  },
] as const;

const navItems = [
  { label: "HOME", href: "/" },
  { label: "THE NARRATIVE", href: "/stories" },
  { label: "THE LINES", href: "/stories/savoir-faire" },
  { label: "THE MILESTONES", href: "/milestones", active: true },
  { label: "YEONGJIN CERTIFIED", href: "/certified" },
  { label: "CONTACT", href: "/contact" },
] as const;

export default function MilestonesPageContent() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#ffffff] text-neutral-950">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.04),transparent_38%)]" />
      </div>

      <nav className="relative z-10 flex flex-col gap-8 px-6 py-8 md:px-10 lg:flex-row lg:items-start lg:justify-between lg:px-16 lg:py-10">
        <Link href="/" className="w-fit text-[18px] font-extrabold tracking-[-0.05em] text-neutral-950">
          YJ TEXLAB
        </Link>

        <ul className="flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-medium uppercase tracking-[0.24em] text-neutral-500">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={"active" in item && item.active ? "text-neutral-950" : "transition-colors hover:text-neutral-950"}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="relative z-10 px-6 pb-20 pt-10 md:px-10 md:pt-16 lg:px-16 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <h1 className="text-[22px] font-medium tracking-[-0.04em] text-neutral-950 md:text-[26px]">
            THE MILESTONES
          </h1>

          <div className="mt-14 border-t border-neutral-200 md:mt-16">
            {milestones.map((milestone) => (
              <article
                key={milestone.title}
                className="grid gap-4 border-b border-neutral-200 py-5 md:grid-cols-[120px_minmax(220px,0.8fr)_minmax(0,1.4fr)] md:items-start md:gap-8"
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400">
                  {milestone.year}
                </span>
                <h2 className="text-[17px] font-medium leading-7 tracking-[-0.03em] text-neutral-950">
                  {milestone.title}
                </h2>
                <p className="max-w-[56ch] text-[12px] leading-7 text-neutral-600">
                  {milestone.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </main>

      <div className="pointer-events-none absolute bottom-8 right-6 text-[34px] font-semibold tracking-[0.18em] text-neutral-200 md:bottom-10 md:right-10 md:text-[44px] lg:right-16">
        永進
      </div>
    </div>
  );
}
