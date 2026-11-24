# Swatches production setup

This repository contains code only for Swatches. Never commit approved media,
storage or Sheet IDs, production layout data, customer codes, or credentials.
Keep the storage folders restricted; do not make links public.

## Required server configuration

- Set `GOOGLE_SERVICE_ACCOUNT_JSON` on the hosting service only. A local
  operator can point `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` at an external trusted
  file. Do not put credential material in code, build logs, or any
  `NEXT_PUBLIC_*` variable.
- Set `SWATCHES_INVENTORY_SHEET_ID` and `SWATCHES_CRM_SHEET_ID` explicitly.
  No production IDs are embedded and absent or invalid IDs do not fall back
  to another Sheet. The server reads live inventory; never publish Sheet photo
  links or use public catalog caching. Inventory must be readable, and
  the authorized CRM access-log sink must be writable before login is issued.
- Inventory contract: `상품 정보` has `SKU`, `패턴 그룹`, `Color`,
  `품 명`, `가격`, `혼용률`, `inch`; `재고DB` has `SKU`, `yd`, and
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
