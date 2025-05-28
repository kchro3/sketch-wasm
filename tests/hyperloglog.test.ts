import { HyperLogLog } from "../pkg";
// import { HyperLogLog } from "../src/hyperloglog";

describe("HyperLogLog", () => {
  test("constructor should throw error for invalid precision", () => {
    expect(() => new HyperLogLog(3)).toThrow();
    expect(() => new HyperLogLog(17)).toThrow();
  });

  test("should maintain correct count for small sets", () => {
    const hll = new HyperLogLog(14);
    const items = ["a", "b", "c", "d", "e"];

    items.forEach((item) => hll.add(item));
    const estimate = hll.count();

    // For small sets, error should be relatively small
    expect(Math.abs(estimate - items.length) / items.length).toBeLessThan(0.2);
  });

  test("should handle duplicate items correctly", () => {
    const hll = new HyperLogLog(14);
    const item = "test";

    // Add the same item multiple times
    for (let i = 0; i < 100; i++) {
      hll.add(item);
    }

    const estimate = hll.count();
    expect(estimate).toBeCloseTo(1, 0);
  });

  test("should merge two HyperLogLog instances correctly", () => {
    const hll1 = new HyperLogLog(14);
    const hll2 = new HyperLogLog(14);

    // Add different items to each instance
    for (let i = 0; i < 1000; i++) {
      hll1.add(`item1-${i}`);
      hll2.add(`item2-${i}`);
    }

    const estimate1 = hll1.count();
    const estimate2 = hll2.count();

    // Merge hll2 into hll1
    hll1.merge(hll2);
    const mergedEstimate = hll1.count();

    // The merged estimate should be close to the sum of individual estimates
    // Allow for 5% error in merged estimate
    const expectedSum = estimate1 + estimate2;
    const error = Math.abs(mergedEstimate - expectedSum) / expectedSum;
    expect(error).toBeLessThan(0.05);
  });

  test("should throw error when merging with different precision", () => {
    const hll1 = new HyperLogLog(14);
    const hll2 = new HyperLogLog(15);

    expect(() => hll1.merge(hll2)).toThrow();
  });

  test("should clear registers correctly", () => {
    const hll = new HyperLogLog(14);

    // Add some items
    for (let i = 0; i < 1000; i++) {
      hll.add(`item-${i}`);
    }

    // Clear and verify count is close to 0
    hll.clear();
    expect(hll.count()).toBe(0);
  });

  test("should handle large sets with reasonable accuracy", () => {
    const hll = new HyperLogLog(14);
    const size = 100000;

    // Add a large number of unique items
    for (let i = 0; i < size; i++) {
      hll.add(`unique-item-${i}`);
    }

    const estimate = hll.count();
    const error = Math.abs(estimate - size) / size;

    // Error should be less than 5% for large sets
    expect(error).toBeLessThan(0.05);
  });

  test("should maintain consistent estimates for same input", () => {
    const hll = new HyperLogLog(14);
    const items = Array.from({ length: 1000 }, (_, i) => `item-${i}`);

    // Add items twice
    items.forEach((item) => hll.add(item));
    const estimate1 = hll.count();

    hll.clear();
    items.forEach((item) => hll.add(item));
    const estimate2 = hll.count();

    // Estimates should be very close (within 5%)
    const relativeError =
      Math.abs(estimate1 - estimate2) / Math.max(estimate1, estimate2);
    expect(relativeError).toBeLessThan(0.05);
  });

  test("should handle empty set correctly", () => {
    const hll = new HyperLogLog(14);
    expect(hll.count()).toBe(0);
  });

  test("should handle single item correctly", () => {
    const hll = new HyperLogLog(14);
    hll.add("test");
    expect(hll.count()).toBe(1);
  });
});
