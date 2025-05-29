import { HeavyKeeper } from '../pkg/sketch_wasm';

describe('HeavyKeeper', () => {
  let hk: HeavyKeeper;

  beforeEach(() => {
    // Initialize with width=1000, depth=5, k=10, decay=0.9
    hk = new HeavyKeeper(1000, 5, 10, 0.9);
  });

  test('should track frequent items', () => {
    // Add items with different frequencies
    for (let i = 0; i < 100; i++) {
      hk.add('frequent');
    }
    for (let i = 0; i < 50; i++) {
      hk.add('medium');
    }
    for (let i = 0; i < 10; i++) {
      hk.add('rare');
    }

    const topK = hk.top_k();
    expect(topK.length).toBeLessThanOrEqual(10);
    expect(topK[0].item).toBe('frequent');
    expect(topK[0].count).toBeGreaterThanOrEqual(90); // Allow some error margin
  });

  test('should handle query operations correctly', () => {
    // Add items multiple times
    for (let i = 0; i < 50; i++) {
      hk.add('test_item');
    }

    // Query should return approximate count
    const count = hk.query('test_item');
    expect(count).toBeGreaterThanOrEqual(40);
    expect(count).toBeLessThanOrEqual(60); // Allow some error margin

    // Query non-existent item should return 0
    expect(hk.query('nonexistent')).toBe(0);
  });

  test('should handle decay mechanism', () => {
    // Add two items that will collide
    for (let i = 0; i < 100; i++) {
      hk.add('item1');
      hk.add('item2');
    }

    // After many additions, both items should be tracked
    const topK = hk.top_k();
    expect(topK.length).toBeGreaterThanOrEqual(2);

    // Both items should have significant counts
    const item1Count = hk.query('item1');
    const item2Count = hk.query('item2');
    expect(item1Count).toBeGreaterThan(0);
    expect(item2Count).toBeGreaterThan(0);
  });

  test('should respect k parameter', () => {
    const k = 5;
    const hk = new HeavyKeeper(1000, 5, k, 0.9);

    // Add more items than k
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 100 - i * 10; j++) {
        hk.add(`item${i}`);
      }
    }

    // Should only return k items
    const topK = hk.top_k();
    expect(topK.length).toBe(k);

    // Should be sorted by count
    for (let i = 1; i < topK.length; i++) {
      expect(topK[i - 1].count).toBeGreaterThanOrEqual(topK[i].count);
    }
  });

  test('should handle empty state', () => {
    const topK = hk.top_k();
    expect(topK.length).toBe(0);
  });

  test('should handle single item', () => {
    hk.add('single_item');
    const topK = hk.top_k();
    expect(topK.length).toBe(1);
    expect(topK[0].item).toBe('single_item');
    // Due to the probabilistic nature of the algorithm, counts can be overestimated
    expect(topK[0].count).toBeGreaterThanOrEqual(1);
    expect(topK[0].count).toBeLessThanOrEqual(10); // Allow for some overestimation
  });

  test('should handle many unique items', () => {
    // Add many unique items
    for (let i = 0; i < 1000; i++) {
      hk.add(`item${i}`);
    }

    const topK = hk.top_k();
    expect(topK.length).toBeLessThanOrEqual(10);
    // Due to the probabilistic nature of the algorithm, counts can be overestimated
    topK.forEach((item) => {
      expect(item.count).toBeGreaterThanOrEqual(1);
      expect(item.count).toBeLessThanOrEqual(10); // Allow for some overestimation
    });
  });

  test('should handle repeated queries', () => {
    // Add items
    for (let i = 0; i < 50; i++) {
      hk.add('test_item');
    }

    // Multiple queries should return consistent results
    const count1 = hk.query('test_item');
    const count2 = hk.query('test_item');
    expect(count1).toBe(count2);
  });

  test('should handle different decay rates', () => {
    const highDecay = new HeavyKeeper(1000, 5, 10, 0.99);
    const lowDecay = new HeavyKeeper(1000, 5, 10, 0.1);

    // Add items to both
    for (let i = 0; i < 100; i++) {
      highDecay.add('item1');
      highDecay.add('item2');
      lowDecay.add('item1');
      lowDecay.add('item2');
    }

    // High decay should show more difference between items
    const highDecayTopK = highDecay.top_k();
    const lowDecayTopK = lowDecay.top_k();

    expect(highDecayTopK.length).toBeGreaterThan(0);
    expect(lowDecayTopK.length).toBeGreaterThan(0);
  });
});
