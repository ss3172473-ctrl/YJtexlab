export const domesticPartners = [
  { name: "삼성물산", logo: "SAMSUNG C&T" },
  { name: "LF", logo: "LF" },
  { name: "파크랜드", logo: "PARKLAND" },
] as const;

export const exportCountries = ["Japan", "USA", "Vietnam", "Thailand"] as const;

export const destinations = [
  { label: "KOREA (HQ)", top: "29.2%", left: "85.3%", align: "center" as const, pulse: true },
  { label: "JAPAN", top: "30.2%", left: "87.6%", align: "left" as const, pulse: false },
  { label: "CHINA", top: "31.8%", left: "83.6%", align: "right" as const, pulse: false },
  { label: "USA", top: "31.2%", left: "17.2%", align: "left" as const, pulse: false },
  { label: "VIETNAM", top: "44%", left: "79.6%", align: "left" as const, pulse: false },
  { label: "THAILAND", top: "42.4%", left: "77.9%", align: "right" as const, pulse: false },
] as const;

export const facilityLocations = [
  {
    city: "Seoul",
    label: "Warehouse",
    description: "대한민국 텍스타일 유통의 중심 서울에서 빠르고 정확한 물류 거점 창고를 운영하고 있습니다.",
  },
  {
    city: "Daegu",
    label: "Factory & Main Warehouse",
    description: "60년의 노하우가 담긴 대구에는 최신 설비의 제조 공장과 대규모 메인 보관 인프라가 갖추어져 있습니다.",
  },
] as const;
