# Vercel 배포 운영

- 기존 운영 프로젝트와 GitHub 저장소를 유지한다. 새 Vercel 프로젝트를 만들지 않는다.
- 기본 브랜치의 소스 변경 또는 수동 실행(입력 비움)은 해당 커밋의 로그인 보호 Preview만 만든다. 운영 도메인은 바꾸지 않는다.
- 운영 반영은 Ego에서 화면·인증·읽기 전용 API를 확인한 다음 Actions에서 확인한 Preview의 `dpl_…` ID를 넣어 수동 실행한다. Preview와 현재 main SHA 및 프로젝트가 다르면 중단한다. Vercel이 운영 환경변수로 다시 빌드한다.
- 배포 전에 무과금 Actions 예산 차단, 기존 운영 배포 ID 및 롤백 가능 여부를 확인한다. 업무 데이터 쓰기나 고객 발송으로 검증하지 않는다. 운영 오류가 생기면 배포 영수증에 적힌 이전 ID로 Vercel에서 롤백한다.
- `YJ_VERCEL_DEPLOY_TOKEN`은 회사 Vercel 팀 배포 전용이다. GitHub Secret으로만 관리하고 토큰 만료 전에 교체한다. 전체 GitHub 앱 권한을 늘리지 않는다.
