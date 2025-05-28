import { CountMinSketch } from "../pkg";

describe("CountMinSketch WebAssembly Bindings", () => {
  test("should create a new CountMinSketch with correct parameters", () => {
    const cms = new CountMinSketch(1000, 5);
    expect(cms).toBeDefined();
  });

  test("should increment and estimate counts correctly", () => {
    const cms = new CountMinSketch(1000, 5);
    cms.increment("test");
    cms.increment("test");
    expect(cms.estimate("test")).toBe(2);
    expect(cms.estimate("not_present")).toBe(0);
  });

  test("should handle empty strings", () => {
    const cms = new CountMinSketch(1000, 5);
    cms.increment("");
    expect(cms.estimate("")).toBe(1);
  });

  test("should handle multiple increments of the same item", () => {
    const cms = new CountMinSketch(1000, 5);
    for (let i = 0; i < 100; i++) {
      cms.increment("frequent");
    }
    expect(cms.estimate("frequent")).toBe(100);
  });

  test("should maintain accuracy within bounds for known frequencies", () => {
    const cms = new CountMinSketch(10000, 5);
    const frequencies = new Map<string, number>();

    // Insert items with known frequencies
    for (let i = 0; i < 1000; i++) {
      const item = `item_${i}`;
      const frequency = Math.floor(Math.random() * 100) + 1;
      frequencies.set(item, frequency);

      for (let j = 0; j < frequency; j++) {
        cms.increment(item);
      }
    }

    // Check estimates
    let totalError = 0;
    let maxError = 0;
    frequencies.forEach((expected, item) => {
      const estimated = cms.estimate(item);
      const error = Math.abs(estimated - expected);
      totalError += error;
      maxError = Math.max(maxError, error);
    });

    const averageError = totalError / frequencies.size;
    expect(averageError).toBeLessThanOrEqual(5); // Average error should be small
    expect(maxError).toBeLessThanOrEqual(20); // Maximum error should be bounded
  });

  test("should handle large strings", () => {
    const cms = new CountMinSketch(1000, 5);
    const longString =
      "very_long_string_that_might_cause_issues_with_hashing_and_should_be_handled_properly";
    cms.increment(longString);
    expect(cms.estimate(longString)).toBe(1);
  });

  test("should handle special characters", () => {
    const cms = new CountMinSketch(1000, 5);
    const specialString = "!@#$%^&*()_+{}|:\"<>?~`-=[]\\;',./";
    cms.increment(specialString);
    expect(cms.estimate(specialString)).toBe(1);
  });

  test("should handle unicode characters", () => {
    const cms = new CountMinSketch(1000, 5);
    const unicodeString = "你好，世界！🌍";
    cms.increment(unicodeString);
    expect(cms.estimate(unicodeString)).toBe(1);
  });

  test("should handle clear operation", () => {
    const cms = new CountMinSketch(1000, 5);
    cms.increment("test");
    cms.increment("test");
    expect(cms.estimate("test")).toBe(2);
    cms.clear();
    expect(cms.estimate("test")).toBe(0);
  });

  test("should handle multiple items with different frequencies", () => {
    const cms = new CountMinSketch(1000, 5);
    const items = ["rare", "common", "very_common"];
    const frequencies = [1, 10, 100];

    items.forEach((item, i) => {
      for (let j = 0; j < frequencies[i]; j++) {
        cms.increment(item);
      }
    });

    items.forEach((item, i) => {
      const estimated = cms.estimate(item);
      expect(estimated).toBeGreaterThanOrEqual(frequencies[i]); // Should never underestimate
      expect(estimated).toBeLessThanOrEqual(frequencies[i] * 1.5); // Should not overestimate too much
    });
  });

  test("should handle hash collisions gracefully", () => {
    const cms = new CountMinSketch(100, 5); // Small width to force collisions
    const items = Array.from({ length: 1000 }, (_, i) => `item_${i}`);

    // Insert all items once
    items.forEach((item) => cms.increment(item));

    // Check that estimates are at least 1 (never underestimate)
    items.forEach((item) => {
      expect(cms.estimate(item)).toBeGreaterThanOrEqual(1);
    });
  });

  test("should maintain relative frequency relationships", () => {
    const cms = new CountMinSketch(1000, 5);
    const items = ["A", "B", "C"];
    const frequencies = [10, 20, 30];

    items.forEach((item, i) => {
      for (let j = 0; j < frequencies[i]; j++) {
        cms.increment(item);
      }
    });

    // Check that relative frequencies are maintained
    const estimates = items.map((item) => cms.estimate(item));
    expect(estimates[1]).toBeGreaterThan(estimates[0]); // B > A
    expect(estimates[2]).toBeGreaterThan(estimates[1]); // C > B
  });
});
