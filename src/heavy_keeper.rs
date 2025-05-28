use wasm_bindgen::prelude::*;
use std::collections::HashMap;

#[wasm_bindgen]
pub struct TopKItem {
    item: String,
    count: u32,
}

#[wasm_bindgen]
impl TopKItem {
    #[wasm_bindgen(constructor)]
    pub fn new(item: String, count: u32) -> Self {
        TopKItem { item, count }
    }

    #[wasm_bindgen(getter)]
    pub fn item(&self) -> String {
        self.item.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn count(&self) -> u32 {
        self.count
    }
}

#[wasm_bindgen]
pub struct HeavyKeeper {
    width: usize,
    depth: usize,
    k: usize,
    decay: f64,
    counters: Vec<Vec<(String, u32)>>,
}

#[wasm_bindgen]
impl HeavyKeeper {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, depth: usize, k: usize, decay: f64) -> Self {
        let mut counters = Vec::with_capacity(depth);
        for _ in 0..depth {
            let mut row = Vec::with_capacity(width);
            for _ in 0..width {
                row.push((String::new(), 0));
            }
            counters.push(row);
        }

        HeavyKeeper {
            width,
            depth,
            k,
            decay,
            counters,
        }
    }

    fn hash(&self, item: &str, seed: u64) -> usize {
        let mut hash: u64 = seed;
        for &byte in item.as_bytes() {
            hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
        }
        (hash % self.width as u64) as usize
    }

    pub fn add(&mut self, item: &str) {
        for i in 0..self.depth {
            let pos = self.hash(item, i as u64);
            let counter = &mut self.counters[i][pos];
            
            if counter.0.is_empty() {
                counter.0 = item.to_string();
                counter.1 = 1;
            } else if counter.0 == item {
                counter.1 += 1;
            } else {
                // Decay the counter with probability decay
                if js_sys::Math::random() < self.decay {
                    counter.1 -= 1;
                    if counter.1 == 0 {
                        counter.0 = item.to_string();
                        counter.1 = 1;
                    }
                }
            }
        }
    }

    pub fn query(&self, item: &str) -> u32 {
        let mut min_count = u32::MAX;
        
        for i in 0..self.depth {
            let pos = self.hash(item, i as u64);
            let counter = &self.counters[i][pos];
            
            if counter.0 == item {
                min_count = min_count.min(counter.1);
            }
        }
        
        if min_count == u32::MAX {
            0
        } else {
            min_count
        }
    }

    pub fn top_k(&self) -> Vec<TopKItem> {
        let mut counts = HashMap::new();
        
        // Aggregate counts across all hash functions
        for row in &self.counters {
            for (item, count) in row {
                if !item.is_empty() {
                    *counts.entry(item.clone()).or_insert(0) += count;
                }
            }
        }
        
        // Convert to vector and sort by count
        let mut items: Vec<TopKItem> = counts.into_iter()
            .map(|(item, count)| TopKItem::new(item, count))
            .collect();
        items.sort_by(|a, b| b.count.cmp(&a.count));
        
        // Return top k items
        items.truncate(self.k);
        items
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_functionality() {
        let mut hk = HeavyKeeper::new(1000, 5, 3, 0.9);
        
        // Add some items
        for _ in 0..100 {
            hk.add("frequent");
        }
        for _ in 0..50 {
            hk.add("medium");
        }
        for _ in 0..10 {
            hk.add("rare");
        }
        
        let top = hk.top_k();
        assert!(top.len() <= 3);
        assert!(top[0].item == "frequent");
        assert!(top[0].count >= 90); // Should have high count
    }

    #[test]
    fn test_query_functionality() {
        let mut hk = HeavyKeeper::new(1000, 5, 3, 0.9);
        
        // Add items multiple times
        for _ in 0..50 {
            hk.add("test_item");
        }
        
        // Query should return approximate count
        let count = hk.query("test_item");
        assert!(count >= 40 && count <= 60); // Allow some error margin
        
        // Query non-existent item should return 0
        assert_eq!(hk.query("nonexistent"), 0);
    }

    #[test]
    fn test_decay_mechanism() {
        let mut hk = HeavyKeeper::new(1000, 5, 3, 0.9);
        
        // Add two items that will collide
        for _ in 0..100 {
            hk.add("item1");
            hk.add("item2");
        }
        
        // After many additions, both items should be tracked
        let top = hk.top_k();
        assert!(top.len() >= 2);
        
        // Both items should have significant counts
        let item1_count = hk.query("item1");
        let item2_count = hk.query("item2");
        assert!(item1_count > 0);
        assert!(item2_count > 0);
    }

    #[test]
    fn test_capacity_limits() {
        let k = 5;
        let mut hk = HeavyKeeper::new(1000, 5, k, 0.9);
        
        // Add more items than k
        for i in 0..10 {
            for _ in 0..(100 - i * 10) {
                hk.add(&format!("item{}", i));
            }
        }
        
        // Should only return k items
        let top = hk.top_k();
        assert_eq!(top.len(), k);
        
        // Should be sorted by count
        for i in 1..top.len() {
            assert!(top[i-1].count >= top[i].count);
        }
    }
} 