# Eom Minseong — Portfolio 2026

Figma 디자인을 바탕으로 구현한 웹 디자인·퍼블리싱 포트폴리오입니다.

사이트: https://eom-minseong-portfolio-2026.minseongeom.chatgpt.site

## 실행

Node.js 20 이상에서 실행합니다.

```sh
npm ci
npm run dev
```

`http://localhost:5173`에서 확인할 수 있습니다. 실행 시 소스를 빌드합니다. 소스를 수정한 뒤에는 서버를 다시 실행하거나 `npm run build`로 갱신합니다.

## 빌드

```sh
npm run build
```

배포용 파일은 `dist/`에 있습니다. 웹 서버에서 해당 폴더를 제공하면 됩니다.

## Vercel 배포

저장소를 Vercel에 연결하고 프로젝트 루트를 이 폴더로 지정합니다. `vercel.json`에 Framework Preset `Other`, Build Command `npm run build`, Output Directory `dist`를 지정했습니다. 별도 환경 변수는 필요하지 않습니다.

현재 `dist/`는 HTML·CSS·이미지·폰트의 원본도 포함합니다. 배포 전에 이 폴더를 삭제하거나 Git에서 제외하지 마세요. `build.mjs`는 React JavaScript 번들을 갱신합니다. 페이지 이동은 `/#about` 같은 해시 주소를 사용합니다.

배포 전 검증:

```sh
npm run check
npm audit
```

`npm run check`는 빌드 후 임시 HTTP 서버와 브라우저를 실행해 정적 파일, 7가지 화면 너비, 섹션 직접 접속·새로고침, 키보드 조작, 브라우저 오류를 확인합니다. Windows에서는 설치된 Edge를 사용하며, 다른 환경에서는 `npx playwright install chromium`으로 브라우저를 설치하세요. 실행 파일을 직접 지정하려면 `PLAYWRIGHT_EXECUTABLE_PATH` 환경 변수를 사용합니다.

소셜 프로필 URL과 Playground 상세 내용은 아직 안내용 문구입니다. 공개할 실제 내용이 준비되면 교체해야 합니다.

## 주요 기능

- PP Neue Montreal, Mono, Pretendard, Inter 웹폰트
- 마우스 방향·속도에 반응하는 검정 획의 국소 탄성 변형과 컬러 가장자리
- 마우스 이탈 시 탄성 복원, 모바일·모션 감소·WebGL 미지원 대체 표시
- 스크롤 속도에 따른 타이틀 이동과 정지 후 원위치 복귀
- 프로젝트 선택, 섹션 이동, 이메일 연결, 반응형 레이아웃

## 구조

- `src/Portfolio.jsx`: 포트폴리오 화면
- `src/use-elastic-typography.js`: 재사용 가능한 React 타이포그래피 Hook
- `src/elastic-typography.js`, `src/elastic-typography-shader.js`: WebGL 윤곽 변형 및 복원
- `src/scroll-titles.js`: 스크롤 타이틀 모션
- `dist/assets`, `dist/fonts`: 이미지·아이콘·폰트
- `dist/*.css`: 디자인과 반응형 스타일
- `verify-*.mjs`, `qa.mjs`: 브라우저 검증
- `.openai/hosting.json`: 기존 Sites 배포 설정

브라우저 검증 스크립트는 작업 환경의 Windows용 Microsoft Edge 경로를 사용합니다. 다른 환경에서는 해당 실행 경로를 수정해주세요.

`node_modules`, 브라우저 임시 프로필, 검증용 스크린샷, 배포 압축 파일은 Git에서 제외합니다.
