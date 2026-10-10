"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartContext";
import OrderTotals from "@/components/cart/OrderTotals";

export default function CartView() {
  const { items, updateQuantity, removeItem, shippingQuote } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-gold">
          YOUR CART
        </p>
        <h2 className="mt-4 font-display text-3xl text-cream">
          Nothing here yet.
        </h2>
        <p className="mt-3 text-sm text-warm-grey">
          Browse the shop and add something you love.
        </p>
        <Link
          href="/shop"
          className="mt-8 bg-gold px-8 py-4 text-xs font-semibold tracking-[0.2em] text-maroon-dark transition-opacity hover:opacity-90"
        >
          BROWSE THE SHOP
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-gold">
        YOUR CART
      </p>
      <h1 className="mt-2 font-display text-4xl text-cream">
        {items.length} item{items.length !== 1 ? "s" : ""}
      </h1>

      <div className="mt-10 divide-y divide-gold/20">
        {items.map((item) => (
          <div
            key={`${item.slug}-${item.size}`}
            className="flex gap-5 py-6"
          >
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden border border-gold/20">
              <Image
                src={item.image}
                alt={item.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cream">{item.name}</p>
                  <p className="mt-0.5 text-xs text-warm-grey">
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <p className="text-sm text-cream">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.slug, item.size, item.quantity - 1)
                    }
                    className="flex h-7 w-7 items-center justify-center border border-gold/30 text-warm-grey transition-colors hover:border-gold hover:text-cream"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm text-cream">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.slug, item.size, item.quantity + 1)
                    }
                    className="flex h-7 w-7 items-center justify-center border border-gold/30 text-warm-grey transition-colors hover:border-gold hover:text-cream"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    removeItem(item.slug, item.size);
                    toast.success(`${item.name} removed from cart.`);
                  }}
                  className="text-xs tracking-[0.1em] text-warm-grey transition-colors hover:text-red-300"
                >
                  REMOVE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-gold/20 pt-8">
        <OrderTotals quote={shippingQuote} />

        {shippingQuote.canCheckout ? (
          <Link
            href="/checkout"
            className="mt-8 block w-full bg-gold px-8 py-4 text-center text-xs font-semibold tracking-[0.2em] text-maroon-dark transition-opacity hover:opacity-90"
          >
            PROCEED TO CHECKOUT
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-8 block w-full cursor-not-allowed bg-gold px-8 py-4 text-center text-xs font-semibold tracking-[0.2em] text-maroon-dark opacity-60"
          >
            PROCEED TO CHECKOUT
          </button>
        )}

        <Link
          href="/shop"
          className="mt-4 block text-center text-xs tracking-[0.2em] text-warm-grey transition-colors hover:text-gold"
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    </div>
  );
}
