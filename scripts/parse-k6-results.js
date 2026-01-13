#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * k6 Load Test Results Parser
 *
 * Usage:
 *   node scripts/parse-k6-results.js <path-to-k6-json-results>
 *
 * Example:
 *   node scripts/parse-k6-results.js k6/results/load-20260113-143020.json
 */

function parseK6Results(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const metrics = data.metrics;

  if (!metrics) {
    console.error('❌ Invalid k6 results file: missing metrics');
    process.exit(1);
  }

  console.log('\n📊 k6 Load Test Results');
  console.log('════════════════════════════════════════════════════════════');

  // Test overview
  console.log('\n📋 Test Overview:');
  console.log(`  File:               ${path.basename(filePath)}`);
  if (data.state) {
    console.log(`  Test Status:        ${data.state.testRunDurationMs ? '✅ Completed' : '⚠️  Incomplete'}`);
    console.log(`  Duration:           ${(data.state.testRunDurationMs / 1000).toFixed(2)}s`);
  }

  // Request statistics
  console.log('\n📈 Request Statistics:');
  if (metrics.http_reqs) {
    console.log(`  Total Requests:     ${metrics.http_reqs.values.count}`);
    console.log(`  Request Rate:       ${metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  }

  if (metrics.http_req_failed) {
    const errorRate = metrics.http_req_failed.values.rate;
    const errorCount = metrics.http_req_failed.values.passes || 0;
    const errorSymbol = errorRate > 0.05 ? '❌' : errorRate > 0.01 ? '⚠️' : '✅';
    console.log(`  ${errorSymbol} Failed Requests:  ${errorCount}`);
    console.log(`  ${errorSymbol} Error Rate:       ${(errorRate * 100).toFixed(2)}%`);
  }

  // Latency statistics
  console.log('\n⏱️  Latency Statistics:');
  if (metrics.http_req_duration) {
    const values = metrics.http_req_duration.values;
    console.log(`  Min:                ${values.min.toFixed(2)}ms`);
    console.log(`  Avg:                ${values.avg.toFixed(2)}ms`);
    console.log(`  Med (p50):          ${values['p(50)'].toFixed(2)}ms`);
    console.log(`  p90:                ${values['p(90)'].toFixed(2)}ms`);

    const p95 = values['p(95)'];
    const p95Symbol = p95 > 500 ? '❌' : p95 > 200 ? '⚠️' : '✅';
    console.log(`  ${p95Symbol} p95:              ${p95.toFixed(2)}ms`);

    const p99 = values['p(99)'];
    const p99Symbol = p99 > 1000 ? '❌' : p99 > 500 ? '⚠️' : '✅';
    console.log(`  ${p99Symbol} p99:              ${p99.toFixed(2)}ms`);

    console.log(`  Max:                ${values.max.toFixed(2)}ms`);
  }

  // Virtual users
  console.log('\n👥 Virtual Users:');
  if (metrics.vus) {
    console.log(`  Average VUs:        ${metrics.vus.values.value.toFixed(0)}`);
  }
  if (metrics.vus_max) {
    console.log(`  Max VUs:            ${metrics.vus_max.values.value.toFixed(0)}`);
  }

  // Endpoint breakdown
  console.log('\n🎯 Endpoint Breakdown:');
  const endpointStats = {};

  for (const [key, value] of Object.entries(metrics)) {
    const match = key.match(/http_req_duration\{endpoint:(\w+)\}/);
    if (match) {
      const endpoint = match[1];
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {};
      }
      endpointStats[endpoint].p95 = value.values['p(95)'].toFixed(2);
      endpointStats[endpoint].avg = value.values.avg.toFixed(2);
    }

    const rpsMatch = key.match(/http_reqs\{endpoint:(\w+)\}/);
    if (rpsMatch) {
      const endpoint = rpsMatch[1];
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = {};
      }
      endpointStats[endpoint].rps = value.values.rate.toFixed(2);
    }
  }

  if (Object.keys(endpointStats).length > 0) {
    for (const [endpoint, stats] of Object.entries(endpointStats)) {
      console.log(`  ${endpoint}:`);
      if (stats.rps) console.log(`    RPS:            ${stats.rps}`);
      if (stats.avg) console.log(`    Avg Latency:    ${stats.avg}ms`);
      if (stats.p95) console.log(`    p95 Latency:    ${stats.p95}ms`);
    }
  } else {
    console.log('  No endpoint-specific metrics found');
  }

  // Threshold validation
  console.log('\n✅ Threshold Validation:');
  const thresholdResults = [];

  if (metrics.http_req_duration) {
    const p95 = metrics.http_req_duration.values['p(95)'];
    thresholdResults.push({
      name: 'p95 latency < 500ms',
      passed: p95 < 500,
      value: `${p95.toFixed(2)}ms`,
    });
  }

  if (metrics.http_req_failed) {
    const errorRate = metrics.http_req_failed.values.rate;
    thresholdResults.push({
      name: 'Error rate < 2%',
      passed: errorRate < 0.02,
      value: `${(errorRate * 100).toFixed(2)}%`,
    });
  }

  if (metrics.http_reqs) {
    const rps = metrics.http_reqs.values.rate;
    thresholdResults.push({
      name: 'RPS >= 30',
      passed: rps >= 30,
      value: `${rps.toFixed(2)} req/s`,
    });
  }

  thresholdResults.forEach((result) => {
    const symbol = result.passed ? '✅' : '❌';
    console.log(`  ${symbol} ${result.name}: ${result.value}`);
  });

  const allPassed = thresholdResults.every((r) => r.passed);
  console.log('════════════════════════════════════════════════════════════');

  if (allPassed) {
    console.log('✅ All thresholds passed!\n');
    return 0;
  } else {
    console.log('❌ Some thresholds failed!\n');
    return 1;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('\n❌ Usage: node scripts/parse-k6-results.js <path-to-k6-json-results>\n');
    console.error('Example:');
    console.error('  node scripts/parse-k6-results.js k6/results/load-20260113-143020.json\n');
    process.exit(1);
  }

  const exitCode = parseK6Results(args[0]);
  process.exit(exitCode);
}

module.exports = { parseK6Results };
