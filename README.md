# OK소방

고객용 반응형 웹과 모바일 현장용 관리자 웹을 하나의 Next.js App Router 프로젝트로 개발합니다.
요구사항은 [docs/README.md](docs/README.md), 구현 순서는 [06_IMPLEMENTATION_PLAN.md](docs/06_IMPLEMENTATION_PLAN.md)를 따릅니다.

## 현재 구현 범위

**Phase 0~8:** Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / Prisma 7 / PostgreSQL / Zod 기반.

- 문서의 13개 업무 테이블, 외래키·인덱스·Soft Delete 필드, 초기 SQL migration
- 세션 및 로그인 시도 제한 테이블
- 초기 SUPER_ADMIN seed (반복 실행 시 기존 비밀번호·권한 변경 없음)
- 관리자 로그인·로그아웃·현재 사용자 API, 보호된 관리자 홈, 모바일 하단 메뉴
- scrypt 비밀번호 해시, 8시간 DB 세션, HttpOnly / Secure / SameSite=Lax / `__Host-` 쿠키
- CSRF Origin 검증, DB 기반 로그인 제한, 활동 로그, noindex, 보안 헤더
- 단위 테스트, 실제 PostgreSQL + production 서버 + Chromium 통합 테스트, GitHub Actions
- 5단계 상담접수, 선택 공사 희망일, 서버/브라우저 Zod 검증
- 원자적 일별 접수번호, 접수·NEW 이력 트랜잭션, 응답 유실 시 중복 방지
- 서명 쿠키 기반 완료 화면, 개인정보 안내 설정, 공개 API 요청 제한
- 관리자 접수 목록·상세, 통합 검색·필터·정렬·페이지네이션, 모바일 카드·PC 테이블
- 고객·현장·문의·첨부사진 확인, 전화 연결, 지도 검색 링크, 민감정보 열람 활동 로그
- 상태 변경 이력, 담당자 지정 이력, 작성자/최고관리자 메모 수정·삭제, 접수 타임라인
- 고객 홈페이지, 회사소개, 서비스 및 개별 서비스 페이지, 작업사례, FAQ, 공개 푸터와 모바일 상담 CTA
- 작업사례·FAQ CMS, 작업 전/중/후 사진 직접 업로드·정렬 API, 사이트 설정, SUPER_ADMIN의 관리자 계정 추가·삭제·최고 관리자 이전
- canonical·Open Graph·sitemap·robots·LocalBusiness 구조화 데이터 및 선택형 GA4 이벤트 기반

홈에서 상담접수 화면으로 이동할 수 있으며 관리자 접수 조회와 기본 업무 처리를 구현했습니다. 방문 일정·견적·현장 사진 및 견적 파일 관리는 Phase 6까지, 고객 공개 웹과 CMS는 Phase 8까지 구현했습니다. Vercel 프로젝트는 생성되어 `https://ok-fire-website.vercel.app`에 배포됐으며, 운영 PostgreSQL·Object Storage와 GitHub 자동 배포 연결은 아직 설정하지 않았습니다.

Phase 10 QA에서 lint, typecheck, production build, 단위 테스트 18개와 임시 DB·스토리지·HTTPS Chromium 통합 테스트를 통과했습니다. 실기기 Safari/Android/Edge와 운영 인프라 검증은 배포 전 수동 확인이 필요합니다.

## 1. 준비

- Node.js 22.12 이상 (권장 Node.js 24 LTS), npm
- PostgreSQL 17 이상 또는 PostgreSQL 제공 서비스
- 로컬 DB 방법 중 하나: Docker Compose 또는 기존 PostgreSQL

```sh
npm ci
cp .env.example .env
```

### 사진 업로드까지 바로 체험하기

별도 `.env`, Docker, 외부 계정 없이 임시 PostgreSQL과 S3 호환 테스트 저장소를 함께 실행할 수 있습니다.

```sh
npm run dev:demo
```

출력되는 `https://localhost:3000/contact`와 임시 관리자 계정으로 상담 접수, 사진 업로드, 로그인을 직접 확인합니다. 로컬 개발 인증서이므로 브라우저 경고를 한 번 허용해야 합니다. 이 명령은 개발 체험 전용 보유기간 문구를 표시하며, `Ctrl+C`로 종료하면 임시 DB·사진·비밀값을 삭제합니다. 실제 고객 정보나 보관할 사진은 입력하지 마세요.

`.env`에 DB 연결, `APP_ORIGIN`, `AUTH_SECRET`, 초기 관리자 값을 설정합니다. `AUTH_SECRET`은 아래 명령으로 생성한 값을 넣습니다. 실제 값은 저장소·공유 문서에 넣지 않습니다.

```sh
openssl rand -hex 32
```

### Docker로 로컬 PostgreSQL 실행 (선택)

```sh
docker compose up -d db
```

Compose의 DB 계정은 `.env.example`의 **로컬 개발 전용** DATABASE_URL과 일치합니다. 운영에서 사용하지 않습니다. 이미 PostgreSQL이 있으면 비어 있는 개발 DB를 만들고 URL을 지정합니다.

## 2. Migration과 초기 관리자

```sh
npm run db:deploy
npm run db:seed
```

`SEED_ADMIN_PASSWORD`는 10~128자이며 기본값이 없습니다. 최초 seed는 SUPER_ADMIN을 생성하고 활동 로그를 남깁니다. 같은 이메일의 활성 SUPER_ADMIN이 있으면 아무것도 바꾸지 않습니다. 이후 계정 추가와 최고 관리자 변경은 `/admin/users`에서 수행하며, 비밀번호 해시와 활동 로그를 함께 저장하므로 관리자 행을 PostgreSQL에 직접 추가하지 마세요.

seed가 끝나면 `.env`의 `SEED_ADMIN_PASSWORD`를 제거하고 비밀번호는 비밀번호 관리자에 보관하세요. 이후 seed를 다시 실행하려면 입력값을 다시 설정해야 합니다. seed는 비밀번호 재설정 도구가 아닙니다.

스키마 수정 시 개발 DB에서:

```sh
npm run db:migrate -- --name describe_change
npm run db:generate
```

생성된 `prisma/migrations/` SQL을 Git에 포함합니다. 운영에서는 `db:migrate`, `db push`, `migrate reset`을 사용하지 않습니다.

## 3. 고객 접수 설정

`.env`에 다음 항목을 설정해야 실제 접수 화면과 API가 활성화됩니다.

- `PRIVACY_CONTACT_TEXT`: `010-1234-1234` (사용자 확인)
- `PRIVACY_RETENTION_TEXT`: 개인정보 수집 목적 달성 후 지체 없이 5일 이내 파기하고, 법령상 보존 의무가 있는 기록은 계약·청약철회 및 결제·공급 5년, 소비자 불만·분쟁 3년, 표시·광고 6개월, 통신비밀보호법상 인터넷 로그·접속지 추적자료 3개월 보관합니다.
- `PRIVACY_POLICY_VERSION`: 표시하는 안내의 버전, 예: `2026-09-15-v1`. 안내 내용이 바뀌면 함께 변경합니다.

설정이 누락되면 `/contact`에 준비 안내를 표시하고 POST `/api/inquiries`는 503을 반환합니다. 통합 테스트는 실제 운영정책과 구분되는 테스트 전용 문구를 임시로 사용합니다. 운영 공개 전 전체 개인정보 처리방침과 실제 파기 절차를 점검하세요.

기존 Phase 1 DB에도 `npm run db:deploy`로 추가 migration을 적용합니다. 기존 행을 지우거나 seed를 다시 실행할 필요는 없습니다.

### 개발 서버

Secure 쿠키를 유지하기 위해 로컬 로그인도 HTTPS로 실행합니다.

```sh
npm run dev -- --experimental-https
```

`.env`의 `APP_ORIGIN=https://localhost:3000`과 접속 주소를 일치시키세요. 첫 실행 시 Next.js가 개발 인증서 설치를 안내할 수 있습니다.

- 고객 홈: `https://localhost:3000`
- 상담접수: `https://localhost:3000/contact`
- 개인정보 안내: `https://localhost:3000/privacy`
- 관리자: `https://localhost:3000/admin` (비로그인 시 로그인으로 이동)
- 로그인: `https://localhost:3000/admin/login`
- 접수관리: `https://localhost:3000/admin/inquiries`

일반 `npm run dev`의 HTTP에서는 Secure 세션 로그인 동작을 보장하지 않습니다. HTTP를 위해 쿠키 보안을 완화하지 않습니다.

## 4. 검증

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:integration
```

통합 테스트는 로컬 임시 PostgreSQL 인스턴스를 시작하고 **임시 DB에만** migration·seed를 실행합니다. 외부 서비스나 실제 `.env` DB를 사용하지 않습니다. 빌드된 production 서버 앞에 테스트 HTTPS 프록시를 구성해 Secure 쿠키를 실제 Chromium에서 검증합니다. OpenSSL과 로컬 프로세스·포트 실행 권한이 필요합니다. 종료 시 서버와 임시 DB를 정리하며 스크린샷 경로를 출력합니다. 테스트용 PostgreSQL 패키지는 개발 의존성입니다.

검증 범위: 접수 검증·동의·동시 생성·재시도 중복 방지·DB 트랜잭션 롤백·5단계 브라우저 접수, seed 멱등성, 로그인 성공·실패, CSRF, 쿠키 속성, 세션 해시·교체·만료·로그아웃 폐기, 비활성/잠금/삭제 계정, 동시 로그인 제한, 로그 민감정보 미포함, 모바일/PC 브라우저 로그인·로그아웃·가로 넘침 여부.

`npm run start`는 production 빌드 실행 명령입니다. 운영에서는 HTTPS 프록시 또는 Vercel 뒤에서 실행해야 합니다.

## 5. 환경변수

| 이름 | 용도 | 필수 시점 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL 앱 연결 URL. 운영은 검증된 TLS와 연결 풀 사용 | DB 실행 |
| `DIRECT_URL` | migration용 직접 연결 URL. 미설정 시 DATABASE_URL 사용 | migration |
| `APP_ORIGIN` | 허용할 정확한 origin. 경로·마지막 `/` 제외. 운영 HTTPS 필수 | 인증 |
| `AUTH_SECRET` | 최소 64자 난수. 로그인 제한 식별자 HMAC 키 | 인증 |
| `SEED_ADMIN_NAME` | 초기 관리자 이름 | seed |
| `SEED_ADMIN_EMAIL` | 초기 관리자 이메일 (소문자 정규화) | seed |
| `SEED_ADMIN_PASSWORD` | 초기 비밀번호, 10~128자 | 최초 seed 실행 |
| `PRIVACY_RETENTION_TEXT` | 확정된 상담 개인정보 보유·이용 기간 | 접수 활성화 |
| `PRIVACY_CONTACT_TEXT` | 개인정보 문의 연락처 | 접수 활성화 |
| `PRIVACY_POLICY_VERSION` | 동의 안내 버전, 최대 100자 | 접수 활성화 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 선택형 GA4 측정 ID (`G-...`). 없으면 분석 스크립트를 로드하지 않음 | 분석 도입 시 |
| `STORAGE_ENDPOINT` | S3 호환 Object Storage endpoint | Phase 3 |
| `STORAGE_REGION` | Object Storage region | Phase 3 |
| `STORAGE_BUCKET` | 비공개 버킷 | Phase 3 |
| `STORAGE_ACCESS_KEY_ID` | 서버 전용 저장소 접근 ID | Phase 3 |
| `STORAGE_SECRET_ACCESS_KEY` | 서버 전용 저장소 비밀키 | Phase 3 |

`NODE_ENV`, `VERCEL`은 실행 환경이 관리합니다. `NEXT_PUBLIC_` 변수에 비밀값을 넣지 않습니다. build/lint/typecheck에는 실제 비밀값이나 DB 연결이 필요하지 않습니다.

## 6. GitHub / Vercel 배포

1. 이 디렉터리가 Git 루트입니다. 새 비공개 GitHub 저장소에 프로젝트 소스·문서·lockfile·migration만 push합니다. `.env*`, 생성물, node_modules는 제외됩니다.
2. 운영 PostgreSQL을 준비하고 최소 권한 앱 계정과 migration 권한 계정을 구분합니다. 백업과 복원 절차를 마련합니다.
3. 운영 DB URL을 안전하게 주입한 별도 배포 작업에서 `npm ci` → `npm run db:deploy`를 실행합니다. DB migration을 Vercel build 안에서 자동 실행하지 않습니다.
4. 초기 SUPER_ADMIN seed를 안전한 작업 환경에서 한 번 실행하고 seed 비밀번호를 제거합니다.
5. Vercel에서 GitHub 저장소를 연결합니다. Framework: Next.js, Node.js: 24.x, Install: `npm ci`, Build: `npm run build`. 이 폴더 자체를 push했다면 Root Directory는 저장소 루트입니다.
6. Vercel 환경변수에 `DATABASE_URL`, `APP_ORIGIN`(실제 HTTPS 도메인), `AUTH_SECRET`과 `PRIVACY_*` 3개 항목을 설정합니다. migration URL과 seed 비밀번호는 앱 런타임에 필요하지 않습니다.
7. Preview와 Production DB·비밀값은 분리합니다. Preview도 접속 도메인과 APP_ORIGIN을 정확히 맞춥니다.
8. 로그인·로그아웃·비로그인 차단과 DB TLS 연결을 확인합니다. 실제 도메인 변경 시 APP_ORIGIN도 수정합니다.

유료 서비스·도메인 구매와 실제 외부 배포는 사용자의 확인 후 진행합니다. Object Storage 연결 코드는 구현했으며 운영 비공개 버킷과 권한·CORS 설정은 배포 전에 구성해야 합니다.

## 인증 개발 규칙

- `src/proxy.ts`는 쿠키 형태만 확인하는 빠른 이동 처리입니다. 실제 권한은 `currentAdmin()` / `requireAdmin()`이 DB로 확인합니다.
- **모든 신규 관리자 API와 Server Action**은 `requireAdmin()`을 호출해야 합니다. 최고 관리자 기능은 `requireAdmin('SUPER_ADMIN')`을 사용합니다. 레이아웃만으로 API를 보호할 수 없습니다.
- 모든 상태 변경 요청은 `requireSameOrigin()` 검증 후 처리합니다. 로그인·로그아웃도 포함합니다.
- 모든 Prisma 연결은 UTC 시간대를 사용합니다. DB 서버 시간대가 한국이어도 세션 수명과 TIMESTAMPTZ 조회가 어긋나지 않도록 공유 factory를 사용하세요.
- 세션에서 반환하는 관리자 정보는 id/name/email/role과 OTP 설정 여부로 제한합니다. BigInt ID는 JSON 문자열로 직렬화합니다.
- 관리자는 비밀번호를 통과한 뒤 OTP가 설정되어 있지 않으면 `/admin/security`에서 인증 앱을 먼저 등록해야 합니다. 등록 후에는 비밀번호와 6자리 TOTP를 모두 확인합니다.
- 로그에 요청 본문·비밀번호·세션 원문·전체 전화번호·DB 연결 문자열을 출력하지 않습니다.
- 계정당 15분 10회, IP당 15분 100회 로그인 요청을 DB 원자적 증가로 제한합니다. 성공 요청도 횟수에 포함합니다. Vercel에서만 플랫폼이 제공한 `x-vercel-forwarded-for`를 사용합니다. 다른 배포 환경은 공통 IP 버킷을 사용하므로 신뢰 프록시 설정을 별도 구현해야 합니다.
- 만료 세션은 해당 계정 로그인 시 정리됩니다. 만료 로그인 제한 레코드 정리는 운영 스케줄러 도입 시 구현합니다.

## 공식 기술 문서

- [Next.js 설치](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js 16 Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Prisma 7 전환 및 PostgreSQL adapter](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)

## 고객 접수 개발 규칙

- `/api/inquiries`는 최대 32KiB JSON, 올바른 Origin과 UUID Idempotency-Key가 필요합니다. 관리자는 기존 8KiB 제한을 유지합니다.
- 같은 키/같은 정규화 요청은 기존 접수 결과를 반환합니다. 다른 내용으로 키를 재사용하면 409입니다. 비밀키 교체 시 기존 요청 payload HMAC은 일치하지 않을 수 있습니다.
- 브라우저 저장소에는 재시도용 UUID만 저장하고 고객 입력값은 저장하지 않습니다. 새로고침하면 입력 정보는 사라집니다.
- 일별 접수번호는 Asia/Seoul 기준 날짜 + 최소 4자리 순번이며 10,000건부터 5자리로 늘어납니다. 번호·접수·이력은 함께 commit/rollback합니다.
- 완료 확인 쿠키는 30분 동안 새로고침을 지원하며, 접수번호만 표시하고 고객 정보 조회 권한을 주지 않습니다.
- 공개 API는 IP당 15분 30회 제한을 별도 DB 테이블로 관리합니다. Vercel 외 배포 시 신뢰 IP 처리를 별도로 연결하세요.
- 고객용 첨부 사진은 동의 후 접수 생성 → 업로드 예약 → 저장소 직접 전송 → 서버 검증 순서로 처리합니다.

## 사진 업로드 설정과 운영

S3 호환 비공개 전용 버킷을 준비한 뒤 `.env.example`의 `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`를 서버에 설정합니다. 저장소 설정이 없으면 글 상담은 사용할 수 있고 사진 선택은 준비 안내로 표시됩니다. 유료 리소스 생성은 사용자 확인 후 진행합니다.

- `STORAGE_ENDPOINT`는 운영에서 HTTPS여야 합니다. R2 사용 시 region은 공급자 설정에 맞추고, AWS S3는 실제 버킷 region을 사용합니다. 로컬 통합 테스트에만 localhost HTTP를 허용합니다.
- 버킷의 공개 접근과 공개 ACL을 비활성화합니다. 앱 자격증명에는 해당 버킷의 PutObject/GetObject/DeleteObject만 허용하고, 정리 작업에는 ListBucket 권한도 필요합니다.
- CORS AllowedOrigins는 실제 `APP_ORIGIN`, AllowedMethods는 PUT/GET/HEAD, AllowedHeaders는 Content-Type으로 설정합니다. Content-Length는 브라우저가 계산하며 서명에 포함됩니다. 공급자별 CORS/권한은 실제 배포 전에 검증합니다.
- `quarantine/` prefix에 1일 만료 수명주기를 설정합니다. 업로드 성공 직후에도 원본을 삭제하지만, 중단된 전송이나 유효시간 내 재전송으로 생성된 임시 파일을 정리하기 위한 설정입니다.
- `private/`의 정식 사진에는 자동 만료 규칙을 적용하지 않습니다. 실제 개인정보 파기는 확정된 운영 보유기간에 따라 별도로 구현해야 합니다.
- 로컬 임시 저장소는 테스트용 S3rver입니다. 실제 AWS/R2의 IAM·공개 차단 동작 전체를 재현하지 않으므로 운영 접근권한 검증을 대체하지 않습니다.

```sh
npm run db:deploy
npm run storage:cleanup
# 위 명령은 삭제하지 않고 정리 후보 개수만 출력합니다.
# 전용 버킷/DB 설정과 후보를 확인한 후 실제 정리:
npm run storage:cleanup -- --apply
```

정리 명령은 24시간 넘은 quarantine 원본과 DB가 참조하지 않는 정규화 이미지, 충분히 만료된 업로드 예약을 처리합니다. Soft Delete된 행이 참조하는 사진도 유지합니다. 서버 종료나 DB 오류 뒤 남은 파일을 회수하기 위해 운영 스케줄러에서 실행할 수 있습니다.

### 사진 보안과 동작

- 고객은 접수 생성에 쓴 난수 요청 키를 `X-Inquiry-Key` 헤더로 제출해야 합니다. 접수 ID만으로 업로드할 수 없으며 접수 생성 후 30분만 허용합니다.
- 동시 요청에서도 완료 사진과 유효한 예약을 합쳐 최대 10장입니다. 예약은 최대 10분, 직접 PUT URL은 5분 유효합니다.
- JPG/JPEG/PNG/WebP/HEIC/HEIF, 파일당 최대 10MiB. 서버가 크기·SHA-256·실제 이미지 형식·디코딩을 검증합니다.
- 최대 5,000만 화소. 긴 변 2,560px 이하 JPEG로 변환하고 EXIF/GPS 등 메타데이터를 제거합니다. HEIC/HEIF와 다중 이미지 파일은 첫 이미지를 사용합니다. 브라우저가 HEIC 미리보기를 지원하지 않으면 파일명과 선택 상태를 보여줍니다.
- 정식 이미지는 원본 업로드 URL로 수정할 수 없는 별도 key에 저장합니다. DB에는 파일과 메타데이터만 연결합니다.
- 접수 내용이 저장된 뒤 사진이 실패하면 입력을 잠그고 재시도 또는 저장된 사진으로 완료할 수 있습니다. 재시도는 기존 접수/사진을 중복 생성하지 않습니다.
- 관리자 `GET /api/admin/attachments/{id}/url`은 로그인·계정 상태·Soft Delete를 검사하고 활동 로그를 남깁니다. GET URL은 60초 유효하며 URL 발급 후 계정이 비활성화되어도 그 60초 동안은 사용할 수 있습니다. 링크를 공개하거나 로그에 기록하지 않습니다.
- Vercel Function의 4.5MB 본문 제한 때문에 10MB 파일을 multipart로 앱 서버에 전송하지 않습니다. 브라우저가 서명 URL로 Object Storage에 직접 전송하고 앱 서버는 작은 JSON 요청을 받습니다. [Vercel 제한](https://vercel.com/docs/functions/limitations)

검증 명령 `npm run test:integration`은 임시 PostgreSQL과 임시 S3 호환 저장소를 함께 실행합니다. 외부 계정이나 실제 고객 사진을 사용하지 않습니다.

## 관리자 접수 조회

- `GET /api/admin/inquiries`와 `GET /api/admin/inquiries/{id}`는 로그인 세션과 활성 계정을 매 요청마다 확인하고 `no-store`로 응답합니다.
- 목록은 고객명·전화번호·접수번호·업체명·주소를 검색하며 기간·상태·문의유형·담당자로 필터링합니다. 기본 20개, 20/50/100개를 선택할 수 있고 최대 100개입니다.
- 목록과 상세는 Soft Delete된 접수를 제외합니다. 상세 첨부도 Soft Delete를 제외하며 사진은 60초짜리 보호 URL로 불러옵니다.
- 목록 및 상세 열람과 사진 URL 발급은 관리자 활동 로그에 기록합니다. 로그에는 검색어·전화번호·주소를 넣지 않습니다.
- 모바일은 고객명·전화번호·주소·문의·사진·상태를 우선하고 전화 및 지도 버튼을 제공합니다. PC는 표와 2열 상세 레이아웃을 사용합니다.
- 지도 버튼은 주소를 네이버 지도 검색 URL로 전달합니다. 관리자가 버튼을 누를 때만 새 창을 엽니다.
- 상태 변경은 접수와 상태 이력을 하나의 트랜잭션으로 기록합니다. 같은 상태 재저장은 이력을 추가하지 않습니다.
- 담당자는 활성 계정만 지정할 수 있으며 배정/해제 모두 이력으로 남습니다. 메모는 작성자 또는 최고 관리자만 수정·삭제할 수 있고 삭제는 Soft Delete입니다.
- 상태/담당자/메모 변경은 동일 Origin 요청과 관리자 세션을 요구합니다. 활동 로그에는 변경 내용이나 메모 원문을 저장하지 않습니다.
