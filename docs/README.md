# OK소방 웹사이트 프로젝트 문서

## 프로젝트 개요
OK소방은 30년 업력의 소방설비 전문업체를 위한 고객용 반응형 웹사이트 + 모바일 대응 관리자 웹사이트 프로젝트입니다.

주요 업무:
- 소방전기
- 소방설비 시공
- 소방점검
- 수리/보수
- 견적 상담

핵심 목표:
1. 고객이 빠르게 OK소방을 신뢰하고 상담을 접수할 수 있게 한다.
2. 고객이 사진과 현장 정보를 함께 전달할 수 있게 한다.
3. 관리자가 PC/모바일에서 신규 접수를 확인하고 전화·메모·방문·견적·상태 관리를 할 수 있게 한다.
4. 상담 → 현장방문 → 견적 → 공사/점검 → 완료까지 하나의 흐름으로 관리한다.

## 권장 기술스택
- Frontend / Backend: Next.js + TypeScript
- Styling: Tailwind CSS
- Database: PostgreSQL
- ORM: Prisma
- File Storage: S3 / Cloudflare R2 / Supabase Storage 중 택1
- Deployment: Vercel 또는 이에 준하는 클라우드
- Auth: 관리자용 HttpOnly Secure Cookie Session
- Source Control: GitHub

## 문서 구조
- `01_POLICY.md` : 서비스 정책서
- `02_DEV_SPEC.md` : 개발 스펙
- `03_WIREFRAME.md` : 고객/관리자 와이어프레임
- `04_ERD.md` : DB / ERD 설계
- `05_API_SPEC.md` : REST API 상세 명세
- `06_IMPLEMENTATION_PLAN.md` : 실제 개발 순서
- `07_CODEX_PROMPT.md` : VS Code + Codex 개발 시작 지시문

## 권장 프로젝트 구조

```text
okfire/
├─ docs/
│  ├─ README.md
│  ├─ 01_POLICY.md
│  ├─ 02_DEV_SPEC.md
│  ├─ 03_WIREFRAME.md
│  ├─ 04_ERD.md
│  ├─ 05_API_SPEC.md
│  ├─ 06_IMPLEMENTATION_PLAN.md
│  └─ 07_CODEX_PROMPT.md
├─ prisma/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  ├─ admin/
│  │  └─ api/
│  ├─ components/
│  ├─ lib/
│  ├─ services/
│  ├─ types/
│  └─ validations/
├─ .env.example
├─ package.json
└─ README.md
```

## MVP 핵심 성공 기준
고객이 모바일에서 사이트 접속 → 상담 접수 → 사진 업로드 → 접수 완료가 가능해야 합니다.

관리자는 모바일에서 로그인 → 신규 접수 확인 → 전화 → 메모 → 상태 변경 → 방문 일정 → 견적 → 완료 처리까지 가능해야 합니다.

## 개발 프로젝트 안내

이 문서들은 원본 `Downloads/docs`에서 `Downloads/okfire/docs`로 복사되었습니다. 이후 구현 기준 문서는 현재 Git 프로젝트의 이 `docs/`이며 원본 파일은 유지합니다.
실행·migration·seed·환경변수·배포 방법은 [프로젝트 README](../README.md), 검증 기록은 [08_VERIFICATION.md](08_VERIFICATION.md)를 확인하세요.
원본의 `07_CODEX_PROMPT.md`는 별도 시작 지시문이므로 이번 사용자가 지정한 요구사항 7개 문서에 포함하지 않았습니다.
