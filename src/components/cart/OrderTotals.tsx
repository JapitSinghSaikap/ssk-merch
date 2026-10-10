"use client";

import { useCart } from "@/components/cart/CartContext";
import { formatPaise, shippingDisplay, type ShippingQuote } from "@/lib/shipping";

// Subtotal / delivery / total block shared by the cart and checkout pages, so
// both always show the same shipping outcome the server will charge.
export default function OrderTotals({ quote }: { quote: ShippingQuote }) {
  const { removeAccessories } = useCart();
  const display = shippingDisplay(quote);
  const blocked = !quote.canCheckout;

  return (
    <div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <p className="text-xs tracking-[0.2em] text-warm-grey">SUBTOTAL</p>
          <p className="text-cream">{formatPaise(quote.merchandiseSubtotalPaise)}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <p className="text-xs tracking-[0.2em] text-warm-grey">DELIVERY</p>
          <p className={display.deliveryLabel === "FREE" ? "text-gold" : "text-cream"}>
            {display.deliveryLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gold/20 pt-4">
        <p className="text-xs tracking-[0.2em] text-warm-grey">TOTAL</p>
        <p className="font-display text-2xl text-gold">
          {blocked ? "—" : formatPaise(quote.totalPaise)}
        </p>
      </div>

      {display.promo && (
        <p className="mt-4 border border-gold/40 bg-gold/10 px-4 py-3 text-center text-xs font-medium tracking-[0.1em] text-gold">
          {display.promo}
        </p>
      )}

      {display.prompt && (
        <div className="mt-4">
          <p className={`text-sm ${blocked ? "text-red-300" : "text-cream"}`}>
            {display.prompt}
          </p>
          {/* Progress is towards free delivery, so it only makes sense once
              the accessory minimum is met. */}
          {!blocked && display.progressPercent !== null && (
            <div
              className="mt-2 h-1.5 w-full overflow-hidden bg-cream/10"
              role="progressbar"
              aria-label="Progress towards free accessory delivery"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(display.progressPercent)}
            >
              <div
                className="h-full bg-gold transition-[width] duration-300"
                style={{ width: `${display.progressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {blocked && quote.hasApparel && (
        <button
          type="button"
          onClick={removeAccessories}
          className="mt-4 w-full border border-gold/40 px-6 py-3 text-xs tracking-[0.2em] text-cream transition-colors hover:border-gold hover:text-gold"
        >
          REMOVE ACCESSORIES AND CHECKOUT APPAREL
        </button>
      )}

      <ul className="mt-3 space-y-1 text-right text-xs leading-relaxed text-warm-grey">
        {display.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
        <li>Estimated delivery: 10–15 days.</li>
      </ul>
    </div>
  );
}
