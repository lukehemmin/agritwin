import {
  formatNumber,
  formatLargeNumber,
  formatDateTime,
  formatRelativeTime,
  formatSensorValue,
  formatPercentage,
  formatRange,
  hexToRgb,
  hexToRgba,
  truncateText
} from '../formatters';

describe('Formatter Utils', () => {
  describe('formatNumber', () => {
    test('formats number with default decimals', () => {
      expect(formatNumber(25.456)).toBe('25.5');
      expect(formatNumber(10)).toBe('10.0');
    });

    test('formats number with custom decimals', () => {
      expect(formatNumber(25.456, 2)).toBe('25.46');
      expect(formatNumber(25.456, 0)).toBe('25');
    });
  });

  describe('formatLargeNumber', () => {
    test('formats large numbers with K suffix', () => {
      expect(formatLargeNumber(1500)).toBe('1.5K');
      expect(formatLargeNumber(1000)).toBe('1.0K');
    });

    test('formats very large numbers with M suffix', () => {
      expect(formatLargeNumber(1500000)).toBe('1.5M');
      expect(formatLargeNumber(1000000)).toBe('1.0M');
    });

    test('formats small numbers without suffix', () => {
      expect(formatLargeNumber(999)).toBe('999');
      expect(formatLargeNumber(500)).toBe('500');
    });
  });

  describe('formatDateTime', () => {
    test('formats date object correctly', () => {
      const date = new Date('2024-01-15T10:30:45');
      const result = formatDateTime(date);
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/01/);
      expect(result).toMatch(/15/);
    });

    test('formats date string correctly', () => {
      const dateString = '2024-01-15T10:30:45Z';
      const result = formatDateTime(dateString);
      expect(result).toMatch(/2024/);
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date();
    
    test('formats recent time as "방금 전"', () => {
      const recent = new Date(now.getTime() - 30000); // 30 seconds ago
      expect(formatRelativeTime(recent)).toBe('방금 전');
    });

    test('formats minutes ago', () => {
      const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      expect(formatRelativeTime(minutesAgo)).toBe('5분 전');
    });

    test('formats hours ago', () => {
      const hoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      expect(formatRelativeTime(hoursAgo)).toBe('2시간 전');
    });

    test('formats days ago', () => {
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      expect(formatRelativeTime(daysAgo)).toBe('3일 전');
    });
  });

  describe('formatSensorValue', () => {
    test('formats sensor value with unit', () => {
      expect(formatSensorValue(25.456, '°C')).toBe('25.5°C');
      expect(formatSensorValue(65.2, '%', 0)).toBe('65%');
    });
  });

  describe('formatPercentage', () => {
    test('formats percentage correctly', () => {
      expect(formatPercentage(85.567)).toBe('85.6%');
      expect(formatPercentage(100, 0)).toBe('100%');
    });
  });

  describe('formatRange', () => {
    test('formats range correctly', () => {
      expect(formatRange(20, 30, '°C')).toBe('20.0 - 30.0°C');
      expect(formatRange(10.5, 15.8, '%')).toBe('10.5 - 15.8%');
    });
  });

  describe('hexToRgb', () => {
    test('converts hex to RGB object', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    });

    test('handles hex without hash', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('returns null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#GGGGGG')).toBeNull();
    });
  });

  describe('hexToRgba', () => {
    test('converts hex to RGBA string', () => {
      expect(hexToRgba('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
      expect(hexToRgba('#00FF00', 1)).toBe('rgba(0, 255, 0, 1)');
    });

    test('returns original hex for invalid input', () => {
      expect(hexToRgba('invalid', 0.5)).toBe('invalid');
    });
  });

  describe('truncateText', () => {
    test('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very lo...');
    });

    test('returns original text if within limit', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    test('handles exact length', () => {
      const exactText = 'Exactly twenty!!'; // 16 chars
      expect(truncateText(exactText, 16)).toBe('Exactly twenty!!');
    });
  });
});