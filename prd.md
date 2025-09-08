<<<<<<< HEAD
PRD: 캔버스 생존 슈터 (React)

최종 목표: 이 문서만으로 한 번에 정확히 구현 가능하도록 모든 규칙·공식·수용기준을 명확히 기술한다.

1. 목표와 범위
- 단일 스테이지의 생존형 슈터 게임. 논리 해상도 800×600 고정.
- 데스크톱/모바일 브라우저에서 동일한 게임 플레이 경험을 제공.
- 모달(레벨업, 게임오버) 시에는 게임 루프와 모든 입력이 완전히 정지.
- 본 범위에서 사운드, 세이브/로드, 멀티플레이, 설정 화면은 제외(후속 범위).

2. 용어
- 논리 좌표: 게임 내부 좌표계(원점 좌상단, 800×600).
- DPR: `devicePixelRatio`(렌더 해상도 배수). 본 게임에서는 2.0으로 상한 캡 적용.
- contain: 전체 캔버스가 화면에 모두 보이도록 비율 유지 확대/축소.
- 조이틱: 모바일에서 화면 위 가상 스틱 입력 UI.
- 모달: 레벨업 선택 또는 게임오버를 표시하는 전체 화면 오버레이 UI.

3. 기술/배포/성능
- 스택: React(CRA 기반, JavaScript). TypeScript 전환은 후속 작업으로 분리.
- 빌드/배포: 정적 빌드 산출물, Vercel 배포 가정.
- 목표 성능: 60 FPS. 5분 플레이 중 프레임 드롭 < 5%.
- 메모리/텍스처 제약: DPR 캡 2.0, 이미지 프리로드, 객체 풀링(투사체/적 권장).

3.1 고정 상수 표(필수)
- 플레이어
  - 이동 속도: 200 px/s, 가속/감속 없음(입력 벡터 즉시 적용)
  - 히트박스: 원(circle), 반지름 12 px
  - 발사 간격: 0.5 s(파워업에 의해 최소 0.2 s까지 단축 가능)
- 투사체
  - 속도: 420 px/s, 수명: 1.8 s, 반지름: 4 px, 기본 관통 0회(명중 시 소멸)
  - 데미지: 1(일반 적 HP 1, 보스 HP 10 기준)
- 적(일반)
  - 속도: 80 px/s, 히트박스 반지름: 16 px, HP: 1
- 보스
  - 등장: 생존 시간 60 s 경과 시 최초 1기 스폰
  - 속도: 60 px/s, 히트박스 반지름: 24 px, HP: 10, 처치 점수/XP +5
- 스폰/개수 한도
  - 동시 적 최대: 50(성능 가드)
  - 최소 플레이어 거리: 120 px 밖에서만 스폰
  - 스폰 링: 화면 밖 30 px 바깥에서 스폰(사방)
  - 일반 적 스폰 주기: 시작 1.2 s, 10 s마다 10% 단축(최소 0.4 s)

4. 화면/레이아웃(반응형, 모바일 contain + 하단 정렬)
- 논리 해상도: 800×600 고정. 좌표 (0,0)=좌상단.
- 공통 스케일 계산(필수):
  - `scale = min(vw/800, vh/600)`
  - `cssWidth = round(800 * scale)`, `cssHeight = round(600 * scale)`
  - `offsetLeft = floor((vw - cssWidth)/2)`
  - 데스크톱: `offsetTop = floor((vh - cssHeight)/2)`(중앙 정렬 허용)
  - 모바일(pointer:coarse): `offsetTop = max(vh - cssHeight - safeBottom, 0)`(하단 정렬)
- 컨테이너 CSS(모바일 우선):
  - `display:flex; justify-content:center; align-items:flex-end;`
  - `width:100vw; height:100vh; background:#000;`
  - `padding-bottom: env(safe-area-inset-bottom);`
- 캔버스 해상도/렌더링:
  - `devicePixelRatioCapped = min(window.devicePixelRatio||1, 2)`
  - `canvas.width = cssWidth * devicePixelRatioCapped`
  - `canvas.height = cssHeight * devicePixelRatioCapped`
  - 2D 컨텍스트: `ctx.setTransform(devicePixelRatioCapped*scale, 0, 0, devicePixelRatioCapped*scale, 0, 0)`
  - `ctx.imageSmoothingEnabled = false`
- 입력 좌표 변환(반드시 동일 공식 사용):
  - `logicalX = (clientX - offsetLeft) / scale`
  - `logicalY = (clientY - offsetTop) / scale`
- 리사이즈/회전 처리: `ResizeObserver + orientationchange` 사용, 100ms 디바운스 내 재계산.
- 수용기준(AC)
  - 어떤 모바일 뷰포트에서도 800×600 전체가 가림 없이 보인다(contain).
  - 모바일에서 캔버스는 하단 정렬되어 조이틱과 자연스럽게 분리된다.
  - notch/홈바 기기에서 safe-area로 HUD/버튼이 잘리지 않는다.
  - 회전/주소창 변화/소프트 키보드 등장 후 100ms 내 정상 재배치.

5. HUD 및 패널
- HUD(상단 중앙): `Score: <총점> | Time: <mm:ss>`
  - 스타일: 중앙 정렬, 반투명 배경, 패딩 8px, 글자 14px.
  - 타이머/스코어는 게임 루프 정지 시 증가도 정지(모달/게임오버 포함).
- 상태 패널(좌상단): Kills, Level, XP 진행도(선택) 표시 가능. 모바일에서 HUD/패널은 캔버스 영역 안에서만 표시되어야 함.
- 수용기준(AC)
  - HUD 텍스트가 어떤 해상도에서도 겹치거나 잘리지 않는다.
  - 게임 정지 상태에서 Time/Score 증가가 중단된다.

6. 조작/입력
- 키보드(데스크톱): `WASD` 또는 방향키 이동.
- 경계 처리: 플레이어는 논리 영역(0..800, 0..600) 바깥으로 이동 불가.
- 모바일 조이틱(UI 표시/숨김 규칙)
  - `pointerdown` 첫 지점에 즉시 조이틱 표시. 같은 포인터로 드래그하면 연속 입력.
  - `pointerup` 즉시 조이틱 숨김 및 입력 벡터 (0,0)으로 초기화.
  - 멀티터치 시 최초 활성 포인터 1개만 입력으로 인정(다른 포인터 무시).
- 모바일 조이틱(이벤트/스타일 규칙)
  - 컨테이너/조이틱: `touch-action:none; user-select:none; overscroll-behavior:none;`
  - 이벤트: 리스너 `{ passive:false }` + `event.preventDefault()` 호출.
  - Pointer Events 권장: `pointerdown` 시 `setPointerCapture(pointerId)` 사용.
  - 벡터 계산: 중심 반경 50px 기준, -1..1로 정규화. 데드존 0.1, 스무딩 시간상수 50~100ms 권장.
- 수용기준(AC)
  - 10초 이상 드래그 유지 시 입력 끊김/스크롤 튐 현상 없음.
  - 모달 표시 중에는 모든 입력/조이틱이 비활성(pointer-events 차단).

6.1 상태 전이(State Machine)
- Idle → Playing → (LevelUpModal ↔ Playing 반복) → GameOver
- 전이 규칙
  - LevelUpModal 진입 시 업데이트/스폰/발사/충돌/타이머 모두 정지
  - GameOver 진입 프레임에 루프 정지, 오버레이 표시, 입력 차단
  - Restart 시 모든 엔티티/타이머/점수/XP 초기화 후 Playing 재진입

7. 점수/XP/레벨업
- 점수 규칙
  - 시간 점수: 실시간 1초당 +1 점.
  - 처치 점수: 일반 적 +1, 보스 +5.
  - 총점 = 시간 점수 + 처치 점수.
- XP 규칙
  - 일반 적 +1 XP, 보스 +5 XP.
  - 레벨 임계치: 10, 20, 40, 80, …(두 배 증가).
- 레벨업 모달
  - 3개의 파워업 선택지를 표기. 모달 표시 중 게임 루프/타이머/스폰/발사/충돌 모두 정지.
  - 선택 즉시 게임 재개, 초과 XP는 다음 레벨에 이월.
- 수용기준(AC)
  - 60초 생존, 일반 5킬, 보스 1킬 시 총점/XP/레벨 변화가 계산식과 일치.

7.1 파워업 정의(고정, 중복 허용)
- Rapid Fire: 발사 간격 -20% (최소 0.2 s까지 하한 캡, 누적 곱연산)
- Projectile Speed: 투사체 속도 +30% (최대 2.0×까지 상한 캡)
- Pierce: 관통 +1 (최대 +3, 적 명중 시 관통 1 소모, 0이면 소멸)
- Multi-shot: 발사체 +1개, 좌우 ±12° 각도 분산(최대 +2개, 총 3발)
- 표기 규칙: 레벨업마다 위 목록에서 중복 없이 3개 무작위 제시(전체 수가 4이므로 3개 샘플링)
- 수용기준(AC)
  - 파워업 누적 시 각 상한/하한 캡을 절대 초과하지 않음
  - 멀티샷은 항상 중심선 기준 대칭 각도 분산 유지

8. 공격/투사체
- 자동 발사: 0.5초 간격 고정(60FPS 기준 ±1프레임 허용 오차).
- 조준 규칙: 이동 중에는 입력 벡터 방향, 정지 시 가장 가까운 적 방향.
- 투사체 속도/크기/쿨다운은 기본값 대비 ±10% 범위의 스케일링은 허용(난이도/난수).
- 수용기준(AC)
  - 120발 연속 발사 중 발사 주기 편차가 ±1프레임 이내.

8.1 시간/타이밍 모델
- 메인 루프: `requestAnimationFrame` 기반, `deltaTime`(초) 사용, 프레임당 `dt`는 `clamp(dt, 0, 0.05)`
- 모든 이동/쿨다운/스폰/타이머는 dt 기반 누적(실시간 1초 = 게임시간 1초)
- 일시정지(모달/오버레이) 시 업데이트 스텝을 스킵하여 `dt=0`과 동일 효과 보장

9. 적/보스/스폰(요구 최소치)
- 기본 이동/체력/크기/스폰 주기는 구현의 재량이나, 모든 값은 표시/충돌/렌더에서 ±10% 오차 내 일관 유지.
- 이미지 비율 훼손 금지: 렌더된 스프라이트의 가로/세로 비율은 원본 대비 ±10% 이내.

9.1 스폰 공식(상세)
- 스폰 위치: 사방 경계선에서 외측 30 px 띠의 임의 지점, 플레이어와 최소 120 px 거리 보장
- 주기 변화: `spawnInterval = max(0.4, 1.2 * 0.9^(floor(elapsed/10s)))`
- 동시 수 제약: 필드에 적 수가 50 이상일 경우 스폰 건너뜀
- 보스: 60 s 경과 시 1회 스폰(이미 존재하면 추가 스폰 없음)

10. 충돌/게임오버
- 충돌 규칙: 플레이어와 적(또는 적의 유효 히트박스)이 접촉하는 프레임에 즉시 게임오버.
- HP/무적 시간 없음. 즉사.
- 게임오버 화면: Final Score, Kills, Time, Restart 버튼.
- 수용기준(AC)
  - 충돌 프레임에 루프 정지, HUD/조이틱 비활성, 오버레이 표시.

10.1 충돌/히트박스 규격(고정)
- 형태: 전 엔티티 원형 히트박스 사용(circle vs circle)
- 반지름: 플레이어 12, 일반 적 16, 보스 24, 투사체 4(px)
- 판정: 두 중심 거리 ≤ (r1 + r2) 이면 충돌
- 투사체 관통: 관통 수치 > 0이면 적 히트 시 관통 -1, 0이면 소멸

11. 리사이즈/회전/가시성
- `visibilitychange` 시 타이머/루프 일시 정지(선택) 가능. 최소한 레벨업/오버레이 중에는 중복 정지 유지.
- `ResizeObserver` + `orientationchange`로 레이아웃 재계산. 100ms 내 반영.

11.1 난수/재현성
- `seed`가 URL 쿼리(`?seed=...`)에 존재하면 결정적 RNG 사용(예: mulberry32)
- `seed` 미지정 시 `crypto.getRandomValues` 등으로 시드 생성 후 런타임에 유지
- RNG 사용 범위: 스폰 위치, 파워업 선택 샘플링, 초기 적 이동 방향

12. 테스트/검증 체크리스트(필수)
- 반응형/레이아웃
  - iPhone 12/SE, Galaxy S10/S22, iPad, 데스크톱 1366×768/1920×1080에서 캔버스 전체가 항상 보임(contain).
  - 모바일에서 캔버스 하단 정렬, safe-area 적용으로 UI 잘림 없음.
- 입력
  - 조이틱 장시간 드래그 시 스크롤·당김 현상 없음. 멀티터치 1지점만 처리.
  - 모달 표시 중 입력/조이틱 차단, 닫는 즉시 정상 복구.
- 점수/레벨/모달
  - 점수식/XP/레벨 임계 통과/초과 XP 이월 동작이 수식과 일치.
- 공격/충돌
  - 발사 주기(0.5초) 편차 ±1프레임, 충돌 즉시 게임오버.
- 성능
  - 적 50, 투사체 50 동시 존재 시 60FPS 유지(중급 모바일 기준). 프레임 드롭 < 5%.

12.1 시나리오형 AC(샘플)
- 시나리오 A: 60 s 생존, 일반 적 5킬, 보스 1킬, 파워업 2회(Rapid Fire, Pierce)
  - 시간 점수 60, 처치 점수 5×1 + 1×5 = 10, 총점 70
  - XP: 5×1 + 1×5 = 10 → 레벨 1 업(임계 10), 초과 0
  - Rapid Fire 1회로 발사 간격 0.4 s, Pierce 1회로 관통 1 적용 확인

13. 메타/구현 메모
- 초기 진입 시 이미지 프리로드 후 게임 시작.
- 오브젝트 풀링으로 GC 스파이크 방지(특히 투사체/적).
- 좌표·스케일·입력 변환 공식은 본문과 동일하게 1원화하여 사용.

13.1 자산 매핑(권장)
- 플레이어: `public/luffy.png`(중앙 앵커, 논리 반지름 12에 맞춰 스케일)
- 일반 적: `public/enemy1.png`, `enemy2.png`, `enemy3.png`(무작위 선택, 반지름 16)
- 보스: `public/boss1.png` 또는 `boss2.png`(반지름 24)
- 공격 이펙트(선택): 투사체는 캔버스 기본 도형(원)으로 표현 가능
- 비율 유지: 렌더 크기는 히트박스 반지름을 기준 삼아 종횡비 유지 스케일

14. 배포/운영
- 로컬 개발: `npm start`로 개발 서버 실행, 60FPS 확인.
- 프로덕션: `npm run build` 산출물을 정적 호스팅(Vercel 등)에 배포.

부록 A: 구현 예시(요지)
- 컨테이너 스타일(모바일 우선)
  - `display:flex; justify-content:center; align-items:flex-end; width:100vw; height:100vh; background:#000; padding-bottom: env(safe-area-inset-bottom);`
- 스케일/좌표 공식(반드시 동일하게 적용)
  - `scale = min(vw/800, vh/600)`, `cssWidth = round(800*scale)`, `cssHeight = round(600*scale)`
  - `offsetLeft = floor((vw-cssWidth)/2)`, `offsetTop = 모바일? (vh-cssHeight-safeBottom): floor((vh-cssHeight)/2)`
  - `logicalX = (clientX - offsetLeft)/scale`, `logicalY = (clientY - offsetTop)/scale`
- 캔버스 해상도
  - `devicePixelRatioCapped = min(devicePixelRatio||1, 2)`
  - `canvas.width = cssWidth * devicePixelRatioCapped`, `canvas.height = cssHeight * devicePixelRatioCapped`
  - `ctx.setTransform(devicePixelRatioCapped*scale, 0, 0, devicePixelRatioCapped*scale, 0, 0)`

본 PRD의 수용기준을 모두 충족하면, 단일 구현 패스로 기대 동작을 재현할 수 있다.
=======
PRD: 뱀서바이벌 스타일 생존 오토 배틀러 (React)

1. 개요
이 문서는 React 기반으로 캔버스 생존 오토 배틀러 게임을 구현하기 위한 명세입니다. 과도한 엔지니어링을 지양하고, 핵심 규칙을 명확히 하여 의도한 동작을 보장합니다.

2. 기술/배포
- 기술 스택: React(환경은 CRA 또는 Next.js 중 택1), TypeScript 권장(필수 아님)
- 배포: Vercel 또는 정적 호스팅
- 캔버스 크기: 800×600, 좌표계 (0,0) = 좌상단

3. 조작 및 이동
- 입력: 키보드 WASD/방향키. 모바일은 가상 조이스틱.
- 플레이어는 화면 밖으로 이동 불가(경계 클램핑).

4. HUD(점수/시간)
- 위치: 화면 최상단 중앙(top-center)에 가로 배치.
- 포맷: “Score: <총점> | Time: <mm:ss>”.
- 스타일: 상단 여백 8px, 중앙 정렬, 반투명 배경, 글자 14px.

4.1 화면/캔버스 레이아웃(반응형/정확한 스케일 수식)
- 논리 해상도(고정): 월드 좌표 800×600.
- 데스크톱: 캔버스 CSS 800×600 중앙 정렬.
- 모바일(기본 contain):
  - 컨테이너: `width: 100vw; height: 100vh; background: #000`.
  - 스케일/오프셋 계산(뷰포트 vw×vh):
    - `scale = min(vw/800, vh/600)`
    - `cssWidth = round(800*scale)`, `cssHeight = round(600*scale)`
    - `offsetLeft = floor((vw - cssWidth)/2)`, `offsetTop = floor((vh - cssHeight)/2)`
  - 캔버스 해상도(선명도):
    - `canvas.width = cssWidth * devicePixelRatio`
    - `canvas.height = cssHeight * devicePixelRatio`
    - 2D 컨텍스트에 `setTransform(devicePixelRatio*scale, 0, 0, devicePixelRatio*scale, 0, 0)` 적용
    - `imageSmoothingEnabled=false`
  - 입력 좌표(논리 좌표로 역변환):
    - `logicalX = (clientX - offsetLeft) / scale`
    - `logicalY = (clientY - offsetTop) / scale`
  - 안전영역: HUD/상태패널 배치에 `env(safe-area-inset-*)` 반영.
- 리사이즈/회전: `ResizeObserver + orientationchange`로 즉시(≤100ms) 재계산.
- 옵션(선택): `RENDER_MODE=cover` 일 때 `scale = max(vw/800, vh/600)`(잘림 허용, 중앙 크롭). HUD/패널은 항상 화면 내 표시.

5. 크기/스케일 요구사항
- 플레이어/적/보스: 원본 스프라이트 대비 10% 크기로 스케일링.
- 투사체: 원본 스프라이트 대비 10% 크기로 스케일링.
- 수용 기준: 렌더링된 이미지의 가로/세로가 원본 대비 지정 비율(±10% 오차) 이내.

6. 충돌 및 게임오버(고정 규칙)
- 규칙: 플레이어와 적의 경계가 닿는 프레임에 “즉시 게임오버(즉사)”.
- HP/피해량/무적시간 개념 없음. 접촉=사망.
- 상태 패널의 Life는 1로 표기(정보 제공용).
- 게임오버 시: 루프 정지, 게임오버 오버레이 표시.
  - 오버레이 항목: Final Score(총점), Kills(처치 수), Time(mm:ss), Restart 버튼.

7. 점수 규칙(시간 점수 + 처치 점수)
- 시간 점수: 1초당 1점(루프가 정지된 동안은 증가하지 않음).
- 처치 점수: 일반 적 1점, 보스 5점.
- 총점 = 시간 점수 + 처치 점수.

8. 자동 공격(오토 파이어)
- 기본: 일정 간격(예: 0.5초)으로 자동 발사. 가장 가까운 적 방향을 우선.
- 적이 없을 경우: 입력 벡터 방향으로 발사.
- 투사체 크기는 5번 스케일 규칙 준수(원본 10%).

9. 레벨업과 일시정지
- XP 부여 시점: 적 처치 “즉시” XP를 부여(일반 +1, 보스 +5). 같은 프레임에 임계치 도달 여부 검사.
- 조건: 경험치 임계(예: 10, 20, 40, 80, …) 도달 시 레벨업.
- 모달: 3개의 파워업 선택지를 모달로 표시.
- 정지: 모달이 열려 있는 동안 게임 루프 “완전 정지”. 아래가 모두 멈춤:
  - 플레이어/적 이동, 스폰, 충돌 판정, 발사, 경과 시간 증가, 점수 증가
- 선택 즉시: 파워업 적용 후 루프 재개. 초과 XP는 다음 레벨로 이월.

10. 모바일 입력(가상 조이스틱)과 스크롤/제스처 제어
- 조이스틱/캔버스 컨테이너 CSS:
  - `touch-action: none;`, `user-select: none;`, `overscroll-behavior: none;` 적용.
- 터치 이벤트 핸들링:
  - `touchstart`/`touchmove` 리스너는 `{ passive: false }`로 등록하고, 내부에서 `event.preventDefault()` 호출.
- 뷰포트 메타 태그:
  - `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">` 지정.
- 레이아웃:
  - 앱 루트는 `height: 100vh`로 고정하여 문서 스크롤 방지.
- 표시/숨김 트리거(동적 조이스틱):
  - 모바일(pointer: coarse)에서 캔버스 또는 게임 영역을 “첫 터치”한 순간, 해당 터치 지점을 중심으로 조이스틱을 표시한다.
  - 드래그 중에는 계속 표시되며, 터치 종료 시 즉시 숨긴다. 고정형(좌하단 고정) 모드 옵션은 추가 가능.
- 조이스틱 벡터 산출:
  - 중심 반지름 50px 기준, -1..1 범위의 정규화 이동 벡터를 산출하고 키보드 입력 벡터와 합성한다.
  - 조이스틱 좌표는 항상 “논리 좌표” 기준으로 계산한다(위 4.1의 역변환 공식을 사용).
- 단일 터치/포인터 정책:
  - `pointerdown` 한 번으로 조이스틱 표시, 동일 이벤트에서 드래그 시작 및 벡터 산출(setPointerCapture 사용).
  - `pointerup/cancel`에서 즉시 조이스틱 숨김 및 외부 벡터 (0,0).
- 수용 기준:
  - 모바일 에뮬레이터에서 캔버스 첫 터치 시 1프레임 내 조이스틱이 표시되고, 드래그 방향에 따라 캐릭터가 이동한다.
  - 조이스틱 조작 중 페이지 스크롤/바운스/핀치줌이 발생하지 않는다. 터치 종료 시 조이스틱이 즉시 숨겨지고 이동 벡터는 (0,0)이다.

11. 유즈케이스 요약
- UC-01 게임 시작: 진입 시 초기화 후 즉시 시작. 플레이어는 중앙에 생성.
- UC-02 조작: 키보드/조이스틱으로 이동. 화면 밖 이동 불가.
- UC-03 적 스폰/이동: 일반 적은 주기적 스폰, 보스는 처치 누적(예: 50)마다 등장. 적은 플레이어를 추적.
- UC-04 자동 공격: 지정 간격으로 자동 발사. 타겟팅/방향 규칙 준수.
- UC-05 충돌: 플레이어-적 접촉 즉시 게임오버. 투사체-적 충돌 시 적 피해/처치 및 경험치/처치 점수 획득.
- UC-06 레벨업: 처치 XP가 임계 도달 시 모달 띄우고 전체 정지. 선택 후 재개.
- UC-07 게임오버: 오버레이에 Final Score, Kills, Time 표기와 재시작 제공.

11.1 캐릭터 상태 패널(좌측 상단)
- 위치: 화면 좌측 상단(top-left) 고정 패널.
- 항목: Life, Fire Rate(발사/초), Bullet Damage(탄 데미지). 필요 시 Level, XP 추가 가능.
- 포맷 예시: `Life: 1 | FireRate: 2.0/s | Damage: 1`
- 스타일: 반투명 배경, 12–14px 폰트, 프레임마다 최신 값 반영.

12. 모듈 구성(권장)
- hooks: 입력(useInput), 루프(useGameLoop), 플레이어(usePlayer), 적(useEnemies), 투사체(useProjectiles)
- components: 캔버스 렌더러(GameCanvas), HUD, LevelUpModal, GameOverScreen, VirtualJoystick
- types: 엔티티 타입/상수

13. 수용 기준(Definition of Done)
- 충돌/게임오버: 플레이어가 적과 접촉한 프레임 내에 게임오버 화면이 즉시 뜨고 루프가 정지한다.
- HUD 위치/표기: 점수/시간이 화면 최상단 중앙에 고정되며 포맷을 준수한다.
- 스케일: 플레이어/적/보스/투사체 모두 원본의 10%로 렌더링(±10% 오차 이내).
- 레벨업 정지: 모달이 열려 있는 동안 위치/스폰/발사/타이머/점수 값 모두 변하지 않는다.
- 점수: 처치 점수와 시간 점수가 합산되며, 10초간 처치 없이 유지 시 점수 10 증가.
- 게임오버 오버레이: Final Score, Kills, Time이 정확히 표기된다.
- 모바일 스크롤 제어: 조이스틱 조작 중 페이지 스크롤/바운스/핀치줌이 발생하지 않는다.
- 레벨업 트리거: 적 처치 프레임에 XP가 부여되고, 임계 도달 시 같은 프레임에 모달이 열린다(정지 상태 전환).
- 상태 패널: 게임 시작 즉시 좌측 상단에 표시되며, 업그레이드 선택 직후 값이 갱신된다.

13.2 반응형/캔버스 레이아웃
- 모바일 뷰포트(여러 해상도/종횡비)에서 전체 게임 월드가 화면 내에 온전히 보이며 화면 밖으로 벗어나 보이지 않는다(contain 기준). 검은 레터박스는 양옆 또는 상하에만 나타난다.
- 리사이즈/회전 시 캔버스가 100ms 이내 자연스럽게 재배치/재스케일되며 조작 좌표(논리 좌표 변환)가 정확하다(5점 샘플: 0,0 / 800,0 / 800,600 / 0,600 / 중앙 테스트).
- DPR에 따라 텍스트/스프라이트가 흐릿해지지 않고(스무딩 비활성), 스케일 후에도 HUD/상태 패널 위치가 의도한 곳에 유지된다(safe-area 반영).
- 확인 기기(예시): iPhone SE(375×667), iPhone 14 Pro Max(430×932), Galaxy S8(360×740), iPad(768×1024), Pixel 7(412×915)에서 이상 없음.

14. 성능
- 60 FPS 목표. 캔버스 한번에 전체 리렌더 가능. 필요시 스프라이트 캐싱.

15. 배포/환경
- 로컬: npm start로 개발 서버 실행. 브라우저 60FPS 확인.
- 프로덕션: 빌드 후 정적 호스팅 배포.

10.1 모바일 조이스틱(단일 터치/드래그 즉시 시작)
- 한 번의 터치(pointerdown)로 조이스틱을 터치 지점에 즉시 표시하고, 같은 이벤트로 드래그 상태를 시작하며 이동 벡터를 산출한다(추가 터치 불필요).
- Pointer Events 권장: pointerdown 시 setPointerCapture(pointerId)로 동일 포인터의 move/up을 안정적으로 수신한다. 대안으로 touchstart/touchmove/touchend 사용 시 리스너는 passive:false로 등록하고 preventDefault() 호출.
- 컨테이너/조이스틱: touch-action:none, overscroll-behavior:none, user-select:none 적용. 첫 pointerdown에서 preventDefault()로 스크롤/줌 방지.
- pointerup 시 조이스틱을 즉시 숨기고 외부 벡터를 (0,0)으로 초기화.
- 단일 포인터 정책: 활성 포인터 1개만 입력으로 사용. 드래그 중 새 pointerdown은 무시하거나 대체하지 않음.

10.2 레벨업 모달 중 입력/조이스틱 차단
- levelUp 모달이 열려 있는 동안 입력 캡처를 비활성화하고 조이스틱은 강제 숨김(visible=false).
- 레이어링: 모달 오버레이는 pointer-events:auto로 입력을 독점하고, 게임 컨테이너/조이스틱은 pointer-events:none 처리.
- 업그레이드 선택(모달 닫힘) 시에만 입력 캡처와 조이스틱 표시를 재개.

13.1 수용 기준 보강(모바일/레벨업)
- 모바일에서 화면을 한 번 터치하면 1프레임 내 조이스틱이 나타나고, 추가 터치 없이 드래그만으로 캐릭터가 이동한다.
- pointerup 시 조이스틱이 즉시 숨겨지고 이동이 멈춘다(벡터 = 0,0).
- 레벨업 모달이 열린 상태에서 화면을 터치/드래그해도 조이스틱이 생성되지 않으며, 모달 버튼은 정상적으로 터치/선택 가능하다.
- 레벨업 모달이 닫힌 직후에만 조이스틱 표시/입력이 재개된다.
>>>>>>> 49d474ed161c959dc1e005abc617aabffcb9b32a
