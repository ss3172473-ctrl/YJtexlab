# Design Notes

## Brand Direction

- Korean and English text both use SUIT as the default typeface.
- The site should feel editorial, clean, and export-oriented rather than overly experimental.
- Motion should support the brand story, not overpower it.
- Production baseline date: 2026-03-26.
- Typography changes away from SUIT require explicit design approval.

## Homepage Composition

1. Header
2. Original hero video
3. Categories preview
4. Partners
5. Global Presence
6. Locations
7. Footer

## Separation Rule

- Product archive treatments can be richer and more experimental.
- Homepage sections must stay restrained and must not inherit product-only hero copy or stray route shells.
- Homepage categories media-art is owned by `src/components/home/FabricMotionLab.tsx`.
- `src/components/home/Categories.tsx` and `src/components/home/FabricMotionLab.tsx` are a default no-touch area unless the user explicitly requests a Categories change.
- Do not import homepage media-art from `src/components/products/**`.

## Map Section

- The world map should remain legible.
- Airline path effects can be animated, but labels and country names must stay readable.

## CRM 관리자 화면

`/admin/crm`은 인증된 회사 관리자에게만 업체 목록과 세부 정보를 보여줍니다. 코드는 발급 즉시 사용 가능하며 별도의 활성 토글을 제공하지 않습니다. 가격 공개는 업체별로 명시적으로 확인하고 변경합니다. 원문 코드는 일괄 목록에 표시하지 않습니다.
