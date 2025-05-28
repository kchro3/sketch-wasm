# sketch-wasm

A high-performance WebAssembly implementation of probabilistic data structures for TypeScript/Node.js applications. This library provides efficient implementations of:

- Bloom Filters
- HyperLogLog
- Count-Min Sketch
- Approximate Top-K

## Features

- **🚀 Blazing Fast**: Up to 33x faster insertions and 15x faster lookups compared to pure JavaScript implementations
- Written in Rust and compiled to WebAssembly for maximum performance
- TypeScript bindings for easy integration
- Memory-efficient implementations
- Benchmarks comparing against popular JavaScript libraries
- Functional programming style inspired by Algebird

## Performance

Our WebAssembly implementation significantly outperforms pure JavaScript alternatives:

| Operation            | WASM    | JavaScript | Speedup          |
| -------------------- | ------- | ---------- | ---------------- |
| Insert (100k items)  | 14.46ms | 484.88ms   | **33.5x faster** |
| Lookup (15k queries) | 4.90ms  | 74.80ms    | **15.3x faster** |

_Benchmarks run against the popular `bloom-filters` npm package with 1M expected items and 1% false positive rate._

## Installation
