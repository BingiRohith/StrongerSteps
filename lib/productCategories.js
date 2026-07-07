/**
 * Fixed set of Product categories — the public /products page has always
 * had exactly these three sections (Mobility Aids, Educational Products,
 * Merchandise), so category is a closed enum rather than free text like
 * Infographic.category. Single source of truth shared by models/Product.js
 * (enum validation), the admin ProductForm's category <select>, the public
 * products page (section grouping), and app/api routes — nothing should
 * hardcode these value/label strings on its own.
 */
export const PRODUCT_CATEGORIES = [
  { value: 'mobility-aids', label: 'Mobility Aids' },
  { value: 'educational-products', label: 'Educational Products' },
  { value: 'merchandise', label: 'Merchandise' },
];

export const PRODUCT_CATEGORY_VALUES = PRODUCT_CATEGORIES.map((c) => c.value);

export function productCategoryLabel(value) {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label || value;
}
