# Eom Minseong — Portfolio 2026

Figma 디자인을 바탕으로 구현한 웹 디자인·퍼블리싱 포트폴리오입니다.

사이트: https://eom-minseong-portfolio-2026.minseongeom.chatgpt.site

## 실행

Node.js 20 이상에서 실행합니다.

```sh
npm install
npm run dev
```

`http://localhost:5173`에서 확인할 수 있습니다. 실행 시 소스를 빌드합니다. 소스를 수정한 뒤에는 서버를 다시 실행하거나 `npm run build`로 갱신합니다.

## 빌드

```sh
npm run build
```

배포용 파일은 `dist/`에 있습니다. 웹 서버에서 해당 폴더를 제공하면 됩니다.

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
