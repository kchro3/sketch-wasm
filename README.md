# sketch-wasm

A high-performance WebAssembly implementation of probabilistic data structures for TypeScript/Node.js applications. This library provides efficient implementations of:

- Bloom Filters
- Count-Min Sketch
- HyperLogLog

## Features

- **🚀 Blazing Fast**: Up to 2,447x faster operations compared to pure JavaScript implementations
- Written in Rust and compiled to WebAssembly for maximum performance
- TypeScript bindings for easy integration
- Memory-efficient implementations
- Benchmarks comparing against popular JavaScript libraries

## Performance

Our WebAssembly implementation significantly outperforms pure JavaScript alternatives:

### Bloom Filter Performance

| Operation            | WASM    | JavaScript | Speedup          |
| -------------------- | ------- | ---------- | ---------------- |
| Insert (100k items)  | 14.60ms | 480.94ms   | **32.9x faster** |
| Lookup (15k queries) | 4.63ms  | 75.04ms    | **16.2x faster** |

### Count-Min Sketch Performance

| Operation              | WASM   | JavaScript | Speedup          |
| ---------------------- | ------ | ---------- | ---------------- |
| Increment (67k items)  | 8.28ms | 226.23ms   | **27.3x faster** |
| Estimate (10k queries) | 1.96ms | 44.57ms    | **22.8x faster** |

### HyperLogLog Performance

| Operation        | WASM   | JavaScript  | Speedup           |
| ---------------- | ------ | ----------- | ----------------- |
| Add (100k items) | 5.80ms | 14,200.89ms | **2,447x faster** |
| Count estimation | 0.25ms | 1.06ms      | **4.3x faster**   |

_Benchmarks run against the popular `bloom-filters` npm package with 1M expected items and 1% false positive rate for Bloom Filter, width=10000/depth=5 for Count-Min Sketch, and precision=14 for HyperLogLog._

## Installation
