# Phase 0~1 검증 기록

검증일: 2026-09-15

## 환경

- macOS arm64, Node.js 24.14.1
- Next.js 16.3.5, Prisma 7.10.0
- 임시 로컬 PostgreSQL 18.4 (`embedded-postgres`), 서버 시간대 Asia/Seoul
- production 빌드 `next start` + 테스트 전용 HTTPS 프록시
- Playwright Chromium, 모바일 390×844 / PC 1440×1000
- 테스트마다 난수 자격증명 생성. 실제 고객 데이터나 운영 DB 사용 없음.

## 결과

| 검증 | 결과 |
| --- | --- |
| `npm run lint` | 통과, 오류·경고 없음 |
| `npm run typecheck` | 통과 |
| `npm run build` | 통과 |
| `npm run test` | 5개 통과 |
| `npm run test:integration` | 실제 DB·HTTPS·브라우저 통합 테스트 통과 |
| 빈 PostgreSQL migration 적용 | 통과 |
| SUPER_ADMIN seed / 반복 시 비밀번호 유지 | 통과 |
| 정상·실패 로그인 / CSRF / Zod 검증 | 통과 |
| 비로그인·위조 세션 관리자 접근 차단 | 통과 |
| HttpOnly·Secure·SameSite·Path·Domain 미설정 | 통과 |
| 세션 원문 미저장 / SHA-256 해시 저장 / 로그인 시 교체 | 통과 |
| 한국 시간대 DB에서도 정확한 8시간 만료 | 통과 |
| 비활성·잠금·삭제 계정, 만료 세션 차단 | 통과 |
| 로그아웃 세션 삭제 및 이전 토큰 재사용 차단 | 통과 |
| 동시 로그인 요청 12개 중 10개 인증실패 / 2개 429 | 통과 |
| 제한 시간 경과 후 재시도 | 통과 |
| 활동로그 기록·비밀번호 원문 미포함 | 통과 |
| 모바일/PC 로그인·로그아웃, 메뉴 표시 | 통과 |
| 모바일 가로 스크롤 없음, 브라우저 JS 오류 없음 | 통과 |

## 수정한 문제

1. 통합 테스트의 NODE_ENV 타입 추론 오류: literal type으로 수정.
2. PostgreSQL Asia/Seoul과 Prisma adapter 날짜 변환의 차이로 만료 시각이 어긋남: 모든 Prisma 연결을 UTC로 고정하고 세션 조회에 만료 조건 추가. DB에서 직접 8시간 수명을 확인하는 회귀 검증 추가.
3. 모바일 한글 단어 중간 줄바꿈: keep-all 적용.
4. 테스트 의존성의 종료 훅 때문에 실패 시 종료코드가 0이 될 수 있었음: 실패 시 명시적 종료코드 1 적용.

빌드/테스트 실행기의 로컬 소켓 및 브라우저 설치는 샌드박스에서 차단되어 승인된 확장 권한으로 실행했습니다.

## 아직 검증하지 않은 범위

- 실제 iPhone Safari, Android 기기, Edge 및 Safari의 전체 QA
- Docker Compose 실행 (이 환경에는 Docker가 없어 embedded PostgreSQL로 검증)
- GitHub Actions 원격 실행, Vercel 배포, 운영 DB TLS/권한/백업
- Phase 2 이후 상담·파일·관리 업무 기능

통합 테스트에서 생성한 계정과 DB는 종료 시 삭제됩니다. 실제 사용 계정은 `.env` 설정 후 `npm run db:seed`로 생성합니다.

# Phase 2 검증 기록

검증일: 2026-09-15. 동일한 macOS/Node.js 환경에서 새 임시 PostgreSQL DB에 Phase 1+2 migration을 적용했습니다.

| 검증 | 결과 |
| --- | --- |
| lint / typecheck / production build | 통과 |
| 단위 테스트 | 기존 5개 + 접수/영수 확인 쿠키 5개, 총 10개 통과 |
| 개인정보 보유기간 미설정 | 폼 미표시, 접수 API 503 확인 |
| 잘못된 입력·미동의·다른 Origin·권한 필드 주입 | 거부, DB 접수 미생성 |
| 잘못된 JSON / JSON 외 형식 / 본문 크기 초과 | 각각 400 / 415 / 413 |
| 실제 접수 저장 | 연락처 정규화·선택 날짜·동의 시각/버전·NEW 이력 확인 |
| 기존 동의 버전 제출 | 409 |
| 같은 키/내용 재시도 | 동일한 응답, 접수/이력 추가 없음 |
| 같은 키/다른 내용 재사용 | 409 |
| 같은 키 동시 요청 5개 | 접수 1건 |
| 서로 다른 키 동시 요청 8개 | 중복 없는 접수번호 8개 |
| 이력 저장 실패 강제 주입 | 접수·이력·번호 카운터 전부 rollback |
| 당일 10,000번째 접수 | 최소 4자리 정책에 따라 5자리 확장 확인 |
| IP당 15분 30회 제한과 만료 후 재시도 | 429 및 만료 후 생성 확인 |
| URL로 완료 번호 위조, 비로그인 조회 | 완료 페이지 redirect, 공개 조회 API 없음 |
| 완료 화면 / 쿠키 | 개인정보 미포함, no-store/noindex, Secure/HttpOnly/SameSite 확인 |
| 모바일 5단계, 이전 이동, 필드/동의 오류 | Chromium에서 통과 |
| 서버 저장 성공 후 브라우저 응답 유실 | 오류 안내 후 재시도 성공, DB 접수는 1건 유지 |
| 완료 화면 새로고침 | 유효한 쿠키로 정상 표시 |
| 고객정보 브라우저 저장소 저장 여부 | localStorage/sessionStorage에 고객 정보 없음. 성공 후 요청 키도 제거 |
| 모바일 390×844 / PC 1440×1000 | 가로 넘침 없음, 화면 스크린샷 직접 확인, JS 오류 없음 |
| 기존 관리자 인증 회귀 테스트 | 모두 통과 |

잘못된 JSON 검증 중 Playwright가 문자열을 JSON 문자열로 직렬화한 테스트 오류를 발견하여, raw Buffer로 보내도록 수정했습니다.

스크린샷은 통합 테스트가 출력하는 임시 디렉터리에 생성됩니다: contact-mobile-step1.png, contact-mobile-review.png, contact-mobile-complete.png, contact-desktop.png.

운영자 개인정보 보유기간은 아직 미정입니다. 실제 운영 기간을 임의로 사용하지 않았으며 테스트에서는 명시적인 테스트 전용 문구만 설정했습니다. 개인정보 문의 연락처는 사용자 확인값 010-1234-1234를 `.env.example`과 정책 문서에 반영했습니다.

실기기 Safari/Android QA, 전체 운영 개인정보 처리방침·파기 절차, 외부 배포 및 사진 업로드는 이번 범위에 포함되지 않습니다.

# Phase 3 검증 기록

검증일: 2026-09-15. 임시 PostgreSQL, S3rver, HTTPS 프록시와 Chromium으로 검증했습니다.

| 검증 | 결과 |
| --- | --- |
| lint / typecheck / production build | 통과 |
| 단위 테스트 | 총 15개 통과 |
| 기존 인증·접수·migration·반복 seed 회귀 | 통과 |
| 소유권 키 누락·불일치·만료, 다른 Origin | 차단 확인 |
| Signed PUT 직접 업로드와 완료 재시도 | 첨부 중복 생성 없음 |
| 4.5MB 초과, 10MiB 이하 실제 PNG | 직접 업로드 및 변환 성공 |
| JPG·PNG·WebP·실제 HEIC/HEIF | JPEG 정규화, 크기 제한, 메타데이터 제거 확인 |
| 위조 이미지·손상 데이터·해시 불일치 | 거부 확인 |
| 동시 11개 예약 | 10개 성공, 1개 거부 |
| 관리자 전용 Signed GET 발급 | 비로그인·삭제 첨부·삭제 접수 차단 |
| 원본 PUT URL 재사용 | 저장 완료된 정규화 이미지에 영향 없음 |
| 모바일 선택·미리보기·개수 제한 | 통과, 스크린샷 직접 확인 |
| 접수 응답 및 첨부 완료 응답 유실 후 재시도 | 접수와 첨부 각각 중복 없음 |
| 스토리지 정리 명령 dry run | 임시 DB·스토리지에서 정상 종료 |

정리 명령 검증을 동기 자식 프로세스로 실행하면 같은 테스트 프로세스의 S3rver 응답이 막히는 문제를 발견해 비동기 실행으로 수정했고, 전체 통합 테스트를 다시 통과했습니다.

S3rver는 실제 클라우드 IAM·비공개 ACL·서명 만료 정책의 완전한 검증 도구가 아닙니다. 운영 제공자의 비공개 버킷, CORS, 수명 주기와 권한은 배포 환경에서 별도 검증해야 합니다. 정리 명령의 실제 삭제와 실기기 Safari/Android는 이번에 검증하지 않았습니다.

운영 DB·스토리지와 개인정보 보유기간은 아직 설정하지 않았습니다. 검증용 비밀번호와 DB는 테스트 종료 시 폐기했습니다.

## 수동 브라우저 체험 환경

`npm run dev:demo`는 임시 PostgreSQL과 S3 호환 저장소를 구성하고 migration·SUPER_ADMIN seed 후 HTTPS 개발 서버를 실행합니다. 관리자 비밀번호와 다른 비밀값은 실행 때마다 생성하며 파일에 기록하지 않습니다. `Ctrl+C` 종료 시 접수·사진을 포함한 임시 디렉터리를 삭제합니다. 이 환경의 개인정보 보유기간 표시는 기능 확인용이며 운영정책이 아닙니다.

임시 인증서 생성, migration 3개 적용, seed, `/contact` HTTPS 200 응답과 사진 선택 기능 활성화를 확인했습니다. macOS 관리자 권한이 필요한 Next.js 인증서 자동 설치 대신 실행 디렉터리 안에 하루짜리 임시 OpenSSL 인증서를 생성하도록 구성했습니다.

# Phase 4 검증 기록

검증일: 2026-09-15. Phase 0~3 회귀 검증과 함께 새 임시 PostgreSQL·S3rver·production 서버·HTTPS Chromium에서 실행했습니다.

| 검증 | 결과 |
| --- | --- |
| lint / typecheck / production build | 통과 |
| 단위 테스트 | 기존 15개 + 관리자 query 3개, 총 18개 통과 |
| 목록·상세 API 비로그인 접근 | 401 차단 |
| 고객명·형식 포함 전화번호 검색 | 일치 접수만 반환 |
| 상태·문의유형·담당자·한국 날짜 필터 | 통과 |
| 정렬·20개 페이지네이션 | 2페이지 결과 확인 |
| 잘못된 pageSize/status/기간/임의 query/범위 초과 ID | 422 또는 404 확인 |
| 접수·첨부 Soft Delete | 목록/상세/사진에서 제외 |
| 상세 응답 최소화 | 요청 소유 해시·payload 해시·storage key 미반환 |
| 목록·상세 열람 활동 로그 | 개인정보 없이 기록 확인 |
| 모바일 접수 카드·하단 메뉴 | 전화 링크, 활성 메뉴, 가로 넘침 없음 |
| PC 접수 테이블·2열 상세 | Chromium 화면 확인 |
| 상세 고객·주소·문의·사진·상태·이력 | 표시 및 보호 사진 로딩 확인 |
| 전화 `tel:`·네이버 지도 주소 검색 링크 | 올바른 목적 URL 확인 |

스크린샷: `inquiries-mobile.png`, `inquiry-detail-mobile.png`, `inquiries-desktop.png`, `inquiry-detail-desktop.png`. 통합 테스트가 출력하는 임시 디렉터리에 생성됩니다.

상태 변경, 담당자 지정, 메모 작성은 Phase 5 범위로 남겨두었으며 Phase 4 상세에서는 기존 데이터를 읽기만 합니다. 외부 지도는 링크 형식까지만 검증했고 실제 지도 서비스 UI는 자동 조작하지 않았습니다.

# Phase 5 검증 기록

검증일: 2026-09-16. 최신 production build와 임시 PostgreSQL·S3rver·HTTPS Chromium에서 Phase 0~4 회귀 검증을 포함해 실행했습니다.

| 검증 | 결과 |
| --- | --- |
| lint / typecheck / production build | 통과 |
| 상태 변경 | 동일 Origin·입력 검증·DB 상태·상태 이력·활동 로그 확인 |
| 같은 상태 재저장 | `changed: false`, 이력 추가 없음 |
| 담당자 배정/해제 | 활성 관리자 검증, 담당자 이력·활동 로그 확인 |
| 메모 생성/수정/삭제 | 201/200/200, Soft Delete 및 활동 로그 확인 |
| 타임라인 API | 상태·담당자·메모 이벤트 포함 확인 |
| 모바일 상세 업무 처리 | 실제 상태 변경과 메모 등록, 성공 안내, 가로 넘침 없음 |
| 기존 고객 접수·사진·관리자 목록/상세·정리 dry run | 전체 회귀 통과 |

브라우저 테스트에서 메모 등록 뒤 서버와 브라우저의 날짜 형식이 달라 React hydration 오류가 발생한 것을 발견했습니다. 메모 시각을 서버에서 한국 시간 문자열로 확정해 전달하도록 수정했고, 같은 브라우저 테스트를 다시 통과했습니다.

스크린샷 `inquiry-detail-mobile.png`에는 상태 변경, 담당자 지정, 메모 등록과 이력을 포함합니다. 방문/견적은 Phase 6 범위입니다.

# Phase 6 검증 기록

검증일: 2026-09-16. 임시 PostgreSQL·S3rver·HTTPS Chromium 환경에서 기존 Phase 0~5 회귀와 함께 확인합니다.

| 검증 | 결과 |
| --- | --- |
| 방문 일정 | 등록, 목록 조회, 방문 완료 및 접수 상태 이력 반영 |
| 견적 | 등록, 상태 수정, Soft Delete |
| 관리자 첨부 | 작업 사진과 PDF/XLSX 견적 파일의 Signed PUT, 서버 검증, 보호 URL, Soft Delete |
| 모바일 관리자 | 접수 상세에서 방문·견적 등록, 사진·파일 업로드, 방문 완료 처리 |

# Phase 7 검증 기록

검증일: 2026-09-16. 임시 PostgreSQL·HTTPS Chromium 환경에서 모바일과 PC 공개 화면을 확인했습니다.

| 검증 | 결과 |
| --- | --- |
| 고객 홈 | 핵심 메시지, 서비스, 문의 상황, 절차, 상담 CTA 표시 |
| 공개 경로 | 회사소개, 서비스/개별 서비스, 작업사례, FAQ HTTP 200 확인 |
| 반응형 | 모바일 메뉴·고정 상담 CTA, 모바일/PC 가로 넘침 없음 |
| 공개 데이터 | 작업사례·FAQ는 published·Soft Delete 필터 적용, 데이터 없을 때 빈 상태 표시 |

# Phase 8 검증 기록

검증일: 2026-09-16. 임시 PostgreSQL·S3rver·HTTPS Chromium 환경에서 기존 회귀와 함께 CMS API를 확인했습니다.

| 검증 | 결과 |
| --- | --- |
| 작업사례 | 생성·공개 조회·수정·Soft Delete, 공개 API 필터 확인 |
| FAQ | 생성·공개 조회·공개 상태 수정·Soft Delete 확인 |
| 사이트 설정 | SUPER_ADMIN 설정 저장과 공개 설정 API 확인 |
| 관리자 계정 | 생성·활성 상태 변경·비밀번호 재설정과 세션 폐기 경로 확인 |
| 회귀 | 기존 접수, 업로드, 방문·견적, 고객 공개 웹, 관리자 UI 통합 테스트 통과 |

# Phase 9 검증 기록

검증일: 2026-09-16. production build와 임시 HTTPS 환경에서 SEO 경로를 확인했습니다.

| 검증 | 결과 |
| --- | --- |
| metadata / canonical / Open Graph | 루트 metadataBase와 공개 경로별 canonical 생성 |
| sitemap / robots | `/sitemap.xml` 200, 서비스 URL 포함 및 관리자·API robots 차단 |
| 구조화 데이터 | 확인된 업체 정보만 담은 LocalBusiness JSON-LD 렌더링 |
| GA4 | 측정 ID가 유효할 때만 스크립트·이벤트 활성화, 기본 환경에서는 외부 분석 요청 없음 |

# Phase 10 QA 기록

검증일: 2026-09-16. 실제 고객 데이터·운영 DB·운영 저장소를 사용하지 않고 임시 PostgreSQL, S3rver, production `next start`, 테스트 HTTPS 프록시와 Playwright Chromium에서 실행했습니다.

| 영역 | 결과 |
| --- | --- |
| 정적 검사 | `npm run lint`, `npm run typecheck`, `git diff --check` 통과 |
| 단위 테스트 | `npm run test` 18개 통과: 인증, CSRF, 입력·동의, 영수 확인, 이미지 정규화·HEIC·저장소 설정 |
| production build | `npm run build` 통과, 24개 정적 생성 경로와 동적 API 라우트 확인 |
| 상담 접수 | 정상 접수, validation, 개인정보 미동의, 중복 재시도, 동시 접수, 롤백, 접수 완료 개인정보 비노출 확인 |
| 파일 | 10장 제한, 10MiB 제한, 위조·손상·해시 불일치 거부, HEIC 포함 JPEG 정규화, 보호 URL 확인 |
| 인증·권한 | 로그인 실패·제한·CSRF·세션 교체·비활성/잠금/삭제 계정·SUPER_ADMIN 경계 확인 |

## 단일 관리자 운영 정책

- `Admin.singleton_key`의 PostgreSQL unique index로 관리자 행을 한 개로 제한합니다.
- 관리자 생성·상태 변경 API는 `403 FORBIDDEN`을 반환합니다.
- 초기 `SUPER_ADMIN`은 `npm run db:seed`로만 생성하며, 비밀번호는 해시로 저장됩니다.
| 운영 기능 | 상태·담당자 이력, 메모 Soft Delete, 방문·견적·PDF 보호 첨부 확인 |
| CMS·SEO | 작업사례·FAQ 공개 필터와 Soft Delete, 설정·계정 관리, sitemap·공개 경로 확인 |
| 반응형 | Chromium 모바일 390×844와 PC 1440×1000에서 고객·관리 화면의 가로 넘침 및 JS 오류 없음 |

## 배포 전 수동 확인 항목

- 실제 iPhone Safari, Android Chrome, 데스크톱 Safari·Edge에서 고객·관리자 핵심 흐름 확인
- 운영 PostgreSQL TLS·최소 권한·백업/복원, 실제 비공개 Object Storage IAM·CORS·수명주기 확인
- 확정된 개인정보 보유기간·파기 절차·대표 전화번호·도메인·GA4 측정 ID를 운영 환경변수에 반영
- Preview와 Production의 `APP_ORIGIN`, DB, 저장소, 비밀값을 분리해 배포 후 로그인·접수·첨부·sitemap 재확인
