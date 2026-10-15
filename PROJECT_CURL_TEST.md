# Selected Projects: Scroll Curl test

첫 번째 Nintendo 이미지의 시각 검토 후, Selected Projects의 **프로젝트 미디어 4개 전체**에 적용했습니다. 다른 섹션의 기존 영상 3개는 적용 범위에 포함하지 않습니다.

`npm.cmd run dev` 실행 후:

- 사이트의 Selected Projects: 이미지 4개에서 스크롤 속도와 방향을 바꾸며 확인
- `http://localhost:5173/curl-test.html`: 이미지 1개와 기존 영상 파일 1개를 분리해 검증하는 테스트 페이지

## 조절 위치

`src/project-curl-config.js`의 `CURL_OPTIONS`:

| 값 | 기본값 | 의미 |
| --- | --- | --- |
| `maxStrength` | `0.06` | 위아래 가장자리의 최대 수평 UV 압축 |
| `velocityReference` | `800` | 최대 강도 기준 스크롤 속도, px/s |
| `attackMs` | `25` | 강도가 증가할 때의 시간 상수 |
| `releaseMs` | `175` | 멈춘 뒤 복원될 때의 시간 상수 |
| `maxPixelRatio` | `1.5` | Canvas 해상도 상한 배율 |
| `maxCanvasWidth` | `2048` | Canvas 너비 상한 |

`ProjectGallery.jsx`가 각 프로젝트 미디어에 연결하며 모든 컨트롤러는 기존 프로젝트 미디어 RAF 하나를 공유합니다.

## 구조와 변경 파일

- `src/project-curl-config.js`: 공통 파라미터
- `src/project-curl-shader.js`: 중앙은 유지하고 위아래로 갈수록 강해지는 반원형 UV 압축
- `src/project-curl.js`: WebGL 텍스처, object-fit cover, 이미지/영상 업로드, 속도 측정, 복원, 정지/화면 밖/탭 숨김/모션 감소 및 WebGL 실패 처리
- `src/ProjectGallery.jsx`: 전체 프로젝트 미디어 연결 및 정리
- `src/project-noise.js`: 기존 호버 전환을 그린 뒤 같은 RAF에서 Curl 렌더링
- `dist/projects.css`: 미디어 내부 Curl Canvas 스타일 1개 추가; 기존 Raster 유지
- `src/ProjectCurlTest.jsx`, `dist/curl-test.html`, `build.mjs`: 별도 테스트 페이지 및 빌드
- `verify-project-curl.mjs`: GPU 픽셀, 이미지/영상, 속도/복원, 정지/화면 밖, 폴백 및 첫 카드 한정 검증
- `verify-project-noise.mjs`: 기존 호버 Canvas 선택자를 명시적으로 지정
- `dist/app.js`, `dist/curl-test.js`: 빌드 출력

Three.js/R3F/Lenis가 설치되어 있지 않아 의존성을 추가하지 않았습니다. 네이티브 스크롤을 그대로 사용합니다. Canvas는 미디어 내부에 고정되므로 스크롤마다 DOM 좌표를 복제하지 않습니다. 영상은 HTMLVideoElement에서 GPU 텍스처로 업로드하며 재생 제어는 기존 LoopVideo에 남겨 둡니다. 정지하면 Curl Canvas를 숨겨 원본 미디어를 표시하고, 새 노이즈·RGB Glitch·Blur는 추가하지 않습니다.

## 검증

`node verify-project-curl.mjs`

빠른 스크롤에서 강도 증가, 방향 반전 시 연속성, 정지 복원, 중앙보다 가장자리의 큰 GPU 픽셀 변형, 영상 재생 및 화면 밖 렌더링 중단, WebGL 미지원 및 reduced-motion 폴백을 검증합니다. 기존 스크롤 및 호버 회귀 검증은 `verify-project-scroll.mjs`, `verify-project-noise.mjs`입니다.

기법 참고: [HAOQI 제작자의 Codrops 설명](https://tympanus.net/codrops/2026/08/15/inside-haoqi-design-letting-dom-and-webgl-share-a-retro-futurist-stage/)의 scroll curl 및 속도 평활화.
