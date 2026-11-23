# Team Pulse Live

팀코칭 시간에 휴대폰으로 진행하는 익명 설문과 결과 화면입니다.

- 설문 사이트: https://mekhander.github.io/team-pulse-live/
- 진행자 화면: https://mekhander.github.io/team-pulse-live/admin.html
- 응답 API: https://team-pulse-live.mekhander.workers.dev

## 제공 기능

- 참여자는 무작위 세션 주소 또는 QR코드로 접속합니다.
- 진행자 화면에서 설문 참여 QR과 결과 보기 QR을 각각 제공합니다.
- 참여 화면과 결과 화면에는 팀 이름이 표시되지 않습니다.
- 이름, 이메일, GitHub 계정은 수집하지 않습니다.
- 응답 중에는 진행자 화면에 `6명 제출`처럼 제출 인원만 표시됩니다.
- 진행자가 설문을 종료하고 결과를 공개하면 자기 인식과 팀 인식 결과가 나란히 표시됩니다.
- 실수로 종료했을 때 `응답 다시 받기`로 기존 응답을 유지한 채 수집을 재개할 수 있습니다.
- 자동 해석이나 팀 간 비교는 제공하지 않습니다.

## 구성

- GitHub Pages: 설문, 진행자, 결과 화면
- Cloudflare Worker + D1: 세션과 익명 응답 저장 및 집계
- Miro: 진행자 화면에서 생성된 결과 링크를 `결과 보기` 버튼에 연결

## 로컬 실행

```powershell
npm install
Copy-Item wrangler.toml.example wrangler.toml
npm run db:migrate:local
npm run worker:dev
npm run dev
```

`.env.local`:

```text
VITE_API_BASE_URL=http://localhost:8787
```

`.dev.vars`:

```text
ADMIN_TOKEN=긴-무작위-관리-토큰
DUPLICATE_SALT=긴-무작위-솔트
```

`wrangler.toml`의 `ALLOWED_ORIGIN`에는 로컬 개발 시 `http://localhost:5173`, 운영 시 GitHub Pages의 origin을 지정합니다. 여러 값을 쓸 때는 쉼표로 구분합니다.

## 배포 순서

1. Cloudflare D1 데이터베이스를 만들고 `wrangler.toml`에 ID를 입력합니다.
2. `ADMIN_TOKEN`, `DUPLICATE_SALT`를 Worker secret으로 등록합니다.
3. 원격 마이그레이션과 Worker 배포를 실행합니다.
4. GitHub 저장소의 `Settings → Secrets and variables → Actions → Variables`에 `API_BASE_URL`을 등록합니다.
5. GitHub Pages의 배포 소스를 GitHub Actions로 지정합니다.
6. `/admin.html`에서 진행자용 이름 A, B, C, D로 네 세션을 만듭니다.
7. 각 세션의 설문 QR코드와 결과 보기 링크를 해당 팀의 Miro 보드에 배치합니다.

팀 이름은 진행자 화면에서만 보이며 설문·결과 URL과 참여자 API 응답에는 포함되지 않습니다.

## 익명성 메모

- 원본 응답에는 팀 세션, 13개 답변, 제출 시각만 저장됩니다.
- 중복 제출 방지 값은 브라우저에서 만든 무작위 ID를 서버에서 단방향 해시한 값이며 사람의 신원과 연결되지 않습니다.
- 응답 중에는 결과를 보여주지 않고 제출 인원만 보여 줍니다. 진행자가 공개한 뒤에만 집계 결과를 읽을 수 있습니다.
- 공용 QR 방식에서는 브라우저 데이터를 삭제한 뒤 다시 제출하는 행위를 완전히 막을 수 없습니다. 익명성을 훼손하지 않는 의도적인 절충입니다.

