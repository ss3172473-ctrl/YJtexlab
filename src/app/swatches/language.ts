export const languages = [
  { id: "ko", name: "Korean", short: "KO" },
  { id: "en", name: "English", short: "EN" },
  { id: "zh-CN", name: "简体中文", short: "中文" },
  { id: "ja", name: "日本語", short: "日本語" },
] as const;

export type Language = (typeof languages)[number]["id"];

const strings = {
  catalog: ["원단 목록", "Fabric catalog", "面料目录", "生地一覧"],
  rollStockNote: [
    "자체 공장 생산 · A급 미사용 정상품 · 생산 후 개별 랩 포장 · 보유 롤 단위 구매",
    "Made in our mill · First-quality unused fabric · Individually wrapped · Full rolls in stock",
    "自有工厂生产 · A级全新面料 · 生产后逐卷包膜存放 · 现货整卷采购",
    "自社工場で生産 · A級の未使用生地 · 生産後にフィルムで個包装 · 在庫品は反単位で販売",
  ],
  soldOutLabel: ["품절", "Sold out", "已售罄", "完売"],
  code: ["고객 코드", "Customer code", "客户代码", "お客様コード"],
  codeHint: ["메일로 받은 4자리 코드를 입력하세요.", "Enter the four-character code from your email.", "请输入邮件中的四位代码。", "メールに記載された4文字のコードを入力してください。"],
  codeInvalid: ["메일로 받은 고객 코드를 확인해 주세요.", "Check the customer code in your email.", "请核对邮件中的客户代码。", "メールに記載されたお客様コードをご確認ください。"],
  codeSlow: ["입력 시도가 많습니다. 잠시 후 다시 시도해 주세요.", "Too many attempts. Please try again later.", "尝试次数过多，请稍后重试。", "入力回数が上限に達しました。しばらくしてから再度お試しください。"],
  codeUnavailable: ["지금은 고객 코드를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.", "The code could not be verified. Please try again shortly.", "暂时无法验证代码，请稍后重试。", "コードを確認できませんでした。しばらくしてから再度お試しください。"],
  codeExpired: ["고객 코드를 다시 입력해 주세요.", "Please enter your customer code again.", "请重新输入客户代码。", "お客様コードをもう一度入力してください。"],
  checking: ["확인 중", "Checking", "正在验证", "確認中"],
  welcome: ["환영합니다", "Welcome", "欢迎", "ようこそ"],
  all: ["전체 원단", "All fabrics", "全部面料", "すべての生地"],
  cart: ["장바구니", "Cart", "购物车", "カート"],
  retry: ["다시 불러오기", "Reload", "重新加载", "再読み込み"],
  stockLoading: ["재고 확인 중", "Checking stock", "正在查询库存", "在庫を確認中"],
  stockUnavailable: ["재고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", "Stock could not be loaded. Please try again shortly.", "暂时无法加载库存，请稍后重试。", "在庫を読み込めませんでした。しばらくしてから再度お試しください。"],
  stockChanged: ["일부 롤의 재고나 단가가 바뀌었습니다. 장바구니를 확인해 주세요.", "Stock or pricing has changed. Please review your cart.", "部分布卷库存或单价有变，请核对购物车。", "一部の反物の在庫または単価が変わりました。カートをご確認ください。"],
  details: ["원단 및 재고 정보", "Fabric and stock details", "面料与库存信息", "生地・在庫情報"],
  composition: ["혼용률", "Composition", "成分", "混用率"],
  finishing: ["조직·가공", "Weave / finish", "织法／后整理", "組織・加工"],
  width: ["폭", "Width", "幅宽", "生地幅"],
  unitPrice: ["야드당 단가", "Price per yard", "每码单价", "1ヤードあたりの単価"],
  pricePending: ["가격 확인 중", "Price pending", "价格待确认", "価格は確認中"],
  rolls: ["롤 재고", "Roll stock", "布卷库存", "反物在庫"],
  add: ["담기", "Add", "加入", "追加"],
  added: ["담김", "Added", "已加入", "追加済み"],
  fullRoll: ["롤 전체를 담아 구매 문의할 수 있습니다.", "Add whole rolls to submit a purchase inquiry.", "可将整卷面料加入购物车后提交采购询价。", "反物を1反単位でカートに追加し、購入についてお問い合わせいただけます。"],
  search: ["상품명, 패턴, 색상, SKU 검색", "Search fabric, pattern, color or SKU", "搜索品名、花型、颜色或 SKU", "品名・柄・色・品番で検索"],
  noMatch: ["검색과 일치하는 원단이 없습니다.", "No fabrics match your search.", "没有符合搜索条件的面料。", "検索条件に一致する生地がありません。"],
  noFabrics: ["등록된 원단이 없습니다.", "No fabrics are listed.", "暂无面料。", "掲載中の生地がありません。"],
  closeCart: ["장바구니 닫기", "Close cart", "关闭购物车", "カートを閉じる"],
  receiptUncertain: ["접수 결과 확인 필요", "Receipt needs confirmation", "需确认接收状态", "受付状況をご確認ください"],
  receiptReceived: ["구매 문의가 접수되었습니다.", "Your purchase inquiry was received.", "已收到您的采购询价。", "購入のお問い合わせを受け付けました。"],
  receiptReply: ["기존 연락처로 회신드리겠습니다.", "We will reply to your existing email address.", "我们将通过已有的邮箱地址回复您。", "ご登録のメールアドレスに返信いたします。"],
  receiptSaved: ["문의는 저장되었습니다. 메일 수신 확인이 필요하면 연락해 주세요.", "Your inquiry was saved. Contact us if you need to confirm email delivery.", "已保存您的询价。如需确认邮件是否送达，请联系我们。", "お問い合わせ内容を保存しました。受付メールが届かない場合はご連絡ください。"],
  receiptCheck: ["접수 여부를 이메일로 확인해 주세요.", "Please contact us by email to confirm receipt.", "请通过邮件确认询价是否已收到。", "受付状況はメールでお問い合わせください。"],
  emptyCart: ["담긴 롤이 없습니다.", "No rolls in your cart.", "购物车中暂无布卷。", "カートに反物がありません。"],
  soldOut: ["재고 없음", "Out of stock", "缺货", "在庫切れ"],
  remove: ["삭제", "Remove", "移除", "削除"],
  subtotal: ["원단 합계", "Fabric subtotal", "面料小计", "生地代小計"],
  shipping: ["배송비 별도", "Shipping excluded", "运费另计", "送料別"],
  removeSoldOut: ["품절된 롤을 삭제한 뒤 문의해 주세요.", "Remove out-of-stock rolls before sending.", "请移除缺货的布卷后再提交。", "在庫切れの反物を削除してからお問い合わせください。"],
  sending: ["보내는 중", "Sending", "正在提交", "送信中"],
  requestQuote: ["견적 요청하기", "Request a quote", "索取报价", "見積もりを依頼する"],
  inquire: ["구매 문의 보내기", "Send purchase inquiry", "提交采购询价", "購入について問い合わせる"],
  previewMail: ["미리보기에서는 문의 메일을 보내지 않습니다.", "Email sending is disabled in this preview.", "此预览不会发送询价邮件。", "プレビューではお問い合わせメールは送信されません。"],
  previewPhoto: ["사진은 미리보기용입니다.", "Photos are for preview only.", "图片仅供预览。", "写真はプレビュー用です。"],
  inquiryUnavailable: ["지금은 문의를 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.", "The inquiry could not be sent. Please try again shortly.", "暂时无法提交询价，请稍后重试。", "お問い合わせを送信できませんでした。しばらくしてから再度お試しください。"],
  gallery: ["색상 갤러리", "Color gallery", "配色图库", "カラーギャラリー"],
  colors: ["원단 색상", "Fabric colors", "面料颜色", "生地の色"],
  previous: ["이전 색상", "Previous color", "上一个颜色", "前の色"],
  next: ["다음 색상", "Next color", "下一个颜色", "次の色"],
  reverse: ["{sku} 원단 뒷면 보기", "Show reverse of {sku}", "查看 {sku} 面料背面", "{sku} の生地裏面を見る"],
  pauseRotation: ["색상 자동 전환 일시 정지", "Pause color rotation", "暂停颜色轮换", "色の自動切り替えを一時停止"],
  playRotation: ["색상 자동 전환 재생", "Play color rotation", "继续颜色轮换", "色の自動切り替えを再開"],
} as const satisfies Record<string, readonly [string, string, string, string]>;

export function swatchesText(language: Language) {
  const index = languages.findIndex((entry) => entry.id === language);
  return (key: keyof typeof strings) => strings[key][index];
}

export function countLabel(count: number, unit: "roll" | "color" | "pattern", language: Language) {
  if (language === "en") return `${count} ${unit}${count === 1 ? "" : "s"}`;
  if (language === "zh-CN") return `${count}${{ roll: " 卷", color: " 种颜色", pattern: " 个花型" }[unit]}`;
  if (language === "ja") return `${count}${{ roll: "反", color: "色", pattern: "柄" }[unit]}`;
  return `${count}${{ roll: "롤", color: "개 색상", pattern: "개 패턴" }[unit]}`;
}

const fabricNames: Record<string, readonly [string, string, string]> = {
  "10수OX": ["10s Oxford", "10支牛津布", "10番手オックスフォード"],
  "40수OX": ["40s Oxford", "40支牛津布", "40番手オックスフォード"],
  "40수체크": ["40s Check", "40支格纹", "40番手チェック"],
  "50수선염": ["50s Yarn-Dyed", "50支色织面料", "50番手先染め"],
  "50수체크": ["50s Check", "50支格纹", "50番手チェック"],
  "CN스판": ["CN Stretch", "CN 弹力面料", "CNストレッチ"],
  "CP선염": ["CP Yarn-Dyed", "CP 色织面料", "CP先染め"],
  "CP스판": ["CP Stretch", "CP 弹力面料", "CPストレッチ"],
  "TR OX": ["TR Oxford", "TR 牛津布", "TRオックスフォード"],
  "고밀도투일": ["High-Density Twill", "高密斜纹面料", "高密度ツイル"],
  "면선염": ["Yarn-Dyed Cotton", "色织棉布", "先染めコットン"],
  "모달": ["Modal", "莫代尔面料", "モダール"],
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
const fabricFamilies = new Map<string, readonly [string, string, string]>([
  ["OX", ["Oxford", "牛津布", "オックスフォード"]],
  ["옥스포드", ["Oxford", "牛津布", "オックスフォード"]],
  ["체크", ["Check", "格纹", "チェック"]],
  ["스트라이프", ["Stripe", "条纹", "ストライプ"]],
  ["선염", ["Yarn-Dyed", "色织面料", "先染め"]],
  ["선염체크", ["Yarn-Dyed Check", "色织格纹", "先染めチェック"]],
  ["선염스트라이프", ["Yarn-Dyed Stripe", "色织条纹", "先染めストライプ"]],
  ["고밀도투일", ["High-Density Twill", "高密斜纹面料", "高密度ツイル"]],
  ["고밀도트윌", ["High-Density Twill", "高密斜纹面料", "高密度ツイル"]],
  ["투일", ["Twill", "斜纹面料", "ツイル"]],
  ["트윌", ["Twill", "斜纹面料", "ツイル"]],
]);

const japaneseCatalogNames = new Map([
  ["멀티ST", "マルチストライプ"],
  ["변형체크", "変形チェック"],
  ["점선OX", "点線柄オックスフォード"],
]);

export function fabricName(name: string, language: Language) {
  if (language === "ko") return name;
  const key = fabricKey(name);
  const japaneseName = language === "ja" && japaneseCatalogNames.get(key);
  if (japaneseName) return japaneseName;
  const index = { en: 0, "zh-CN": 1, ja: 2 } as const;
  const known = knownFabricNames.get(key) ?? fabricFamilies.get(key);
  if (known) return known[index[language]];

  const match = /^([1-9][0-9]{0,2})수(.+)$/.exec(key);
  const family = match && !/^\d/.test(match[2]) && (fabricFamilies.get(match[2]) ?? knownFabricNames.get(match[2]));
  if (!match || !family) return name;
  const count = match[1];
  return { en: `${count}s ${family[0]}`, "zh-CN": `${count}支${family[1]}`, ja: `${count}番手${family[2]}` }[language];
}

const japaneseColors: Record<string, string> = {
  "Apricot": "アプリコット", "Beige": "ベージュ", "Black": "ブラック",
  "Blue": "ブルー", "Brown": "ブラウン", "Burgundy": "バーガンディ",
  "Dark Gray": "ダークグレー", "Dark Navy": "ダークネイビー", "Deep Blue": "ディープブルー",
  "Deep Sky Blue": "ディープスカイブルー", "Emerald Light Green": "ライトエメラルドグリーン", "Emerald Sky Blue": "エメラルドスカイブルー",
  "Green": "グリーン", "Green/Mint": "グリーン／ミント", "Indigo": "インディゴ",
  "Indian Pink": "インディアンピンク", "Jade": "ジェイドグリーン", "Khaki": "カーキ",
  "Light Sky Blue": "ライトスカイブルー", "Light Green": "ライトグリーン", "Light Navy": "ライトネイビー",
  "Mint": "ミント", "Navy": "ネイビー", "Optical White": "オプティカルホワイト",
  "Orange": "オレンジ", "Pink": "ピンク", "Purple": "パープル",
  "Red": "レッド", "Sky Blue": "スカイブルー", "White": "ホワイト",
  "White/Navy": "ホワイト／ネイビー", "Yellow": "イエロー",
};

export function colorName(color: string, language: Language) {
  if (language === "ja") return japaneseColors[color] ?? color;
  return language === "zh-CN" ? chineseColors[color] ?? color : color;
}
