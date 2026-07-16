'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Star, Info } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * E-commerce style product card for the public /products page. Pricing
 * (originalPrice/sellingPrice/discountPercentage) always comes straight
 * from the API — models/Product.js's pre-validate hook is the only place
 * that ever computes the discount, this component just renders it.
 * `icon` is the generic lucide fallback rendered when the product has no
 * uploaded image (category-specific icons were removed in Sprint 18 —
 * categories are now open-ended, see models/ProductCategory.js).
 *
 * Sprint 18: card visuals reworked for a "premium e-commerce" feel —
 * consistent height, a taller/cleaner image area, clearer price hierarchy,
 * softer badges, and a hover-only lift+shadow (no idle/looping motion, per
 * the sprint's animation guidance).
 */
export default function ProductCard({ product, icon: Icon }) {
  if (!product) return null;

  const hasPrice = Number(product.sellingPrice) > 0;
  const hasDiscount = hasPrice && Number(product.originalPrice) > Number(product.sellingPrice);
  const outOfStock = product.stockStatus === 'out-of-stock';
  const categoryIconUrl = product.category?.icon?.url;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white shadow-sm transition-shadow duration-200 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-sage">
        {product.image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
          <img
            src={product.image.url}
            alt={product.image.alt || product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : categoryIconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded category icon, not an optimizable remote image
          <img src={categoryIconUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            {Icon && <Icon size={40} aria-hidden="true" />}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">Out of stock</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <Badge tone="accent" className="shadow-sm">{product.discountPercentage}% OFF</Badge>
          )}
        </div>
        {product.featured && (
          <span className="absolute right-3 top-3">
            <Badge tone="primary" className="shadow-sm">
              <Star size={11} className="mr-1 -ml-0.5 fill-current" aria-hidden="true" />
              Featured
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {product.category?.name && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{product.category.name}</p>
        )}
        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-primary-dark line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1.5 flex-1 text-sm text-muted line-clamp-2">{product.description}</p>
        )}

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-line/70 pt-3">
          <div>
            {hasPrice ? (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-xl font-bold text-primary-dark">
                  ₹{Number(product.sellingPrice).toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted line-through">
                    ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm italic text-muted">Pricing coming soon</p>
            )}
            {!outOfStock && <p className="mt-0.5 text-xs font-semibold text-primary">In stock</p>}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            aria-disabled="true"
            title="Product details are coming soon"
            className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-full border-2 border-line px-4 py-2 text-xs font-semibold text-muted"
          >
            <Info size={13} aria-hidden="true" />
            View Details
          </button>
          <button
            type="button"
            aria-disabled="true"
            title="Checkout is coming soon"
            className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-full bg-line px-4 py-2 text-xs font-semibold text-muted"
          >
            <ShoppingCart size={13} aria-hidden="true" />
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}
