/**
 * Shared MRP / selling-price / discount-% math for Products.
 *
 * models/Product.js's pre-validate hook is the authoritative source — the
 * public API always serves server-computed values (pricing is never
 * calculated on the public frontend, per Sprint 9 requirements). The admin
 * ProductForm imports these same functions purely so its live preview can't
 * drift from what the server will actually compute and save on submit.
 */

export function clampPercent(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

export function discountFromPrices(originalPrice, sellingPrice) {
  const mrp = Number(originalPrice) || 0;
  const price = Number(sellingPrice) || 0;
  if (mrp <= 0 || price <= 0 || price >= mrp) return 0;
  return clampPercent((1 - price / mrp) * 100);
}

export function sellingPriceFromDiscount(originalPrice, discountPercentage) {
  const mrp = Number(originalPrice) || 0;
  if (mrp <= 0) return 0;
  return Math.round(mrp * (1 - clampPercent(discountPercentage) / 100));
}
