import { ShoppingCart, Star, Info } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * E-commerce style product card for the public /products page. Pricing
 * (originalPrice/sellingPrice/discountPercentage) always comes straight
 * from the API — models/Product.js's pre-validate hook is the only place
 * that ever computes the discount, this component just renders it.
 * `icon` is the per-category lucide fallback rendered when the product has
 * no uploaded image.
 */
export default function ProductCard({ product, icon: Icon }) {
  if (!product) return null;

  const hasPrice = Number(product.sellingPrice) > 0;
  const hasDiscount = hasPrice && Number(product.originalPrice) > Number(product.sellingPrice);
  const outOfStock = product.stockStatus === 'out-of-stock';

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl2 border border-line bg-white transition-colors hover:border-primary">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-sage">
        {product.image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally-uploaded file, not an optimizable remote image
          <img
            src={product.image.url}
            alt={product.image.alt || product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/25">
            {Icon && <Icon size={36} aria-hidden="true" />}
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-3 top-3">
            <Badge tone="accent">{product.discountPercentage}% OFF</Badge>
          </span>
        )}
        {product.featured && (
          <span className="absolute right-3 top-3">
            <Badge tone="primary">
              <Star size={11} className="mr-1 -ml-0.5 fill-current" aria-hidden="true" />
              Featured
            </Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug text-primary-dark line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{product.description}</p>
        )}

        <div className="mt-3">
          {hasPrice ? (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-display text-lg font-bold text-primary-dark">
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
          <p className={`mt-1 text-xs font-semibold ${outOfStock ? 'text-red-600' : 'text-primary'}`}>
            {outOfStock ? 'Out of stock' : 'In stock'}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            aria-disabled="true"
            title="Product details are coming soon"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border-2 border-line px-4 py-1.5 text-xs font-semibold text-muted"
          >
            <Info size={13} aria-hidden="true" />
            View Details
          </button>
          <button
            type="button"
            aria-disabled="true"
            title="Checkout is coming soon"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-full bg-line px-4 py-1.5 text-xs font-semibold text-muted"
          >
            <ShoppingCart size={13} aria-hidden="true" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
