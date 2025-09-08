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
