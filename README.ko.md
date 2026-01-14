# Docker 풀스택 Next.js + NestJS CRUD 애플리케이션

[English](README.md) | [한국어](README.ko.md)

Next.js 프론트엔드, NestJS 백엔드, PostgreSQL 데이터베이스로 구성된 완전한 Docker 기반 풀스택 애플리케이션입니다.

## 주요 기능

### 핵심 기능

- **프론트엔드**: TypeScript, Tailwind CSS, React Query를 사용한 모던 Next.js 14
- **백엔드**: Prisma ORM과 PostgreSQL을 사용한 NestJS
- **데이터베이스**: 영구 볼륨을 지원하는 Docker 내 PostgreSQL 16
- **모노레포**: 효율적인 의존성 관리를 위한 pnpm 워크스페이스
- **Docker**: 개발 및 프로덕션을 위한 완전한 컨테이너화
- **CRUD 작업**: 게시물 생성, 조회, 수정, 삭제
- **핫 리로드**: 실시간 코드 업데이트 개발 모드
- **타입 안정성**: 전체 스택에 걸친 TypeScript 지원
- **반응형 UI**: 모든 디바이스에서 작동하는 모바일 우선 디자인

### 인증 및 권한 관리

- **JWT 인증**: 액세스 토큰(15분) + 리프레시 토큰(7일)
- **쿠키 기반 저장**: XSS 보호를 위한 HttpOnly 쿠키
- **OAuth 2.0**: Google, GitHub, Kakao 통합
- **RBAC 시스템**: 권한 기반 역할 기반 접근 제어
- **토큰 갱신**: 재시도 큐를 사용한 자동 토큰 갱신
- **라우트 보호**: 보호된 라우트를 위한 Next.js 미들웨어
- **세션 관리**: Redis + PostgreSQL 하이브리드 저장소

### 모니터링 및 관찰 가능성

- **Prometheus**: 모든 서비스로부터 실시간 메트릭 수집
- **Grafana**: 시각화를 위한 사전 구성된 대시보드
- **애플리케이션 메트릭**: NestJS 성능, 응답 시간, 오류율
- **데이터베이스 메트릭**: PostgreSQL 연결, 쿼리, 캐시 히트
- **캐시 메트릭**: Redis 작업, 메모리 사용량, 키 통계
- **시스템 메트릭**: CPU, 메모리, 디스크, 네트워크 사용량

## 기술 스택

### 프론트엔드

- **Next.js 14** - App Router를 사용한 React 프레임워크
- **TypeScript** - 타입 안전 JavaScript
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **SWR** - 데이터 페칭 및 캐싱
- **Axios** - HTTP 클라이언트

### 백엔드

- **NestJS** - 프로그레시브 Node.js 프레임워크
- **TypeORM** - TypeScript 및 JavaScript용 ORM
- **PostgreSQL** - 관계형 데이터베이스
- **class-validator** - 유효성 검사 데코레이터
- **class-transformer** - 객체 변환

### DevOps 및 모니터링

- **Docker** - 컨테이너화
- **Docker Compose** - 멀티 컨테이너 오케스트레이션
- **pnpm** - 빠르고 디스크 공간 효율적인 패키지 매니저
- **Prometheus** - 메트릭 수집 및 모니터링
- **Grafana** - 메트릭 시각화 및 대시보드
- **Exporters** - PostgreSQL, Redis, Node.js 시스템 메트릭

## 프로젝트 구조

```
docker_fullstack_next_nest/
├── apps/
│   ├── frontend/              # Next.js 애플리케이션
│   │   ├── src/
│   │   │   ├── app/           # App router 페이지
│   │   │   ├── components/    # React 컴포넌트
│   │   │   ├── lib/           # API 클라이언트 및 타입
│   │   │   └── hooks/         # 커스텀 React 훅
│   │   ├── Dockerfile         # 프로덕션 빌드
│   │   └── Dockerfile.dev     # 개발 빌드
│   └── backend/               # NestJS 애플리케이션
│       ├── src/
│       │   ├── posts/         # Posts CRUD 모듈
│       │   ├── app.module.ts  # 루트 모듈
│       │   └── main.ts        # 진입점
│       ├── Dockerfile         # 프로덕션 빌드
│       └── Dockerfile.dev     # 개발 빌드
├── docker-compose.yml         # 메인 개발 설정
├── docker-compose.dev.yml     # 핫 리로드 개발 설정
├── docker-compose.prod.yml    # 프로덕션 설정
├── package.json               # 루트 워크스페이스 설정
└── pnpm-workspace.yaml        # 워크스페이스 정의
```

## 빠른 시작

### 사전 요구 사항

- Docker 및 Docker Compose 설치
- pnpm 설치 (로컬 개발 시 선택 사항)
- Git 설치

### 1. 클론 및 설정

```bash
# 프로젝트 디렉토리로 이동
cd docker_fullstack_next_nest

# 환경 파일 복사
cp .env.example .env
```

### 2. Docker Compose로 시작

```bash
# 모든 서비스 시작 (PostgreSQL, Backend, Frontend)
docker-compose up --build

# 또는 백그라운드 모드로 실행
docker-compose up -d --build
```

다음이 시작됩니다:

- **PostgreSQL** (http://localhost:5432)
- **Backend API** (http://localhost:4000)
- **Frontend UI** (http://localhost:3000)
- **Prometheus** (http://localhost:9090)
- **Grafana** (http://localhost:3001)

### 3. 애플리케이션 접속

브라우저를 열고 다음 주소를 방문하세요:

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:4000
- **API 헬스 체크**: http://localhost:4000/health
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **백엔드 메트릭**: http://localhost:4000/metrics

### 4. 서비스 중지

```bash
# 서비스 중지
docker-compose down

# 볼륨까지 제거 (데이터베이스 정리)
docker-compose down -v
```

## 개발 워크플로우

### Docker Compose 사용 (권장)

```bash
# 핫 리로드로 모든 서비스 시작
pnpm dev
# 또는
docker-compose up

# 빌드 후 시작
pnpm dev:build
# 또는
docker-compose up --build

# 로그 보기
pnpm logs              # 모든 서비스
pnpm logs:frontend     # 프론트엔드만
pnpm logs:backend      # 백엔드만
pnpm logs:db           # 데이터베이스만
pnpm logs:prometheus   # Prometheus만
pnpm logs:grafana      # Grafana만

# 모니터링 서비스
pnpm monitoring:up      # 모니터링 스택만 시작
pnpm monitoring:down    # 모니터링 스택 중지
pnpm monitoring:restart # Prometheus와 Grafana 재시작

# 서비스 중지
pnpm dev:down
# 또는
docker-compose down

# 모든 것 정리 (볼륨 포함)
pnpm dev:clean
# 또는
docker-compose down -v
```

### 모니터링 설정

프로젝트에는 완전한 모니터링 스택이 포함되어 있습니다:

1. **Prometheus**가 다음으로부터 메트릭을 수집:
   - NestJS 백엔드 (애플리케이션 메트릭)
   - PostgreSQL (데이터베이스 메트릭)
   - Redis (캐시 메트릭)
   - Node Exporter (시스템 메트릭)

2. **Grafana**가 시각화 제공:
   - 사전 구성된 Prometheus 데이터소스
   - NestJS 애플리케이션 대시보드
   - http://localhost:3001 에서 접속 (admin/admin)

3. **메트릭 엔드포인트**:
   - 백엔드: http://localhost:4000/metrics
   - PostgreSQL Exporter: http://localhost:9187/metrics
   - Redis Exporter: http://localhost:9121/metrics
   - Node Exporter: http://localhost:9100/metrics

### 로컬 개발 (Docker 없이)

#### 백엔드

```bash
cd apps/backend

# 의존성 설치
pnpm install

# .env 파일 생성
cp .env.example .env

# 개발 서버 실행
pnpm start:dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start:prod
```

#### 프론트엔드

```bash
cd apps/frontend

# 의존성 설치
pnpm install

# .env.local 파일 생성
cp .env.example .env.local

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

## 환경 변수

### 루트 `.env`

```env
# PostgreSQL 설정
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=posts_db

# 프론트엔드 설정
NEXT_PUBLIC_API_URL=http://localhost:4000

# 백엔드 설정
FRONTEND_URL=http://localhost:3000
```

### 백엔드 `.env`

```env
NODE_ENV=development
PORT=4000

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=posts_db

FRONTEND_URL=http://localhost:3000
```

### 프론트엔드 `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API 엔드포인트

### Posts API

기본 URL: `http://localhost:4000`

| 메서드 | 엔드포인트   | 설명             | 요청 본문                     |
| ------ | ------------ | ---------------- | ----------------------------- |
| GET    | `/posts`     | 모든 게시물 조회 | -                             |
| GET    | `/posts/:id` | ID로 게시물 조회 | -                             |
| POST   | `/posts`     | 새 게시물 생성   | `{title, content, author?}`   |
| PATCH  | `/posts/:id` | 게시물 수정      | `{title?, content?, author?}` |
| DELETE | `/posts/:id` | 게시물 삭제      | -                             |

### 예제 요청

#### 게시물 생성

```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "첫 번째 게시물",
    "content": "첫 번째 게시물의 내용입니다.",
    "author": "홍길동"
  }'
```

#### 모든 게시물 조회

```bash
curl http://localhost:4000/posts
```

#### 단일 게시물 조회

```bash
curl http://localhost:4000/posts/1
```

#### 게시물 수정

```bash
curl -X PATCH http://localhost:4000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "수정된 제목"
  }'
```

#### 게시물 삭제

```bash
curl -X DELETE http://localhost:4000/posts/1
```

## 데이터베이스 접속

### PostgreSQL 연결

```bash
# Docker exec 사용
docker exec -it fullstack_postgres psql -U postgres -d posts_db

# 호스트에서 psql 사용 (설치된 경우)
psql -h localhost -p 5432 -U postgres -d posts_db
```

### 데이터베이스 스키마

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 프로덕션 배포

### 프로덕션 이미지 빌드

```bash
# 모든 서비스 빌드
docker-compose -f docker-compose.prod.yml build

# 프로덕션 서비스 시작
pnpm prod:build
# 또는
docker-compose -f docker-compose.prod.yml up -d

# 로그 보기
docker-compose -f docker-compose.prod.yml logs -f

# 프로덕션 서비스 중지
pnpm prod:down
# 또는
docker-compose -f docker-compose.prod.yml down
```

### 프로덕션 환경 변수

프로덕션용 `.env` 업데이트:

```env
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=posts_db_prod

NEXT_PUBLIC_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## 워크스페이스 명령어

```bash
# 프론트엔드 전용 명령어 실행
pnpm frontend dev
pnpm frontend build
pnpm frontend lint

# 백엔드 전용 명령어 실행
pnpm backend start:dev
pnpm backend build
pnpm backend lint

# 특정 앱에 패키지 설치
pnpm --filter frontend add <패키지명>
pnpm --filter backend add <패키지명>

# 모든 워크스페이스의 의존성 설치
pnpm install
```

## 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 포트를 사용 중인 프로세스 확인
lsof -i :3000
lsof -i :4000
lsof -i :5432

# 프로세스 종료 또는 docker-compose.yml에서 포트 변경
```

### 데이터베이스 연결 실패

- PostgreSQL 컨테이너가 정상인지 확인: `docker ps`
- 백엔드의 환경 변수 확인
- DATABASE_HOST가 'postgres'로 설정되어 있는지 확인 (Docker의 서비스 이름)

### 프론트엔드가 백엔드에 접근할 수 없는 경우

- 프론트엔드 .env의 NEXT_PUBLIC_API_URL 확인
- 백엔드 main.ts의 CORS 설정 확인
- 백엔드 컨테이너가 실행 중인지 확인: `docker ps`

### 핫 리로드가 작동하지 않는 경우

- docker-compose.yml의 볼륨 마운트 확인
- `--build` 플래그로 컨테이너 재시작
- .dockerignore에 node_modules가 있는지 확인

### 완전히 새로 시작

```bash
# 모든 컨테이너 중지
docker-compose down -v

# 모든 이미지 제거
docker-compose down --rmi all

# 모든 것 재빌드
docker-compose up --build
```

## 기능 및 구현 사항

### 프론트엔드 기능

- **게시물 목록**: 반응형 디자인의 아름다운 그리드 레이아웃
- **게시물 생성**: 유효성 검사 및 오류 처리가 있는 폼
- **게시물 조회**: 메타데이터가 포함된 상세 게시물 뷰
- **게시물 수정**: 미리 채워진 수정 폼
- **게시물 삭제**: 삭제 전 확인 대화상자
- **로딩 상태**: 데이터 페칭 중 스켈레톤 화면
- **오류 처리**: 사용자 친화적 오류 메시지
- **낙관적 업데이트**: 즉각적인 UI 피드백
- **반응형 디자인**: 모바일, 태블릿, 데스크톱에서 작동

### 백엔드 기능

- **RESTful API**: 표준 HTTP 메서드 및 상태 코드
- **입력 유효성 검사**: DTO의 class-validator 데코레이터
- **오류 처리**: 적절한 예외 필터 및 응답
- **데이터베이스 통합**: PostgreSQL과 TypeORM
- **CORS**: 프론트엔드 원본에 대해 구성됨
- **헬스 체크**: 모니터링을 위한 /health 엔드포인트
- **자동 동기화**: 개발 환경에서 데이터베이스 스키마 동기화
- **로깅**: 개발 환경에서 요청/응답 로깅

## 테스트

### 수동 테스트

1. **게시물 생성**
   - http://localhost:3000/posts/new 방문
   - 제목, 내용, 선택적으로 작성자 입력
   - "게시물 생성" 클릭
   - 게시물 목록으로 리다이렉트 확인

2. **게시물 보기**
   - http://localhost:3000/posts 방문
   - 그리드 레이아웃의 모든 게시물 확인
   - 아무 게시물의 "보기" 클릭

3. **게시물 수정**
   - 게시물 상세 또는 목록에서 "수정" 클릭
   - 필드 업데이트
   - "게시물 수정" 클릭
   - 변경사항 확인

4. **게시물 삭제**
   - "삭제" 버튼 클릭
   - 대화상자에서 확인
   - 게시물이 제거되었는지 확인

### API 테스트

```bash
# 헬스 엔드포인트 테스트
curl http://localhost:4000/health

# 생성 테스트
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "테스트", "content": "테스트 내용"}'

# 모두 읽기 테스트
curl http://localhost:4000/posts

# 하나 읽기 테스트
curl http://localhost:4000/posts/1

# 수정 테스트
curl -X PATCH http://localhost:4000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "수정됨"}'

# 삭제 테스트
curl -X DELETE http://localhost:4000/posts/1
```

## 기여하기

### 코드 스타일

- **프론트엔드**: Next.js 설정으로 ESLint + Prettier
- **백엔드**: NestJS 설정으로 ESLint + Prettier
- **TypeScript**: Strict 모드 활성화

### 커밋 가이드라인

1. 기능 브랜치 생성
2. 변경사항 작성
3. 로컬 테스트
4. 명확한 메시지로 커밋
5. Pull Request 생성

## 성능 최적화

### 프론트엔드

- 클라이언트 사이드 캐싱을 위한 SWR
- 최적화된 이미지를 위한 Next.js Image 컴포넌트
- 동적 임포트를 사용한 코드 스플리팅
- 가능한 경우 정적 생성

### 백엔드

- 데이터베이스 연결 풀링 (TypeORM 기본값)
- 적절한 인덱스를 사용한 쿼리 최적화
- 대용량 데이터셋을 위한 페이지네이션 (구현 예정)

### Docker

- 더 작은 이미지를 위한 멀티 스테이지 빌드
- Alpine Linux 베이스 이미지
- 레이어 캐싱 최적화
- 불필요한 파일 제외를 위한 .dockerignore

## 보안 고려사항

### 백엔드

- class-validator를 사용한 입력 유효성 검사
- TypeORM을 통한 SQL 인젝션 방지
- 프론트엔드 URL로 제한된 CORS
- 비밀 정보를 위한 환경 변수
- 프로덕션 컨테이너의 비루트 사용자

### 프론트엔드

- 프로덕션에서 HTTPS (권장)
- API URL을 위한 환경 변수
- 입력 새니타이제이션
- React를 통한 XSS 방지

## 문서

- **백엔드 API**: [apps/backend/README.md](apps/backend/README.md) 참조
- **프론트엔드**: [apps/frontend/README.md](apps/frontend/README.md) 참조
- **API 예제**: [apps/backend/API_EXAMPLES.md](apps/backend/API_EXAMPLES.md) 참조

## 라이선스

MIT

## 지원

문제, 질문 또는 기여에 대해:

1. 기존 문서 확인
2. 문제 해결 섹션 검토
3. Docker 로그 확인: `docker-compose logs`
4. 자세한 정보와 함께 이슈 생성

## 로드맵

### 단기

- [ ] 인증 추가 (JWT)
- [ ] 검색 기능 구현
- [ ] 게시물 카테고리/태그 추가
- [ ] 리치 텍스트 에디터
- [ ] 이미지 업로드

### 장기

- [ ] 댓글 시스템
- [ ] 사용자 프로필
- [ ] 게시물 좋아요/즐겨찾기
- [ ] 이메일 알림
- [ ] GraphQL API 옵션

---

**전문 에이전트로 제작**:

- 시니어 백엔드 개발자 (10년 NestJS 경험)
- 시니어 프론트엔드 개발자 (10년 Next.js 경험)

Docker, Next.js, NestJS, PostgreSQL로 ❤️를 담아 제작
