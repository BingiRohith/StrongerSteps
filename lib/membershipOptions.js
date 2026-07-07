/**
 * Closed option sets for the Membership CMS — mirrors the
 * lib/productCategories.js pattern (single source of truth shared by
 * models/Membership.js enum validation, the admin MembershipForm's
 * <select>s, and the public /join page's label/formatting helpers).
 */

export const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
];
export const CURRENCY_VALUES = CURRENCIES.map((c) => c.value);

export function currencySymbol(value) {
  return CURRENCIES.find((c) => c.value === value)?.symbol || '';
}

export const BILLING_PERIODS = [
  { value: 'one-time', label: 'One-time' },
  { value: 'monthly', label: 'Per month' },
  { value: 'quarterly', label: 'Per quarter' },
  { value: 'yearly', label: 'Per year' },
  { value: 'free', label: 'Free forever' },
];
export const BILLING_PERIOD_VALUES = BILLING_PERIODS.map((b) => b.value);

export function billingPeriodLabel(value) {
  return BILLING_PERIODS.find((b) => b.value === value)?.label || value;
}

// Card border/accent colour — the public /join page has always used two
// looks (plain sage border vs. accent "Most Popular" border); this adds a
// third so admins can vary plan colour without new CSS.
export const PLAN_THEMES = [
  { value: 'sage', label: 'Sage (default)' },
  { value: 'accent', label: 'Accent (gold)' },
  { value: 'primary', label: 'Primary (deep green)' },
];
export const PLAN_THEME_VALUES = PLAN_THEMES.map((t) => t.value);
