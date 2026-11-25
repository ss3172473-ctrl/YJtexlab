# Swatches production setup

This repository contains code only for Swatches. Never commit approved media,
storage or Sheet IDs, production layout data, customer codes, or credentials.
Keep the storage folders restricted; do not make links public.

## Required server configuration

- Set the dedicated `SWATCHES_GOOGLE_SERVICE_ACCOUNT_JSON` as a secret on the
  hosting service. Hosted builds do not fall back to Contact credentials. For
  local previews only, the existing `GOOGLE_SERVICE_ACCOUNT_JSON` or an
  external trusted file via `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` still works when
  no dedicated value is set. A malformed dedicated value never falls back.
  Keep the existing Contact identity for Contact and inquiry delivery, and
  never put credentials in Git, build logs, or a `NEXT_PUBLIC_*` setting.
- Set `SWATCHES_INVENTORY_SHEET_ID` and `SWATCHES_CRM_SHEET_ID` explicitly.
  No production IDs are embedded and absent or invalid IDs do not fall back
  to another Sheet. The server reads live inventory; never publish Sheet photo
  links or use public catalog caching. Inventory must be readable, and
  the authorized CRM access-log sink must be writable before login is issued.
- Inventory contract: `상품 정보` has `SKU`, `패턴 그룹`, `Color`,
  `품 명`, `수출가(원/yd)`, `혼용률`, `inch`; `재고DB` has `SKU`, `yd`, and
  `상태`. Preserve leading zeroes in customer codes by using plain-text cells.
  CRM `업체현황` needs `업체명`, `이메일`, `고객 코드`, `활성 상태`.
  CRM `Swatches 접속 기록` appends date/time (KST), company, email, and
  campaign. Keep the test and customer code sets separate and unique.
- Set a fresh server-only `SWATCHES_SESSION_SECRET` of at least 32 characters.
  On the live host add a cross-instance rate limit for
  `POST /api/swatches/access`; the in-process limit is not global.
- Optional approved design data comes from the private tab
  `Swatches 디자인 설정` A1 in `SWATCHES_DESIGN_SHEET_ID`. Without a
  configured Sheet or approved data, the layout uses an empty configuration,
  not a local preview snapshot. The separately protected editor additionally
  requires a different `SWATCHES_ADMIN_KEY` of at least 32 characters.
- Existing Contact settings are `GOOGLE_CONTACT_SPREADSHEET_ID`,
  `GOOGLE_CONTACT_SHEET_NAME`, `CONTACT_EMAIL_WEBHOOK_URL`, and
  `CONTACT_EMAIL_WEBHOOK_SECRET`; keep the host secret and confirm the
  Apps Script recipient before enabling real inquiries.

## 업체별 가격 공개 이관 제안

1. CRM 담당자가 `업체현황`의 업체명·고객 코드·활성 상태를 대조하고, 중복된 활성 코드와 가격 승인 대상을 검토한다. 기존 코드와 선행 0을 유지한다.
2. 같은 업체 행에 텍스트 열 `가격 공개`를 하나 추가한다. 신규 행은 빈칸 또는 `비공개`로 시작한다. 승인된 활성 업체만 정확히 `공개`로 설정한다. 열 누락·중복, 빈칸, 불리언, 오타, 앞뒤 공백은 모두 비공개다. 활성 상태와 가격 공개 승인은 별도다.
3. 기존 활성 업체도 행별 승인 명단과 대조한다. 운영 관리자가 고객 화면에서 가격을 확인해야 하면 담당자의 기존 활성 CRM 행을 명시적으로 승인한다. 디자인 편집 키는 가격 권한을 부여하지 않는다. 이 절차는 제안이며 운영 CRM에는 적용하지 않았다.
4. 적용 전 테스트 CRM에서 A(공개), B(비공개), C(빈칸 → 비활성)를 각각 기존 코드로 확인한다. 언어 선택, 코드, 업체명, 상세, 장바구니, 견적 접수 순으로 확인한다. 운영 반영 시 고객에게 새 코드를 발급할 필요가 없다.

카탈로그·문의는 로그인 때 발급된 메모리 전용 방문 키와 HttpOnly 쿠키를 함께 확인한 다음 매번 활성 업체 행을 읽는다. 새 문서에는 방문 키가 없다. 가격 권한은 세션이나 미디어 조회 캐시에 저장하지 않는다. 탭 복귀, 장바구니 열기, 재고 충돌 시 카탈로그를 다시 읽는다. 이미 승인되어 열린 화면의 표시값은 다음 확인 때 갱신된다. 상시 30초 조회는 없다.

비공개 업체는 롤 ID만 보낸다. 공개 업체의 표시 단가는 변경 감지에만 쓴다. 서버가 문의 직전에 재고와 수출 단가를 다시 읽고 최신 수치로 접수 내용을 계산한다. 비공개 견적의 단가가 아직 비어 있으면 내부 접수에 단가 확인이 필요하다고 기록한다. 409를 받은 브라우저는 현재 업체 권한으로 카탈로그를 다시 조회한다.

### 권한 회수와 롤백

- 가격 공개만 회수하려면 해당 행을 `비공개`로 변경한다. 업체 접근도 회수하려면 `활성 상태`를 비활성으로 바꾼다. 카탈로그·문의는 다음 요청부터 반영한다. 기존 미디어 전용 활성 코드 캐시는 최대 15초다.
- 이 변경을 아직 통합하지 않은 경우 feature 브랜치를 승격 대상에서 제외하면 된다.
- 운영 적용 후 코드를 되돌려야 한다면 이전 버전이 모든 활성 업체에 가격을 제공한다는 점을 먼저 확인한다. 비공개 고객의 접근을 임시 차단하거나 가격을 제거한 서버 버전을 준비한 뒤 통합 담당자가 롤백한다. CRM 열만 지운 상태에서 이전 버전을 복원하면 가격이 노출될 수 있다. 코드·업체명 연결과 기존 문의 기록은 보존한다.

## Private media

Each type uses its own dedicated restricted folder and approved manifest in
server environment settings. Give the deployed service account Viewer access
only to the specific approved folders.

| Media | Folder setting | Manifest setting | Drive mime type |
| --- | --- | --- | --- |
| Original video | `SWATCHES_DRIVE_VIDEO_FOLDER_ID` | `SWATCHES_DRIVE_VIDEO_MANIFEST` | `video/mp4` |
| Approved front | `SWATCHES_DRIVE_FRONT_FOLDER_ID` | `SWATCHES_DRIVE_FRONT_MANIFEST` | `image/webp` |
| Approved reverse | `SWATCHES_DRIVE_REVERSE_FOLDER_ID` | `SWATCHES_DRIVE_REVERSE_MANIFEST` | `image/webp` |

All manifests have shape `{"version":1,"assets":[{"sku":"<SKU>","fileId":"<private file ID>","bytes":<integer>,"md5":"<lowercase MD5>"}]}`.
Compare each entry to the approved original before configuring. Images must
be named `<SKU>.webp`, videos `<SKU>.mp4`, and be direct children of their
respective folders. Invalid, absent, crossed, or unlisted media is not served.
The browser receives authenticated same-origin routes, never a Drive URL,
Drive ID, or token. Validate the total hosting environment size privately.

Explicit local paths for review only:
`SWATCHES_APPROVED_MEDIA_DIRECTORY` (png/),
`SWATCHES_ORIGINAL_VIDEO_DIRECTORY` (mp4/),
`SWATCHES_REVERSE_TEXTURE_DIRECTORY` (webp/) with a comma-separated
`SWATCHES_LOCAL_REVERSE_SKUS`. No media is assumed to exist inside the
checkout. Do not package private source directories in public assets.
The existing explicit private bucket settings, if present, still work for
supported front/video objects and never grant public URLs.

## Verification before publishing

Run the Swatches route tests, TypeScript, and production build. In the staged
host verify the guest sees no catalog or asset payload; a designated internal
customer code grants access and records a single login; live catalogue and
inquiry validation use the intended Sheets; front and reverse bytes match the
approved assets; and original video seeking yields a correct 206 response.
Review tracked changes and generated static files for secrets, IDs, customer
data, and asset bytes before any public push. Keep a known-good rollback target.
