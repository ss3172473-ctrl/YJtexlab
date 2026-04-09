# Parallel Workflow

이 문서는 같은 프로젝트를 여러 Codex 쓰레드가 병행 작업할 때 충돌 없이 운영하는 기준입니다.

## 핵심 규칙

- 기본 operator 모델은 `2공간` 입니다.
- canonical root `/Users/leesungjun/Desktop/yjtexlab.com` 는 integration/deploy 기준으로 최대한 깨끗하게 유지합니다.
- 실제 기능 수정은 feature worktree에서만 진행합니다.
- 일반 사용 흐름에서는 새 쓰레드에서 `parallel-workstream-guard`를 먼저 호출하고, helper script 실행은 에이전트가 대신 수행합니다.
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

1. canonical root 에서 `./scripts/start-workstream.sh feature ...` 또는 `integration ...` 로 전용 worktree를 만든다.
2. 전용 브랜치를 확인한다.
3. `npm run hooks:install` 로 hook guard 를 활성화한다.
4. 필요할 때만 `.omx/workstreams/active.json`에 현재 쓰레드를 등록한다.
5. 담당 경로 안에서만 수정한다.
6. `npm run build`
7. `npm run verify`
8. `npm run verify:parallel`
9. feature 작업이 끝난 것 같으면 `npm run workstream:next` 를 보고, 사용자에게 `main 승격할지` 먼저 묻는다.
10. `./scripts/handoff-workstream.sh` 로 BASE_SHA 대비 승격 범위를 정리한다.
11. canonical root 가 지저분하면 `npm run workstream:audit` 로 먼저 분류한다.
12. 통합 쓰레드가 승인된 diff만 병합 후 `npm run verify:deploy`
13. 통합 쓰레드가 승인된 후보를 `main`으로 승격한다
14. `main` push 로 production 배포를 발생시킨다

## worktree 생성 예시

```bash
./scripts/start-workstream.sh feature products-ui /products \
  --owned-path src/app/products \
  --owned-path src/components/products

./scripts/start-workstream.sh feature about-font /about \
  --owned-path src/app/about \
  --owned-path src/components/about

./scripts/start-workstream.sh integration deploy-20260407 integration
```

## 충돌 방지 기준

- feature 쓰레드가 자기 범위 밖 파일을 수정하면 `verify:parallel` 실패
- feature 쓰레드가 guarded shared files 를 수정하면 `verify:parallel` 실패
- parallel mode 가 활성화된 상태에서 workstream 등록 없이 작업하면 `verify:parallel` 실패
- production 배포는 integration thread 가 조립한 `main` 후보 기준으로만 허용
- `pre-push` hook 는 non-main branch 에서 `main` 직접 push 를 막고, clean `main` 이 아니면 `main` push 를 막습니다.
- `post-commit` hook 는 feature 작업이 handoff 단계인지 요약하고, `main 승격할지` 먼저 묻게 유도합니다.

## 운영 메모

- parallel mode 를 쓰지 않을 때는 `.omx/workstreams/active.json`의 `enabled`를 `false`로 둡니다.
- parallel mode 를 시작할 때는 `enabled`를 `true`로 바꾸고, active workstream 을 등록합니다.
- 새 쓰레드는 항상 `docs/THREAD_START.md`부터 읽고 시작합니다.
- canonical root 에서 기능 개발을 바로 시작하지 않습니다. 예외는 단독 긴급 integration 작업뿐입니다.
- canonical root 가 dirty 해지면 자동 삭제하지 말고 `npm run workstream:audit` 로 먼저 `승격 / 별도 feature / 로컬 artifact` 로 분류합니다.
