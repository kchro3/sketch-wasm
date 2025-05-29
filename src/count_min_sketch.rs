use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use wasm_bindgen::prelude::*;

/// A probabilistic data structure for counting the frequency of events in a data stream.
/// It uses a small amount of memory while providing approximate frequency estimates.
#[wasm_bindgen]
#[derive(Debug)]
pub struct CountMinSketch {
  width: usize,
  depth: usize,
  counters: Vec<Vec<u32>>,
  hash_seeds: Vec<u64>,
}

#[wasm_bindgen]
impl CountMinSketch {
  /// Creates a new Count-Min Sketch with the specified width and depth.
  ///
  /// # Arguments
  ///
  /// * `width` - The number of counters in each row
  /// * `depth` - The number of hash functions (rows)
  #[wasm_bindgen(constructor)]
  pub fn new(width: usize, depth: usize) -> CountMinSketch {
    let mut hash_seeds = Vec::with_capacity(depth);
    for i in 0..depth {
      hash_seeds.push(i as u64);
    }

    let counters = vec![vec![0; width]; depth];

    CountMinSketch { width, depth, counters, hash_seeds }
  }

  fn hash(&self, item: &str, seed: u64) -> usize {
    let mut hasher = DefaultHasher::new();
    item.hash(&mut hasher);
    seed.hash(&mut hasher);
    (hasher.finish() as usize) % self.width
  }

  /// Increments the count for an item.
  ///
  /// # Arguments
  ///
  /// * `item` - The item to increment
  #[wasm_bindgen]
  pub fn increment(&mut self, item: &str) {
    for i in 0..self.depth {
      let pos = self.hash(item, self.hash_seeds[i]);
      self.counters[i][pos] = self.counters[i][pos].saturating_add(1);
    }
  }

  /// Returns the estimated frequency of an item.
  ///
  /// # Arguments
  ///
  /// * `item` - The item to query
  #[wasm_bindgen]
  pub fn estimate(&self, item: &str) -> u32 {
    let mut min_count = u32::MAX;
    for i in 0..self.depth {
      let pos = self.hash(item, self.hash_seeds[i]);
      min_count = min_count.min(self.counters[i][pos]);
    }
    min_count
  }

  /// Clears all counters in the sketch.
  #[wasm_bindgen]
  pub fn clear(&mut self) {
    for row in &mut self.counters {
      for count in row {
        *count = 0;
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_count_min_sketch() {
    let mut cms = CountMinSketch::new(1000, 5);

    // Test increment and estimate
    cms.increment("test");
    cms.increment("test");
    assert_eq!(cms.estimate("test"), 2);

    // Test different items
    cms.increment("other");
    assert_eq!(cms.estimate("other"), 1);

    // Test clear
    cms.clear();
    assert_eq!(cms.estimate("test"), 0);
  }
}
