import type { ProductCategory } from "@/lib/products";

export type FilterState = {
  categories: ProductCategory[];
  sizes: string[];
  maxPrice: number;
};

type Props = {
  categories: { value: ProductCategory; label: string }[];
  sizes: string[];
  priceBounds: { min: number; max: number };
  value: FilterState;
  onChange: (next: FilterState) => void;
};

export default function ShopFilters({
  categories,
  sizes,
  priceBounds,
  value,
  onChange,
}: Props) {
  function toggleCategory(category: ProductCategory) {
    const next = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  }

  function toggleSize(size: string) {
    const next = value.sizes.includes(size)
      ? value.sizes.filter((s) => s !== size)
      : [...value.sizes, size];
    onChange({ ...value, sizes: next });
  }

  function clearFilters() {
    onChange({ categories: [], sizes: [], maxPrice: priceBounds.max });
  }

  const hasActiveFilters =
    value.categories.length > 0 ||
    value.sizes.length > 0 ||
    value.maxPrice < priceBounds.max;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-[0.3em] text-gold">
          FILTERS
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] tracking-[0.15em] text-warm-grey underline-offset-2 hover:text-gold hover:underline"
          >
            CLEAR
          </button>
        )}
      </div>

      <div>
        <p className="text-xs tracking-[0.2em] text-cream">CATEGORY</p>
        <div className="mt-4 space-y-3">
          {categories.map((category) => (
            <label
              key={category.value}
              className="flex items-center gap-3 text-sm text-warm-grey hover:text-cream"
            >
              <input
                type="checkbox"
                checked={value.categories.includes(category.value)}
                onChange={() => toggleCategory(category.value)}
                className="h-4 w-4 border border-gold/40 bg-transparent accent-gold"
              />
              {category.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs tracking-[0.2em] text-cream">
          PRICE — UP TO ₹{value.maxPrice.toLocaleString("en-IN")}
        </p>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          step={10}
          value={value.maxPrice}
          onChange={(e) =>
            onChange({ ...value, maxPrice: Number(e.target.value) })
          }
          className="mt-4 w-full accent-gold"
        />
        <div className="mt-1 flex justify-between text-[11px] text-warm-grey">
          <span>₹{priceBounds.min.toLocaleString("en-IN")}</span>
          <span>₹{priceBounds.max.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div>
        <p className="text-xs tracking-[0.2em] text-cream">SIZE</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              aria-pressed={value.sizes.includes(size)}
              className={`border px-3 py-1.5 text-xs tracking-[0.1em] transition-colors ${
                value.sizes.includes(size)
                  ? "border-gold bg-gold text-maroon-dark"
                  : "border-gold/30 text-warm-grey hover:border-gold hover:text-cream"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
