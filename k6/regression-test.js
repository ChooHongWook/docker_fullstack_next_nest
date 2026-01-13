import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://backend:4000';

// Baseline performance targets (update these after establishing baseline)
const BASELINE = {
  posts_list_p95: 200, // ms
  post_detail_p95: 150, // ms
  health_p95: 50, // ms
  error_rate: 0.01, // 1%
  min_rps: 100, // requests per second
};

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 }, // Sustained load
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // Baseline comparison with 20% tolerance
    'http_req_duration{endpoint:posts_list}': [
      `p(95)<${BASELINE.posts_list_p95 * 1.2}`,
    ],
    'http_req_duration{endpoint:post_detail}': [
      `p(95)<${BASELINE.post_detail_p95 * 1.2}`,
    ],
    'http_req_duration{endpoint:health}': [`p(95)<${BASELINE.health_p95 * 1.2}`],

    // Error rate should not exceed 2x baseline
    http_req_failed: [`rate<${BASELINE.error_rate * 2}`],

    // RPS should not drop below 80% of baseline
    http_reqs: [`rate>=${BASELINE.min_rps * 0.8}`],
  },
};

export default function () {
  const scenario = Math.random();

  if (scenario < 0.1) {
    // 10% - Health check
    const res = http.get(`${BASE_URL}/health`, {
      tags: { endpoint: 'health' },
    });

    check(res, {
      'health status is 200': (r) => r.status === 200,
    });
  } else if (scenario < 0.6) {
    // 50% - Posts list
    const res = http.get(`${BASE_URL}/posts`, {
      tags: { endpoint: 'posts_list' },
    });

    check(res, {
      'posts list status is 200': (r) => r.status === 200,
      'posts list has data': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body));
        } catch {
          return false;
        }
      },
    });
  } else {
    // 40% - Post detail
    const postId = Math.floor(Math.random() * 100) + 1;
    const res = http.get(`${BASE_URL}/posts/${postId}`, {
      tags: { endpoint: 'post_detail' },
    });

    check(res, {
      'post detail status is 200 or 404': (r) => [200, 404].includes(r.status),
    });
  }
}

export function handleSummary(data) {
  const metrics = data.metrics;

  console.log('\n🔄 Regression Test Results');
  console.log('════════════════════════════════════════════════════════════');

  // Current test metrics
  const current = {
    posts_list_p95:
      metrics['http_req_duration{endpoint:posts_list}']?.values['p(95)'] || 0,
    post_detail_p95:
      metrics['http_req_duration{endpoint:post_detail}']?.values['p(95)'] || 0,
    health_p95:
      metrics['http_req_duration{endpoint:health}']?.values['p(95)'] || 0,
    error_rate: metrics.http_req_failed?.values.rate || 0,
    rps: metrics.http_reqs?.values.rate || 0,
  };

  // Calculate regressions
  const regression = {
    posts_list: current.posts_list_p95 > BASELINE.posts_list_p95 * 1.2,
    post_detail: current.post_detail_p95 > BASELINE.post_detail_p95 * 1.2,
    health: current.health_p95 > BASELINE.health_p95 * 1.2,
    error_rate: current.error_rate > BASELINE.error_rate * 2,
    rps: current.rps < BASELINE.min_rps * 0.8,
  };

  // Display results
  console.log('\n📊 Performance Comparison:');
  console.log('\n  Metric                  | Baseline    | Current     | Status');
  console.log('  ----------------------- | ----------- | ----------- | ------');

  const compareMetric = (name, baseline, current, unit, higher_is_better = false) => {
    const diff = ((current - baseline) / baseline) * 100;
    const symbol =
      (higher_is_better && current >= baseline) ||
      (!higher_is_better && current <= baseline * 1.2)
        ? '✅'
        : '⚠️';
    const diffStr =
      diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
    console.log(
      `  ${name.padEnd(23)} | ${(baseline + unit).padEnd(11)} | ${(current.toFixed(2) + unit).padEnd(11)} | ${symbol} ${diffStr}`,
    );
  };

  compareMetric('Posts List p95', BASELINE.posts_list_p95, current.posts_list_p95, 'ms');
  compareMetric(
    'Post Detail p95',
    BASELINE.post_detail_p95,
    current.post_detail_p95,
    'ms',
  );
  compareMetric('Health p95', BASELINE.health_p95, current.health_p95, 'ms');
  compareMetric(
    'Error Rate',
    BASELINE.error_rate * 100,
    current.error_rate * 100,
    '%',
  );
  compareMetric('RPS', BASELINE.min_rps, current.rps, '', true);

  console.log('\n════════════════════════════════════════════════════════════');

  // Overall verdict
  const hasRegression = Object.values(regression).some((v) => v);

  if (hasRegression) {
    console.log('\n❌ Performance Regression Detected!\n');
    console.log('Regressions in:');
    if (regression.posts_list)
      console.log('  - Posts list endpoint (p95 latency)');
    if (regression.post_detail)
      console.log('  - Post detail endpoint (p95 latency)');
    if (regression.health) console.log('  - Health endpoint (p95 latency)');
    if (regression.error_rate) console.log('  - Error rate');
    if (regression.rps) console.log('  - Request throughput (RPS)');
    console.log('\n💡 Action Required: Investigate performance degradation\n');
  } else {
    console.log('\n✅ No Performance Regression Detected\n');
    console.log('All metrics within acceptable thresholds.\n');
  }

  return {
    stdout: JSON.stringify(
      {
        regression: hasRegression,
        baseline: BASELINE,
        current: current,
        regressions: regression,
      },
      null,
      2,
    ),
  };
}
