import {
  calculateSensorStatus,
  calculateAverage,
  calculateMedian,
  calculateStandardDeviation,
  calculateChangeRate,
  calculateTrend,
  calculateHealthScore,
  detectOutliers
} from '../calculations';

describe('Calculation Utils', () => {
  describe('calculateSensorStatus', () => {
    const ranges = {
      min_normal: 20,
      max_normal: 30,
      min_warning: 15,
      max_warning: 35,
      min_critical: 10,
      max_critical: 40
    };

    test('returns normal status for values in normal range', () => {
      expect(calculateSensorStatus(25, ranges)).toBe('normal');
      expect(calculateSensorStatus(20, ranges)).toBe('normal');
      expect(calculateSensorStatus(30, ranges)).toBe('normal');
    });

    test('returns warning status for values in warning range', () => {
      expect(calculateSensorStatus(18, ranges)).toBe('warning');
      expect(calculateSensorStatus(33, ranges)).toBe('warning');
    });

    test('returns critical status for values outside warning range', () => {
      expect(calculateSensorStatus(12, ranges)).toBe('critical');
      expect(calculateSensorStatus(38, ranges)).toBe('critical');
    });
  });

  describe('calculateAverage', () => {
    test('calculates average correctly', () => {
      expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateAverage([10, 20, 30])).toBe(20);
    });

    test('returns 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0);
    });

    test('handles single value', () => {
      expect(calculateAverage([42])).toBe(42);
    });
  });

  describe('calculateMedian', () => {
    test('calculates median for odd number of values', () => {
      expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateMedian([5, 1, 3])).toBe(3);
    });

    test('calculates median for even number of values', () => {
      expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
      expect(calculateMedian([10, 20])).toBe(15);
    });

    test('returns 0 for empty array', () => {
      expect(calculateMedian([])).toBe(0);
    });
  });

  describe('calculateStandardDeviation', () => {
    test('calculates standard deviation correctly', () => {
      const result = calculateStandardDeviation([1, 2, 3, 4, 5]);
      expect(result).toBeCloseTo(1.58, 2);
    });

    test('returns 0 for single value or empty array', () => {
      expect(calculateStandardDeviation([])).toBe(0);
      expect(calculateStandardDeviation([5])).toBe(0);
    });

    test('handles identical values', () => {
      expect(calculateStandardDeviation([5, 5, 5, 5])).toBe(0);
    });
  });

  describe('calculateChangeRate', () => {
    test('calculates positive change rate', () => {
      expect(calculateChangeRate(110, 100)).toBe(10);
    });

    test('calculates negative change rate', () => {
      expect(calculateChangeRate(90, 100)).toBe(-10);
    });

    test('returns 0 when previous value is 0', () => {
      expect(calculateChangeRate(50, 0)).toBe(0);
    });

    test('handles no change', () => {
      expect(calculateChangeRate(100, 100)).toBe(0);
    });
  });

  describe('calculateTrend', () => {
    const createMockData = (values: number[]) => 
      values.map((value, index) => ({
        id: index,
        sensor_id: 'test',
        value,
        unit: 'test',
        status: 'normal' as const,
        timestamp: new Date().toISOString()
      }));

    test('detects upward trend', () => {
      const data = createMockData([1, 2, 3, 4, 5]);
      expect(calculateTrend(data)).toBe('up');
    });

    test('detects downward trend', () => {
      const data = createMockData([5, 4, 3, 2, 1]);
      expect(calculateTrend(data)).toBe('down');
    });

    test('detects stable trend', () => {
      const data = createMockData([3, 3, 3, 3, 3]);
      expect(calculateTrend(data)).toBe('stable');
    });

    test('returns stable for insufficient data', () => {
      const data = createMockData([5]);
      expect(calculateTrend(data)).toBe('stable');
    });
  });

  describe('calculateHealthScore', () => {
    test('calculates health score correctly', () => {
      expect(calculateHealthScore(8, 1, 1)).toBe(85); // (8*100 + 1*50 + 1*0) / 10
      expect(calculateHealthScore(10, 0, 0)).toBe(100);
      expect(calculateHealthScore(0, 0, 10)).toBe(0);
    });

    test('returns 100 for no data', () => {
      expect(calculateHealthScore(0, 0, 0)).toBe(100);
    });
  });

  describe('detectOutliers', () => {
    test('detects outliers using IQR method', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100]; // 100 is an outlier
      const outliers = detectOutliers(values);
      expect(outliers).toContain(100);
    });

    test('returns empty array for insufficient data', () => {
      expect(detectOutliers([1, 2, 3])).toEqual([]);
    });

    test('returns empty array when no outliers exist', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const outliers = detectOutliers(values);
      expect(outliers).toEqual([]);
    });
  });
});