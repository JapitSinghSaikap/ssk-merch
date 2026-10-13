# SAIKAPIAN — Free-Shipping Promotion & Checkout UI

**Status:** Launch implementation specification  
**Scope:** Cart and checkout UI/logic (no merchandise-price discount)  
**Currency:** INR (₹)

## Objective

Show an automatically applied **SAIKAPIAN** free-shipping label when *the entire order* qualifies for free delivery. When accessories do not yet qualify, show an accurate accessory-specific prompt and progress toward the free-shipping threshold. Never use the promo label to override actual shipping rules.

This promotion is a **shipping-benefit presentation**, not a ₹100 price discount, not a user-entered coupon, and not an additional shipping subsidy. If free delivery is already included in the apparel price, show it as free without inventing a discounted shipping amount.

## Configurable rules

```ts
export const SHIPPING_RULES = {
  minimumAccessorySubtotalPaise: 19900, // ₹199.00
  freeAccessoryShippingAtPaise: 40000,  // ₹400.00
  standardAccessoryShippingPaise: 9900, // ₹99.00 (once per accessory shipment / vendor parcel group)
  promoLabel: 'SAIKAPIAN',
} as const;
```

**Accessory subtotal** = sum of accessory item prices × quantities, **before shipping**. For launch, calculate shipping eligibility before any product-level promotional discount. Apparel amounts do **not** count toward the accessory thresholds. Evaluate separate accessory fulfillment/vendor groups independently if multiple origins are added later.

| Cart condition | Checkout | Shipping | UI message |
|---|---|---|---|
| Apparel only, no accessories | Allowed | Free | `SAIKAPIAN applied · Free shipping` |
| Accessory subtotal ₹0.01–₹198.99 | Blocked while accessories remain | Not computed | `Add ₹X more in accessories to continue` |
| Accessory subtotal ₹199.00–₹399.99 | Allowed | ₹99 accessory shipping | `Add ₹X more in accessories to unlock FREE shipping` |
| Accessory subtotal ₹400.00 or more | Allowed | Free for accessories | `SAIKAPIAN applied · Free shipping unlocked!` |
| Mixed apparel + accessories | Determined by **accessory subtotal** | Apparel shipping free; accessories follow above tiers | Do **not** show order-wide `SAIKAPIAN applied` unless accessory shipping is also free |
| Empty cart | Blocked | N/A | Normal empty-cart UI |

**Boundary tests:** ₹198.99 blocked; ₹199.00 allowed with ₹99 shipping; ₹399.99 allowed with ₹99 shipping; ₹400.00 free shipping.

## Front-end display behavior

### A. Apparel only (shipping included)
- Shipping line: `FREE`.
- Auto-applied label: `SAIKAPIAN applied — Free shipping`.
- No accessory progress bar.

### B. Accessories below ₹199 (including mixed carts)
- Keep accessories in cart but disable checkout until accessories reach ₹199 or the customer removes them.
- Message: `Add ₹{199 - accessorySubtotal} more in accessories to continue checkout.`
- Optional secondary message: `Free accessory shipping unlocks at ₹400.`
- If apparel is also in cart, provide a clear `Remove accessories and checkout apparel` option.
- **Do not** show `SAIKAPIAN applied` for the whole order.

### C. Accessories from ₹199 to below ₹400
- Charge ₹99 **once per accessory parcel/vendor fulfillment group**, not per unit.
- Show shipping as `₹99` and do not show the coupon as applied.
- Progress prompt: `Add ₹{400 - accessorySubtotal} more in accessories to unlock FREE shipping!`
- Progress bar percentage = `min(100, accessorySubtotal / 400 * 100)`.
- Example: one white ceramic mug at ₹300 → ₹99 shipping; progress 75%; `Add ₹100 more...`; customer payable for accessories ₹399.

### D. Accessories of ₹400 or more
- Shipping line: `FREE`.
- Auto-applied label: `SAIKAPIAN applied — Free shipping unlocked!`.
- Hide progress-to-free-shipping prompt or show completed progress.
- Example: large beer mug at ₹450 → free shipping, ₹450 payable.

### E. Mixed apparel and accessories
- Calculate apparel shipping and accessory shipping **independently**, because vendors dispatch directly to customers.
- If accessories cost ₹300 and apparel costs ₹999: accessory shipping ₹99; order total ₹1,398. Show `Add ₹100 more in accessories...` but do **not** show order-wide `SAIKAPIAN applied`.
- If accessories cost ₹450 and apparel costs ₹999: both shipping groups are free; total ₹1,449. Show `SAIKAPIAN applied`.
- Optional summary line while accessories are paid: `Apparel delivery: FREE · Accessories delivery: ₹99`.

## Reference implementation (TypeScript)

Use integer paise to prevent floating-point boundary errors. **Recompute authoritatively on the server** from catalog prices, quantities, item categories and vendor group identifiers; do not trust client-supplied subtotals or shipping amounts.

```ts
type CartItem = {
  category: 'apparel' | 'accessory';
  unitPricePaise: number;
  quantity: number;
  vendorGroup: string;
};

const MIN = SHIPPING_RULES.minimumAccessorySubtotalPaise;
const FREE = SHIPPING_RULES.freeAccessoryShippingAtPaise;
const FEE = SHIPPING_RULES.standardAccessoryShippingPaise;

export function getCheckoutShipping(items: CartItem[]) {
  const validItems = items.filter(i => i.quantity > 0);
  const totalPaise = validItems.reduce((s, i) => s + i.unitPricePaise * i.quantity, 0);
  const accessories = validItems.filter(i => i.category === 'accessory');
  const accessorySubtotalPaise = accessories.reduce((s, i) => s + i.unitPricePaise * i.quantity, 0);
  const hasAccessories = accessories.length > 0;
  const checkoutAllowed = totalPaise > 0 && (!hasAccessories || accessorySubtotalPaise >= MIN);

  // Launch assumption: all accessories dispatch together from the Panchkula vendor.
  // When multiple accessory vendor groups exist, split into groups and price each parcel independently.
  const accessoryShippingPaise = !checkoutAllowed || !hasAccessories || accessorySubtotalPaise >= FREE
    ? 0
    : FEE;

  const allShippingFree = checkoutAllowed && accessoryShippingPaise === 0;
  const remainingToMinimumPaise = hasAccessories ? Math.max(0, MIN - accessorySubtotalPaise) : 0;
  const remainingToFreePaise = hasAccessories ? Math.max(0, FREE - accessorySubtotalPaise) : 0;

  return {
    checkoutAllowed,
    accessorySubtotalPaise,
    accessoryShippingPaise,
    // Apparel shipping is included in apparel selling prices.
    totalPayablePaise: checkoutAllowed ? totalPaise + accessoryShippingPaise : null,
    remainingToMinimumPaise,
    remainingToFreePaise,
    progressPercent: hasAccessories ? Math.min(100, accessorySubtotalPaise / FREE * 100) : 0,
    showSaikapianApplied: allShippingFree,
    promoLabel: allShippingFree ? SHIPPING_RULES.promoLabel : null,
  };
}
```

## Suggested copy

- **Unlocked**: `✓ SAIKAPIAN applied — Free shipping unlocked!`
- **Apparel only**: `✓ SAIKAPIAN applied — Free delivery included`
- **Eligible but shipping payable**: `Add ₹{amount} more in accessories to unlock FREE shipping!`
- **Below minimum**: `Add ₹{amount} more in accessories to continue checkout.`
- **Mixed cart with accessory charge**: `Your apparel ships free. Add ₹{amount} more in accessories to unlock free accessory delivery.`

## Checkout examples (assuming prices from current plan)

| Cart | Accessory subtotal | Status | Delivery charge | Promo display |
|---|---:|---|---:|---|
| Black T-shirt ₹999 | ₹0 | Allowed | ₹0 | SAIKAPIAN applied |
| Tracksuit ₹2,200 + magnet ₹90* | ₹90 | Blocked until accessories added/removed | N/A | Not applied |
| White mug ₹300 | ₹300 | Allowed | ₹99 | Progress: ₹100 more |
| T-shirt ₹999 + white mug ₹300 | ₹300 | Allowed | ₹99 | Progress: ₹100 more |
| Large beer mug ₹450 | ₹450 | Allowed | ₹0 | SAIKAPIAN applied |
| White mug ₹300 + magnet ₹90* | ₹390 | Allowed | ₹99 | Progress: ₹10 more |
| Black mug ₹400 | ₹400 | Allowed | ₹0 | SAIKAPIAN applied |
| Two white mugs ₹600 | ₹600 | Allowed | ₹0 | SAIKAPIAN applied |

*Magnet ₹90 is **provisional** and not finalized in the Pricing Sheet.*

## Important guardrails

1. **No fake discounts:** Do not show struck-through shipping prices unless they are genuine normally charged rates. Do not invent ₹100 off or automatically subtract money from product totals.
2. **Not a real bypass coupon:** Customers should not be able to enter `SAIKAPIAN` manually to force free shipping. It is an informational/automatic label reflecting the result of shipping rules.
3. **Backend revalidation:** Recalculate thresholds and shipping after cart changes, at checkout, and immediately before payment confirmation. Enforce minimum accessory eligibility server-side.
4. **No negative or fractional quantity inputs:** Validate SKUs, catalog prices, categories, and quantities at checkout.
5. **Refunds/edits:** Recalculate when orders are edited before fulfillment; document a separate policy if post-purchase partial refunds change eligibility.
6. **Multiple origin caveat:** The current ₹99-per-accessory-shipment logic assumes one Panchkula accessories vendor. Add vendor-level grouping if that assumption changes.
7. **Shipping costs vs checkout charges:** Courier costs from the Pricing Sheet are planning estimates; ₹99 is the *customer-facing charge*. Keep estimated fulfillment expense and collected shipping revenue separate for margin reporting.
8. **Threshold tuning:** Keep ₹199 / ₹400 / ₹99 configurable, and revisit after collecting actual shipment costs and order mix.

## Acceptance criteria

- [ ] Apparel-only checkout succeeds with ₹0 shipping and SAIKAPIAN applied.
- [ ] Accessories ₹198.99 block checkout, with exact add-more message.
- [ ] Accessories ₹199.00 apply ₹99 shipping.
- [ ] Accessories ₹399.99 apply ₹99 shipping and display amount needed to ₹400.
- [ ] Accessories ₹400.00 get free shipping and SAIKAPIAN applied.
- [ ] Adding apparel never changes the accessory free-shipping progress calculation.
- [ ] Mixed cart with accessory fee does **not** display order-wide SAIKAPIAN applied.
- [ ] Mixed cart with all shipping groups free displays SAIKAPIAN applied.
- [ ] Progress messages update immediately when quantities change.
- [ ] Server and client calculations match; users cannot bypass minimums via direct payment requests.
- [ ] No misleading struck-through shipping prices or fictitious price reductions.

**Implementation note:** This document only specifies desired behavior; it does not change website code or live settings.
