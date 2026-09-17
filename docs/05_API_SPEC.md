# OK소방 API 상세 명세 v1.0

## 1. 공통
Base:
```text
/api
```

성공:
```json
{
  "success": true,
  "data": {}
}
```

실패:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해주세요."
  }
}
```

HTTP:
```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
415 Unsupported Media Type
422 Validation Error
429 Too Many Requests
500 Internal Server Error
```

## 2. 고객 상담 접수
### POST /api/inquiries
```json
{
  "inquiryType": "FIRE_ELECTRIC",
  "customerName": "홍길동",
  "phone": "01012345678",
  "companyName": "ABC빌딩",
  "address": "서울특별시 강남구 테헤란로 123",
  "addressDetail": "3층",
  "description": "3층 복도 유도등에 불이 들어오지 않습니다.",
  "preferredContactTime": "AFTERNOON",
  "preferredContactDetail": null,
  "privacyAgreed": true
}
```

성공:
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "inquiryNumber": "OK-20260915-0012",
    "status": "NEW",
    "createdAt": "2026-09-15T13:31:00+09:00"
  }
}
```

## 3. 관리자 인증
```text
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/auth/me
```

로그인:
```json
{
  "email": "admin@okfire.co.kr",
  "password": "********"
}
```

권장 인증:
- HttpOnly
- Secure
- SameSite Cookie Session

## 5. 대시보드
### GET /api/admin/dashboard

반환:
- summary
- todayVisits
- recentInquiries

## 6. 접수 목록
### GET /api/admin/inquiries

Query:
```text
page
pageSize
status
inquiryType
assignedAdminId
keyword
from
to
sort
order
```

keyword 대상:
- customer_name
- phone
- inquiry_number
- company_name
- address

## 7. 접수 상세
### GET /api/admin/inquiries/{id}

포함:
- 고객정보
- 문의정보
- 담당자
- attachments
- notes
- visits
- estimates
- timeline

## 8. 접수 수정
### PATCH /api/admin/inquiries/{id}

## 9. 상태 변경
### PATCH /api/admin/inquiries/{id}/status
```json
{
  "status": "CONSULTING",
  "memo": "고객 전화 상담 시작"
}
```

Transaction:
- inquiries UPDATE
- inquiry_status_histories INSERT
- admin_activity_logs INSERT

## 10. 담당자 변경
### PATCH /api/admin/inquiries/{id}/assignee
```json
{
  "adminId": 3
}
```

## 11. 상담 메모
```text
POST   /api/admin/inquiries/{id}/notes
PATCH  /api/admin/inquiries/{inquiryId}/notes/{noteId}
DELETE /api/admin/inquiries/{inquiryId}/notes/{noteId}
```

생성:
```json
{
  "content": "고객 통화 완료. 내일 오후 2시 방문 예정."
}
```

## 12. 방문 일정
```text
GET   /api/admin/visits
POST  /api/admin/inquiries/{id}/visits
PATCH /api/admin/visits/{visitId}
PATCH /api/admin/visits/{visitId}/status
```

생성:
```json
{
  "visitDate": "2026-09-16",
  "visitTime": "14:00",
  "assignedAdminId": 1,
  "address": "서울특별시 강남구 테헤란로 123",
  "addressDetail": "3층",
  "memo": "관리실 연락 후 방문",
  "changeInquiryStatus": true
}
```

## 13. 견적
```text
POST   /api/admin/inquiries/{id}/estimates
PATCH  /api/admin/estimates/{estimateId}
DELETE /api/admin/estimates/{estimateId}
```

생성:
```json
{
  "amount": 500000,
  "memo": "유도등 4개 교체 및 배선 작업",
  "status": "DRAFT"
}
```

## 14. 관리자 첨부
```text
POST   /api/admin/inquiries/{id}/attachments
GET    /api/admin/attachments/{id}/url
DELETE /api/admin/attachments/{id}
```

attachmentType:
```text
BEFORE
WORKING
AFTER
ESTIMATE
ETC
```

## 15. Timeline
### GET /api/admin/inquiries/{id}/timeline

Type 예:
```text
STATUS
ASSIGNEE
NOTE
VISIT
ESTIMATE
```

## 16. 작업사례 고객
```text
GET /api/works
GET /api/works/{slug}
```

## 17. 작업사례 관리자
```text
GET    /api/admin/works
POST   /api/admin/works
PATCH  /api/admin/works/{id}
DELETE /api/admin/works/{id}
POST   /api/admin/works/{id}/images
PATCH  /api/admin/works/{id}/images/order
DELETE /api/admin/work-images/{imageId}
```

## 18. FAQ
고객:
```text
GET /api/faqs
```

관리자:
```text
GET    /api/admin/faqs
POST   /api/admin/faqs
PATCH  /api/admin/faqs/{id}
DELETE /api/admin/faqs/{id}
```

## 19. 사이트 설정
```text
GET   /api/site-settings/public
GET   /api/admin/site-settings
PATCH /api/admin/site-settings
```

## 20. 관리자
```text
GET   /api/admin/users
POST  /api/admin/users
PATCH /api/admin/users/{id}
DELETE /api/admin/users/{id}
POST  /api/admin/users/{id}/reset-password
```
- 모든 관리자 계정 API는 SUPER_ADMIN 전용이며, 생성되는 계정은 ACTIVE MANAGER입니다. 생성 요청은 name, email, phone(선택), password(10~128자)를 받습니다.
- `PATCH /api/admin/users/{id}`는 `{ "confirm": true }`를 받아 활성 MANAGER를 최고 관리자로 변경합니다. 최고 관리자는 한 명만 허용하고, 변경 시 기존·새 최고 관리자 계정의 세션을 모두 폐기합니다.
- `DELETE /api/admin/users/{id}`는 일반 관리자만 Soft Delete하고 해당 계정의 모든 세션을 폐기합니다. SUPER_ADMIN과 현재 로그인한 계정은 삭제할 수 없습니다.
- 비밀번호 재설정은 로그인한 본인 계정에만 허용됩니다.

## 21. 활동로그
```text
GET /api/admin/activity-logs
```
SUPER_ADMIN만.

## 22. Error Codes
```text
INVALID_REQUEST
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
INTERNAL_ERROR
RATE_LIMITED

INVALID_CREDENTIALS
ACCOUNT_INACTIVE
ACCOUNT_LOCKED
SESSION_EXPIRED

INQUIRY_NOT_FOUND
INVALID_INQUIRY_STATUS
STATUS_NOT_CHANGED
INVALID_ASSIGNEE

FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
FILE_UPLOAD_FAILED
MAX_ATTACHMENT_EXCEEDED

WORK_CASE_NOT_FOUND
SLUG_ALREADY_EXISTS

ADMIN_NOT_FOUND
EMAIL_ALREADY_EXISTS
INVALID_ROLE
```

## 23. 보안
- 관리자 API 서버 권한검증 필수
- CSRF 방어
- Rate Limit
- 입력 Validation
- ORM/Parameterized Query
- XSS Sanitization
- 로그에 비밀번호/전체 전화번호 등 민감정보 금지

## 24. 우선순위
P0:
- 로그인
- 상담접수
- 사진
- 접수 목록
- 접수 상세
- 상태
- 메모
- 담당자
- 방문

P1:
- 견적
- 현장사진
- 작업사례
- FAQ
- 설정
- 대시보드

P2:
- 활동로그 UI
- 알림톡/SMS
- 고객 진행상태
- PDF 견적서

## 25. Phase 1 인증 구현 상세

- POST login은 OTP가 설정된 계정에 대해 짧은 수명의 MFA 확인 쿠키를 발급하고 `{ "requiresTotp": true }`를 반환합니다. 클라이언트는 `POST /api/admin/auth/totp/verify`에 6자리 코드를 보내야 일반 세션이 발급됩니다. OTP가 없는 계정은 일반 세션으로 로그인한 뒤 `/admin/security`에서 `GET/POST /api/admin/auth/totp/setup`을 통해 등록해야 하며, 등록 전에는 이 두 API 외의 관리자 업무 API가 `403 OTP_SETUP_REQUIRED`를 반환합니다.
- GET me는 동일한 admin 형식, 비로그인·만료·비활성·잠금·삭제 상태는 401입니다.
- POST logout 성공: `{ "success": true, "data": { "loggedOut": true } }`. 현재 세션을 DB에서 삭제하고 쿠키를 만료시킵니다. 세션이 없어도 같은 응답입니다.
- 세션 쿠키: `__Host-okfire_session`, HttpOnly, Secure, SameSite=Lax, Path=/, Domain 없음, 절대 만료 8시간.
- 로그인마다 새 토큰을 발급하고 요청에 포함된 이전 세션을 폐기합니다. 모든 요청에서 계정 상태를 DB로 재확인합니다.
- 로그인·로그아웃은 `Origin`이 서버 `APP_ORIGIN`과 정확히 일치해야 합니다. 누락·다른 출처는 403입니다.
- login Content-Type은 application/json (다르면 415), 본문은 최대 8KiB (초과 413), 잘못된 JSON은 400, 입력 검증 실패는 422입니다.
- 존재하지 않는 계정·잘못된 비밀번호·비활성·잠금·삭제 계정 로그인은 계정 존재 여부가 노출되지 않도록 동일한 `401 INVALID_CREDENTIALS`를 반환합니다.
- 이메일은 trim/소문자 처리, 비밀번호는 변형 없이 검증하며 최대 128자입니다.
- 계정당 15분 10회, IP당 15분 100회 요청 제한. 초과 시 `429 RATE_LIMITED`, `Retry-After: 900`. 성공 시에도 횟수를 초기화하지 않습니다.
- 관리자 API는 Cache-Control: no-store. 응답에 비밀번호 해시·세션 토큰을 JSON으로 포함하지 않습니다.
- DB BIGINT ID는 모든 신규 API에서 문자열로 직렬화합니다. 위 초기 예제의 숫자 id도 실제 구현에서는 문자열을 사용합니다.

## 26. Phase 2 고객 상담접수 상세

### POST /api/inquiries
- 필수 헤더: `Content-Type: application/json`, `Origin: APP_ORIGIN과 일치`, `Idempotency-Key: UUID`.
- 비로그인 고객이 사용하며 서버에서 입력·동의·rate limit을 검증합니다.
- 기존 요청 필드에 `privacyPolicyVersion` 필수, `preferredWorkDate` 선택(`YYYY-MM-DD` 또는 null)을 추가합니다.
- 필수: inquiryType, customerName, phone, address, description, privacyAgreed=true, privacyPolicyVersion.
- 선택: companyName, addressDetail, preferredContactTime, preferredContactDetail, preferredWorkDate. 빈 선택 문자열은 NULL로 정규화합니다.
- customerName 1~50자, companyName 100자, address/addressDetail 255자, description 1~5,000자, 연락시간 상세 100자.
- 전화번호는 공백/하이픈/괄호 제거, +82는 국내 0 접두사로 정규화. 국내 형식 9~12자리 숫자 검증.
- 날짜는 실제 달력 날짜를 검증합니다.
- preferredContactTime=CUSTOM이면 상세 시간 필수. 다른 값에서는 상세 시간을 NULL로 저장합니다.
- 본문 최대 32KiB. 모르는 필드(상태, 담당자, attachments 등 포함)는 거부합니다.

성공 HTTP 201 (같은 키·같은 내용 재시도도 같은 결과):
```json
{
  "success": true,
  "data": {
    "id": "1234",
    "inquiryNumber": "OK-20260915-0012",
    "status": "NEW",
    "createdAt": "2026-09-15T09:00:00.000Z"
  }
}
```
- 같은 키·다른 정규화 내용은 409 IDEMPOTENCY_CONFLICT. 중복 키에 대해 접수나 이력을 추가하지 않습니다.
- 응답 유실 시 같은 키와 같은 내용으로 재시도합니다. 상태 응답은 최초 생성 시 NEW를 뜻하며 고객용 진행 조회가 아닙니다.
- 반환값에는 고객명·전화번호·주소를 포함하지 않습니다. GET /api/inquiries 또는 ID 기반 고객 공개 조회는 제공하지 않습니다.
- 완료 확인용 `__Host-okfire_receipt` 쿠키: HttpOnly, Secure, SameSite=Lax, Path=/, 30분. 서명된 접수번호·만료만 포함하며 인증 세션이 아닙니다.
- `/contact/complete`는 유효한 쿠키 없으면 `/contact`로 이동. no-store/noindex 적용. 개인정보 조회 권한을 부여하지 않습니다.

오류:
- 400 INVALID_REQUEST: 요청 키/JSON 오류
- 403 FORBIDDEN: Origin 누락/불일치
- 413 INVALID_REQUEST: 크기 초과
- 415 INVALID_REQUEST: JSON 외 형식
- 422 VALIDATION_ERROR: 입력/동의 오류, `error.fields`에 필드별 메시지 (원문 입력값 미포함)
- 409 PRIVACY_POLICY_UPDATED: 화면에서 동의한 버전이 현행 안내와 다름
- 409 IDEMPOTENCY_CONFLICT: 처리된 키를 다른 내용으로 재사용
- 429 RATE_LIMITED: IP당 15분 30회 초과, Retry-After: 900. 검증 실패·재시도도 포함.
- 503 SERVICE_UNAVAILABLE: 확정된 개인정보 안내 설정 누락

Vercel의 플랫폼 IP 헤더만 신뢰하고 다른 환경에서는 공통 local 버킷을 사용합니다. 외부 프록시를 별도로 도입하면 신뢰 설정이 필요합니다. Phase 3 첨부 API는 접수 ID만으로 업로드/조회가 허용되지 않도록 별도 소유 증명을 구현해야 합니다.

## 27. 고객 이미지 업로드

간편 상담 접수에서는 고객 사진 업로드 API를 제공하지 않습니다. 고객은 현장 상황을 문의 내용에 적고, 관리자는 필요한 사진을 현장 업무에서 직접 등록합니다.

### GET /api/admin/attachments/{id}/url
- 관리자 세션 필수. 첨부 또는 접수가 Soft Delete되었으면 404.
- 성공 data.url, expiresIn=60. ATTACHMENT_VIEW 활동 로그 기록.
- Phase 3에서는 정규화된 고객 JPEG를 지원합니다. 견적 파일은 Phase 6에서 확장합니다.

## 28. Phase 4 관리자 접수 조회

### GET /api/admin/inquiries

- 관리자 세션과 활성 계정을 확인합니다. Soft Delete된 접수는 제외합니다.
- query: `page`(기본 1), `pageSize`(20/50/100, 기본 20), `keyword`(최대 100자), `status`, `inquiryType`, `assignedAdminId`, `from`, `to`, `sort`, `order`.
- `from`/`to`는 `YYYY-MM-DD`이며 Asia/Seoul 날짜 기준, 양 끝 날짜를 포함합니다.
- `sort`: createdAt/inquiryNumber/customerName/status, `order`: asc/desc. 기본은 createdAt desc이며 같은 값은 ID 내림차순으로 고정합니다.
- keyword는 고객명, 정규화 전화번호, 접수번호, 업체명, 주소/상세주소를 검색합니다.
- 성공: `data.items`, `data.pagination { page, pageSize, total, totalPages }`, 담당자 필터용 `data.admins`. 모든 BIGINT ID는 문자열입니다.
- 각 item은 접수번호, 고객명, 연락처, 업체명, 주소, 문의유형, 상태, 접수일, 담당자, 삭제되지 않은 첨부 수를 포함합니다.
- 올바르지 않은 query는 422. 목록 열람은 `INQUIRY_LIST_VIEW` 활동 로그에 기록하며 검색 조건과 개인정보는 로그에 넣지 않습니다.

### GET /api/admin/inquiries/{id}

- 관리자 세션과 활성 계정을 확인합니다. 존재하지 않거나 Soft Delete된 접수는 404입니다.
- 고객/문의/동의 정보, 담당자, 삭제되지 않은 attachments/notes/visits/estimates와 status history를 반환합니다.
- submission key/payload hash, 저장소 key, 비밀번호·세션 값은 반환하지 않습니다. 첨부 파일 열람 URL은 기존 보호 API로 별도 발급합니다.
- 상세 열람은 `INQUIRY_VIEW` 활동 로그에 기록합니다. 상세를 열어도 접수 상태는 변경하지 않습니다.

## 29. Phase 5 관리자 업무 처리

모든 변경 API는 로그인한 활성 관리자, `Origin: APP_ORIGIN`, `application/json`을 요구합니다. Soft Delete된 접수는 404이며 메모 원문은 활동 로그에 저장하지 않습니다.

### PATCH /api/admin/inquiries/{id}/status

`{ "status": "CONSULTING", "memo": "선택 메모, 최대 500자" }`를 받습니다. 접수 상태와 다를 때 접수·상태 이력·`INQUIRY_STATUS_CHANGED` 로그를 트랜잭션으로 기록합니다. 같은 상태면 `changed: false`로 성공하며 이력을 추가하지 않습니다.

### PATCH /api/admin/inquiries/{id}/assignee

`{ "adminId": "3" }` 또는 `{ "adminId": null }`을 받습니다. 활성·미삭제 관리자만 지정할 수 있으며 변경 시 담당자 이력과 `INQUIRY_ASSIGNEE_CHANGED` 로그를 기록합니다.

### POST /api/admin/inquiries/{id}/notes

`{ "content": "1~5,000자 메모" }`를 받아 메모와 `INQUIRY_NOTE_CREATED` 로그를 생성합니다.

### PATCH / DELETE /api/admin/inquiries/{id}/notes/{noteId}

작성자 또는 SUPER_ADMIN만 수정/삭제할 수 있습니다. PATCH는 같은 content 규칙을 사용하고 `INQUIRY_NOTE_UPDATED` 로그를 남깁니다. DELETE는 Soft Delete와 `INQUIRY_NOTE_DELETED` 로그를 남깁니다.

### GET /api/admin/inquiries/{id}/timeline

상태 이력, 담당자 이력, 삭제되지 않은 메모를 시간 역순으로 반환합니다. 모든 ID와 시간은 문자열/ISO 8601입니다.
