import { getProductBySlug, type ProductFulfilment } from "./products";

// Rule-based shipping for checkout — see merch_rule_based_checkout.md and
// saikapian_shipping_promo_checkout.md.
//
// Apparel ships with delivery included in the price. Accessories are judged
// on the accessory subtotal alone (apparel never counts towards it):
//   0 < subtotal < minimum         → checkout blocked until more is added
//   minimum <= subtotal < free     → one flat accessory delivery fee
//   subtotal >= free threshold     → free accessory delivery
//
// v1 assumes every accessory ships from one vendor in one parcel, so the fee
// is charged once per order, never per item.
//
// When the whole order ships free, the cart shows the SAIKAPIAN label. It is
// only a presentation of that outcome — never a code customers can enter, and
// never a discount on product prices.
//
// All amounts are integer paise so threshold comparisons are exact. Bump
// `version` whenever a value changes — it is stored on each order.
export const SHIPPING_RULES = {
  version: "2026-10-v1",
  minAccessorySubtotalPaise: 198_00,
  freeAccessoryShippingThresholdPaise: 400_00,
  standardAccessoryShippingFeePaise: 99_00,
  apparelShippingFeePaise: 0,
  promoLabel: "SAIKAPIAN",
} as const;

export type ShippingLine = { slug: string; quantity: number };

export type ShippingQuote = {
  canCheckout: boolean;
  hasApparel: boolean;
  hasAccessories: boolean;
  merchandiseSubtotalPaise: number;
  accessorySubtotalPaise: number;
  // How much more in accessories is needed before checkout is allowed.
  additionalAccessoryAmountRequiredPaise: number;
  // How much more in accessories unlocks free accessory delivery.
  amountToFreeAccessoryShippingPaise: number;
  qualifiesForFreeAccessoryShipping: boolean;
  shippingFeePaise: number;
  totalPaise: number;
};

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}

export function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export type PricedLine = {
  fulfilment: ProductFulfilment;
  unitPricePaise: number;
  quantity: number;
};

// Prices always come from the catalogue, never from the client's cart, so the
// browser and the server reach the same answer. Unknown slugs are skipped —
// the server rejects them separately before quoting.
export function quoteShipping(lines: ShippingLine[]): ShippingQuote {
  return quotePricedLines(
    lines.flatMap((line) => {
      const product = getProductBySlug(line.slug);
      if (!product) return [];
      return [
        {
          fulfilment: product.fulfilment,
          unitPricePaise: rupeesToPaise(product.price),
          quantity: line.quantity,
        },
      ];
    }),
  );
}

export function quotePricedLines(lines: PricedLine[]): ShippingQuote {
  const rules = SHIPPING_RULES;
  let apparelPaise = 0;
  let accessoryPaise = 0;
  let hasApparel = false;
  let hasAccessories = false;

  for (const line of lines) {
    const linePaise = line.unitPricePaise * line.quantity;
    if (line.fulfilment === "accessory") {
      hasAccessories = true;
      accessoryPaise += linePaise;
    } else {
      hasApparel = true;
      apparelPaise += linePaise;
    }
  }

  const merchandiseSubtotalPaise = apparelPaise + accessoryPaise;
  const belowMinimum =
    hasAccessories && accessoryPaise < rules.minAccessorySubtotalPaise;
  const qualifiesForFreeAccessoryShipping =
    hasAccessories && accessoryPaise >= rules.freeAccessoryShippingThresholdPaise;

  let shippingFeePaise = hasApparel ? rules.apparelShippingFeePaise : 0;
  if (hasAccessories && !belowMinimum && !qualifiesForFreeAccessoryShipping) {
    shippingFeePaise += rules.standardAccessoryShippingFeePaise;
  }

  return {
    canCheckout: !belowMinimum,
    hasApparel,
    hasAccessories,
    merchandiseSubtotalPaise,
    accessorySubtotalPaise: accessoryPaise,
    additionalAccessoryAmountRequiredPaise: belowMinimum
      ? rules.minAccessorySubtotalPaise - accessoryPaise
      : 0,
    amountToFreeAccessoryShippingPaise:
      hasAccessories && !qualifiesForFreeAccessoryShipping
        ? rules.freeAccessoryShippingThresholdPaise - accessoryPaise
        : 0,
    qualifiesForFreeAccessoryShipping,
    shippingFeePaise,
    totalPaise: merchandiseSubtotalPaise + shippingFeePaise,
  };
}

export type ShippingDisplay = {
  // Value for the DELIVERY line of the summary.
  deliveryLabel: string;
  // Set only when every shipping group in the order is free.
  promo: string | null;
  // Main call to action; shown as an error when checkout is blocked.
  prompt: string | null;
  details: string[];
  // Progress towards free accessory delivery; null when there are no accessories.
  progressPercent: number | null;
};

// Customer-facing summary for the cart and checkout pages.
export function shippingDisplay(quote: ShippingQuote): ShippingDisplay {
  const rules = SHIPPING_RULES;
  const isEmpty = !quote.hasApparel && !quote.hasAccessories;
  const allShippingFree =
    !isEmpty && quote.canCheckout && quote.shippingFeePaise === 0;

  const display: ShippingDisplay = {
    deliveryLabel: !quote.canCheckout
      ? "—"
      : quote.shippingFeePaise > 0
        ? formatPaise(quote.shippingFeePaise)
        : "FREE",
    promo: null,
    prompt: null,
    details: [],
    progressPercent: quote.hasAccessories
      ? Math.min(
          100,
          (quote.accessorySubtotalPaise / rules.freeAccessoryShippingThresholdPaise) * 100,
        )
      : null,
  };
  if (isEmpty) return display;

  if (allShippingFree) {
    display.promo = quote.hasAccessories
      ? `✓ ${rules.promoLabel} applied — Free shipping unlocked!`
      : `✓ ${rules.promoLabel} applied — Free delivery included`;
  } else if (!quote.canCheckout) {
    display.prompt = checkoutBlockedMessage(quote);
    display.details.push(
      `Free accessory shipping unlocks at ${formatPaise(rules.freeAccessoryShippingThresholdPaise)}.`,
    );
  } else {
    const remaining = formatPaise(quote.amountToFreeAccessoryShippingPaise);
    display.prompt = quote.hasApparel
      ? `Your apparel ships free. Add ${remaining} more in accessories to unlock free accessory delivery.`
      : `Add ${remaining} more in accessories to unlock FREE shipping!`;
    if (quote.hasApparel) {
      display.details.push(
        `Apparel delivery: FREE · Accessories delivery: ${formatPaise(quote.shippingFeePaise)}`,
      );
    }
  }

  if (quote.hasApparel && quote.hasAccessories) {
    display.details.push("Apparel and accessories may arrive in separate parcels.");
  }
  return display;
}

// Why checkout is blocked — shared by the cart UI and the server's rejection.
export function checkoutBlockedMessage(quote: ShippingQuote) {
  return `Add ${formatPaise(quote.additionalAccessoryAmountRequiredPaise)} more in accessories to continue checkout.`;
}
