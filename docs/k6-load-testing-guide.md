# k6 부하테스트 가이드

## 목차

1. [개요](#개요)
2. [의사결정 사항](#의사결정-사항)
3. [테스트 목적](#테스트-목적)
4. [아키텍처 설계](#아키텍처-설계)
5. [구현 방법](#구현-방법)
6. [테스트 시나리오](#테스트-시나리오)
7. [환경별 실행 전략](#환경별-실행-전략)
8. [모니터링 통합](#모니터링-통합)
9. [실행 가이드](#실행-가이드)
10. [성능 기준 및 임계값](#성능-기준-및-임계값)
11. [트러블슈팅](#트러블슈팅)

---

## 개요

본 프로젝트는 Next.js 14 (Frontend) + NestJS (Backend) + PostgreSQL (Database) + Prometheus/Grafana (Monitoring) 스택으로 구성되어 있습니다.

k6를 사용하여 백엔드 API의 성능을 측정하고, 병목 지점을 파악하며, 인프라 확장성을 검증합니다.

### 현재 프로젝트 상태

- **백엔드 엔드포인트**: Posts CRUD, Auth (JWT/OAuth), User Management
- **데이터베이스**: PostgreSQL with Prisma ORM
- **인증**: JWT + Refresh Token + RBAC (Role-Based Access Control)
- **모니터링**: Prometheus (메트릭 수집) + Grafana (시각화)

---

## 의사결정 사항

본 프로젝트의 k6 부하테스트는 다음과 같은 의사결정을 기반으로 구성됩니다:

### ✅ 1. Docker Compose 통합 방식 채택

**결정**: Docker Compose에 k6 서비스를 통합하여 실행

**이유**:

- 기존 인프라(backend, postgres, prometheus, grafana)와 네트워크 공유
- 재현 가능한 테스트 환경 제공
- CI/CD 파이프라인 통합 용이
- 서비스명으로 직접 호출 가능 (예: `http://backend:4000`)

### ✅ 2. 테스트 대상 엔드포인트

**결정**: Posts CRUD 및 Auth Flow에 집중

**우선순위**:

1. **Posts CRUD** (읽기 중심)
   - `GET /posts` - 전체 게시글 목록 조회
   - `GET /posts/:id` - 특정 게시글 조회
   - `POST /posts` - 게시글 작성 (인증 필요)
   - `PUT /posts/:id` - 게시글 수정 (인증 필요)
   - `DELETE /posts/:id` - 게시글 삭제 (인증 필요)

2. **Auth Flow**
   - `POST /auth/login` - 로그인
   - `POST /auth/refresh` - 토큰 갱신
   - `POST /auth/logout` - 로그아웃

**이유**: 실제 애플리케이션에서 가장 빈번하게 호출되는 엔드포인트

### ✅ 3. 성능 목표 수립

**결정**: 명확한 RPS 및 Latency 목표 설정

| 엔드포인트               | 목표 VUs | 목표 RPS | p95 Latency | 에러율 |
| ------------------------ | -------- | -------- | ----------- | ------ |
| `GET /posts` (읽기 API)  | 50       | 300-1000 | < 200ms     | < 1%   |
| `GET /posts/:id`         | 50       | 300-1000 | < 150ms     | < 1%   |
| `POST /auth/login`       | 50       | 50-100   | < 500ms     | < 1%   |
| `POST /posts` (쓰기 API) | 30       | 30-50    | < 1s        | < 2%   |

**트래픽 패턴**:

- **읽기:쓰기 비율**: 90:10 (실제 애플리케이션 패턴 반영)
- **인증 필요**: 쓰기 작업은 모두 JWT 인증 필요

### ✅ 4. 다중 환경 지원

**결정**: 로컬/CI/스테이징 환경 모두에서 실행 가능하도록 구성

**환경별 실행 방법**:

#### A. 로컬 개발 환경

```bash
# Docker Compose 사용
pnpm k6:local:smoke
pnpm k6:local:load
```

#### B. CI 환경 (GitHub Actions)

```bash
# PR 병합 시 자동 실행
# Smoke test만 실행하여 빠른 피드백
```

#### C. 스테이징 환경

```bash
# 배포 전 성능 검증
pnpm k6:staging:load
pnpm k6:staging:stress
```

**환경 전환 방법**:

- 환경 변수 `BASE_URL`, `TEST_ENV`로 제어
- 각 환경별 별도의 pnpm 스크립트 제공
- `.env.k6.local`, `.env.k6.staging` 파일로 설정 분리

---

## 테스트 목적

### 1. 성능 벤치마킹

각 엔드포인트의 기본 성능 지표를 측정합니다:

- **평균 응답 시간** (p50, p95, p99)
- **초당 처리량** (Requests Per Second, RPS)
- **동시 사용자 처리 능력** (Virtual Users, VUs)
- **에러율** (Error Rate)

### 2. 병목 지점 탐지

시스템의 성능 한계를 파악합니다:

- **Database Connection Pool** 한계 (PostgreSQL 기본 100 connections)
- **Prisma Query 성능** (N+1 쿼리, 인덱스 부재)
- **JWT 토큰 검증 오버헤드** (매 요청마다 검증)
- **Prometheus Metrics Collection** 영향도 (메트릭 수집 비용)
- **RBAC 권한 체크** 성능 (Permission 조회 쿼리)

### 3. 인프라 확장성 검증

Docker 환경에서의 리소스 제약을 확인합니다:

- **PostgreSQL Connection Limit** 도달 여부
- **NestJS 서버 메모리/CPU 사용률** (Node.js 싱글 스레드 한계)
- **Docker Container 리소스 제약** (메모리, CPU 할당)

---

## 아키텍처 설계

### 전체 구성도

```
┌─────────────────┐
│  k6 Container   │ ◄─── 환경별 설정 (.env.k6.local / .env.k6.staging)
│  (on-demand)    │
└────────┬────────┘
         │ HTTP Requests
         │ (http://backend:4000 or http://staging.example.com)
         ▼
┌─────────────────┐     ┌──────────────────┐
│   NestJS        │────▶│   PostgreSQL     │
│   Backend       │     │   Database       │
│  (port 4000)    │     │  (port 5432)     │
└────────┬────────┘     └──────────────────┘
         │
         │ /metrics
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Prometheus    │────▶│    Grafana       │
│  (port 9090)    │     │   (port 3001)    │
└─────────────────┘     └──────────────────┘
         ▲
         │ k6 metrics (optional)
         │
┌─────────────────┐
│  k6 Prometheus  │
│  Remote Write   │
└─────────────────┘
```

### Docker Network 구성

모든 서비스는 `fullstack-network`를 공유하여 서비스명으로 통신합니다:

- `backend` → NestJS 서버 (http://backend:4000)
- `postgres` → PostgreSQL (postgresql://postgres:5432)
- `prometheus` → Prometheus (http://prometheus:9090)
- `grafana` → Grafana (http://grafana:3001)
- `k6` → k6 테스트 러너 (실행 시에만 생성, 완료 후 자동 삭제)

---

## 구현 방법

### Docker Compose 통합 구성

#### 1. `docker-compose.yml`에 k6 프로필 추가

```yaml
# docker-compose.yml
services:
  # ... 기존 서비스들 (backend, postgres, prometheus, grafana)

  # k6 테스트 러너 (프로필로 분리)
  k6:
    image: grafana/k6:latest
    networks:
      - fullstack-network
    volumes:
      - ./k6:/scripts
      - ./k6/results:/results
    environment:
      - BASE_URL=${K6_BASE_URL:-http://backend:4000}
      - TEST_ENV=${TEST_ENV:-local}
      - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
    depends_on:
      - backend
      - prometheus
    profiles:
      - testing # 기본 실행 시 제외, 명시적으로 실행 시에만 시작
    command: run /scripts/smoke-test.js # 기본 커맨드 (오버라이드 가능)
```

**주요 특징**:

- `profiles: ["testing"]` → `pnpm dev` 실행 시 k6 컨테이너는 시작되지 않음
- `docker-compose run --rm k6` 명령으로 필요할 때만 실행
- `--rm` 플래그로 테스트 완료 후 컨테이너 자동 삭제

#### 2. 환경 변수 파일 생성

```bash
# .env.k6.local (로컬 환경)
K6_BASE_URL=http://backend:4000
TEST_ENV=local
K6_VUS=50
K6_DURATION=5m

# .env.k6.staging (스테이징 환경)
K6_BASE_URL=https://staging-api.example.com
TEST_ENV=staging
K6_VUS=100
K6_DURATION=10m

# .env.k6.ci (CI 환경)
K6_BASE_URL=http://backend:4000
TEST_ENV=ci
K6_VUS=10
K6_DURATION=1m
```

#### 3. `package.json`에 스크립트 추가

```json
{
  "scripts": {
    "// === k6 Load Testing ===": "",

    "// 로컬 환경 테스트": "",
    "k6:local:smoke": "docker-compose run --rm -e BASE_URL=http://backend:4000 k6 run /scripts/smoke-test.js",
    "k6:local:load": "docker-compose run --rm -e BASE_URL=http://backend:4000 k6 run /scripts/load-test.js",
    "k6:local:stress": "docker-compose run --rm -e BASE_URL=http://backend:4000 k6 run /scripts/stress-test.js",
    "k6:local:auth": "docker-compose run --rm -e BASE_URL=http://backend:4000 k6 run /scripts/auth-test.js",

    "// CI 환경 테스트": "",
    "k6:ci:smoke": "docker-compose run --rm -e BASE_URL=http://backend:4000 -e K6_VUS=5 k6 run /scripts/smoke-test.js",
    "k6:ci:regression": "docker-compose run --rm -e BASE_URL=http://backend:4000 k6 run /scripts/regression-test.js",

    "// 스테이징 환경 테스트": "",
    "k6:staging:load": "docker-compose run --rm --env-file .env.k6.staging k6 run /scripts/load-test.js",
    "k6:staging:stress": "docker-compose run --rm --env-file .env.k6.staging k6 run /scripts/stress-test.js",

    "// 결과 저장 및 리포트": "",
    "k6:local:load:report": "docker-compose run --rm -e BASE_URL=http://backend:4000 k6 run --out json=/results/load-$(date +%Y%m%d-%H%M%S).json /scripts/load-test.js",

    "// k6 Shell 접근 (디버깅용)": "",
    "k6:shell": "docker-compose run --rm k6 sh"
  }
}
```

---

## 테스트 시나리오

### 1. Smoke Test (헬스체크)

**목적**: 시스템이 정상 작동하는지 최소 부하로 확인

**실행 환경**: 로컬, CI, 스테이징
**VUs**: 1-5
**Duration**: 30초-1분

```javascript
// k6/smoke-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: __ENV.K6_VUS || 1,
  duration: __ENV.K6_DURATION || '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://backend:4000';

export default function () {
  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 50ms': (r) => r.timings.duration < 50,
    'has correct structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok';
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
```

**실행 방법**:

```bash
# 로컬
pnpm k6:local:smoke

# CI
pnpm k6:ci:smoke

# 스테이징
docker-compose run --rm --env-file .env.k6.staging k6 run /scripts/smoke-test.js
```

---

### 2. Posts CRUD Load Test (핵심 시나리오)

**목적**: Posts CRUD 엔드포인트 성능 측정 (읽기 90%, 쓰기 10%)

**실행 환경**: 로컬, 스테이징
**VUs**: 50
**목표 RPS**: 읽기 300-1000, 쓰기 30-50
**Duration**: 10분

```javascript
// k6/posts-crud-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const readLatency = new Trend('read_latency', true);
const writeLatency = new Trend('write_latency', true);

const BASE_URL = __ENV.BASE_URL || 'http://backend:4000';

export const options = {
  stages: [
    { duration: '1m', target: 20 }, // 워밍업
    { duration: '2m', target: 50 }, // 목표 부하
    { duration: '5m', target: 50 }, // 유지
    { duration: '1m', target: 100 }, // 피크 테스트
    { duration: '1m', target: 0 }, // 램프다운
  ],
  thresholds: {
    // 전역 임계값
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.02'], // 2% 에러율 허용
    errors: ['rate<0.05'],

    // 엔드포인트별 임계값 (의사결정 사항 반영)
    'http_req_duration{endpoint:posts_list}': ['p(95)<200'],
    'http_req_duration{endpoint:post_detail}': ['p(95)<150'],
    'http_req_duration{endpoint:create_post}': ['p(95)<1000'],

    // RPS 목표
    'http_reqs{endpoint:posts_list}': ['rate>=300'], // 최소 300 RPS
    'http_reqs{endpoint:post_detail}': ['rate>=300'],
  },
};

// 테스트 사용자 토큰 (사전 생성 필요)
const TEST_TOKEN = __ENV.TEST_TOKEN || generateTestToken();

function generateTestToken() {
  // 실제로는 setup() 함수에서 로그인하여 토큰 획득
  return 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
}

export function setup() {
  // 테스트 시작 전 로그인하여 토큰 획득
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'loadtest@example.com',
      password: 'TestPassword123!',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (loginRes.status === 200) {
    const { accessToken } = loginRes.json();
    return { token: accessToken };
  }

  throw new Error('Failed to authenticate');
}

export default function (data) {
  const scenario = Math.random();

  // 90% 읽기, 10% 쓰기 (의사결정 사항 반영)
  if (scenario < 0.5) {
    // 50% - 전체 게시글 목록 조회
    const res = http.get(`${BASE_URL}/posts`, {
      tags: { endpoint: 'posts_list' },
    });

    readLatency.add(res.timings.duration);

    check(res, {
      'posts list status is 200': (r) => r.status === 200,
      'has posts array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body));
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);
  } else if (scenario < 0.9) {
    // 40% - 특정 게시글 조회
    const postId = Math.floor(Math.random() * 100) + 1;
    const res = http.get(`${BASE_URL}/posts/${postId}`, {
      tags: { endpoint: 'post_detail' },
    });

    readLatency.add(res.timings.duration);

    check(res, {
      'post detail status is 200 or 404': (r) => [200, 404].includes(r.status),
    }) || errorRate.add(1);
  } else {
    // 10% - 게시글 작성 (인증 필요)
    const payload = JSON.stringify({
      title: `Load Test Post ${Date.now()}`,
      content: `Generated by k6 at ${new Date().toISOString()}`,
    });

    const res = http.post(`${BASE_URL}/posts`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.token}`,
      },
      tags: { endpoint: 'create_post' },
    });

    writeLatency.add(res.timings.duration);

    check(res, {
      'create post status is 201': (r) => r.status === 201,
      'has post id': (r) => {
        try {
          return JSON.parse(r.body).id !== undefined;
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);
  }

  sleep(1);
}

export function teardown(data) {
  // 테스트 종료 후 정리 (선택사항)
  console.log('Test completed');
}
```

**실행 방법**:

```bash
# 로컬 (빠른 테스트)
pnpm k6:local:load

# 스테이징 (실제 성능 측정)
pnpm k6:staging:load

# 결과 JSON 저장
pnpm k6:local:load:report
```

---

### 3. Auth Flow Test (인증 플로우)

**목적**: 로그인 → 인증된 요청 → 토큰 갱신 플로우 성능 측정

**실행 환경**: 로컬, 스테이징
**VUs**: 50
**목표 RPS**: 50-100 (로그인)
**Duration**: 5분

```javascript
// k6/auth-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.BASE_URL || 'http://backend:4000';

// 테스트 사용자 목록 (사전 생성 필요)
const users = new SharedArray('users', function () {
  return [
    { email: 'user1@test.com', password: 'Password123!' },
    { email: 'user2@test.com', password: 'Password123!' },
    { email: 'user3@test.com', password: 'Password123!' },
  ];
});

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 }, // 목표 50 VUs
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // 의사결정 사항 반영: Auth 50~100 RPS, p95 < 500ms
    http_req_duration: ['p(95)<800'],
    'http_req_duration{endpoint:login}': ['p(95)<500'],
    'http_req_duration{endpoint:refresh}': ['p(95)<300'],
    'http_reqs{endpoint:login}': ['rate>=50', 'rate<=100'], // 목표 RPS 범위
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const user = users[__VU % users.length];

  // 1. 로그인
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login' },
  });

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    console.error(`Login failed for ${user.email}: ${loginRes.status}`);
    return;
  }

  const { accessToken, refreshToken } = loginRes.json();

  sleep(1);

  // 2. 인증된 요청 (게시글 작성)
  const createPostRes = http.post(
    `${BASE_URL}/posts`,
    JSON.stringify({
      title: `Auth Test Post - VU ${__VU}`,
      content: 'Testing authenticated endpoint',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      tags: { endpoint: 'create_post' },
    },
  );

  check(createPostRes, {
    'create post status is 201': (r) => r.status === 201,
  });

  sleep(2);

  // 3. 토큰 갱신
  const refreshRes = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify({ refreshToken }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'refresh' },
    },
  );

  check(refreshRes, {
    'refresh status is 200': (r) => r.status === 200,
    'has new access token': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
```

**실행 방법**:

```bash
# 사전 준비: 테스트 사용자 생성
pnpm backend prisma:studio  # 또는 seed script

# 테스트 실행
pnpm k6:local:auth
```

---

### 4. Stress Test (시스템 한계 테스트)

**목적**: 시스템의 한계점 파악 및 장애 발생 지점 확인

**실행 환경**: 스테이징 (⚠️ 로컬은 비추천)
**VUs**: 100 → 500+
**Duration**: 15-20분

```javascript
// k6/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://backend:4000';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // 정상 부하
    { duration: '3m', target: 200 }, // 2배 부하
    { duration: '2m', target: 300 }, // 3배 부하
    { duration: '3m', target: 400 }, // 4배 부하 (한계 테스트)
    { duration: '2m', target: 500 }, // 5배 부하 (의도적 과부하)
    { duration: '5m', target: 0 }, // 복구 시간 측정
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 느슨한 임계값
    http_req_failed: ['rate<0.2'], // 20% 에러율까지 허용
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/posts`, {
    tags: { test: 'stress' },
  });

  check(res, {
    'status is not 5xx': (r) => r.status < 500,
    'response received': (r) => r.body !== null,
  });

  sleep(0.5); // 짧은 sleep으로 높은 부하 생성
}
```

**실행 방법**:

```bash
# ⚠️ 스테이징 환경에서만 실행 권장
pnpm k6:staging:stress

# 실시간 모니터링
docker-compose logs -f backend prometheus
```

---

## 환경별 실행 전략

### 1. 로컬 개발 환경 (Local)

**목적**: 빠른 피드백, 개발 중 성능 회귀 감지

**실행 시나리오**:

- ✅ Smoke Test (매번)
- ✅ Posts CRUD Load Test (변경 시)
- ✅ Auth Flow Test (인증 로직 변경 시)
- ❌ Stress Test (로컬 리소스 부족)

**실행 방법**:

```bash
# 1. 서비스 시작
pnpm dev

# 2. 테스트 데이터 준비
pnpm backend prisma:migrate:deploy
# 테스트 사용자 생성

# 3. Smoke Test (빠른 검증)
pnpm k6:local:smoke

# 4. Load Test (성능 측정)
pnpm k6:local:load

# 5. 결과 확인
# - 터미널 출력
# - Grafana: http://localhost:3001
```

**on/off 제어**:

```bash
# k6만 실행 (다른 서비스는 이미 실행 중)
pnpm k6:local:smoke

# k6 포함하여 전체 스택 실행 (필요 시)
docker-compose --profile testing up -d

# k6 종료 (컨테이너는 자동 삭제됨)
# 별도 종료 불필요 (--rm 플래그)
```

---

### 2. CI 환경 (GitHub Actions)

**목적**: PR 병합 전 성능 회귀 검증

**실행 시나리오**:

- ✅ Smoke Test (모든 PR)
- ✅ Regression Test (성능 기준 검증)
- ❌ Load Test (시간 소요)
- ❌ Stress Test (리소스 소모)

**실행 방법** (GitHub Actions):

```yaml
# .github/workflows/performance-test.yml
name: Performance Test

on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'apps/backend/**'
      - 'k6/**'

jobs:
  k6-smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Start services
        run: |
          docker-compose up -d postgres backend prometheus
          sleep 10

      - name: Run migrations
        run: pnpm backend prisma:migrate:deploy

      - name: Health check
        run: |
          curl --retry 10 --retry-delay 3 --retry-connrefused \
            http://localhost:4000/health

      - name: Run k6 smoke test
        run: pnpm k6:ci:smoke

      - name: Check thresholds
        if: failure()
        run: |
          echo "❌ Performance regression detected!"
          exit 1

      - name: Cleanup
        if: always()
        run: docker-compose down -v
```

**on/off 제어**:

```yaml
# 특정 경로 변경 시에만 실행
on:
  pull_request:
    paths:
      - 'apps/backend/**'
      - 'k6/**'

# 수동 실행 옵션 추가
on:
  workflow_dispatch:
    inputs:
      test_type:
        type: choice
        options:
          - smoke
          - load
```

---

### 3. 스테이징 환경 (Staging)

**목적**: 배포 전 실제 성능 검증, 용량 계획

**실행 시나리오**:

- ✅ Smoke Test (배포 후 즉시)
- ✅ Load Test (주기적)
- ✅ Stress Test (월 1회)
- ✅ Auth Flow Test (인증 변경 시)

**실행 방법**:

```bash
# 1. 환경 변수 설정
export K6_BASE_URL=https://staging-api.example.com

# 2. 스테이징 전용 스크립트 실행
pnpm k6:staging:load

# 3. 또는 환경 파일 사용
docker-compose run --rm \
  --env-file .env.k6.staging \
  k6 run /scripts/load-test.js

# 4. 결과 저장
docker-compose run --rm \
  --env-file .env.k6.staging \
  k6 run --out json=/results/staging-$(date +%Y%m%d).json \
  /scripts/load-test.js
```

**on/off 제어**:

```bash
# 정기 실행 (cron)
# 매주 월요일 새벽 2시
0 2 * * 1 cd /path/to/project && pnpm k6:staging:load

# 배포 스크립트에 통합
#!/bin/bash
# deploy.sh
echo "Deploying to staging..."
kubectl apply -f k8s/staging/

echo "Waiting for deployment..."
sleep 30

echo "Running smoke test..."
pnpm k6:staging:smoke || exit 1

echo "Deployment successful!"
```

---

## 모니터링 통합

### Prometheus + Grafana 연동

#### 1. k6 메트릭을 Prometheus로 전송 (선택사항)

k6의 메트릭을 Prometheus로 전송하여 Grafana에서 시각화할 수 있습니다.

**방법 A: Prometheus Remote Write**

```javascript
// k6/config/prometheus.js
export const options = {
  ext: {
    loadimpact: {
      distribution: {
        'prometheus.remote_write': {
          url: 'http://prometheus:9090/api/v1/write',
        },
      },
    },
  },
};
```

**방법 B: JSON 결과 파일 + Prometheus Pushgateway**

```bash
# k6 결과를 JSON으로 저장
pnpm k6:local:load:report

# Python 스크립트로 Prometheus로 전송
python scripts/push-k6-metrics.py k6/results/load-*.json
```

#### 2. Grafana 대시보드 구성

**Import 방법**:

```bash
# Grafana UI
1. http://localhost:3001 접속 (admin/admin)
2. Dashboards → Import
3. Dashboard ID: 2587 (k6 Load Testing Results)
4. Prometheus 데이터소스 선택
5. Import
```

**커스텀 패널**:

- Virtual Users (VUs) 추이
- HTTP Request Duration (p95, p99)
- Request Rate (RPS) by Endpoint
- Error Rate by Endpoint
- Backend vs k6 Latency 비교
- PostgreSQL Connections vs Load

#### 3. 알림 룰 설정

```yaml
# monitoring/prometheus/alerts/k6.yml
groups:
  - name: k6_performance
    interval: 30s
    rules:
      - alert: HighErrorRateDuringLoadTest
        expr: rate(k6_http_req_failed_total[5m]) / rate(k6_http_reqs_total[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High error rate during k6 load test'
          description: 'Error rate is {{ $value | humanizePercentage }}'

      - alert: SlowResponseTimeDuringLoadTest
        expr: histogram_quantile(0.95, rate(k6_http_req_duration_bucket[5m])) > 1000
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: 'Slow response time during k6 test'
          description: 'p95 latency is {{ $value }}ms'

      - alert: DatabaseConnectionPoolNearLimit
        expr: pg_stat_database_numbackends{datname="posts_db"} > 90
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Database connection pool near limit during load test'
          description: '{{ $value }} connections active (limit: 100)'
```

---

## 실행 가이드

### Quick Start (5분 안에 실행)

```bash
# 1. 서비스 시작
pnpm dev

# 2. 헬스체크
curl http://localhost:4000/health

# 3. Smoke Test 실행
pnpm k6:local:smoke

# 4. Grafana에서 결과 확인
open http://localhost:3001
```

### 사전 준비

#### 1. 서비스 시작

```bash
# 전체 스택 시작 (k6 제외)
pnpm dev

# 또는 개별 서비스
docker-compose up -d postgres backend prometheus grafana
```

#### 2. 데이터베이스 준비

```bash
# 마이그레이션 실행
pnpm backend prisma:migrate:deploy

# 테스트 사용자 생성 (Auth 테스트용)
# apps/backend/prisma/seed.ts 작성 후
pnpm backend prisma:db:seed
```

**seed 예시**:

```typescript
// apps/backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 테스트 사용자 생성
  const users = [
    { email: 'user1@test.com', password: 'Password123!', name: 'Test User 1' },
    { email: 'user2@test.com', password: 'Password123!', name: 'Test User 2' },
    { email: 'admin@test.com', password: 'Admin123!', name: 'Admin User' },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
        provider: 'LOCAL',
      },
    });
  }

  console.log('✅ Seed data created');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

#### 3. 헬스체크 확인

```bash
# Backend health check
curl http://localhost:4000/health
# Expected: {"status":"ok","database":"connected"}

# Prometheus
curl http://localhost:9090/-/healthy
# Expected: Prometheus is Healthy.

# Grafana
curl http://localhost:3001/api/health
# Expected: {"database":"ok","version":"..."}
```

### 테스트 실행 (환경별)

#### 로컬 환경

```bash
# Smoke Test (30초)
pnpm k6:local:smoke

# Posts CRUD Load Test (10분)
pnpm k6:local:load

# Auth Flow Test (5분)
pnpm k6:local:auth

# 결과 JSON 저장
pnpm k6:local:load:report
```

#### CI 환경

```bash
# GitHub Actions에서 자동 실행
# 또는 로컬에서 CI 모드 시뮬레이션
pnpm k6:ci:smoke
```

#### 스테이징 환경

```bash
# 환경 변수 설정
export K6_BASE_URL=https://staging-api.example.com

# Load Test
pnpm k6:staging:load

# Stress Test (주의: 고부하)
pnpm k6:staging:stress
```

### 고급 실행 옵션

```bash
# 1. VU와 Duration 오버라이드
docker-compose run --rm \
  -e BASE_URL=http://backend:4000 \
  k6 run --vus 100 --duration 10m /scripts/load-test.js

# 2. 특정 스테이지만 실행
docker-compose run --rm k6 run \
  --stage 2m:50,5m:50 /scripts/load-test.js

# 3. 환경 변수 전달
docker-compose run --rm \
  -e BASE_URL=http://backend:4000 \
  -e K6_VUS=50 \
  -e TEST_ENV=local \
  k6 run /scripts/load-test.js

# 4. 결과를 여러 포맷으로 저장
docker-compose run --rm k6 run \
  --out json=/results/result.json \
  --out csv=/results/result.csv \
  /scripts/load-test.js

# 5. 디버그 모드 (HTTP 요청/응답 전체 로깅)
docker-compose run --rm k6 run \
  --http-debug=full \
  /scripts/load-test.js

# 6. 특정 시나리오만 실행 (태그 기반)
docker-compose run --rm k6 run \
  --tag testid=regression \
  /scripts/load-test.js
```

### 결과 분석

#### 터미널 출력 예시

```
     ✓ posts list status is 200
     ✓ response time < 200ms

     checks.........................: 99.80% ✓ 4990    ✗ 10
     data_received..................: 3.2 MB  53 kB/s
     data_sent......................: 520 kB  8.7 kB/s
     http_req_blocked...............: avg=1.5ms    p(95)=5ms
     http_req_connecting............: avg=800µs    p(95)=2ms
     http_req_duration..............: avg=180ms    p(95)=420ms   p(99)=800ms
     http_req_failed................: 0.20%   ✓ 10      ✗ 4990
     http_reqs......................: 5000    83.33/s
     iterations.....................: 5000    83.33/s
     vus............................: 50      min=0     max=50

✅ Thresholds passed
```

#### JSON 결과 파싱

```javascript
// scripts/parse-k6-results.js
const fs = require('fs');

const resultsFile = process.argv[2] || 'k6/results/latest.json';
const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

const metrics = results.metrics;

console.log('\n📊 k6 Load Test Results\n');
console.log('════════════════════════════════════════');
console.log(`Total Requests:     ${metrics.http_reqs.count}`);
console.log(`RPS:                ${metrics.http_reqs.rate.toFixed(2)}`);
console.log(
  `Error Rate:         ${(metrics.http_req_failed.rate * 100).toFixed(2)}%`,
);
console.log('────────────────────────────────────────');
console.log(
  `p50 Latency:        ${metrics.http_req_duration.values['p(50)']}ms`,
);
console.log(
  `p95 Latency:        ${metrics.http_req_duration.values['p(95)']}ms`,
);
console.log(
  `p99 Latency:        ${metrics.http_req_duration.values['p(99)']}ms`,
);
console.log(`Max Latency:        ${metrics.http_req_duration.values.max}ms`);
console.log('════════════════════════════════════════\n');

// Threshold 검증
const thresholdsFailed = results.root_group.checks.filter((c) => c.fails > 0);
if (thresholdsFailed.length > 0) {
  console.error('❌ Failed Checks:');
  thresholdsFailed.forEach((c) => {
    console.error(`  - ${c.name}: ${c.fails} failures`);
  });
  process.exit(1);
} else {
  console.log('✅ All checks passed');
}
```

**실행**:

```bash
node scripts/parse-k6-results.js k6/results/load-20260113-143020.json
```

---

## 성능 기준 및 임계값

### 의사결정 기반 SLO (Service Level Objectives)

| 엔드포인트           | 목표 VUs | 목표 RPS | p95 Latency | p99 Latency | 에러율 |
| -------------------- | -------- | -------- | ----------- | ----------- | ------ |
| **GET /posts**       | 50       | 300-1000 | < 200ms     | < 500ms     | < 1%   |
| **GET /posts/:id**   | 50       | 300-1000 | < 150ms     | < 400ms     | < 1%   |
| **POST /auth/login** | 50       | 50-100   | < 500ms     | < 800ms     | < 1%   |
| **POST /posts**      | 30       | 30-50    | < 1s        | < 2s        | < 2%   |
| **GET /health**      | -        | 1000+    | < 50ms      | < 100ms     | < 0.1% |

### k6 Thresholds 구성

```javascript
// k6/config/thresholds.js
export const thresholds = {
  // 전역 임계값
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.02'],

  // 엔드포인트별 임계값 (의사결정 반영)
  'http_req_duration{endpoint:posts_list}': ['p(95)<200', 'p(99)<500'],
  'http_req_duration{endpoint:post_detail}': ['p(95)<150', 'p(99)<400'],
  'http_req_duration{endpoint:login}': ['p(95)<500', 'p(99)<800'],
  'http_req_duration{endpoint:create_post}': ['p(95)<1000', 'p(99)<2000'],
  'http_req_duration{endpoint:health}': ['p(95)<50', 'p(99)<100'],

  // RPS 목표 (의사결정 반영)
  'http_reqs{endpoint:posts_list}': ['rate>=300'],
  'http_reqs{endpoint:login}': ['rate>=50', 'rate<=100'],

  // 에러율
  'http_req_failed{endpoint:posts_list}': ['rate<0.01'],
  'http_req_failed{endpoint:login}': ['rate<0.01'],
  'http_req_failed{endpoint:create_post}': ['rate<0.02'],

  // 인프라 메트릭
  checks: ['rate>0.95'], // 95% 이상 체크 통과
  iterations: ['rate>10'], // 최소 10 iterations/s
};
```

### 회귀 검증

```javascript
// k6/regression-test.js
import { check } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://backend:4000';

// 베이스라인 (이전 성능 기준)
const BASELINE = {
  posts_list_p95: 180,
  post_detail_p95: 120,
  login_p95: 450,
  create_post_p95: 900,
  error_rate: 0.005, // 0.5%
  rps: 350,
};

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // 베이스라인 대비 20% 이내 허용
    'http_req_duration{endpoint:posts_list}': [
      `p(95)<${BASELINE.posts_list_p95 * 1.2}`,
    ],
    'http_req_duration{endpoint:post_detail}': [
      `p(95)<${BASELINE.post_detail_p95 * 1.2}`,
    ],
    'http_req_duration{endpoint:login}': [`p(95)<${BASELINE.login_p95 * 1.2}`],
    http_req_failed: [`rate<${BASELINE.error_rate * 2}`], // 2배까지 허용
  },
};

export default function () {
  const scenario = Math.random();

  if (scenario < 0.5) {
    http.get(`${BASE_URL}/posts`, { tags: { endpoint: 'posts_list' } });
  } else if (scenario < 0.9) {
    const id = Math.floor(Math.random() * 100) + 1;
    http.get(`${BASE_URL}/posts/${id}`, { tags: { endpoint: 'post_detail' } });
  } else {
    http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'test@example.com', password: 'password' }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { endpoint: 'login' },
      },
    );
  }
}

export function handleSummary(data) {
  const metrics = data.metrics;

  const current = {
    posts_list_p95:
      metrics['http_req_duration{endpoint:posts_list}']?.values['p(95)'] || 0,
    post_detail_p95:
      metrics['http_req_duration{endpoint:post_detail}']?.values['p(95)'] || 0,
    login_p95:
      metrics['http_req_duration{endpoint:login}']?.values['p(95)'] || 0,
    error_rate: metrics.http_req_failed?.values.rate || 0,
    rps: metrics.http_reqs?.values.rate || 0,
  };

  const regression = {
    posts_list: current.posts_list_p95 > BASELINE.posts_list_p95 * 1.2,
    post_detail: current.post_detail_p95 > BASELINE.post_detail_p95 * 1.2,
    login: current.login_p95 > BASELINE.login_p95 * 1.2,
    error_rate: current.error_rate > BASELINE.error_rate * 2,
    rps: current.rps < BASELINE.rps * 0.8,
  };

  console.log('\n📊 Regression Test Results\n');
  console.table({ current, baseline: BASELINE, regression });

  if (Object.values(regression).some((v) => v)) {
    console.error('\n❌ Performance regression detected!');
    return { stdout: JSON.stringify({ regression: true, details: current }) };
  }

  console.log('\n✅ No performance regression detected');
  return { stdout: JSON.stringify({ regression: false, details: current }) };
}
```

---

## 트러블슈팅

### 일반적인 문제

#### 1. Connection Refused

**증상**:

```
WARN[0001] Request Failed error="dial tcp: lookup backend: no such host"
```

**원인**:

- k6 컨테이너가 `fullstack-network`에 연결되지 않음
- 서비스명 대신 localhost 사용

**해결**:

```bash
# 네트워크 확인
docker network ls | grep fullstack

# k6 컨테이너가 올바른 네트워크에 연결되었는지 확인
docker-compose run --rm k6 sh
/ # ping backend
/ # wget -O- http://backend:4000/health

# BASE_URL 확인
docker-compose run --rm -e BASE_URL=http://backend:4000 k6 run /scripts/smoke-test.js
```

#### 2. Database Connection Pool Exhausted

**증상**:

```
Error: remaining connection slots are reserved for non-replication superuser connections
```

**원인**:

- PostgreSQL connection limit (기본 100) 초과
- Prisma connection pool 설정 부족

**해결**:

```typescript
// apps/backend/src/prisma/prisma.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool 조정
  pool: {
    min: 10,
    max: 30, // k6 VUs (50) 보다 작게 설정
    idleTimeoutMillis: 30000,
  },
});
```

```sql
-- PostgreSQL 설정 확인 및 변경
SHOW max_connections;  -- 기본값 확인

-- Connection limit 증가 (필요 시)
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
```

```javascript
// k6에서 동시성 제한
export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 30, // Connection pool보다 작게
      maxVUs: 50,
      stages: [
        { duration: '2m', target: 300 }, // RPS 목표
      ],
    },
  },
};
```

#### 3. High Memory Usage (OOM)

**증상**:

```
FATAL ERROR: JavaScript heap out of memory
```

**원인**:

- Node.js 메모리 한계 (기본 4GB)
- 메모리 누수

**해결**:

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - NODE_OPTIONS=--max-old-space-size=8192 # 8GB
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: '2'
```

```bash
# 실시간 메모리 모니터링
docker stats backend

# Heap dump 생성 (메모리 누수 분석)
docker exec backend node --expose-gc --inspect=0.0.0.0:9229 dist/main.js
```

#### 4. Slow Response Time

**증상**:

- p95 latency > 목표치 (200ms, 500ms 등)
- 점진적인 성능 저하

**원인**:

- N+1 쿼리 문제
- 인덱스 부재
- 불필요한 데이터 로딩

**해결**:

```typescript
// 1. N+1 쿼리 최적화
const posts = await prisma.post.findMany({
  include: {
    author: true, // Eager loading (단일 쿼리)
  },
});

// 2. Select로 필요한 필드만 조회
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    createdAt: true,
    // content 제외 (대용량 텍스트)
    author: {
      select: { id: true, name: true },
    },
  },
});

// 3. 페이지네이션 추가
const posts = await prisma.post.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});
```

```sql
-- 인덱스 추가
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);

-- 쿼리 성능 분석
EXPLAIN ANALYZE SELECT * FROM posts WHERE author_id = 'xxx' ORDER BY created_at DESC LIMIT 20;
```

#### 5. High Error Rate

**증상**:

- `http_req_failed` > 5%
- 500 Internal Server Error 다수

**원인**:

- 예외 처리 누락
- 타임아웃 설정 부재
- 데이터 검증 실패

**해결**:

```typescript
// NestJS 전역 예외 필터
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // 에러 로깅 (Prometheus 메트릭 포함)
    console.error('[Exception]', {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

```javascript
// k6에서 타임아웃 설정
export const options = {
  httpDebug: 'full',
  timeout: '30s', // 전역 타임아웃
};

export default function () {
  const res = http.get('http://backend:4000/posts', {
    timeout: '10s', // 개별 요청 타임아웃
  });

  if (res.status === 0) {
    console.error('Request timeout or connection failed');
  }
}
```

### 디버깅 팁

#### 1. k6 디버그 모드

```bash
# HTTP 요청/응답 전체 로깅
docker-compose run --rm k6 run --http-debug=full /scripts/load-test.js

# 특정 VU만 실행 (단일 사용자 시뮬레이션)
docker-compose run --rm k6 run --vus 1 --iterations 1 /scripts/load-test.js

# 환경 변수로 디버그 토글
docker-compose run --rm -e DEBUG=true k6 run /scripts/load-test.js
```

```javascript
// 스크립트 내 디버그 로깅
export default function () {
  if (__ENV.DEBUG === 'true') {
    console.log(`[VU ${__VU}] Iteration ${__ITER} starting...`);
  }

  const res = http.get(`${BASE_URL}/posts`);

  if (__ENV.DEBUG === 'true') {
    console.log(
      `[VU ${__VU}] Response: ${res.status} - ${res.timings.duration}ms`,
    );
    console.log(`[VU ${__VU}] Body: ${res.body.substring(0, 100)}...`);
  }
}
```

#### 2. Docker 로그 분석

```bash
# 실시간 로그 (모든 서비스)
docker-compose logs -f

# Backend만 필터링
docker-compose logs -f backend

# 에러만 필터링
docker-compose logs backend | grep ERROR

# 특정 시간대 로그
docker-compose logs --since 5m backend

# 최근 100줄
docker-compose logs --tail=100 backend

# 컨테이너 리소스 사용량
docker stats --no-stream

# 메모리 사용량만
docker stats --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"
```

#### 3. Prometheus 쿼리

```promql
# Backend 평균 응답 시간
rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])

# 엔드포인트별 응답 시간
rate(http_request_duration_ms_sum{route="/posts"}[5m]) / rate(http_request_duration_ms_count{route="/posts"}[5m])

# 에러율
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Database 활성 연결 수
pg_stat_database_numbackends{datname="posts_db"}

# Database 쿼리 시간
histogram_quantile(0.95, rate(prisma_query_duration_bucket[5m]))

# CPU 사용률
rate(process_cpu_seconds_total[5m]) * 100

# 메모리 사용량
process_resident_memory_bytes / 1024 / 1024  # MB
```

---

## 다음 단계

### Phase 1: 기본 구현 (1주)

- [x] k6 Docker Compose 통합
- [x] 환경별 설정 파일 작성
- [ ] Smoke Test 스크립트 작성
- [ ] Posts CRUD Load Test 스크립트 작성
- [ ] Auth Flow Test 스크립트 작성
- [ ] pnpm scripts 추가
- [ ] 테스트 사용자 seed 스크립트 작성

### Phase 2: 모니터링 및 CI/CD (1주)

- [ ] Grafana k6 대시보드 import
- [ ] Prometheus 알림 룰 추가
- [ ] GitHub Actions workflow 작성
- [ ] 회귀 검증 스크립트 작성
- [ ] 결과 JSON 파싱 스크립트 작성

### Phase 3: 최적화 및 고도화 (2-4주)

- [ ] Stress Test 스크립트 작성
- [ ] RBAC 성능 테스트
- [ ] 성능 기준 베이스라인 수립
- [ ] 주간 성능 리포트 자동화
- [ ] k6 Cloud 연동 (선택사항)
- [ ] 성능 개선 작업 (인덱스, 쿼리 최적화 등)

---

## 참고 자료

### 공식 문서

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://github.com/grafana/k6-examples)
- [Prometheus Integration](https://k6.io/docs/results-output/real-time/prometheus-remote-write/)
- [Grafana Dashboards for k6](https://grafana.com/grafana/dashboards/?search=k6)

### 유용한 도구

- [k6 Cloud](https://k6.io/cloud/) - SaaS 부하 테스트 플랫폼
- [xk6](https://github.com/grafana/xk6) - k6 확장 빌더
- [k6-reporter](https://github.com/benc-uk/k6-reporter) - HTML 리포트 생성

### 커뮤니티

- [k6 Community Forum](https://community.k6.io/)
- [k6 GitHub Discussions](https://github.com/grafana/k6/discussions)

---

**마지막 업데이트**: 2026-01-13
**문서 버전**: 2.0.0
**의사결정 반영**: Docker 통합, Posts CRUD + Auth Flow, VUs 50, RPS 목표, 다중 환경 지원
**작성자**: SC Agent
