import { describe, expect, it } from 'vitest';
import { formatMoney } from './format';

describe('formatMoney', () => {
  it('formats naira by default', () => {
    expect(formatMoney(1500)).toBe('₦1,500.00');
  });

  it('uses the symbol for known currencies and the code otherwise', () => {
    expect(formatMoney(10, 'USD')).toBe('$10.00');
    expect(formatMoney(10, 'JPY')).toBe('JPY10.00');
  });

  it('shows zero but treats missing amounts as a dash', () => {
    expect(formatMoney(0)).toBe('₦0.00');
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney('')).toBe('—');
  });
});
