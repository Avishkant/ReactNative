import numberToWords from '../src/utils/numberToWords';

describe('numberToWords (Indian)', () => {
  test('one lakh', () => {
    expect(numberToWords(100000, { system: 'indian' })).toBe('one lakh');
  });

  test('twenty five lakh', () => {
    expect(numberToWords(2500000, { system: 'indian' })).toBe(
      'twenty five lakh',
    );
  });

  test('one crore', () => {
    expect(numberToWords(10000000, { system: 'indian' })).toBe('one crore');
  });

  test('complex number', () => {
    expect(numberToWords(12345678, { system: 'indian' })).toBe(
      'one crore twenty three lakh forty five thousand six hundred seventy eight',
    );
  });
});
