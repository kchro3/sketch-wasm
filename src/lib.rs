use wasm_bindgen::prelude::*;

mod bloom;
// mod hyperloglog;
// mod count_min_sketch;
// mod approx_top_k;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

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
