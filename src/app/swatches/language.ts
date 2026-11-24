export const languages = [
  { id: "ko", name: "Korean", short: "KO" },
  { id: "en", name: "English", short: "EN" },
  { id: "zh-CN", name: "简体中文", short: "中文" },
] as const;

export type Language = (typeof languages)[number]["id"];

const strings = {
  catalog: ["원단 목록", "Fabric catalog", "面料目录"],
  soldOutLabel: ["품절", "Sold out", "已售罄"],
  code: ["고객 코드", "Customer code", "客户代码"],
  codeHint: ["메일로 받은 4자리 코드를 입력하세요.", "Enter the four-digit code from your email.", "请输入邮件中的四位数字代码。"],
  codeInvalid: ["메일로 받은 숫자 고객 코드를 확인해 주세요.", "Check the customer code in your email.", "请核对邮件中的客户代码。"],
  codeSlow: ["입력 시도가 많습니다. 잠시 후 다시 시도해 주세요.", "Too many attempts. Please try again later.", "尝试次数过多，请稍后重试。"],
  codeUnavailable: ["지금은 고객 코드를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.", "The code could not be verified. Please try again shortly.", "暂时无法验证代码，请稍后重试。"],
  codeExpired: ["고객 코드를 다시 입력해 주세요.", "Please enter your customer code again.", "请重新输入客户代码。"],
  checking: ["확인 중", "Checking", "正在验证"],
  welcome: ["환영합니다", "Welcome", "欢迎"],
  all: ["전체 원단", "All fabrics", "全部面料"],
  cart: ["장바구니", "Cart", "购物车"],
  retry: ["다시 불러오기", "Reload", "重新加载"],
  stockLoading: ["재고 확인 중", "Checking stock", "正在查询库存"],
  stockUnavailable: ["재고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", "Stock could not be loaded. Please try again shortly.", "暂时无法加载库存，请稍后重试。"],
  stockChanged: ["일부 롤의 재고나 단가가 바뀌었습니다. 장바구니를 확인해 주세요.", "Stock or pricing has changed. Please review your cart.", "部分布卷库存或单价有变，请核对购物车。"],
  details: ["원단 및 재고 정보", "Fabric and stock details", "面料与库存信息"],
  composition: ["혼용률", "Composition", "成分"],
  finishing: ["조직·가공", "Weave / finish", "织法／后整理"],
  width: ["폭", "Width", "幅宽"],
  unitPrice: ["야드당 단가", "Price per yard", "每码单价"],
  pricePending: ["가격 확인 중", "Price pending", "价格待确认"],
  rolls: ["롤 재고", "Roll stock", "布卷库存"],
  add: ["담기", "Add", "加入"],
  added: ["담김", "Added", "已加入"],
  fullRoll: ["롤 전체를 담아 구매 문의할 수 있습니다.", "Add whole rolls to submit a purchase inquiry.", "可将整卷面料加入购物车后提交采购询价。"],
  search: ["상품명, 패턴, 색상, SKU 검색", "Search fabric, pattern, color or SKU", "搜索品名、花型、颜色或 SKU"],
  noMatch: ["검색과 일치하는 원단이 없습니다.", "No fabrics match your search.", "没有符合搜索条件的面料。"],
  noFabrics: ["등록된 원단이 없습니다.", "No fabrics are listed.", "暂无面料。"],
  closeCart: ["장바구니 닫기", "Close cart", "关闭购物车"],
  receiptUncertain: ["접수 결과 확인 필요", "Receipt needs confirmation", "需确认接收状态"],
  receiptReceived: ["구매 문의가 접수되었습니다.", "Your purchase inquiry was received.", "已收到您的采购询价。"],
  receiptReply: ["기존 연락처로 회신드리겠습니다.", "We will reply to your existing email address.", "我们将通过已有的邮箱地址回复您。"],
  receiptSaved: ["문의는 저장되었습니다. 메일 수신 확인이 필요하면 연락해 주세요.", "Your inquiry was saved. Contact us if you need to confirm email delivery.", "已保存您的询价。如需确认邮件是否送达，请联系我们。"],
  receiptCheck: ["접수 여부를 이메일로 확인해 주세요.", "Please contact us by email to confirm receipt.", "请通过邮件确认询价是否已收到。"],
  emptyCart: ["담긴 롤이 없습니다.", "No rolls in your cart.", "购物车中暂无布卷。"],
  soldOut: ["재고 없음", "Out of stock", "缺货"],
  remove: ["삭제", "Remove", "移除"],
  subtotal: ["원단 합계", "Fabric subtotal", "面料小计"],
  shipping: ["배송비 별도", "Shipping excluded", "运费另计"],
  removeSoldOut: ["품절된 롤을 삭제한 뒤 문의해 주세요.", "Remove out-of-stock rolls before sending.", "请移除缺货的布卷后再提交。"],
  sending: ["보내는 중", "Sending", "正在提交"],
  inquire: ["구매 문의 보내기", "Send purchase inquiry", "提交采购询价"],
  previewMail: ["미리보기에서는 문의 메일을 보내지 않습니다.", "Email sending is disabled in this preview.", "此预览不会发送询价邮件。"],
  previewPhoto: ["사진은 미리보기용입니다.", "Photos are for preview only.", "图片仅供预览。"],
  inquiryUnavailable: ["지금은 문의를 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.", "The inquiry could not be sent. Please try again shortly.", "暂时无法提交询价，请稍后重试。"],
  gallery: ["색상 갤러리", "Color gallery", "配色图库"],
  colors: ["원단 색상", "Fabric colors", "面料颜色"],
  previous: ["이전 색상", "Previous color", "上一个颜色"],
  next: ["다음 색상", "Next color", "下一个颜色"],
} as const;

export function swatchesText(language: Language) {
  const index = languages.findIndex((entry) => entry.id === language);
  return (key: keyof typeof strings) => strings[key][index];
}

export function countLabel(count: number, unit: "roll" | "color" | "pattern", language: Language) {
  if (language === "en") return `${count} ${unit}${count === 1 ? "" : "s"}`;
  if (language === "zh-CN") return `${count}${{ roll: " 卷", color: " 种颜色", pattern: " 个花型" }[unit]}`;
  return `${count}${{ roll: "롤", color: "개 색상", pattern: "개 패턴" }[unit]}`;
}

const fabricNames: Record<string, readonly [string, string]> = {
  "10수OX": ["10s Oxford", "10支牛津布"],
  "40수OX": ["40s Oxford", "40支牛津布"],
  "40수체크": ["40s Check", "40支格纹"],
  "50수선염": ["50s Yarn-Dyed", "50支色织面料"],
  "50수체크": ["50s Check", "50支格纹"],
  "CN스판": ["CN Stretch", "CN 弹力面料"],
  "CP선염": ["CP Yarn-Dyed", "CP 色织面料"],
  "CP스판": ["CP Stretch", "CP 弹力面料"],
  "TR OX": ["TR Oxford", "TR 牛津布"],
  "고밀도투일": ["High-Density Twill", "高密斜纹面料"],
  "면선염": ["Yarn-Dyed Cotton", "色织棉布"],
  "모달": ["Modal", "莫代尔面料"],
};

const chineseColors: Record<string, string> = {
  Apricot: "杏色", Beige: "米色", Black: "黑色", Blue: "蓝色", Brown: "棕色",
  Burgundy: "酒红色", "Dark Gray": "深灰色", "Dark Navy": "深藏青色", "Deep Blue": "深蓝色",
  "Deep Sky Blue": "深天蓝色", "Emerald Light Green": "浅翠绿色", "Emerald Sky Blue": "翠天蓝色",
  Green: "绿色", "Green/Mint": "绿色／薄荷色", Indigo: "靛蓝色",
  Jade: "翡翠色", Khaki: "卡其色", "Light Green": "浅绿色", "Light Navy": "浅藏青色",
  "Light Sky Blue": "浅天蓝色", Mint: "薄荷色", Navy: "藏青色", "Optical White": "亮白色",
  Orange: "橙色", Pink: "粉色", Purple: "紫色", Red: "红色", "Sky Blue": "天蓝色",
  White: "白色", "White/Navy": "白色／藏青色", Yellow: "黄色",
};

// Catalog text is stored as given. Only translate complete, recognized names
// or the unambiguous yarn-count + fabric family form; never guess at custom
// style names, new brand terms, or codes. A finish such as 기모 is not
// enough information to distinguish napping, brushing, or sanding.
const fabricKey = (name: string) => name.normalize("NFKC").replace(/\s+/g, "").toUpperCase();
const knownFabricNames = new Map(Object.entries(fabricNames).map(([name, translation]) => [fabricKey(name), translation]));
const fabricFamilies = new Map<string, readonly [string, string]>([
  ["OX", ["Oxford", "牛津布"]],
  ["옥스포드", ["Oxford", "牛津布"]],
  ["체크", ["Check", "格纹"]],
  ["스트라이프", ["Stripe", "条纹"]],
  ["선염", ["Yarn-Dyed", "色织面料"]],
  ["선염체크", ["Yarn-Dyed Check", "色织格纹"]],
  ["선염스트라이프", ["Yarn-Dyed Stripe", "色织条纹"]],
  ["고밀도투일", ["High-Density Twill", "高密斜纹面料"]],
  ["고밀도트윌", ["High-Density Twill", "高密斜纹面料"]],
  ["투일", ["Twill", "斜纹面料"]],
  ["트윌", ["Twill", "斜纹面料"]],
]);

export function fabricName(name: string, language: Language) {
  if (language === "ko") return name;
  const index = language === "en" ? 0 : 1;
  const key = fabricKey(name);
  const known = knownFabricNames.get(key) ?? fabricFamilies.get(key);
  if (known) return known[index];

  const match = /^([1-9][0-9]{0,2})수(.+)$/.exec(key);
  const family = match && !/^\d/.test(match[2]) && (fabricFamilies.get(match[2]) ?? knownFabricNames.get(match[2]));
  if (!match || !family) return name;
  return language === "en" ? `${match[1]}s ${family[0]}` : `${match[1]}支${family[1]}`;
}

export function colorName(color: string, language: Language) {
  return language === "zh-CN" ? chineseColors[color] ?? color : color;
}
