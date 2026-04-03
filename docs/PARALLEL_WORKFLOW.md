# Parallel Workflow

이 문서는 같은 프로젝트를 여러 Codex 쓰레드가 병행 작업할 때 충돌 없이 운영하는 기준입니다.

## 핵심 규칙

- 기본 모델은 `1 쓰레드 = 1 worktree = 1 담당 범위` 입니다.
- 같은 실제 폴더를 두 쓰레드가 동시에 사용하면 안 됩니다.
- feature 쓰레드는 자기 담당 경로 안에서만 수정합니다.
- 공유 가드 파일은 기본적으로 통합 쓰레드만 수정합니다.
- production 배포 후보는 integration thread 가 조립하고, 최종 production branch 는 `main` 입니다.

## 역할 구분

### 1. 라우트 전용 쓰레드

- 예: `/products` UI, `/about` 텍스트/폰트
- 자기 담당 경로만 수정
- `npm run build`, `npm run verify`, `npm run verify:parallel` 까지만 수행
- production 배포 금지

### 2. 공유 가드 파일

기본적으로 feature 쓰레드가 수정하면 안 되는 파일들입니다.

- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/site/**`
- `src/lib/route-matrix.ts`
- `src/lib/seo.ts`
- `package.json`
- `vercel.json`
- `README.md`
- `AGENTS.md`
- `docs/**`

### 3. 통합/배포 쓰레드

- 여러 route workstream 변경을 모으는 쓰레드
- 필요한 경우 공유 가드 파일 수정 가능
- 최종 `npm run verify:deploy` 실행
- 승인된 후보를 `main`으로 승격한 뒤 production 배포 수행

## 권장 흐름

1. canonical repo에서 새 worktree를 만든다.
2. 전용 브랜치를 만든다.
3. `.omx/workstreams/active.json`에 현재 쓰레드를 등록한다.
4. 담당 경로 안에서만 수정한다.
5. `npm run build`
6. `npm run verify`
7. `npm run verify:parallel`
8. 통합 쓰레드에 결과를 넘긴다.
9. 통합 쓰레드가 병합 후 `npm run verify:deploy`
10. 통합 쓰레드가 승인된 후보를 `main`으로 승격한다
11. `main` push 로 production 배포를 발생시킨다

## worktree 생성 예시

```bash
./scripts/create-worktree.sh products-ui /products
./scripts/create-worktree.sh about-font /about
./scripts/create-worktree.sh integration-20260326 integration
```

## 충돌 방지 기준

- feature 쓰레드가 자기 범위 밖 파일을 수정하면 `verify:parallel` 실패
- feature 쓰레드가 guarded shared files 를 수정하면 `verify:parallel` 실패
- parallel mode 가 활성화된 상태에서 workstream 등록 없이 작업하면 `verify:parallel` 실패
- production 배포는 integration thread 가 조립한 `main` 후보 기준으로만 허용

## 운영 메모

- parallel mode 를 쓰지 않을 때는 `.omx/workstreams/active.json`의 `enabled`를 `false`로 둡니다.
- parallel mode 를 시작할 때는 `enabled`를 `true`로 바꾸고, active workstream 을 등록합니다.
- 새 쓰레드는 항상 `docs/THREAD_START.md`부터 읽고 시작합니다.
