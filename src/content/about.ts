export type LocalizedText = {
  ko: string;
  en: string;
};

export type LocalizedLines = {
  ko: string[];
  en: string[];
};

export type AboutValue = {
  id: string;
  title: LocalizedText;
  body: LocalizedText[];
  leadLines?: LocalizedLines;
};

export type AboutLink = {
  href: string;
  label: LocalizedText;
  description: LocalizedText;
};

export type AboutPageContent = {
  title: LocalizedText;
  heroIntroLines: LocalizedLines;
  intro: LocalizedText[];
  values: AboutValue[];
  links: AboutLink[];
};

export const aboutPageContent: AboutPageContent = {
  title: {
    ko: "Our standards",
    en: "Our standards",
  },
  heroIntroLines: {
    ko: ["좋은 원단은 설명보다", "기준에서 먼저 드러난다고 믿습니다."],
    en: [
      "We believe good fabric reveals itself through standards",
      "before it ever needs explanation.",
    ],
  },
  intro: [
    {
      ko: "좋은 원단은 설명보다 기준에서 먼저 드러난다고 믿습니다.",
      en: "We believe good fabric reveals itself through standards before it ever needs explanation.",
    },
    {
      ko: "YJ TexLab은 1960년대 대구에서 시작해 3대째 이어져 온 선염 면원단 중심 기업입니다. 우리가 말하는 품질은 이미지가 아니라 실제 발주와 생산 판단에서 다시 확인되는 기준입니다.",
      en: "YJ TexLab is a third-generation company rooted in Daegu since the 1960s, with a long focus on yarn-dyed cotton fabrics. For us, quality is not an image claim but a standard tested again in sourcing and production decisions.",
    },
    {
      ko: "오래된 기준일수록 더 단순하게 말할 수 있어야 한다고 생각합니다. 아래의 네 가지는 영진원단이 오랫동안 지켜온 기준을 가장 직접적으로 설명하는 단어들입니다.",
      en: "We believe the longer a standard has lasted, the more simply it should be stated. The four ideas below are the clearest way to describe what Yeongjin Fabric has protected over time.",
    },
  ],
  values: [
    {
      id: "quality",
      title: {
        ko: "Quality",
        en: "Quality",
      },
      body: [
        {
          ko: "단가를 맞추기 위해 공정을 생략하는 선택은 하지 않습니다.",
          en: "We do not cut process simply to meet a target price.",
        },
        {
          ko: "저가 원단 시장의 흐름 속에서 많은 것들이 타협의 대상이 됩니다. 공정이 줄고, 마감이 간소해지고, 그 차이는 수치가 아닌 손끝에서 드러납니다. 영진원단은 그 흐름 안에서도 정통 선염 가공과 최고급 공정만을 고집해 왔습니다. 우리가 보는 것은 옷의 겉모습이 아니라, 그 옷을 지탱하는 원단의 생애입니다.",
          en: "In the lower-priced fabric market, many things become negotiable. Processes are reduced, finishes are simplified, and the difference shows up not in a spec sheet but in the hand of the cloth. Even in that environment, Yeongjin Fabric has stayed with authentic yarn-dyed processing and top-tier finishing. We do not look first at the appearance of a garment, but at the life of the fabric that supports it.",
        },
      ],
      leadLines: {
        ko: ["단가를 맞추기 위해", "공정을 생략하는 선택은 하지 않습니다."],
        en: ["We do not cut process", "simply to meet a target price."],
      },
    },
    {
      id: "integrity",
      title: {
        ko: "Integrity",
        en: "Integrity",
      },
      body: [
        {
          ko: "1962년 대구 영진상사에서 시작해 3대째 이어져 온 기준입니다.",
          en: "This is a standard that began at Yeongjin Trading in Daegu in 1962 and has continued across three generations.",
        },
        {
          ko: "세대를 거쳐 이어진다는 것은 단순한 연혁이 아닙니다. 어떤 원단을 남기고 어떤 공정을 지킬지, 그 판단이 대가 바뀌어도 흔들리지 않았다는 뜻입니다. 오래된 기준일수록 더 단순하게 말할 수 있어야 한다고 생각합니다. 영진상사에서 시작한 그 기준은 지금의 영진원단에도 그대로 남아 있습니다.",
          en: "Continuity across generations is not just a matter of chronology. It means the judgment behind what fabrics to keep and what processes to protect did not shift as leadership changed. We believe the older a standard becomes, the more simply it should be stated. The standard that began at Yeongjin Trading still remains in Yeongjin Fabric today.",
        },
      ],
      leadLines: {
        ko: ["1962년 대구 영진상사에서 시작해", "3대째 이어져 온 기준입니다."],
        en: [
          "This is a standard that began at Yeongjin Trading in Daegu in 1962",
          "and has continued across three generations.",
        ],
      },
    },
    {
      id: "recognition",
      title: {
        ko: "Recognition",
        en: "Recognition",
      },
      body: [
        {
          ko: "그 가치는 설명이 필요하지 않았습니다.",
          en: "Its value did not need much explanation.",
        },
        {
          ko: "2000년대 삼성물산, LF, 이랜드 등 국내 주요 브랜드가 영진원단을 찾은 것은 영업의 결과가 아니었습니다. 품질 기준이 까다롭기로 알려진 일본 시장에까지 원단을 수출하게 된 것도 마찬가지입니다. 원단이 먼저 말했고, 시장이 그것을 알아봤습니다.",
          en: "In the 2000s, major Korean brands such as Samsung C&T, LF, and E-Land did not come to Yeongjin Fabric because of salesmanship alone. The same was true when our fabrics reached export markets such as Japan, where quality standards are known to be demanding. The fabric spoke first, and the market recognized it.",
        },
      ],
      leadLines: {
        ko: ["그 가치는", "설명이 필요하지 않았습니다."],
        en: ["Its value", "did not need much explanation."],
      },
    },
    {
      id: "archive",
      title: {
        ko: "Archive",
        en: "Archive",
      },
      body: [
        {
          ko: "60년의 안목으로 엄선된 1,500여 종의 원단이 지금 여기 있습니다.",
          en: "More than 1,500 fabrics, selected through sixty years of judgment, are here today.",
        },
        {
          ko: "유행을 따라 구성을 바꾸지 않았습니다. 오래 입어도 좋은가, 다음 발주에서도 같은 원단을 받을 수 있는가. 영진원단의 아카이브는 그 질문을 반복하며 쌓인 결과입니다.",
          en: "We did not reshape the archive around short-term trends. Will it still feel right after long use? Can the same fabric be supplied again on the next order? The Yeongjin Fabric archive is the result of asking those questions again and again.",
        },
      ],
      leadLines: {
        ko: ["60년의 안목으로 엄선된 1,500여 종의 원단이", "지금 여기 있습니다."],
        en: [
          "More than 1,500 fabrics, selected through sixty years of judgment,",
          "are here today.",
        ],
      },
    },
  ],
  links: [
    {
      href: "/products",
      label: {
        ko: "패브릭 보기",
        en: "View fabrics",
      },
      description: {
        ko: "현재 보유 중인 원단 구성을 확인합니다",
        en: "See the current fabric range we hold",
      },
    },
    {
      href: "/contact",
      label: {
        ko: "문의하기",
        en: "Contact us",
      },
      description: {
        ko: "프로젝트 맥락과 필요한 사양을 남겨 주세요",
        en: "Share your project context and required specifications",
      },
    },
  ],
};
