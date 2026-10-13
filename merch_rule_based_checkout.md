# Sainik School Kapurthala Merch — Rule-Based Shipping Checkout

**Status:** Proposed launch configuration (requires approval/testing)  
**Currency:** INR  
**Fulfilment:** Vendors dispatch orders directly to customers. Apparel and accessories may ship from separate vendors. Accessory vendor dispatches from Panchkula, Haryana. Merch business pays couriers.

## 1. Goal

Allow standalone apparel purchases with shipping included in the listed price, while preventing loss-making small accessory shipments. Calculate shipping eligibility on **accessory subtotal**, not whole-cart subtotal, including when apparel is in the same cart.

## 2. Proposed configurable launch values

| Config key | Value | Meaning |
|---|---:|---|
| `MIN_ACCESSORY_SUBTOTAL` | `199` | Minimum accessory subtotal required to include any accessories in checkout |
| `FREE_ACCESSORY_SHIPPING_THRESHOLD` | `400` | Accessory subtotal at/above this value receives no additional accessory shipping fee |
| `STANDARD_ACCESSORY_SHIPPING_FEE` | `99` | Fee if accessory subtotal is >= minimum but below free-shipping threshold |
| `APPAREL_SHIPPING_FEE` | `0` | Apparel-only shipping fee (assumed included in product price) |

**These are launch hypotheses, not validated courier rates or guarantees of profitability.** Keep values configurable; don't hard-code in multiple places.

## 3. Classification and calculation rules

- Each sellable SKU must be classified as `apparel` or `accessory` in the product catalog. Do not infer type from SKU spelling.
- Use **post-item-discount accessory merchandise subtotal**, before shipping and tax, for threshold comparisons. Exclude apparel totals and gift cards from accessory qualification. If coupon behavior isn't supported yet, explicitly disallow coupons from changing threshold eligibility until implemented consistently.
- Shipping thresholds use **INR minor units** (paise) or another exact decimal representation. Do not compare floating-point currency amounts.
- When the cart contains no accessories: shipping fee = ₹0, checkout allowed, subject to other normal validations.
- When `0 < accessorySubtotal < ₹199`: the *current cart* is not eligible for checkout. Show amount needed to qualify; permit user to remove accessories and buy apparel alone.
- When `₹199 <= accessorySubtotal < ₹400`: add a **single ₹99 accessory shipping fee per accessory fulfilment group**; do not charge ₹99 for each accessory item.
- When `accessorySubtotal >= ₹400`: accessory delivery is free (₹0 checkout fee), subject to operational feasibility and shipping-zone restrictions in Section 7.
- Apparel subtotal never unlocks free accessory shipping. An order with apparel and accessories runs the same accessory thresholds as an accessories-only order.

**Important:** This v1 assumes all accessories in this product catalog are fulfilled by **one accessory vendor** from one dispatch location, in one consignment when possible. If multiple vendors, warehouses, or separately dispatched consignments are possible, calculate thresholds **per shipping/fulfilment group**, not by adding unrelated items. See Section 7.

## 4. Checkout examples

Magnet price is **provisional ₹90**, because its selling price has not been finalized in the pricing sheet.

| Cart | Accessory subtotal | Shipping collected | Expected behavior |
|---|---:|---:|---|
| T-shirt ₹999 | ₹0 | ₹0 | Allow |
| Tracksuit ₹2,200 | ₹0 | ₹0 | Allow |
| Tracksuit + 1 magnet | ₹90 | N/A | Block checkout of full cart; prompt to add ₹109 accessories or remove magnet |
| 2 magnets | ₹180 | N/A | Prompt to add ₹19 accessories |
| 3 magnets | ₹270 | ₹99 | Allow |
| 1 white mug | ₹300 | ₹99 | Allow |
| Tracksuit + 1 white mug | ₹300 | ₹99 | Allow; order total ₹2,599 |
| 1 large beer mug | ₹450 | ₹0 | Allow; free accessory delivery |
| White mug + magnet | ₹390 | ₹99 | Allow |
| 1 black ceramic mug | ₹400 | ₹0 | Allow; free accessory delivery |
| 2 white mugs | ₹600 | ₹0 | Allow |
| Tracksuit + 2 white mugs | ₹600 | ₹0 | Allow |

For accessory order value below ₹199, **do not silently remove the accessory or submit a partial order**. The customer must choose how to proceed.

## 5. Customer messaging

- Apparel-only: `Shipping included on apparel orders.`
- Accessories below minimum: `Add ₹{minimum - accessorySubtotal} more in accessories to proceed, or remove accessories to check out with apparel only.`
- Accessories eligible for paid shipping: `Accessory delivery: ₹99. Add ₹{freeThreshold - accessorySubtotal} more in accessories to unlock free accessory delivery.`
- Free threshold met: `Free accessory delivery unlocked.`
- Mixed cart: `Apparel and accessories may arrive in separate parcels.`
- Avoid `Add 2 more items` messaging; it may be wrong for variable-price SKUs.

Display the accessory fee clearly in cart summary and final checkout, before payment. Do not advertise all-cart free shipping if accessories trigger delivery fees.

## 6. Suggested implementation (platform agnostic)

```ts
type Item = {
  sku: string;
  category: 'apparel' | 'accessory';
  quantity: number;
  unitPricePaise: number; // price after per-item discounts; must be >= 0
};

type ShippingResult = {
  canCheckout: boolean;
  accessorySubtotalPaise: number;
  additionalAccessoryAmountRequiredPaise: number;
  accessoryShippingFeePaise: number;
  qualifiesForFreeAccessoryShipping: boolean;
};

const MIN_ACCESSORY_SUBTOTAL = 19900;
const FREE_ACCESSORY_SHIPPING_THRESHOLD = 40000;
const STANDARD_ACCESSORY_SHIPPING_FEE = 9900;

function shippingForCart(items: Item[]): ShippingResult {
  // Validate SKU, price and quantity against the trusted server-side catalog first.
  const subtotal = items
    .filter(i => i.category === 'accessory')
    .reduce((sum, i) => sum + i.unitPricePaise * i.quantity, 0);

  if (subtotal === 0) {
    return { canCheckout: true, accessorySubtotalPaise: 0,
      additionalAccessoryAmountRequiredPaise: 0, accessoryShippingFeePaise: 0,
      qualifiesForFreeAccessoryShipping: false };
  }

  if (subtotal < MIN_ACCESSORY_SUBTOTAL) {
    return { canCheckout: false, accessorySubtotalPaise: subtotal,
      additionalAccessoryAmountRequiredPaise: MIN_ACCESSORY_SUBTOTAL - subtotal,
      accessoryShippingFeePaise: 0, qualifiesForFreeAccessoryShipping: false };
  }

  const free = subtotal >= FREE_ACCESSORY_SHIPPING_THRESHOLD;
  return { canCheckout: true, accessorySubtotalPaise: subtotal,
    additionalAccessoryAmountRequiredPaise: 0,
    accessoryShippingFeePaise: free ? 0 : STANDARD_ACCESSORY_SHIPPING_FEE,
    qualifiesForFreeAccessoryShipping: free };
}
```

The snippet assumes a single accessory fulfilment group and no order-level discounts. For multi-vendor systems, run the policy per accessory vendor/dispatch group and add fees for applicable groups. Recalculate on the **server at checkout/payment creation**, not solely in the browser. Persist the shipping rule version, actual charged fee, vendor/group, parcel tracking and courier expense on the order record.

## 7. Decisions and exceptions to confirm

1. **Multiple accessory vendors:** If accessories can originate from more than one location, aggregate accessory totals across vendors only if they genuinely ship together. Otherwise qualify each vendor group separately and show applicable fees.
2. **Shipping serviceability:** Determine how to handle remote/out-of-coverage PIN codes and unexpectedly high courier charges. Don't promise free shipping everywhere before checking the shipping partner's zone/rates. Decide if shipping is unavailable, if a surcharge is permitted, or if it will be subsidized.
3. **Fragile/large orders:** Mug packaging, volumetric weight, breakage protection and multi-parcel shipments may increase cost. Monitor these separately.
4. **Discounts and tax:** Confirm the exact subtotal used by thresholds and order of coupon/tax calculation. This spec uses discounted merchandise subtotal before shipping/tax.
5. **Returns, cancellations, COD:** Determine shipping fee refunds, RTO charges and whether cash-on-delivery is supported. Initial approach assumes prepaid orders.
6. **Magnet sale price:** ₹90 is a test assumption only; finalize before applying examples to live storefront.
7. **Commercial platform:** Confirm website/checkout platform and payment workflow; implement equivalent server-side enforcement rather than trusting only front-end display.

## 8. Shipping budget assumptions (not customer charges)

From the current working estimates for Panchkula dispatch:

| Parcel | Budgeted courier expense |
|---|---:|
| One magnet | ₹85 |
| One regular ceramic mug | ₹120 |
| One small frosted mug | ₹120 |
| One large beer mug | ₹150 |
| Two ceramic mugs in one shipment | ₹175 |
| One mug + magnet | ₹140 |

**Avoid double counting:** The Pricing Sheet currently allocates conservative shipping **per unit**. Order profitability should instead calculate actual shipping **per parcel**; charging the customer ₹99 is a revenue line/offset, not a replacement for actual courier expense. Where bundled items ship together, don't sum all individual shipping allowances as though separate couriers were booked.

## 9. Tests before launch

- No accessories: apparel-only checkout proceeds with ₹0 extra delivery.
- ₹0 accessories: no minimum applied.
- ₹90, ₹180, ₹198.99 accessory totals: block checkout with exact amount-to-add messaging.
- Exactly ₹199: checkout permitted; ₹99 shipping.
- ₹300 accessory subtotal alone or with ₹2,200 tracksuit: ₹99 shipping in both cases.
- ₹399.99: ₹99 shipping; exactly ₹400: ₹0 shipping.
- ₹450 beer mug: free accessory delivery, both alone and with apparel.
- Removing accessories after reaching threshold updates shipping immediately.
- Quantity change, coupon, cart refresh and return from payment flow all recalculate shipping.
- App/server calculations agree and customer cannot bypass the minimum by altering browser requests.
- If any item is reclassified or vendor assignment changes, fulfilment grouping and rates recalculate.

## 10. Post-launch monitoring

For each order, record: order ID, accessory SKUs, vendor, recipient PIN code/zone, parcel count, actual vs chargeable weight, courier service, actual shipping paid, customer shipping fee charged, packaging expense, and return/RTO costs. Review the first **20–30 shipped orders** and then adjust configuration values based on net contribution margin and delivery experience.

**Recommendation:** Ship v1 only after validating courier serviceability and making the three thresholds editable from a single configuration source. Proposed ₹199/₹400/₹99 values are suitable for a controlled starting test, **not proven to cover shipping on all possible orders**.
