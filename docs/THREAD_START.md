# 새 쓰레드 시작 가이드

새 Codex 쓰레드를 이 repo에서 시작하면 아래 순서대로 바로 확인합니다.

## 1분 체크리스트

1. 이번 쓰레드의 담당 영역이 무엇인지 적는다.
2. 현재 작업 폴더가 다른 쓰레드와 공유되지 않는 별도 worktree인지 확인한다.
3. 현재 브랜치가 이 쓰레드 전용 브랜치인지 확인한다.
4. 수정 가능한 소유 경로와 수정 금지 공유 경로를 확인한다.
5. `.omx/workstreams/active.json`에 현재 쓰레드가 등록되어 있는지 확인한다.
6. production 배포 권한이 있는 통합 쓰레드인지 확인한다.
7. 작업 전 `AGENTS.md`와 `docs/PARALLEL_WORKFLOW.md`를 읽는다.

## 기본 원칙

- 같은 실제 폴더를 두 개 이상의 쓰레드가 동시에 쓰면 안 됩니다.
- 기본 모델은 `1 쓰레드 = 1 worktree = 1 담당 범위` 입니다.
- feature 쓰레드는 자기 담당 경로 안에서만 수정합니다.
- 공유 shell, 배포, route, SEO 파일은 기본적으로 통합 쓰레드만 수정합니다.
- production 배포는 통합/배포 전담 쓰레드만 할 수 있습니다.

## 공유 가드 파일

기본적으로 feature 쓰레드는 아래 파일/경로를 수정하지 않습니다.

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

## 시작 템플릿

### `/products` UI 수정 쓰레드

```text
이번 쓰레드는 /products UI 전용 작업이다.
작업 폴더는 전용 worktree만 사용한다.
수정 허용 경로는 src/app/products/**, src/components/products/** 이다.
공유 가드 파일은 수정하지 않는다.
production 배포는 하지 않고 build/verify/verify:parallel까지만 수행한다.
```

### `/about` 폰트/텍스트 수정 쓰레드

```text
이번 쓰레드는 /about 텍스트와 폰트 표현 전용 작업이다.
작업 폴더는 전용 worktree만 사용한다.
수정 허용 경로는 src/app/about/**, src/components/about/** 이다.
공유 가드 파일은 수정하지 않는다.
production 배포는 하지 않고 build/verify/verify:parallel까지만 수행한다.
```

### 통합/배포 전담 쓰레드

```text
이번 쓰레드는 통합과 production 배포 전담이다.
다른 workstream에서 완료된 변경만 모아서 검증한다.
필요한 경우에만 공유 가드 파일을 수정한다.
production 배포 전 npm run verify:deploy 를 반드시 실행한다.
```
