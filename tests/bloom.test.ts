import { BloomFilter } from "../pkg";

describe("BloomFilter WebAssembly Bindings", () => {
  test("should create a new BloomFilter with correct parameters", () => {
    const filter = new BloomFilter(1000, 0.01);
    expect(filter).toBeDefined();
  });

  test("should insert and check items correctly", () => {
    const filter = new BloomFilter(100, 0.01);
    filter.insert("test");
    expect(filter.contains("test")).toBe(true);
    expect(filter.contains("not_present")).toBe(false);
  });

  test("should handle empty strings", () => {
    const filter = new BloomFilter(100, 0.01);
    filter.insert("");
    expect(filter.contains("")).toBe(true);
  });

  test("should handle duplicate inserts", () => {
    const filter = new BloomFilter(100, 0.01);
    filter.insert("duplicate");
    filter.insert("duplicate");
    expect(filter.contains("duplicate")).toBe(true);
  });

  test("should maintain false positive rate within bounds", () => {
    const filter = new BloomFilter(1000, 0.01);
    const inserted = new Set<string>();

    // Insert 1000 items
    for (let i = 0; i < 1000; i++) {
      const item = `item_${i}`;
      filter.insert(item);
      inserted.add(item);
    }

    // Test for false positives
    let falsePositives = 0;
    const testCount = 10000;

    for (let i = 0; i < testCount; i++) {
      const item = `test_${i}`;
      if (!inserted.has(item) && filter.contains(item)) {
        falsePositives++;
      }
    }

    const falsePositiveRate = falsePositives / testCount;
    expect(falsePositiveRate).toBeLessThanOrEqual(0.02); // Allow for some margin above the target rate
  });

  test("should handle large strings", () => {
    const filter = new BloomFilter(100, 0.01);
    const longString =
      "very_long_string_that_might_cause_issues_with_hashing_and_should_be_handled_properly";
    filter.insert(longString);
    expect(filter.contains(longString)).toBe(true);
  });

  test("should handle special characters", () => {
    const filter = new BloomFilter(100, 0.01);
    const specialString = "!@#$%^&*()_+{}|:\"<>?~`-=[]\\;',./";
    filter.insert(specialString);
    expect(filter.contains(specialString)).toBe(true);
  });

  test("should handle unicode characters", () => {
    const filter = new BloomFilter(100, 0.01);
    const unicodeString = "你好，世界！🌍";
    filter.insert(unicodeString);
    expect(filter.contains(unicodeString)).toBe(true);
  });
});
