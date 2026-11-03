/** Shared display/checkout calculation; only server-owned plan values authorize a charge. */
export function membershipAmountMinor(plan) {
  return Math.round(Number(plan.price) * (100 - Number(plan.discountPercentage || 0)));
}
