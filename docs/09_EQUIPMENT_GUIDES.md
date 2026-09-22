# 소방설비 가이드와 공개 서비스 개편 (2026-09-22)

## 반영 범위

- 홈, 회사소개, 서비스, 푸터, 검색 설명과 JSON-LD에서 소방점검 서비스 안내 삭제.
- `/services/fire-inspection`은 목록·사이트맵에서 제외하며 기존 주소는 404 처리.
- 신규 상담 유형에서 `FIRE_INSPECTION` 제외. DB enum과 관리자 과거 기록은 유지.
- 기존 가이드 3개를 유지하고 아래 12개 설비 가이드 추가.
- 홈에는 가이드 4개를 표시하고 전체 목록으로 연결. 전체 목록, 관련 글, 정적 상세 페이지와 `/sitemap.xml`은 같은 콘텐츠 목록을 사용.

## 신규 경로

| 주제 | 경로 |
| --- | --- |
| 화재감지기·소방감지기 | `/guides/fire-detector` |
| 화재경보기 | `/guides/fire-alarm` |
| 소화전 | `/guides/fire-hydrant` |
| 시각경보기 | `/guides/visual-fire-alarm` |
| 프리액션밸브 | `/guides/preaction-valve` |
| 옥내소화전 | `/guides/indoor-fire-hydrant` |
| 옥외소화전 | `/guides/outdoor-fire-hydrant` |
| 방화셔터 결선 | `/guides/fire-shutter-wiring` |
| 자동소화장치 | `/guides/automatic-fire-extinguishing-device` |
| 화재수신기 | `/guides/fire-alarm-control-panel` |
| 제연설비 | `/guides/smoke-control-system` |
| 배연창 자동개폐기 | `/guides/automatic-window-opener` |

## 작성 및 검증

- 사용자 확인에 따라 방화셔터는 배선 결선, 자동개폐기는 배연창 구동장치로 설명.
- 화재감지기와 소방감지기는 중복 문서 대신 한 글에서 설명.
- 소방청 화재안전성능기준, 법제처 자료, 용인시 건축자재 안내를 참고하고 각 상세 페이지에 링크 제공.
- 설치 대상·간격·용량을 일률적으로 단정하지 않으며, 결선도·제품 사양·현장 조건 확인을 안내.
- 각 글에 고유 제목·설명·canonical 및 Article/BreadcrumbList JSON-LD 생성.
- 사이트맵 파일 갱신과 검색엔진의 색인 반영은 별개입니다. 검색엔진 관리자 도구에 재제출한 것으로 간주하지 않습니다.
- lint, typecheck, build 및 단위 테스트 20개 통과. 공개 FAQ와 작업사례 본문에 삭제 대상 서비스 안내가 없음을 확인.
