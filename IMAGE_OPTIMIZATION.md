# 무손실 이미지 최적화

2026-10-23 기준, 3개 프로젝트의 PNG 32개를 무손실 WebP로 배포합니다.
배포 용량은 41,575,023바이트(39.65MiB) 줄었고, 전체 dist는 약 278.65MiB에서 239.00MiB로 감소했습니다.

- 원본 PNG는 `projects/`에 그대로 보존합니다. 영상과 3D 모델은 이번 작업에서 변경하지 않았습니다.
- 해상도를 유지하고 FFmpeg로 디코딩한 RGBA 바이트 전체가 일치하는 이미지만 적용했습니다.
- 5% 이상 작아지지 않거나 픽셀이 달라지는 이미지는 PNG를 유지했습니다.
- 변환한 이미지에는 별도 ICC 프로필이 없고, 명시된 감마도 표준 sRGB 값임을 확인했습니다.
- `lib/optimized-images/manifest.json`에 원본 SHA-256, 크기, 변환 파일을 기록했습니다.
- 빌드 시 원본 해시를 확인하고 배포 사본과 참조 경로만 교체합니다. 원본이 수정되면 오래된 변환본을 배포하지 않도록 빌드를 중단합니다.
- WebP 변환본은 저장소에 포함하므로 일반 빌드에는 FFmpeg가 필요하지 않습니다.

검증: `npm.cmd run check`, `node artifacts/verify-lossless-images.mjs` 통과.
세 프로젝트의 이미지 디코딩, 음악 카드 전환, 변환 파일 HTTP 응답, 브라우저 오류를 확인했습니다.

다시 생성할 때는 로컬 `.video-tools/package/ffmpeg.exe`가 필요합니다.
`node artifacts/optimize-lossless-images.mjs` 실행 후 빌드 및 검증을 다시 진행합니다.
원복하려면 `build.mjs`의 `deployOptimizedImages` 호출을 제거하고 빌드하면 원본 PNG가 다시 복사됩니다.
이번 작업에서는 공개 사이트에 배포하지 않았습니다.
