# OK소방 ERD 설계 v1.0

## 1. 테이블 목록
1. admins
2. inquiries
3. inquiry_attachments
4. inquiry_notes
5. inquiry_status_histories
6. inquiry_assignment_histories
7. visits
8. estimates
9. work_cases
10. work_case_images
11. faqs
12. site_settings
13. admin_activity_logs

## 2. 관계
```text
ADMINS
  │
  ├────< INQUIRIES
  ├────< INQUIRY_NOTES
  ├────< STATUS_HISTORIES
  ├────< ASSIGNMENT_HISTORIES
  ├────< VISITS
  └────< ADMIN_ACTIVITY_LOGS

INQUIRIES
  ├────< INQUIRY_ATTACHMENTS
  ├────< INQUIRY_NOTES
  ├────< INQUIRY_STATUS_HISTORIES
  ├────< INQUIRY_ASSIGNMENT_HISTORIES
  ├────< VISITS
  └────< ESTIMATES

WORK_CASES
  └────< WORK_CASE_IMAGES
```

## 3. admins
```text
id BIGSERIAL PK
name VARCHAR(50)
email VARCHAR(255) UNIQUE
password_hash VARCHAR(255)
phone VARCHAR(20)
role VARCHAR(30)
status VARCHAR(20)
last_login_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Role:
```text
SUPER_ADMIN
MANAGER
```

Status:
```text
ACTIVE
INACTIVE
LOCKED
```

## 4. inquiries
```text
id BIGSERIAL PK
inquiry_number VARCHAR(30) UNIQUE
customer_name VARCHAR(50)
phone VARCHAR(20)
company_name VARCHAR(100) NULL
postal_code VARCHAR(10) NULL
address VARCHAR(255)
address_detail VARCHAR(255) NULL
inquiry_type VARCHAR(30)
description TEXT
preferred_contact_time VARCHAR(30) NULL
preferred_contact_detail VARCHAR(100) NULL
status VARCHAR(30)
assigned_admin_id BIGINT NULL FK admins.id
privacy_agreed BOOLEAN
privacy_agreed_at TIMESTAMP
source VARCHAR(30)
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

## 5. inquiry_attachments
```text
id BIGSERIAL PK
inquiry_id BIGINT FK
uploaded_by_admin_id BIGINT NULL FK
uploader_type VARCHAR(20)
attachment_type VARCHAR(30)
original_name VARCHAR(255)
stored_name VARCHAR(255)
storage_key VARCHAR(500)
mime_type VARCHAR(100)
file_size BIGINT
sort_order INTEGER
estimate_id BIGINT NULL
created_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Uploader:
```text
CUSTOMER
ADMIN
```

Type:
```text
CUSTOMER
BEFORE
WORKING
AFTER
ESTIMATE
ETC
```

## 6. inquiry_notes
```text
id BIGSERIAL PK
inquiry_id BIGINT FK
admin_id BIGINT FK
content TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

## 7. inquiry_status_histories
```text
id BIGSERIAL PK
inquiry_id BIGINT FK
previous_status VARCHAR(30) NULL
new_status VARCHAR(30)
changed_by_admin_id BIGINT NULL FK
memo VARCHAR(500) NULL
created_at TIMESTAMP
```

## 8. inquiry_assignment_histories
```text
id BIGSERIAL PK
inquiry_id BIGINT FK
previous_admin_id BIGINT NULL FK
new_admin_id BIGINT NULL FK
changed_by_admin_id BIGINT FK
created_at TIMESTAMP
```

## 9. visits
```text
id BIGSERIAL PK
inquiry_id BIGINT FK
assigned_admin_id BIGINT NULL FK
visit_date DATE
visit_time TIME NULL
address VARCHAR(255)
address_detail VARCHAR(255) NULL
memo TEXT NULL
status VARCHAR(20)
created_by_admin_id BIGINT FK
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Visit status:
```text
SCHEDULED
COMPLETED
CANCELED
```

## 10. estimates
```text
id BIGSERIAL PK
inquiry_id BIGINT FK
amount NUMERIC(15,2) NULL
memo TEXT NULL
status VARCHAR(20)
created_by_admin_id BIGINT FK
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

Estimate status:
```text
DRAFT
SENT
APPROVED
REJECTED
```

## 11. work_cases
```text
id BIGSERIAL PK
title VARCHAR(200)
slug VARCHAR(255) UNIQUE
category VARCHAR(30)
location VARCHAR(100) NULL
building_type VARCHAR(50) NULL
work_date DATE NULL
summary VARCHAR(500) NULL
description TEXT
thumbnail_storage_key VARCHAR(500) NULL
published BOOLEAN
published_at TIMESTAMP NULL
created_by_admin_id BIGINT FK
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

## 12. work_case_images
```text
id BIGSERIAL PK
work_case_id BIGINT FK
image_type VARCHAR(20)
storage_key VARCHAR(500)
alt_text VARCHAR(255) NULL
sort_order INTEGER
created_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

## 13. faqs
```text
id BIGSERIAL PK
category VARCHAR(30) NULL
question VARCHAR(500)
answer TEXT
sort_order INTEGER
published BOOLEAN
created_by_admin_id BIGINT FK
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP NULL
```

## 14. site_settings
```text
id BIGSERIAL PK
setting_key VARCHAR(100) UNIQUE
setting_value TEXT NULL
value_type VARCHAR(20)
description VARCHAR(255) NULL
updated_by_admin_id BIGINT NULL FK
created_at TIMESTAMP
updated_at TIMESTAMP
```

## 15. admin_activity_logs
```text
id BIGSERIAL PK
admin_id BIGINT NULL FK
action_type VARCHAR(50)
target_type VARCHAR(50) NULL
target_id BIGINT NULL
metadata JSONB NULL
ip_address VARCHAR(50) NULL
user_agent TEXT NULL
created_at TIMESTAMP
```

## 16. 주요 인덱스
```text
UNIQUE inquiries(inquiry_number)
INDEX inquiries(phone)
INDEX inquiries(status)
INDEX inquiries(assigned_admin_id)
INDEX inquiries(created_at)
INDEX inquiries(inquiry_type)
INDEX inquiries(status, created_at)
INDEX inquiries(assigned_admin_id, status)

INDEX visits(visit_date)
INDEX visits(assigned_admin_id, visit_date)
INDEX inquiry_notes(inquiry_id, created_at)
INDEX inquiry_status_histories(inquiry_id, created_at)

UNIQUE work_cases(slug)
INDEX work_cases(published, published_at)
INDEX work_cases(category)
```

## 17. 주요 Transaction
상태 변경:
```text
BEGIN
UPDATE inquiries
INSERT inquiry_status_histories
INSERT admin_activity_logs
COMMIT
```

담당자 변경:
```text
BEGIN
UPDATE inquiries
INSERT inquiry_assignment_histories
INSERT admin_activity_logs
COMMIT
```

## 18. 삭제 원칙
- Cascade 물리삭제 최소화
- 기본 Soft Delete
- 관리자 퇴사 시 계정 비활성화
- 과거 메모/상태/담당자 이력 유지

## 19. Phase 1 구현 보완

업무 테이블 13개 외에 관리자 인증을 위해 다음 테이블을 추가합니다.

### admin_sessions
- id BIGSERIAL PK
- token_hash VARCHAR(64) UNIQUE: 256비트 난수 세션 토큰의 SHA-256 해시
- admin_id BIGINT FK admins.id, ON DELETE RESTRICT
- expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ
- admin_id, expires_at 인덱스
- 세션 원문은 쿠키에만 저장하며 로그·DB에 저장하지 않습니다.

### auth_rate_limits
- key VARCHAR(64) PK: 이메일 또는 신뢰할 수 있는 IP 식별자의 HMAC-SHA256
- count INTEGER
- expires_at TIMESTAMPTZ, 인덱스
- 다중 서버 인스턴스에서 INSERT ON CONFLICT 원자 연산으로 로그인 횟수를 제한합니다.

### 구현 타입
- Prisma 모델/필드는 PascalCase/camelCase, 실제 테이블/컬럼은 문서의 snake_case로 매핑합니다.
- 정의된 상태/역할은 PostgreSQL enum, 일시는 TIMESTAMPTZ(3), 방문일/작업일은 DATE, 방문시간은 TIME입니다.
- 관리자 전화번호·마지막 로그인일과 사례 공개일은 생성 시 NULL이 가능합니다.
- 외래키는 RESTRICT로 물리삭제를 막고 Soft Delete 필드를 유지합니다.
- API의 BIGINT ID는 정밀도 손실 방지를 위해 JSON 문자열로 직렬화합니다.

### 시간대 안전성
Prisma PostgreSQL adapter의 TIMESTAMPTZ 변환을 위해 모든 앱/seed 연결은 `options: '-c timezone=UTC'`를 적용합니다. DB 서버가 Asia/Seoul이어도 저장·조회 시각을 UTC로 유지합니다. 세션 만료는 DB 조회 조건과 애플리케이션에서 모두 검증하며, 화면 표시는 추후 Asia/Seoul로 변환합니다.

## 20. Phase 2 스키마 보완

### inquiries 추가 컬럼
- `preferred_work_date DATE NULL`: 정책서의 선택 공사 희망일.
- `privacy_policy_version VARCHAR(100) NULL`: 고객이 동의한 안내 버전. 신규 API 접수는 필수로 저장하며 과거 행과의 호환을 위해 DB에서는 NULL 허용.
- `submission_key_hash VARCHAR(64) NULL UNIQUE`: Idempotency-Key 난수 UUID의 SHA-256.
- `submission_payload_hash VARCHAR(64) NULL`: 정규화된 요청의 HMAC-SHA256. 원문 개인정보의 단순 해시 추측을 막기 위해 서버 비밀키 사용.

### inquiry_counters
- `day VARCHAR(8) PK`: Asia/Seoul 기준 YYYYMMDD.
- `value INTEGER`: 해당 일자 마지막 접수번호 순번.
- INSERT ON CONFLICT UPDATE로 원자적 증가. 접수 및 NEW 이력과 함께 commit/rollback.

### public_rate_limits
- `key VARCHAR(64) PK`: 신뢰한 IP 식별자의 HMAC.
- `count INTEGER`, `expires_at TIMESTAMPTZ(3)` 및 만료 인덱스.
- 로그인 제한과 분리된 공개 접수 API 전용 테이블.

### 생성 트랜잭션
1. 요청 키의 PostgreSQL transaction advisory lock.
2. 기존 요청 키 확인. 동일 내용이면 기존 결과 반환, 다른 내용/Soft Delete된 접수이면 409.
3. 한국 시간 기준 날짜의 카운터 증가.
4. inquiries INSERT (NEW, WEB, 동의 시각/버전).
5. inquiry_status_histories INSERT (previous=NULL, new=NEW, changed_by=NULL).
6. 모두 commit. 오류 시 카운터·접수·이력 모두 rollback.

idempotency 해시는 접수 레코드와 함께 유지합니다. 추후 실제 개인정보 파기 시 관련 데이터의 처리 범위를 포함해야 합니다.

## 21. Phase 3 upload_tickets
- id UUID PK, inquiry_id FK, client_id UUID. UNIQUE(inquiry_id, client_id).
- original_name, mime_type, file_size, sha256: 검증할 원본의 선언 정보.
- storage_key UNIQUE: 비공개 quarantine 원본 키.
- attachment_id UNIQUE NULL FK inquiry_attachments.id: 검증 후 생성된 정식 파일.
- expires_at, created_at, rejected_at NULL: 만료 및 거부 상태.
- 문의 행 잠금으로 유효 예약 + 완료 사진 수를 검사해 동시 요청에서도 10장 제한.
- 정식 저장 시 동일 문의 잠금 아래 첨부 생성과 ticket 연결을 한 번만 commit.
- 저장소와 DB는 분산 트랜잭션이 없으므로 DB 결과가 불확실하면 파일을 즉시 삭제하지 않습니다. 24시간 후 DB 참조 여부를 확인하는 정리 명령으로 회수합니다.
