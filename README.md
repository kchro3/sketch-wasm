# sketch-wasm

A high-performance WebAssembly implementation of probabilistic data structures for TypeScript/Node.js applications. This library provides efficient implementations of:

- Bloom Filters
- Count-Min Sketch
- HyperLogLog
- Heavy Keeper (Approximate Top-K)

## Features

- **🚀 Blazing Fast**: Up to 2,350x faster operations compared to pure JavaScript implementations
- Written in Rust and compiled to WebAssembly for maximum performance
- TypeScript bindings for easy integration
- Memory-efficient implementations
- Benchmarks comparing against popular JavaScript libraries

## Performance

Our WebAssembly implementation significantly outperforms pure JavaScript alternatives:

### Bloom Filter Performance

| Operation            | WASM    | JavaScript | Speedup          |
| -------------------- | ------- | ---------- | ---------------- |
| Insert (100k items)  | 14.58ms | 481.00ms   | **33.0x faster** |
| Lookup (15k queries) | 4.39ms  | 74.05ms    | **16.9x faster** |

### Count-Min Sketch Performance

| Operation              | WASM   | JavaScript | Speedup          |
| ---------------------- | ------ | ---------- | ---------------- |
| Increment (67k items)  | 8.02ms | 222.55ms   | **27.7x faster** |
| Estimate (10k queries) | 1.94ms | 44.18ms    | **22.8x faster** |

### HyperLogLog Performance

| Operation        | WASM   | JavaScript  | Speedup           |
| ---------------- | ------ | ----------- | ----------------- |
| Add (100k items) | 5.86ms | 13,772.33ms | **2,351x faster** |
| Count estimation | 0.32ms | 1.17ms      | **3.6x faster**   |

### Heavy Keeper Performance

| Operation        | WASM   | JavaScript | Speedup         |
| ---------------- | ------ | ---------- | --------------- |
| Add (100k items) | 6.50ms | 9.31ms     | **1.4x faster** |
| Top-K query      | 0.91ms | 0.55ms     | _0.6x slower_   |

_Benchmarks run against the popular `bloom-filters` npm package with 1M expected items and 1% false positive rate for Bloom Filter, width=10000/depth=5 for Count-Min Sketch, precision=14 for HyperLogLog, and width=1000/depth=5/k=10 for Heavy Keeper._

## Installation
