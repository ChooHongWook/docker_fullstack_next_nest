import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://backend:4000';

export const options = {
  vus: __ENV.K6_VUS ? parseInt(__ENV.K6_VUS) : 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: 'health' },
  });

  const healthCheck = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
    'health has status field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status !== undefined;
      } catch {
        return false;
      }
    },
  });

  // Basic posts endpoint check
  const postsRes = http.get(`${BASE_URL}/posts`, {
    tags: { endpoint: 'posts' },
  });

  check(postsRes, {
    'posts status is 200': (r) => r.status === 200,
    'posts response time < 200ms': (r) => r.timings.duration < 200,
    'posts returns array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics;

  console.log('\n🔍 Smoke Test Summary');
  console.log('════════════════════════════════════════');
  console.log(`Total Requests:     ${metrics.http_reqs.count}`);
  console.log(`Failed Requests:    ${metrics.http_req_failed.values.passes || 0}`);
  console.log(`Request Rate:       ${metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  console.log('────────────────────────────────────────');
  console.log(
    `p95 Latency:        ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`,
  );
  console.log(
    `Max Latency:        ${metrics.http_req_duration.values.max.toFixed(2)}ms`,
  );
  console.log('────────────────────────────────────────');
  console.log(`Checks Passed:      ${data.root_group.checks.filter((c) => c.passes > 0).length}/${data.root_group.checks.length}`);
  console.log('════════════════════════════════════════\n');

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
