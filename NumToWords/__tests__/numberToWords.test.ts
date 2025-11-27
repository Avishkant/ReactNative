import numberToWords from '../src/utils/numberToWords';

describe('numberToWords', () => {
  test('zero', () => {
    expect(numberToWords(0)).toBe('zero');
  });

  test('single digits', () => {
    expect(numberToWords(5)).toBe('five');
    expect(numberToWords('9')).toBe('nine');
  });

  test('teens and tens', () => {
    expect(numberToWords(13)).toBe('thirteen');
    expect(numberToWords(25)).toBe('twenty five');
    expect(numberToWords(80)).toBe('eighty');
  });

  test('hundreds and thousands', () => {
    expect(numberToWords(105)).toBe('one hundred five');
    expect(numberToWords(1000)).toBe('one thousand');
    expect(numberToWords(56945781)).toBe(
      'fifty six million nine hundred forty five thousand seven hundred eighty one',
    );
  });

  test('negative numbers', () => {
    expect(numberToWords(-42)).toBe('minus forty two');
  });

  test('large numbers', () => {
    expect(numberToWords(1000000)).toBe('one million');
    expect(numberToWords(1234567890)).toBe(
      'one billion two hundred thirty four million five hundred sixty seven thousand eight hundred ninety',
    );
  });

  test('decimals', () => {
    expect(numberToWords('123.45')).toBe(
      'one hundred twenty three point four five',
    );
  });
});
