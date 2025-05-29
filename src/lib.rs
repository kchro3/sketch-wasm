//! A high-performance WebAssembly implementation of probabilistic data structures.
//! This library provides efficient implementations of:
//! - Bloom Filters
//! - Count-Min Sketch
//! - HyperLogLog
//! - Heavy Keeper (Approximate Top-K)

use wasm_bindgen::prelude::*;

mod bloom;
mod hyperloglog;
mod count_min_sketch;
mod heavy_keeper;
// mod approx_top_k;

pub use bloom::BloomFilter;
pub use count_min_sketch::CountMinSketch;
pub use hyperloglog::HyperLogLog;
pub use heavy_keeper::HeavyKeeper;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Initialize the WebAssembly module.
/// This function should be called before using any of the data structures.
#[wasm_bindgen]
pub fn init() {
    log("Initializing sketch-wasm...");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
