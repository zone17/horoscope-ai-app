import {
  ARCHIVE_START_DATE,
  getArchiveDateRange,
  isValidArchiveDate,
  formatArchiveDate,
} from '../../src/utils/daily-archive';

describe('daily-archive utilities', () => {
  describe('ARCHIVE_START_DATE', () => {
    it('should be 2026-04-01', () => {
      expect(ARCHIVE_START_DATE).toBe('2026-04-01');
    });
  });

  describe('getArchiveDateRange', () => {
    it('returns an array of date strings', () => {
      const dates = getArchiveDateRange(5);
      expect(Array.isArray(dates)).toBe(true);
      dates.forEach((d) => {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('returns dates in reverse chronological order', () => {
      const dates = getArchiveDateRange(10);
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1] > dates[i]).toBe(true);
      }
    });

    it('does not include dates before ARCHIVE_START_DATE', () => {
      const dates = getArchiveDateRange(9999);
      dates.forEach((d) => {
        expect(d >= ARCHIVE_START_DATE).toBe(true);
      });
    });

    it('returns empty array when days is 0', () => {
      expect(getArchiveDateRange(0)).toEqual([]);
    });
  });

  describe('isValidArchiveDate', () => {
    it('rejects invalid format', () => {
      expect(isValidArchiveDate('April 3, 2026')).toBe(false);
      expect(isValidArchiveDate('2026/04/03')).toBe(false);
      expect(isValidArchiveDate('20260403')).toBe(false);
      expect(isValidArchiveDate('')).toBe(false);
    });

    it('rejects dates before archive start', () => {
      expect(isValidArchiveDate('2026-03-31')).toBe(false);
      expect(isValidArchiveDate('2025-01-01')).toBe(false);
    });

    it('rejects future dates', () => {
      // A date far in the future
      expect(isValidArchiveDate('2099-01-01')).toBe(false);
    });

    it('rejects impossible calendar dates', () => {
      expect(isValidArchiveDate('2026-02-30')).toBe(false);
      expect(isValidArchiveDate('2026-13-01')).toBe(false);
      expect(isValidArchiveDate('2026-00-01')).toBe(false);
    });

    it('accepts valid archive dates', () => {
      expect(isValidArchiveDate('2026-04-01')).toBe(true);
    });
  });

  describe('formatArchiveDate', () => {
    it('formats YYYY-MM-DD to human-readable', () => {
      expect(formatArchiveDate('2026-04-03')).toBe('April 3, 2026');
      expect(formatArchiveDate('2026-12-25')).toBe('December 25, 2026');
      expect(formatArchiveDate('2026-01-01')).toBe('January 1, 2026');
    });
  });
});
