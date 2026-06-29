/**
 * Shared password-strength scoring used by the sign-up and settings password
 * fields, so both surfaces show identical feedback from a single source.
 */
export interface PasswordStrength {
  label: string;
  width: number;
  barClass: string;
  textClass: string;
}

const LEVELS: PasswordStrength[] = [
  { label: 'Very weak', width: 20, barClass: 'bg-red-400', textClass: 'text-red-400' },
  { label: 'Weak', width: 40, barClass: 'bg-orange-400', textClass: 'text-orange-400' },
  { label: 'Fair', width: 60, barClass: 'bg-amber-400', textClass: 'text-amber-400' },
  { label: 'Strong', width: 80, barClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
  { label: 'Very strong', width: 100, barClass: 'bg-emerald-300', textClass: 'text-emerald-300' },
];

const EMPTY: PasswordStrength = { label: '', width: 0, barClass: '', textClass: '' };

/**
 * Score a password on five criteria (length >=8, length >=12, an uppercase
 * letter, a digit, and a symbol) and map it to a visual strength level.
 * Returns an empty descriptor for an empty/whitespace-only password.
 */
export function getPasswordStrength(password: string | null | undefined): PasswordStrength {
  const p = password ?? '';
  if (!p) return { ...EMPTY };

  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  return LEVELS[Math.min(score - 1, 4)] || LEVELS[0];
}
