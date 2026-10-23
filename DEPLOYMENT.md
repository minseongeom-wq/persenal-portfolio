# 배포 파일 제외 기준

이미지·영상의 화질은 변경하지 않고, 확실히 사용하지 않는 항목만 배포에서 제외합니다. 원본 자료는 작업 폴더에 보존합니다.

## 포트폴리오

`build.mjs`는 다음 항목을 `dist/`에 복사하지 않으며, 이전 빌드에 남아 있으면 해당 배포 사본만 제거합니다.

- `projects/lotus/assets/models/emira.glb`, `eletre.glb`, `emeya.glb`: 사이트는 별도의 `*-draco.glb` 압축본을 사용합니다. 원본은 `projects/`에 유지합니다.
- `projects/men-i-trust/assets/videos/break-for-lovers-live-2025.mp4`: 첫 화면은 `hero-edited.mp4`를 사용합니다. 이전 영상은 `projects/`에 유지합니다.
- `projects/README.md`: 개발 문서.
- `curl-test.html`, `curl-test.js`: 단독 검증 페이지. HTML 소스는 `artifacts/curl-test.html`, React 소스는 `src/ProjectCurlTest.jsx`에 유지합니다.

단독 Curl 검증이 필요할 때만 아래 명령으로 포함합니다.

```sh
node build.mjs --with-curl-test
node serve.mjs --with-curl-test
```

일반적인 `npm run build`는 검증 페이지를 다시 제외합니다. `.vercelignore`에도 동일한 원본 제외 항목을 지정해 Vercel 업로드에 중복 원본이 실리지 않도록 했습니다. `artifacts/`, `references/`, `.video-tools/`의 기존 배포 제외는 유지합니다. 디코더와 라이선스는 배포에 유지합니다.

## 별도 닌텐도 프로젝트

`C:/Users/mbc/Desktop/mbc_teamproject/vite.config.js`의 `excludeLegacyDeploymentAssets` 플러그인은 아래 세 파일의 배포 사본만 제외합니다. `public/`의 원본은 그대로 보존합니다.

- `video/community/community-hero.mp4`: 현재 커뮤니티는 `videos/community/`의 개별 영상을 사용합니다.
- `home-transition/home-icon.png`
- `home-transition/pixel-takeover.png`: 이전 전환용 자료. 현재 전환은 별도 DOM/CSS 및 인트로 구현을 사용합니다.

생성된 번들에 이 경로가 직접 참조되면 빌드를 실패시키도록 보호했습니다. 향후 이 파일을 다시 사용할 때는 제외 목록에서도 제거해야 합니다. 기존 GitHub Pages 배포 흐름이 이 빌드 결과를 사용합니다.

검증 수치와 항목은 `artifacts/deployment-exclusions.json`에 기록합니다. 실제 배포·푸시는 별도로 진행하지 않았습니다.
