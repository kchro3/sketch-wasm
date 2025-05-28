use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct HyperLogLog {
    registers: Vec<u8>,
    m: usize,
    p: u8,
    alpha: f64,
}

#[wasm_bindgen]
impl HyperLogLog {
    #[wasm_bindgen(constructor)]
    pub fn new(precision: Option<u8>) -> Result<HyperLogLog, JsValue> {
        let p = precision.unwrap_or(14);
        
        if p < 4 || p > 16 {
            return Err(JsValue::from_str("Precision must be between 4 and 16"));
        }
        
        let m = 1usize << p; // 2^p
        let registers = vec![0u8; m];
        
        // Calculate alpha constant based on m
        let alpha = match m {
            16 => 0.673,
            32 => 0.697,
            64 => 0.709,
            _ => 0.7213 / (1.0 + 1.079 / (m as f64)),
        };
        
        Ok(HyperLogLog {
            registers,
            m,
            p,
            alpha,
        })
    }
    
    fn hash(&self, value: &str) -> u32 {
        // MurmurHash3 32-bit implementation
        let mut h1 = 0xdeadbeef_u32;
        let c1 = 0xcc9e2d51_u32;
        let c2 = 0x1b873593_u32;
        
        for byte in value.bytes() {
            let mut k1 = byte as u32;
            k1 = k1.wrapping_mul(c1);
            k1 = (k1 << 15) | (k1 >> 17);
            k1 = k1.wrapping_mul(c2);
            
            h1 ^= k1;
            h1 = (h1 << 13) | (h1 >> 19);
            h1 = h1.wrapping_mul(5).wrapping_add(0xe6546b64);
        }
        
        h1 ^= value.len() as u32;
        h1 ^= h1 >> 16;
        h1 = h1.wrapping_mul(0x85ebca6b);
        h1 ^= h1 >> 13;
        h1 = h1.wrapping_mul(0xc2b2ae35);
        h1 ^= h1 >> 16;
        
        h1
    }
    
    pub fn add(&mut self, value: &str) {
        let hash = self.hash(value);
        let index = (hash & ((self.m - 1) as u32)) as usize; // Get first p bits
        let w = hash >> self.p; // Get remaining bits
        
        let leading_zeros = if w == 0 {
            32 - self.p + 1
        } else {
            (w << self.p).leading_zeros() as u8 + 1
        };
        
        self.registers[index] = self.registers[index].max(leading_zeros);
    }
    
    pub fn count(&self) -> f64 {
        // Calculate raw estimate
        let sum: f64 = self.registers
            .iter()
            .map(|&val| 2.0_f64.powf(-(val as f64)))
            .sum();
        
        let mut estimate = (self.alpha * (self.m as f64) * (self.m as f64)) / sum;
        
        // Apply small range correction
        if estimate <= 2.5 * (self.m as f64) {
            let zeros = self.registers.iter().filter(|&&x| x == 0).count();
            if zeros != 0 {
                estimate = (self.m as f64) * ((self.m as f64) / (zeros as f64)).ln();
            }
        }
        
        // Apply large range correction
        let large_threshold = 2.0_f64.powf(32.0) / 30.0;
        if estimate > large_threshold {
            estimate = -2.0_f64.powf(32.0) * (1.0 - estimate / 2.0_f64.powf(32.0)).ln();
        }
        
        // Ensure we don't return NaN or Infinity
        if !estimate.is_finite() || estimate <= 0.0 {
            return 0.0;
        }
        
        // Round to nearest integer for consistency
        estimate.round()
    }
    
    pub fn merge(&mut self, other: &HyperLogLog) -> Result<(), JsValue> {
        if self.m != other.m {
            return Err(JsValue::from_str("Cannot merge HyperLogLog instances with different precision"));
        }
        
        for i in 0..self.m {
            self.registers[i] = self.registers[i].max(other.registers[i]);
        }
        
        Ok(())
    }
    
    pub fn clear(&mut self) {
        self.registers.fill(0);
    }
}
