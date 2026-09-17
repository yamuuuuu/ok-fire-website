# OK소방 개발 스펙 v1.0

## 1. 기술스택
- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Object Storage
- 관리자 Session 인증
- GitHub
- Vercel 또는 동급 배포 환경

## 2. URL 구조

### 고객
```text
/
/about
/services
/services/fire-electric
/services/fire-construction
/services/fire-inspection
/works
/works/[slug]
/faq
/contact
/contact/complete
/privacy
```

### 관리자
```text
/admin/login
/admin
/admin/inquiries
/admin/inquiries/[id]
/admin/schedule
/admin/works
/admin/works/new
/admin/works/[id]
/admin/faq
/admin/settings
/admin/users
```

## 3. 관리자 권한
### SUPER_ADMIN
- 모든 기능
- 사이트 설정
- 활동로그
- 관리자 계정 추가
- 일반 관리자 계정 삭제
- 최고 관리자 변경

### MANAGER
- 접수 조회/수정
- 상담 메모
- 상태 변경
- 방문 일정
- 견적
- 현장 사진
- 작업사례/FAQ 운영

## 4. 상담 접수 필드
```text
inquiry_type
customer_name
phone
company_name
postal_code
address
address_detail
description
preferred_contact_time
preferred_contact_detail
privacy_agreed
attachments[]
```

## 5. ENUM

### InquiryType
```text
FIRE_ELECTRIC
FIRE_CONSTRUCTION
FIRE_INSPECTION
REPAIR
ESTIMATE
ETC
```

### InquiryStatus
```text
NEW
CONFIRMED
CONSULTING
VISIT_SCHEDULED
VISIT_COMPLETED
ESTIMATING
WORKING
COMPLETED
ON_HOLD
CANCELED
```

### PreferredContactTime
```text
ANYTIME
MORNING
AFTERNOON
CUSTOM
```

### AdminRole
```text
SUPER_ADMIN
MANAGER
```

## 6. 접수번호
```text
OK-YYYYMMDD-XXXX
```
동시 접수 시 중복 방지를 위해 DB Sequence 또는 별도 sequence 로직 사용.

## 7. 파일 업로드
- 고객 이미지 최대 10장
- 1파일 최대 10MB
- jpg/jpeg/png/webp/heic/heif
- 관리자 견적 파일: pdf/jpg/jpeg/png/xlsx
- Object Storage 사용
- DB에는 storage_key 및 메타데이터만 저장
- 관리자 보호 파일은 Signed URL 권장

## 8. 모바일 관리자
하단 메뉴:
- 홈
- 접수
- 일정
- 사례
- 더보기

접수 상세 Sticky Action:
- 전화하기
- 상태변경

## 9. 관리자 대시보드
- 오늘 신규접수
- 상담중
- 방문예정
- 견적진행
- 공사진행
- 오늘 방문
- 최근 신규 접수

## 10. 목록 검색/필터
검색:
- 고객명
- 전화번호
- 접수번호
- 업체명
- 주소

필터:
- 기간
- 상태
- 문의유형
- 담당자

Pagination:
- 기본 20
- 20 / 50 / 100
- 최대 100

## 11. SEO
- 관리자 noindex
- sitemap 자동 생성
- 메타데이터
- 작업사례 slug
- 이미지 alt
- LocalBusiness/Organization schema 고려

## 12. 성능
- 이미지 리사이징
- lazy loading
- 썸네일
- CDN/캐시
- Pagination
- DB Index

## 13. 브라우저
- Chrome
- Safari
- Edge
- Android Chrome
- iOS Safari
- IE 제외

## 14. MVP 완료 조건
고객:
1. 모바일 접속
2. 서비스 확인
3. 상담 접수
4. 접수 완료

관리자:
1. 모바일 로그인
2. 신규접수 확인
3. 고객 전화
4. 메모
5. 상태 변경
6. 방문 일정
7. 견적
8. 공사진행
9. 완료 처리

## 15. Phase 0~1 구현 기준
- Next.js 16 App Router, React 19, Prisma 7 + `@prisma/adapter-pg`, Zod, Tailwind CSS 4.
- Next.js 16의 middleware 명칭 변경에 따라 `src/proxy.ts`를 사용합니다. DB 인증·권한검사는 각 보호 페이지/API에서 수행합니다.
- 세션 수명은 8시간, 초기 seed 비밀번호는 16~128자. 인증 요청·쿠키 세부사항은 API 문서 25절을 따릅니다.
- 로컬 개발도 Secure 쿠키를 유지하므로 HTTPS로 실행합니다. `.env.example` 및 루트 README 참조.
- 관리자 홈은 Phase 1 인증 확인용 화면입니다. 업무 통계와 아직 구현하지 않은 메뉴는 가짜 데이터를 표시하지 않습니다.
- 정책서의 선택 항목인 공사 희망일을 Phase 2에서 선택 DATE 필드와 API 요청 항목으로 반영했습니다.

## 16. Phase 2 구현 기준
- `/contact`: 문의유형 → 현장정보 → 문의내용/공사 희망일 → 연락정보 → 확인/동의, 5단계.
- 주소는 직접 입력하며 외부 주소 검색 서비스는 도입하지 않습니다.
- 정책서에 정의된 공사 희망일을 `preferredWorkDate` 선택 날짜로 추가합니다. 희망일은 확정 일정이 아닙니다.

## 17. 고객 파일 업로드 범위
- 간편 상담 접수에서는 우편번호와 고객 현장 사진을 받지 않습니다. 사진·파일은 관리자 업무(현장 사진, 견적 파일, 작업사례)에서만 관리합니다.
- 실제 저장소 계정/버킷은 사진·파일 운영을 시작할 때 연결하며, 앱 환경변수와 운영 설정 절차는 루트 README를 따릅니다.

## 18. Phase 4 관리자 접수관리 구현 기준

- `/admin/inquiries`: 고객명·전화번호·접수번호·업체명·주소 통합 검색, 접수일 기간·상태·문의유형·담당자 필터, 접수일/접수번호/고객명/상태 정렬.
- 페이지 크기는 20/50/100, 기본 20, 최대 100입니다. 모든 조건은 URL query에 유지해 새로고침과 링크 공유가 가능합니다.
- 모바일은 접수 카드를, PC는 테이블을 표시합니다. 신규접수를 강조하며 고객명·전화번호·주소·문의유형·사진 수·상태를 우선합니다.
- `/admin/inquiries/[id]`: 고객/연락/현장/문의/첨부사진, 상태·담당자, 메모와 함께 방문 일정·견적·현장 사진·견적 파일을 모바일에서도 등록하고 관리합니다.
- 전화는 `tel:` 링크, 지도는 별도 API 키가 필요 없는 네이버 지도 주소 검색 링크입니다. 외부 지도에는 관리자가 링크를 누를 때 주소가 전달됩니다.
- 목록·상세·첨부 사진은 인증과 Soft Delete를 확인합니다. 목록/상세 열람과 사진 URL 발급을 활동 로그에 남기되 검색어와 개인정보는 로그에 저장하지 않습니다.
- 상태·담당자·메모를 바꾸는 UI와 API는 Phase 5에서 구현합니다. 상세를 열어도 상태를 자동 변경하지 않습니다.

## 19. Phase 5 운영 기능 구현 기준

- 상세의 업무 처리 영역에서 상태, 변경 메모, 담당자, 상담메모를 관리합니다. 모바일 하단의 상태 변경 버튼은 이 영역으로 이동합니다.
- 상태 변경은 기존 상태와 다를 때만 접수 UPDATE, 상태 이력 INSERT, 활동 로그 INSERT를 하나의 트랜잭션으로 처리합니다.
- 담당자는 활성·미삭제 관리자만 배정할 수 있습니다. 배정과 해제 모두 담당자 이력과 활동 로그를 남깁니다.
- 메모는 1~5,000자. 작성자 또는 SUPER_ADMIN만 수정·Soft Delete할 수 있으며 메모 원문은 활동 로그에 저장하지 않습니다.
- 타임라인 API는 상태·담당자·삭제되지 않은 메모를 시간 역순으로 반환합니다. 목록/상세 조회와 상태 변경이 서로 접수 상태를 임의로 바꾸지 않습니다.
- 고객 입력값은 React 메모리에만 유지합니다. localStorage/sessionStorage/URL에 고객 개인정보를 저장하지 않습니다.
- sessionStorage에는 중복 방지용 난수 UUID만 저장합니다. 제출 중 중복 클릭 차단, 네트워크 응답 유실 시 같은 키로 재시도합니다.
- 접수·최초 NEW 상태 이력·당일 카운터를 하나의 DB 트랜잭션으로 기록합니다. 접수번호는 한국 시간 날짜와 당일 원자적 카운터를 조합합니다.
- 번호 뒷자리는 최소 4자리로 0을 채우며, 당일 10,000번째부터 자연스럽게 5자리 이상으로 확장합니다. 번호는 재사용하지 않습니다.
- 완료 화면은 서명된 HttpOnly Secure 쿠키를 검증합니다. URL로 전달한 번호를 신뢰하거나 번호로 고객 정보를 조회하는 기능은 없습니다.
- `PRIVACY_RETENTION_TEXT`, `PRIVACY_CONTACT_TEXT`, `PRIVACY_POLICY_VERSION`을 서버에 설정합니다. 누락 시 폼을 숨기고 API는 503을 반환합니다.

## 20. Phase 7 고객 홈페이지 구현 기준

- 고객 공개 화면은 홈, 회사소개, 서비스/개별 서비스, 작업사례, FAQ, 상담접수, 개인정보 안내로 구성합니다.
- 모바일 메뉴와 하단 고정 CTA는 상담 접수로 연결합니다. 대표 전화번호가 운영 정보로 확정되기 전에는 임의 번호나 `tel:` 링크를 표시하지 않습니다.
- 공개 작업사례와 FAQ는 `published=true`, `deleted_at IS NULL` 데이터만 서버에서 읽습니다. CMS 전에는 빈 상태를 표시합니다.
- 작업사례에는 정확한 고객 주소 및 개인정보를 표시하지 않습니다.

## 21. Phase 8 CMS 구현 기준

- 초기 SUPER_ADMIN은 seed로 한 번 생성합니다. SUPER_ADMIN은 관리자 관리 화면에서 매니저 계정을 추가·Soft Delete하고, 활성 매니저에게 최고 관리자 권한을 이전할 수 있습니다. 삭제된 계정의 세션은 즉시 폐기합니다.
- 최고 관리자는 항상 한 명만 유지합니다. 권한 이전은 DB 트랜잭션으로 기존 최고 관리자를 MANAGER로 변경한 후 대상 관리자를 SUPER_ADMIN으로 변경하며, 두 계정의 기존 세션을 폐기합니다.
- 공개 API와 공개 페이지는 `published=true`, `deleted_at IS NULL`만 조회합니다.
- 작업사례 사진은 Signed PUT 후 서버에서 이미지 형식·크기·해시를 검증하고 JPEG로 정규화합니다. 작업 전·중·후 유형과 정렬 순서를 저장하며 삭제는 Soft Delete합니다.
- 초기 관리자 비밀번호는 16~128자로 해시해 저장합니다. 관리자 계정은 PostgreSQL seed로 한 번 생성하며, 직접 DB에 비밀번호를 저장하지 않습니다.
- 비밀번호 재설정은 본인 계정에만 허용하며 기존 세션을 폐기합니다.
- 비밀번호 변경은 관리자 설정 화면에서 새 비밀번호와 확인값을 입력해 수행합니다. 16자 이상 비밀번호만 허용하고 변경 직후 모든 관리자 세션을 폐기합니다.

## 22. Phase 9 SEO / Analytics 구현 기준

- `APP_ORIGIN`을 metadataBase, canonical과 sitemap URL 기준으로 사용합니다. 배포 도메인을 바꾸면 APP_ORIGIN도 함께 변경합니다.
- 공개 페이지는 title·description·canonical·Open Graph를 제공하며 관리자와 완료 화면은 noindex를 유지합니다.
- sitemap은 공개 정적 페이지와 공개된 작업사례만 포함합니다. robots는 `/admin`, `/api`를 차단합니다.
- LocalBusiness JSON-LD는 확인된 정보만 표시합니다. 대표 전화번호·상세 주소는 운영 정보 확정 전 포함하지 않습니다.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`가 `G-...` 형식으로 설정된 경우에만 GA4를 로드합니다. `contact_start`, `contact_submit`, `service_view`, `work_view`를 전송하며, 대표 전화번호 확정 후 전화 링크에 `phone_click`을 연결합니다.
