# OK소방 구현 순서

## Phase 0. 프로젝트 생성
- Next.js
- TypeScript
- Tailwind
- ESLint
- Prisma
- PostgreSQL 연결
- `.env.example`
- Git 초기화

## Phase 1. DB / Auth
1. Prisma schema 작성
2. migration 생성
3. seed 생성
4. SUPER_ADMIN 초기 계정
5. 로그인
6. 세션
7. 관리자 middleware / authorization

완료조건:
- 관리자 로그인 가능
- 비로그인 `/admin` 차단
- SUPER_ADMIN 계정으로 대시보드 진입

## Phase 2. 고객 상담 접수
1. `/contact`
2. 5단계 접수 UI
3. Zod validation
4. POST `/api/inquiries`
5. 접수번호 생성
6. status history 생성
7. `/contact/complete`

완료조건:
- 실제 DB에 접수 생성
- 접수번호 중복 없음

## Phase 3. 파일 업로드
1. Object Storage 설정
2. 이미지 검증
3. 최대 10장
4. 업로드 API
5. Signed URL
6. 이미지 미리보기

## Phase 4. 관리자 접수관리
1. `/admin/inquiries`
2. 검색/필터/pagination
3. 모바일 카드
4. PC table
5. `/admin/inquiries/[id]`
6. 전화 버튼
7. 지도 링크

## Phase 5. 운영 기능
1. 상태 변경
2. status history
3. 담당자
4. assignment history
5. 메모
6. Timeline

## Phase 6. 방문/견적
1. 일정 등록
2. 일정 목록
3. 방문 완료
4. 견적 등록/수정
5. 견적파일
6. 작업 전/중/후 사진

## Phase 7. 고객 홈페이지
1. Home
2. About
3. Services
4. Works
5. FAQ
6. Footer
7. 모바일 Sticky CTA

## Phase 8. CMS
1. 작업사례 CRUD
2. 이미지 정렬
3. FAQ CRUD
4. 사이트 설정
5. SUPER_ADMIN 관리자 추가·권한 이전 정책 적용

## Phase 9. SEO / Analytics
- metadata
- sitemap
- robots
- canonical
- OG
- LocalBusiness
- GA 이벤트
  - phone_click
  - contact_start
  - contact_submit
  - service_view
  - work_view

## Phase 10. QA
### 모바일
- iPhone Safari
- Android Chrome

### PC
- Chrome
- Safari
- Edge

### 주요 테스트
- 접수 정상
- validation
- 개인정보 미동의
- 이미지 10장 초과
- 잘못된 파일
- 로그인 실패
- 권한
- 상태 history
- 담당자 history
- 방문
- 견적
- Soft Delete

## Phase 11. 배포
1. GitHub push
2. Production DB
3. Storage
4. Vercel 배포
5. 환경변수
6. 임시 URL QA
7. 도메인 구매
8. DNS 연결
9. SSL 확인
10. 정식 오픈

## 개발 중 원칙
- 문서와 구현 충돌 시 docs를 기준으로 하되, 사소한 구현 디테일은 합리적으로 결정
- 정책 변경이 필요한 경우 문서도 함께 수정
- 비용이 발생하는 외부 서비스 도입 전 사용자 승인
- 실제 비밀키/비밀번호 git commit 금지

## 진행 기록 — 2026-09-15

- Phase 0: 프로젝트·Git 초기화, 기술스택 설정, `.env.example`, PostgreSQL 연결 및 로컬 Compose 구성 완료.
- Phase 1: 전체 ERD schema, 초기 migration, SUPER_ADMIN seed, 세션·로그인·로그아웃·me API, 보호된 관리자 홈, 권한검사 함수 구현.
- 검증 명령 및 실행 결과는 루트 README와 `docs/08_VERIFICATION.md`에 기록합니다.
- Phase 2: 5단계 고객 접수, Zod 검증, 생성 API, 당일 접수번호, 최초 상태 이력, 재시도 중복 방지, 완료 화면 구현.
- Phase 3: S3 호환 직접 업로드, 이미지 검증/변환, 최대 10장, 소유 증명, 관리자 Signed URL, 미리보기/재시도 구현.
- Phase 4: 관리자 접수 목록/상세 API, 통합 검색·필터·정렬·페이지네이션, 모바일 카드·PC 테이블, 보호 사진·전화·지도 링크 구현.
- Phase 5: 상태 변경·상태 이력, 담당자 지정·이력, 작성자/최고관리자 메모 관리, 타임라인 API와 상세 업무 처리 UI 구현.
- Phase 6: 방문 일정 등록·목록·완료 처리, 견적 등록/수정/삭제, PDF·XLSX 견적 파일과 작업 전/중/후 사진의 관리자 직접 업로드를 구현했습니다. 운영 Object Storage는 연결 전입니다.
- Phase 7: 고객 홈, 회사소개, 서비스/개별 서비스, 작업사례, FAQ, 공통 푸터와 모바일 상담 CTA를 구현했습니다. 공개 작업사례·FAQ는 CMS 공개 데이터가 생기면 자동으로 표시됩니다.
- Phase 8: 작업사례·FAQ CRUD, 공개 필터 API, 작업 사진 직접 업로드·정렬 API, 사이트 설정과 관리자 계정 관리 정책을 구현했습니다.
- Phase 9: metadata, canonical, Open Graph, sitemap, robots, LocalBusiness JSON-LD와 선택형 GA4 이벤트 기반을 구현했습니다.
- Phase 10: 단위 테스트 18개와 임시 PostgreSQL·S3rver·HTTPS Chromium 통합 테스트를 통해 접수·파일·인증·관리·CMS·SEO 전체 회귀를 확인했습니다.
- 다음 작업은 Phase 11 배포 준비입니다.
- 개인정보 수집 목적 달성 후 5일 이내 파기하며, 법령상 보존 의무 기록은 사용자 확정 기간에 따라 보관합니다. 운영 환경변수에 안내문을 설정한 뒤 실제 고객 접수를 활성화합니다.
