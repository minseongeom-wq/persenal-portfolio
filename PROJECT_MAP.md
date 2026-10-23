# 프로젝트 파일 안내

## 수정할 위치

| 프로젝트 | 파일 위치 | 설명 |
| --- | --- | --- |
| 메인 포트폴리오 | `src/` | React 화면과 인터랙션 |
| Lotus | `projects/lotus/` | 독립 정적 사이트 |
| Men I Trust | `projects/men-i-trust/` | 독립 정적 사이트 |
| Worldwideworld | `projects/worldwideworld/` | 독립 정적 사이트 |

`projects/`는 원본 프로젝트에서 가져온 독립 스냅샷입니다. 원본과의 관계는 `projects/README.md`를 참고하세요.

## 유지해야 하는 파일

- `dist/`: 배포 파일이면서 메인 사이트의 원본 HTML·CSS·이미지·폰트·동영상도 보관합니다. 폴더 전체를 삭제하지 마세요. 빌드는 JS 번들과 `dist/projects/`를 갱신합니다.
- `lib/`: 디자인 효과 런타임.
- `design-source.jsx`, `latest-design.jsx`, `design-classes.json`: 디자인 동기화에 사용하는 입력 파일.
- 루트의 `.mjs`와 기준 JSON: 빌드·서버·디자인 동기화·브라우저 검증 도구. 상대 경로를 사용하므로 이동 시 참조도 점검해야 합니다.
- `artifacts/`: 검증 스크립트, 측정 결과, 참고 자료.
- `.openai/`, `.vercel/`, `vercel.json`, `.vercelignore`: 호스팅·배포 설정.
- `package.json`, `package-lock.json`: 실행 명령과 의존성 정보.

## 참고 자료와 로컬 도구

- `references/`: 루트에서 옮긴 디자인 참고 이미지. 원본 내용은 유지했습니다.
- `node_modules/`: 설치된 의존성.
- `.preview-profile/`: 로컬 브라우저 프로필.
- `.video-tools/`: 로컬 영상 도구.

## 실행

```sh
npm run dev
npm run build
npm run check
```

개별 프로젝트 수정은 `projects/`에서 진행한 뒤 `npm run build`로 배포 사본에 반영합니다. `dist/projects/`만 직접 수정하면 다음 빌드에서 덮어써질 수 있습니다.
