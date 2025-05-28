# sketch-wasm

A high-performance WebAssembly implementation of probabilistic data structures for TypeScript/Node.js applications. This library provides efficient implementations of:

- Bloom Filters
- Count-Min Sketch

## Features

- **🚀 Blazing Fast**: Up to 34x faster insertions and 29x faster increments compared to pure JavaScript implementations
- Written in Rust and compiled to WebAssembly for maximum performance
- TypeScript bindings for easy integration
- Memory-efficient implementations
- Benchmarks comparing against popular JavaScript libraries

## Performance

Our WebAssembly implementation significantly outperforms pure JavaScript alternatives:

### Bloom Filter Performance

| Operation            | WASM    | JavaScript | Speedup          |
| -------------------- | ------- | ---------- | ---------------- |
| Insert (100k items)  | 14.50ms | 496.56ms   | **34.3x faster** |
| Lookup (15k queries) | 4.81ms  | 75.90ms    | **15.8x faster** |

### Count-Min Sketch Performance

| Operation              | WASM   | JavaScript | Speedup          |
| ---------------------- | ------ | ---------- | ---------------- |
| Increment (67k items)  | 7.93ms | 229.49ms   | **28.9x faster** |
| Estimate (10k queries) | 1.96ms | 45.38ms    | **23.2x faster** |

_Benchmarks run against the popular `bloom-filters` npm package with 1M expected items and 1% false positive rate for Bloom Filter, and width=10000, depth=5 for Count-Min Sketch._

## Installation
