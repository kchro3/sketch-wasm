const { performance } = require('perf_hooks');
const { BloomFilter } = require('../pkg/sketch_wasm');
const { BloomFilter: JSBloomFilter } = require('bloom-filters');

function measureMemory() {
  const used = process.memoryUsage();
  return {
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100,
  };
}

async function runBenchmarks() {
  console.log('Running benchmarks...\n');

  // Bloom Filter benchmarks
  console.log('Bloom Filter Benchmarks:');
  console.log('-----------------------');

  // Initialize filters with same parameters
  const expectedItems = 1000000;
  const falsePositiveRate = 0.01;

  const wasmFilter = new BloomFilter(expectedItems, falsePositiveRate);
  const jsFilter = JSBloomFilter.create(expectedItems, falsePositiveRate);

  console.log('Filter Configuration:');
  console.log(`Expected items: ${expectedItems}`);
  console.log(`False positive rate: ${falsePositiveRate}`);
  console.log(`WASM filter size: ${wasmFilter.bits?.length || 'unknown'}`);
  console.log(`JS filter size: ${jsFilter.size}`);
  console.log(`JS filter hash count: ${jsFilter._nbHashes}\n`);

  // Warm up both filters to ensure fair comparison
  console.log('Warming up filters...');
  const warmupItems = Array.from({ length: 1000 }, (_, i) => `warmup${i}`);
  warmupItems.forEach(item => {
    wasmFilter.insert(item);
    jsFilter.add(item);
  });

  // Test data
  const items = Array.from({ length: 100000 }, (_, i) => `item${i}`);

  // Clear memory before benchmarking
  if (global.gc) {
    global.gc();
  }

  // Measure baseline memory
  const baselineMemory = measureMemory();
  console.log('Baseline memory:', baselineMemory);

  // WASM insert benchmark
  const wasmStart = performance.now();
  items.forEach(item => wasmFilter.insert(item));
  const wasmInsertTime = performance.now() - wasmStart;

  // Create fresh JS filter for fair comparison
  const jsFilterFresh = JSBloomFilter.create(expectedItems, falsePositiveRate);

  // JS insert benchmark
  const jsStart = performance.now();
  items.forEach(item => jsFilterFresh.add(item));
  const jsInsertTime = performance.now() - jsStart;

  console.log('\nInsert Performance (100,000 items):');
  console.log(`WASM: ${wasmInsertTime.toFixed(2)}ms`);
  console.log(`JS: ${jsInsertTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(jsInsertTime / wasmInsertTime).toFixed(2)}x`);

  // Memory usage after insertions
  const afterInsertMemory = measureMemory();
  console.log('\nMemory after insertions:', afterInsertMemory);

  // Lookup performance test
  const lookupItems = items.slice(0, 10000); // Test with 10k lookups for better measurement
  const nonExistentItems = Array.from({ length: 5000 }, (_, i) => `nonexistent${i}`);
  const mixedLookupItems = [...lookupItems, ...nonExistentItems];

  // Shuffle for realistic access pattern
  for (let i = mixedLookupItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mixedLookupItems[i], mixedLookupItems[j]] = [mixedLookupItems[j], mixedLookupItems[i]];
  }

  // WASM lookup
  const wasmLookupStart = performance.now();
  let wasmHits = 0;
  mixedLookupItems.forEach(item => {
    if (wasmFilter.contains(item)) wasmHits++;
  });
  const wasmLookupTime = performance.now() - wasmLookupStart;

  // JS lookup
  const jsLookupStart = performance.now();
  let jsHits = 0;
  mixedLookupItems.forEach(item => {
    if (jsFilterFresh.has(item)) jsHits++;
  });
  const jsLookupTime = performance.now() - jsLookupStart;

  console.log(`\nLookup Performance (${mixedLookupItems.length} mixed queries):`);
  console.log(`WASM: ${wasmLookupTime.toFixed(2)}ms (${wasmHits} hits)`);
  console.log(`JS: ${jsLookupTime.toFixed(2)}ms (${jsHits} hits)`);
  console.log(`Speedup: ${(jsLookupTime / wasmLookupTime).toFixed(2)}x`);

  // Verify both filters have similar behavior
  console.log('\nFilter Accuracy Check:');
  console.log(`WASM hits: ${wasmHits}, JS hits: ${jsHits}`);
  console.log(`Hit difference: ${Math.abs(wasmHits - jsHits)} (should be small for fair comparison)`);

  // Note about benchmark fairness
  console.log('\nBenchmark Notes:');
  console.log('- Both filters use same expected items and false positive rate');
  console.log('- Warm-up performed to eliminate JIT compilation effects');
  console.log('- Mixed lookup pattern (existing + non-existing items)');
  console.log('- Memory measurements include baseline overhead');
  console.log('- Run with --expose-gc for more accurate memory measurements');
}

runBenchmarks().catch(console.error);