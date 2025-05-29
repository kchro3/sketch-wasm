# sketch-wasm

A high-performance WebAssembly implementation of probabilistic data structures for TypeScript/Node.js applications. This library provides efficient implementations of:

- Bloom Filters
- Count-Min Sketch
- HyperLogLog
- Heavy Keeper (Approximate Top-K)

## Features

- **🚀 Blazing Fast**: Up to 2,320x faster operations compared to pure JavaScript implementations
- Written in Rust and compiled to WebAssembly for maximum performance
- TypeScript bindings for easy integration
- Memory-efficient implementations
- Benchmarks comparing against popular JavaScript libraries

## Performance

Our WebAssembly implementation significantly outperforms pure JavaScript alternatives:

### Bloom Filter Performance

| Operation            | WASM    | JavaScript | Speedup          |
| -------------------- | ------- | ---------- | ---------------- |
| Insert (100k items)  | 14.53ms | 493.80ms   | **34.0x faster** |
| Lookup (15k queries) | 4.67ms  | 76.63ms    | **16.4x faster** |

### Count-Min Sketch Performance

| Operation              | WASM   | JavaScript | Speedup          |
| ---------------------- | ------ | ---------- | ---------------- |
| Increment (67k items)  | 8.20ms | 221.39ms   | **27.0x faster** |
| Estimate (10k queries) | 2.03ms | 45.10ms    | **22.3x faster** |

### HyperLogLog Performance

| Operation        | WASM   | JavaScript  | Speedup           |
| ---------------- | ------ | ----------- | ----------------- |
| Add (100k items) | 5.96ms | 13,823.39ms | **2,320x faster** |
| Count estimation | 0.34ms | 1.18ms      | **3.5x faster**   |

### Heavy Keeper Performance

| Operation        | WASM   | JavaScript | Speedup         |
| ---------------- | ------ | ---------- | --------------- |
| Add (3.3k items) | 2.91ms | 1.97ms     | _0.7x slower_   |
| Top-K query      | 0.41ms | 0.45ms     | **1.1x faster** |

_Benchmarks run against the popular `bloom-filters` npm package with 1M expected items and 1% false positive rate for Bloom Filter, width=10000/depth=5 for Count-Min Sketch, precision=14 for HyperLogLog, and width=1000/depth=5/k=10 for Heavy Keeper._

## Installation

```bash
npm install sketch-wasm
```

## Usage

### Bloom Filter

```typescript
import { BloomFilter } from "sketch-wasm";

// Create a Bloom filter with expected 1M items and 1% false positive rate
const filter = new BloomFilter(1_000_000, 0.01);

// Insert items
filter.insert("item1");
filter.insert("item2");

// Check if items exist
console.log(filter.contains("item1")); // true
console.log(filter.contains("item2")); // true
console.log(filter.contains("item3")); // false (or true with 1% probability)
```

### Count-Min Sketch

```typescript
import { CountMinSketch } from "sketch-wasm";

// Create a Count-Min Sketch with width=10000 and depth=5
const sketch = new CountMinSketch(10000, 5);

// Increment counters for items
sketch.increment("item1");
sketch.increment("item1");
sketch.increment("item2");

// Get frequency estimates
console.log(sketch.estimate("item1")); // ~2
console.log(sketch.estimate("item2")); // ~1
console.log(sketch.estimate("item3")); // 0

// Clear all counters
sketch.clear();
```

### HyperLogLog

```typescript
import { HyperLogLog } from "sketch-wasm";

// Create a HyperLogLog with precision=14 (2^14 = 16384 registers)
const hll = new HyperLogLog(14);

// Add items
hll.add("item1");
hll.add("item2");
hll.add("item1"); // Duplicates are automatically handled

// Get cardinality estimate
console.log(hll.count()); // ~2

// Merge two HyperLogLog instances
const hll2 = new HyperLogLog(14);
hll2.add("item3");
hll.merge(hll2);
console.log(hll.count()); // ~3
```

### Heavy Keeper (Approximate Top-K)

```typescript
import { HeavyKeeper } from "sketch-wasm";

// Create a Heavy Keeper with width=1000, depth=5, k=10, decay=0.9
const hk = new HeavyKeeper(1000, 5, 10, 0.9);

// Add items
for (let i = 0; i < 100; i++) {
  hk.add("frequent");
}
for (let i = 0; i < 50; i++) {
  hk.add("medium");
}
for (let i = 0; i < 10; i++) {
  hk.add("rare");
}

// Get top-k items
const topK = hk.top_k();
console.log(topK);
// [
//   { item: 'frequent', count: ~100 },
//   { item: 'medium', count: ~50 },
//   { item: 'rare', count: ~10 }
// ]

// Query specific item frequency
console.log(hk.query("frequent")); // ~100
```
