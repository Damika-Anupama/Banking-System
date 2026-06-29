import { getPasswordStrength } from './password-strength';

describe('getPasswordStrength', () => {
  it('returns an empty descriptor for empty / null / undefined', () => {
    expect(getPasswordStrength('').label).toBe('');
    expect(getPasswordStrength(null).width).toBe(0);
    expect(getPasswordStrength(undefined).barClass).toBe('');
  });

  it('rates a short simple password as very weak', () => {
    const s = getPasswordStrength('abc');
    expect(s.label).toBe('Very weak');
    expect(s.width).toBe(20);
  });

  it('rates a long, fully mixed password as very strong', () => {
    const s = getPasswordStrength('Abcdef123456!');
    expect(s.label).toBe('Very strong');
    expect(s.width).toBe(100);
  });

  it('increases with added complexity', () => {
    const lengthOnly = getPasswordStrength('abcdefgh').width; // 1 criterion
    const withUpperDigit = getPasswordStrength('Abcdefgh1').width; // 3 criteria
    expect(withUpperDigit).toBeGreaterThan(lengthOnly);
  });

  it('maps each score to a distinct level', () => {
    expect(getPasswordStrength('abcdefgh').label).toBe('Very weak'); // length>=8
    expect(getPasswordStrength('Abcdefgh').label).toBe('Weak'); // +upper
    expect(getPasswordStrength('Abcdefg1').label).toBe('Fair'); // +digit
    expect(getPasswordStrength('Abcdefg1!').label).toBe('Strong'); // +symbol
    expect(getPasswordStrength('Abcdefghijk1!').label).toBe('Very strong'); // +length>=12
  });
});
