use wasm_bindgen::prelude::*;
use std::collections::{HashMap, BinaryHeap};
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;
use std::cmp::Reverse;

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

// Internal struct for min-heap operations
#[derive(Clone, Debug, PartialEq, Eq)]
struct HeapItem {
    item: String,
    count: u32,
}

impl PartialOrd for HeapItem {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for HeapItem {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // For min-heap: smaller counts come first
        self.count.cmp(&other.count)
            .then_with(|| self.item.cmp(&other.item)) // Tie-breaker for deterministic ordering
    }
}

#[wasm_bindgen]
pub struct HeavyKeeper {
    width: usize,
    depth: usize,
    k: usize,
    decay: f64,
    counters: Vec<Vec<(String, u32)>>,
    hash_seeds: Vec<u64>,
    // Min-heap to maintain top-k items efficiently
    top_k_heap: BinaryHeap<Reverse<HeapItem>>,
    // Track all seen items for accurate counting
    all_counts: HashMap<String, u32>,
}

#[wasm_bindgen]
impl HeavyKeeper {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, depth: usize, k: usize, decay: f64) -> Self {
        let mut counters = Vec::with_capacity(depth);
        let mut hash_seeds = Vec::with_capacity(depth);
        
        for i in 0..depth {
            let mut row = Vec::with_capacity(width);
            for _ in 0..width {
                row.push((String::new(), 0));
            }
            counters.push(row);
            hash_seeds.push(i as u64);
        }

        HeavyKeeper {
            width,
            depth,
            k,
            decay,
            counters,
            hash_seeds,
            top_k_heap: BinaryHeap::new(),
            all_counts: HashMap::new(),
        }
    }

    fn hash(&self, item: &str, seed: u64) -> usize {
        let mut hasher = DefaultHasher::new();
        item.hash(&mut hasher);
        seed.hash(&mut hasher);
        (hasher.finish() as usize) % self.width
    }

    fn update_top_k(&mut self, item: &str, count: u32) {
        // Update the aggregated count
        self.all_counts.insert(item.to_string(), count);
        
        // Check if item is already in heap
        let mut found_in_heap = false;
        let heap_items: Vec<_> = self.top_k_heap.drain().collect();
        
        for Reverse(heap_item) in heap_items {
            if heap_item.item == item {
                // Update existing item in heap
                self.top_k_heap.push(Reverse(HeapItem {
                    item: item.to_string(),
                    count,
                }));
                found_in_heap = true;
            } else {
                // Keep other items
                self.top_k_heap.push(Reverse(heap_item));
            }
        }
        
        if !found_in_heap {
            // New item - add to heap
            if self.top_k_heap.len() < self.k {
                self.top_k_heap.push(Reverse(HeapItem {
                    item: item.to_string(),
                    count,
                }));
            } else if let Some(Reverse(min_item)) = self.top_k_heap.peek() {
                if count > min_item.count {
                    self.top_k_heap.pop(); // Remove minimum
                    self.top_k_heap.push(Reverse(HeapItem {
                        item: item.to_string(),
                        count,
                    }));
                }
            }
        }
    }

    pub fn add(&mut self, item: &str) {
        for i in 0..self.depth {
            let pos = self.hash(item, self.hash_seeds[i]);
            let counter = &mut self.counters[i][pos];
            
            if counter.0.is_empty() {
                counter.0 = item.to_string();
                counter.1 = 1;
            } else if counter.0 == item {
                counter.1 += 1;
            } else {
                // Decay the counter with probability decay
                if js_sys::Math::random() < self.decay {
                    counter.1 = counter.1.saturating_sub(1);
                    if counter.1 == 0 {
                        counter.0 = item.to_string();
                        counter.1 = 1;
                    }
                }
            }
        }
        
        // Update top-k with current estimated count
        let estimated_count = self.query(item);
        if estimated_count > 0 {
            self.update_top_k(item, estimated_count);
        }
    }

    pub fn query(&self, item: &str) -> u32 {
        let mut min_count = u32::MAX;
        
        for i in 0..self.depth {
            let pos = self.hash(item, self.hash_seeds[i]);
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
        // For accuracy, we still need to aggregate all counts to handle hash collisions
        let mut counts = HashMap::with_capacity(self.width);
        
        // Aggregate counts across all hash functions
        for row in &self.counters {
            for (item, count) in row {
                if !item.is_empty() {
                    *counts.entry(item.clone()).or_insert(0) += count;
                }
            }
        }
        
        // Use min-heap for efficient top-k selection
        let mut heap = BinaryHeap::new();
        
        for (item, count) in counts {
            if heap.len() < self.k {
                heap.push(Reverse(HeapItem { item, count }));
            } else if let Some(Reverse(min_item)) = heap.peek() {
                if count > min_item.count {
                    heap.pop();
                    heap.push(Reverse(HeapItem { item, count }));
                }
            }
        }
        
        // Convert heap to sorted vector (largest first)
        let mut items: Vec<TopKItem> = heap.into_iter()
            .map(|Reverse(heap_item)| TopKItem::new(heap_item.item, heap_item.count))
            .collect();
        
        // Sort in descending order by count
        items.sort_unstable_by(|a, b| b.count.cmp(&a.count));
        
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

    #[test]
    fn test_min_heap_efficiency() {
        let mut hk = HeavyKeeper::new(100, 3, 5, 0.9);
        
        // Add many items with different frequencies
        for i in 0..20 {
            for _ in 0..(20 - i) {
                hk.add(&format!("item{}", i));
            }
        }
        
        let top = hk.top_k();
        assert_eq!(top.len(), 5);
        
        // Verify ordering
        for i in 1..top.len() {
            assert!(top[i-1].count >= top[i].count);
        }
        
        // The most frequent items should be at the top
        assert!(top[0].item == "item0" || top[0].count >= 15);
    }
} 