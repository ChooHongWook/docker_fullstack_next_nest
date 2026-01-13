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
  const scenario = Math.random();

  if (scenario < 0.7) {
    // 70% - 읽기 작업
    const res = http.get(`${BASE_URL}/posts`, {
      tags: { test: 'stress', operation: 'read' },
    });

    check(res, {
      'status is not 5xx': (r) => r.status < 500,
      'response received': (r) => r.body !== null,
    });
  } else if (scenario < 0.85) {
    // 15% - 특정 게시글 조회
    const postId = Math.floor(Math.random() * 100) + 1;
    const res = http.get(`${BASE_URL}/posts/${postId}`, {
      tags: { test: 'stress', operation: 'read_detail' },
    });

    check(res, {
      'status is 200 or 404': (r) => [200, 404].includes(r.status),
    });
  } else {
    // 15% - Health check (시스템 생존 확인)
    const res = http.get(`${BASE_URL}/health`, {
      tags: { test: 'stress', operation: 'health' },
    });

    check(res, {
      'health check responds': (r) => r.status > 0,
    });
  }

  sleep(0.5); // 짧은 sleep으로 높은 부하 생성
}

export function handleSummary(data) {
  const metrics = data.metrics;

  console.log('\n⚠️  Stress Test Results');
  console.log('════════════════════════════════════════');
  console.log(`Total Requests:     ${metrics.http_reqs.count}`);
  console.log(`Request Rate:       ${metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  console.log(
    `Error Rate:         ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%`,
  );
  console.log('────────────────────────────────────────');
  console.log(
    `p50 Latency:        ${metrics.http_req_duration.values['p(50)'].toFixed(2)}ms`,
  );
  console.log(
    `p95 Latency:        ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`,
  );
  console.log(
    `p99 Latency:        ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`,
  );
  console.log(`Max Latency:        ${metrics.http_req_duration.values.max.toFixed(2)}ms`);
  console.log('────────────────────────────────────────');
  console.log(
    `Min Latency:        ${metrics.http_req_duration.values.min.toFixed(2)}ms`,
  );
  console.log(
    `Avg Latency:        ${metrics.http_req_duration.values.avg.toFixed(2)}ms`,
  );
  console.log('════════════════════════════════════════');

  // 시스템 한계점 분석
  const peakVUs = 500;
  const totalErrors = metrics.http_req_failed.values.passes || 0;
  const errorRate = metrics.http_req_failed.values.rate;

  console.log('\n📊 System Stress Analysis:');
  console.log(`  Peak VUs:           ${peakVUs}`);
  console.log(`  Total Errors:       ${totalErrors}`);
  console.log(`  Error Rate:         ${(errorRate * 100).toFixed(2)}%`);

  if (errorRate < 0.05) {
    console.log('\n✅ System handled stress well (< 5% error rate)');
  } else if (errorRate < 0.2) {
    console.log('\n⚠️  System under stress but operational (< 20% error rate)');
  } else {
    console.log('\n❌ System exceeded capacity (> 20% error rate)');
  }

  console.log('\n💡 Recommendations:');
  if (errorRate > 0.1) {
    console.log('  - Consider scaling backend instances');
    console.log('  - Review database connection pool settings');
    console.log('  - Check for memory leaks or resource exhaustion');
  } else {
    console.log('  - System capacity is sufficient for current load');
    console.log('  - Monitor trends for future capacity planning');
  }

  console.log('\n');

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
