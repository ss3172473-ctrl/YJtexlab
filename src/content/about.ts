export type LocalizedText = {
  ko: string;
  en: string;
};

export type AboutPanel = {
  id: string;
  code: string;
  label: string;
  blocks: LocalizedText[];
};

export const aboutPanels: AboutPanel[] = [
  {
    id: "foundation",
    code: "01",
    label: "FOUNDATION",
    blocks: [
      {
        ko: `1962년대 대구 영진상사에서 시작해 3대째 이어져 온 영진원단입니다.`,
        en: `Yeongjin Fabric began as Yeongjin Trading in Daegu in the 1960s and has continued for three generations.`,
      },
      {
        ko: `우리는 옷의 겉모습이 아닌 옷을 지탱하는 원단의 생애를 봅니다.`,
        en: `We do not look at the appearance of clothing. We look at the life of the fabric that supports it.`,
      },
    ],
  },
  {
    id: "process",
    code: "02",
    label: "PROCESS",
    blocks: [
      {
        ko: `단가를 맞추기 위해 공정을 생략하는 저가 원단 시장의 흐름 속에서도
영진원단은 타협 대신 정통 선염 가공과 최고급 공정만을 고집해 왔습니다.`,
        en: `Even in a low-cost fabric market that skips processes to hit price targets,
Yeongjin Fabric has chosen no compromise, insisting on authentic yarn-dyeing and only the highest-grade processes.`,
      },
    ],
  },
  {
    id: "proof",
    code: "03",
    label: "PROOF",
    blocks: [
      {
        ko: `이러한 고집의 결과 2000년대 삼성물산 LF 이랜드 등 국내 주요 브랜드는 물론
품질 기준이 까다로운 일본등 해외시장에까지 원단을 수출하며 그 가치를 인정받았습니다.`,
        en: `As a result of that conviction, in the 2000s our fabrics were recognized not only by major Korean brands
such as Samsung C&T, LF, and E-Land, but also by overseas markets including Japan, where quality standards are especially demanding.`,
      },
    ],
  },
  {
    id: "release",
    code: "04",
    label: "WAREHOUSE OPENING",
    blocks: [
      {
        ko: `이제 60년의 안목이 고스란히 담긴 1500여 종의 하이엔드 원단들을
진짜 품질을 알아보시는 분들을 위해 선보입니다.`,
        en: `Now, more than 1,500 high-end fabrics holding the full eye of sixty years
are being presented for those who truly recognize quality.`,
      },
    ],
  },
];
