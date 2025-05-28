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
