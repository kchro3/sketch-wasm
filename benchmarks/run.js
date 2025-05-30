const { performance } = require('perf_hooks');
const { BloomFilter, CountMinSketch, HyperLogLog, HeavyKeeper } = require('../pkg/sketch_wasm');
const {
  BloomFilter: JSBloomFilter,
  CountMinSketch: JSCountMinSketch,
  HyperLogLog: JSHyperLogLog,
} = require('bloom-filters');

function measureMemory() {
  const used = process.memoryUsage();
  return {
    heapUsed: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotal: Math.round((used.heapTotal / 1024 / 1024) * 100) / 100,
    external: Math.round((used.external / 1024 / 1024) * 100) / 100,
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
  warmupItems.forEach((item) => {
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
  items.forEach((item) => wasmFilter.insert(item));
  const wasmInsertTime = performance.now() - wasmStart;

  // Create fresh JS filter for fair comparison
  const jsFilterFresh = JSBloomFilter.create(expectedItems, falsePositiveRate);

  // JS insert benchmark
  const jsStart = performance.now();
  items.forEach((item) => jsFilterFresh.add(item));
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
  mixedLookupItems.forEach((item) => {
    if (wasmFilter.contains(item)) wasmHits++;
  });
  const wasmLookupTime = performance.now() - wasmLookupStart;

  // JS lookup
  const jsLookupStart = performance.now();
  let jsHits = 0;
  mixedLookupItems.forEach((item) => {
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
  console.log(
    `Hit difference: ${Math.abs(wasmHits - jsHits)} (should be small for fair comparison)`
  );

  // Count-Min Sketch benchmarks
  console.log('\nCount-Min Sketch Benchmarks:');
  console.log('---------------------------');

  // Initialize Count-Min Sketch with parameters that match WASM dimensions
  const errorRate = 0.00027; // 0.027% error rate to match WASM width of 10000
  const accuracy = 0.9933; // 99.33% accuracy to match WASM depth of 5
  const wasmCms = new CountMinSketch(10000, 5);
  const jsCms = JSCountMinSketch.create(errorRate, accuracy);

  console.log('Count-Min Sketch Configuration:');
  console.log(`WASM: width=10000, depth=5`);
  console.log(`JS: errorRate=${errorRate}, accuracy=${accuracy}`);
  console.log(`JS dimensions: width=${jsCms.columns}, depth=${jsCms.rows}\n`);
  console.log('Note: JS dimensions should be close to WASM dimensions for fair comparison');

  // Generate test data with known frequencies
  const frequencyItems = [];
  for (let i = 0; i < 1000; i++) {
    const item = `item${i}`;
    const frequency = Math.floor(Math.random() * 100) + 1; // Random frequency between 1 and 100
    for (let j = 0; j < frequency; j++) {
      frequencyItems.push(item);
    }
  }

  // Shuffle items for realistic access pattern
  for (let i = frequencyItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [frequencyItems[i], frequencyItems[j]] = [frequencyItems[j], frequencyItems[i]];
  }

  // Clear memory before CMS benchmarking
  if (global.gc) {
    global.gc();
  }

  // Measure baseline memory for CMS
  const cmsBaselineMemory = measureMemory();
  console.log('CMS Baseline memory:', cmsBaselineMemory);

  // WASM Increment performance test
  const wasmCmsStart = performance.now();
  frequencyItems.forEach((item) => wasmCms.increment(item));
  const wasmCmsIncrementTime = performance.now() - wasmCmsStart;

  // JS Increment performance test
  const jsCmsStart = performance.now();
  frequencyItems.forEach((item) => jsCms.update(item));
  const jsCmsIncrementTime = performance.now() - jsCmsStart;

  console.log('\nIncrement Performance:');
  console.log(`WASM: ${wasmCmsIncrementTime.toFixed(2)}ms`);
  console.log(`JS: ${jsCmsIncrementTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(jsCmsIncrementTime / wasmCmsIncrementTime).toFixed(2)}x`);
  console.log(`Average time per increment:`);
  console.log(`  WASM: ${(wasmCmsIncrementTime / frequencyItems.length).toFixed(3)}ms`);
  console.log(`  JS: ${(jsCmsIncrementTime / frequencyItems.length).toFixed(3)}ms`);

  // Memory usage after increments
  const afterCmsMemory = measureMemory();
  console.log('\nMemory after CMS increments:', afterCmsMemory);

  // Estimate performance test
  const estimateItems = frequencyItems.slice(0, 10000); // Test with 10k estimates

  // WASM Estimate
  const wasmCmsEstimateStart = performance.now();
  let wasmTotalEstimate = 0;
  estimateItems.forEach((item) => {
    wasmTotalEstimate += wasmCms.estimate(item);
  });
  const wasmCmsEstimateTime = performance.now() - wasmCmsEstimateStart;

  // JS Estimate
  const jsCmsEstimateStart = performance.now();
  let jsTotalEstimate = 0;
  estimateItems.forEach((item) => {
    jsTotalEstimate += jsCms.count(item);
  });
  const jsCmsEstimateTime = performance.now() - jsCmsEstimateStart;

  console.log('\nEstimate Performance:');
  console.log(`WASM: ${wasmCmsEstimateTime.toFixed(2)}ms`);
  console.log(`JS: ${jsCmsEstimateTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(jsCmsEstimateTime / wasmCmsEstimateTime).toFixed(2)}x`);
  console.log(`Average time per estimate:`);
  console.log(`  WASM: ${(wasmCmsEstimateTime / estimateItems.length).toFixed(3)}ms`);
  console.log(`  JS: ${(jsCmsEstimateTime / estimateItems.length).toFixed(3)}ms`);
  console.log(`Average count per item:`);
  console.log(`  WASM: ${(wasmTotalEstimate / estimateItems.length).toFixed(2)}`);
  console.log(`  JS: ${(jsTotalEstimate / estimateItems.length).toFixed(2)}`);

  // Verify both implementations have similar behavior
  console.log('\nCMS Accuracy Check:');
  console.log(`WASM total estimate: ${wasmTotalEstimate}`);
  console.log(`JS total estimate: ${jsTotalEstimate}`);
  console.log(
    `Estimate difference: ${Math.abs(wasmTotalEstimate - jsTotalEstimate)} (should be small for fair comparison)`
  );

  // HyperLogLog benchmarks
  console.log('\nHyperLogLog Benchmarks:');
  console.log('----------------------');
  // Initialize HyperLogLog with same configuration for fair comparison
  const precision = 14;
  const numRegisters = 1 << precision; // 2^14 = 16384
  const wasmHll = new HyperLogLog(precision);
  // Create JS HyperLogLog with same number of registers
  const jsHll = new JSHyperLogLog(numRegisters);

  console.log('HyperLogLog Configuration:');
  console.log(`Precision: ${precision}`);
  console.log(`Number of registers: ${numRegisters}`);
  console.log('Note: Both implementations now use identical register count for fair comparison\n');
  // Generate test data with known cardinality
  const cardinalityItems = [];
  const uniqueItems = new Set();
  for (let i = 0; i < 100000; i++) {
    const item = `item${i}`;
    cardinalityItems.push(item);
    uniqueItems.add(item);
  }

  // Clear memory before HLL benchmarking
  if (global.gc) {
    global.gc();
  }

  // Measure baseline memory for HLL
  const hllBaselineMemory = measureMemory();
  console.log('HLL Baseline memory:', hllBaselineMemory);

  // WASM Add performance test
  const wasmHllStart = performance.now();
  cardinalityItems.forEach((item) => wasmHll.add(item));
  const wasmHllAddTime = performance.now() - wasmHllStart;

  // JS Add performance test (using 'update' method for bloom-filters library)
  const jsHllStart = performance.now();
  cardinalityItems.forEach((item) => jsHll.update(item));
  const jsHllAddTime = performance.now() - jsHllStart;

  console.log('\nAdd Performance:');
  console.log(`WASM: ${wasmHllAddTime.toFixed(2)}ms`);
  console.log(`JS: ${jsHllAddTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(jsHllAddTime / wasmHllAddTime).toFixed(2)}x`);
  console.log(`Average time per add:`);
  console.log(`  WASM: ${(wasmHllAddTime / cardinalityItems.length).toFixed(3)}ms`);
  console.log(`  JS: ${(jsHllAddTime / cardinalityItems.length).toFixed(3)}ms`);

  // Memory usage after adds
  const afterHllMemory = measureMemory();
  console.log('\nMemory after HLL adds:', afterHllMemory);

  // Count performance test
  const wasmHllCountStart = performance.now();
  const wasmEstimate = wasmHll.count();
  const wasmHllCountTime = performance.now() - wasmHllCountStart;

  const jsHllCountStart = performance.now();
  const jsEstimate = jsHll.count();
  const jsHllCountTime = performance.now() - jsHllCountStart;

  console.log('\nCount Performance:');
  console.log(`WASM: ${wasmHllCountTime.toFixed(2)}ms`);
  console.log(`JS: ${jsHllCountTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(jsHllCountTime / wasmHllCountTime).toFixed(2)}x`);

  // Verify both implementations have similar behavior
  console.log('\nHLL Accuracy Check:');
  console.log(`Actual cardinality: ${uniqueItems.size}`);
  console.log(`WASM estimate: ${wasmEstimate.toFixed(2)}`);
  console.log(`JS estimate: ${jsEstimate.toFixed(2)}`);
  console.log(
    `WASM error: ${((Math.abs(wasmEstimate - uniqueItems.size) / uniqueItems.size) * 100).toFixed(2)}%`
  );
  console.log(
    `JS error: ${((Math.abs(jsEstimate - uniqueItems.size) / uniqueItems.size) * 100).toFixed(2)}%`
  );

  // Compare with Bloom Filter memory usage
  console.log('\nMemory Usage Comparison:');
  console.log(
    `Bloom Filter (1M items, 1% error): ${(wasmFilter.bits?.length / 8 / 1024).toFixed(2)}KB`
  );
  console.log(
    `HyperLogLog (precision ${precision}): ${(((1 << precision) * 4) / 1024).toFixed(2)}KB`
  );

  // Note about benchmark fairness
  console.log('\nBenchmark Notes:');
  console.log('- Both data structures use same number of items for fair comparison');
  console.log('- HyperLogLog implementations now use identical register count');
  console.log('- Both HLL implementations use same method names (add/count)');
  console.log('- Warm-up performed to eliminate JIT compilation effects');
  console.log('- Memory measurements include baseline overhead');
  console.log('- Run with --expose-gc for more accurate memory measurements');
  console.log('- Note: Different hash functions may still affect performance/accuracy');

  // Heavy Keeper benchmarks
  console.log('\nHeavy Keeper Benchmarks:');
  console.log('----------------------');

  // Initialize Heavy Keeper with parameters for fair comparison
  const width = 1000;
  const depth = 5;
  const k = 10;
  const decay = 0.9;
  const wasmHk = new HeavyKeeper(width, depth, k, decay);

  // Create a simple JS implementation for comparison
  class JSHeavyKeeper {
    constructor(width, depth, k, decay) {
      this.width = width;
      this.depth = depth;
      this.k = k;
      this.decay = decay;
      this.counters = Array(depth)
        .fill()
        .map(() =>
          Array(width)
            .fill()
            .map(() => ({ item: '', count: 0 }))
        );
    }

    hash(item, seed) {
      let hash = seed;
      for (let i = 0; i < item.length; i++) {
        hash = (hash * 31 + item.charCodeAt(i)) >>> 0;
      }
      return hash % this.width;
    }

    add(item) {
      for (let i = 0; i < this.depth; i++) {
        const pos = this.hash(item, i);
        const counter = this.counters[i][pos];

        if (!counter.item) {
          counter.item = item;
          counter.count = 1;
        } else if (counter.item === item) {
          counter.count++;
        } else if (Math.random() < this.decay) {
          counter.count--;
          if (counter.count === 0) {
            counter.item = item;
            counter.count = 1;
          }
        }
      }
    }

    query(item) {
      let minCount = Infinity;
      for (let i = 0; i < this.depth; i++) {
        const pos = this.hash(item, i);
        const counter = this.counters[i][pos];
        if (counter.item === item) {
          minCount = Math.min(minCount, counter.count);
        }
      }
      return minCount === Infinity ? 0 : minCount;
    }

    topK() {
      const counts = new Map();
      for (const row of this.counters) {
        for (const { item, count } of row) {
          if (item) {
            counts.set(item, (counts.get(item) || 0) + count);
          }
        }
      }
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.k);
    }
  }

  const jsHk = new JSHeavyKeeper(width, depth, k, decay);

  console.log('Heavy Keeper Configuration:');
  console.log(`Width: ${width}, Depth: ${depth}, K: ${k}, Decay: ${decay}\n`);
  // Generate test data with Zipfian/power-law distribution
  const hkFrequencyItems = [];
  const numItems = 1000;
  const s = 1.5; // Zipf parameter (s > 1 for proper power law)

  // Calculate Zipfian frequencies
  const zipfFrequencies = [];
  let totalFreq = 0;
  for (let i = 1; i <= numItems; i++) {
    const freq = Math.floor(1000 / Math.pow(i, s)); // Scale base frequency
    zipfFrequencies.push(Math.max(1, freq)); // Ensure minimum frequency of 1
    totalFreq += zipfFrequencies[i - 1];
  }

  // Generate items according to Zipfian distribution
  for (let i = 0; i < numItems; i++) {
    const item = `item${i}`;
    const frequency = zipfFrequencies[i];
    for (let j = 0; j < frequency; j++) {
      hkFrequencyItems.push(item);
    }
  }

  // Shuffle items for realistic access pattern
  for (let i = hkFrequencyItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hkFrequencyItems[i], hkFrequencyItems[j]] = [hkFrequencyItems[j], hkFrequencyItems[i]];
  }

  console.log(`Generated ${hkFrequencyItems.length} items with Zipfian distribution (s=${s})`);
  console.log(`Most frequent item appears ${zipfFrequencies[0]} times`);
  console.log(`Least frequent items appear ${zipfFrequencies[numItems - 1]} times`);

  // Clear memory before HK benchmarking
  if (global.gc) {
    global.gc();
  }

  // Measure baseline memory for HK
  const hkBaselineMemory = measureMemory();
  console.log('HK Baseline memory:', hkBaselineMemory);

  // WASM Add performance test
  const wasmHkStart = performance.now();
  hkFrequencyItems.forEach((item) => wasmHk.add(item));
  const wasmHkAddTime = performance.now() - wasmHkStart;

  // JS Add performance test
  const jsHkStart = performance.now();
  hkFrequencyItems.forEach((item) => jsHk.add(item));
  const jsHkAddTime = performance.now() - jsHkStart;

  console.log('\nAdd Performance:');
  console.log(`WASM: ${wasmHkAddTime.toFixed(2)}ms`);
  console.log(`JS: ${jsHkAddTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(jsHkAddTime / wasmHkAddTime).toFixed(2)}x`);
  console.log(`Average time per add:`);
  console.log(`  WASM: ${(wasmHkAddTime / hkFrequencyItems.length).toFixed(3)}ms`);
  console.log(`  JS: ${(jsHkAddTime / hkFrequencyItems.length).toFixed(3)}ms`);

  // Memory usage after adds
  const afterHkMemory = measureMemory();
  console.log('\nMemory after HK adds:', afterHkMemory);

  // Top-K performance test
  const wasmHkTopKStart = performance.now();
  const wasmTopK = wasmHk.top_k();
  const wasmHkTopKTime = performance.now() - wasmHkTopKStart;

  const jsHkTopKStart = performance.now();
  const jsTopK = jsHk.topK();
  const jsHkTopKTime = performance.now() - jsHkTopKStart;

  console.log('\nTop-K Performance:');
  console.log(`WASM: ${wasmHkTopKTime.toFixed(2)}ms`);
  console.log(`JS: ${jsHkTopKTime.toFixed(2)}ms`);
  console.log(`Speedup: ${(jsHkTopKTime / wasmHkTopKTime).toFixed(2)}x`);

  // Verify both implementations have similar behavior
  console.log('\nHK Accuracy Check:');
  console.log('WASM Top-K:', wasmTopK.map((item) => `${item.item}: ${item.count}`).join(', '));
  console.log('JS Top-K:', jsTopK.map(([item, count]) => `${item}: ${count}`).join(', '));
  console.log('Note: Both implementations should track similar top items');

  // Compare memory usage
  console.log('\nMemory Usage Comparison:');
  console.log(
    `Heavy Keeper (width=${width}, depth=${depth}): ${((width * depth * 8) / 1024).toFixed(2)}KB`
  );

  // Note about benchmark fairness
  console.log('\nBenchmark Notes:');
  console.log('- Both implementations use identical parameters');
  console.log('- JS implementation is a direct port of the WASM version');
  console.log('- Memory measurements include baseline overhead');
  console.log('- Run with --expose-gc for more accurate memory measurements');
}

runBenchmarks().catch(console.error);
