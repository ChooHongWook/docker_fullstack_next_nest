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
    { email: 'loadtest@example.com', password: 'TestPassword123!' },
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
    'http_req_duration{endpoint:logout}': ['p(95)<200'],
    'http_reqs{endpoint:login}': ['rate>=10'], // 최소 10 RPS
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const user = users[__VU % users.length];

  // 1. 로그인
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify(user),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'login' },
    },
  );

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch {
        return false;
      }
    },
    'has refresh token': (r) => {
      try {
        return JSON.parse(r.body).refreshToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    console.error(`VU ${__VU}: Login failed`);
    sleep(2);
    return;
  }

  let accessToken, refreshToken;
  try {
    const body = JSON.parse(loginRes.body);
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  } catch (e) {
    console.error(`VU ${__VU}: Failed to parse login response`);
    sleep(2);
    return;
  }

  sleep(1);

  // 2. 인증이 필요한 작업 수행 (게시글 작성)
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

  // 4. 로그아웃
  const logoutRes = http.post(
    `${BASE_URL}/auth/logout`,
    JSON.stringify({ refreshToken }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      tags: { endpoint: 'logout' },
    },
  );

  check(logoutRes, {
    'logout status is 200 or 204': (r) => [200, 204].includes(r.status),
  });

  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics;

  console.log('\n🔐 Auth Flow Test Results');
  console.log('════════════════════════════════════════');
  console.log(`Total Requests:     ${metrics.http_reqs.count}`);
  console.log(`Request Rate:       ${metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  console.log(
    `Error Rate:         ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%`,
  );
  console.log('────────────────────────────────────────');
  console.log(
    `p95 Latency:        ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`,
  );
  console.log(
    `p99 Latency:        ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`,
  );
  console.log('════════════════════════════════════════');

  // Auth 엔드포인트별 통계
  console.log('\n🔑 Auth Endpoint Statistics:');

  const endpoints = ['login', 'refresh', 'logout', 'create_post'];
  endpoints.forEach((endpoint) => {
    const durationKey = `http_req_duration{endpoint:${endpoint}}`;
    const reqsKey = `http_reqs{endpoint:${endpoint}}`;

    if (metrics[durationKey] && metrics[reqsKey]) {
      console.log(`  ${endpoint}:`);
      console.log(`    RPS: ${metrics[reqsKey].values.rate.toFixed(2)}`);
      console.log(
        `    p95: ${metrics[durationKey].values['p(95)'].toFixed(2)}ms`,
      );
    }
  });

  console.log('\n');

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
