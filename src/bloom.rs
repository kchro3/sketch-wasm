use wasm_bindgen::prelude::*;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

#[wasm_bindgen]
pub struct BloomFilter {
    bits: Vec<bool>,
    hash_count: usize,
}

#[wasm_bindgen]
impl BloomFilter {
    #[wasm_bindgen(constructor)]
    pub fn new(expected_items: usize, false_positive_rate: f64) -> BloomFilter {
        let size = Self::optimal_size(expected_items, false_positive_rate);
        let hash_count = Self::optimal_hash_count(size, expected_items);
        
        BloomFilter {
            bits: vec![false; size],
            hash_count,
        }
    }

    pub fn insert(&mut self, item: &str) {
        for i in 0..self.hash_count {
            let index = self.get_hash(item, i) % self.bits.len();
            self.bits[index] = true;
        }
    }

    pub fn contains(&self, item: &str) -> bool {
        for i in 0..self.hash_count {
            let index = self.get_hash(item, i) % self.bits.len();
            if !self.bits[index] {
                return false;
            }
        }
        true
    }

    fn get_hash(&self, item: &str, seed: usize) -> usize {
        let mut hasher = DefaultHasher::new();
        item.hash(&mut hasher);
        seed.hash(&mut hasher);
        hasher.finish() as usize
    }

    fn optimal_size(items: usize, false_positive_rate: f64) -> usize {
        let ln2 = std::f64::consts::LN_2;
        let size = -(items as f64 * false_positive_rate.ln()) / (ln2 * ln2);
        size.ceil() as usize
    }

    fn optimal_hash_count(size: usize, items: usize) -> usize {
        let ln2 = std::f64::consts::LN_2;
        let hash_count = (size as f64 / items as f64) * ln2;
        hash_count.ceil() as usize
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_optimal_size_calculation() {
        let size = BloomFilter::optimal_size(1000, 0.01);
        assert!(size > 0);
        assert!(size >= 1000); // Size should be at least as large as the number of items
    }

    #[test]
    fn test_optimal_hash_count_calculation() {
        let size = BloomFilter::optimal_size(1000, 0.01);
        let hash_count = BloomFilter::optimal_hash_count(size, 1000);
        assert!(hash_count > 0);
        assert!(hash_count <= 10); // Hash count should be reasonable
    }

    #[test]
    fn test_basic_insert_and_contains() {
        let mut filter = BloomFilter::new(100, 0.01);
        filter.insert("test");
        assert!(filter.contains("test"));
        assert!(!filter.contains("not_present"));
    }

    #[test]
    fn test_false_positive_rate() {
        let mut filter = BloomFilter::new(1000, 0.01);
        let mut inserted = HashSet::new();
        
        // Insert 1000 items
        for i in 0..1000 {
            let item = format!("item_{}", i);
            filter.insert(&item);
            inserted.insert(item);
        }

        // Test for false positives
        let mut false_positives = 0;
        let test_count = 10000;
        
        for i in 0..test_count {
            let item = format!("test_{}", i);
            if !inserted.contains(&item) && filter.contains(&item) {
                false_positives += 1;
            }
        }

        let false_positive_rate = false_positives as f64 / test_count as f64;
        assert!(false_positive_rate <= 0.02); // Allow for some margin above the target rate
    }

    #[test]
    fn test_empty_filter() {
        let filter = BloomFilter::new(100, 0.01);
        assert!(!filter.contains("any_item"));
    }

    #[test]
    fn test_multiple_inserts() {
        let mut filter = BloomFilter::new(100, 0.01);
        filter.insert("duplicate");
        filter.insert("duplicate");
        assert!(filter.contains("duplicate"));
    }

    #[test]
    fn test_edge_cases() {
        let mut filter = BloomFilter::new(100, 0.01);
        filter.insert("");
        assert!(filter.contains(""));
        
        filter.insert("very_long_string_that_might_cause_issues_with_hashing_and_should_be_handled_properly");
        assert!(filter.contains("very_long_string_that_might_cause_issues_with_hashing_and_should_be_handled_properly"));
    }
} 