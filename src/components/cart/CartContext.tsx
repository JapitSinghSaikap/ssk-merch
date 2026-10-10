"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getProductBySlug } from "@/lib/products";
import { quoteShipping, type ShippingQuote } from "@/lib/shipping";

export type CartItem = {
  slug: string;
  name: string;
  color?: string;
  image: string;
  size: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (slug: string, size: string, quantity: number) => void;
  removeItem: (slug: string, size: string) => void;
  // Drops every accessory, leaving apparel — the way out of a cart blocked by
  // the accessory minimum.
  removeAccessories: () => void;
  clearCart: () => void;
  totalItems: number;
  // Subtotal, delivery fee and total under the checkout shipping rules.
  shippingQuote: ShippingQuote;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "ssk-cart";

// A saved cart can outlive catalogue changes — re-read prices from the
// catalogue and drop items that are no longer for sale, so the cart shows
// what checkout will actually charge.
function refreshItems(stored: CartItem[]): CartItem[] {
  return stored.flatMap((item) => {
    const product = getProductBySlug(item.slug);
    if (!product || product.hidden) return [];
    return [{ ...item, price: product.price }];
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount only — never server-side.
  // setTimeout(0) defers the setState call out of the effect body,
  // satisfying the react-hooks/set-state-in-effect lint rule while
  // still avoiding a server/client hydration mismatch.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setItems(refreshItems(JSON.parse(stored)));
      } catch {
        // localStorage unavailable or corrupt — start fresh
      }
      setHydrated(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Persist on every change — but only after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full — silently continue
    }
  }, [items, hydrated]);

  function addItem(
    newItem: Omit<CartItem, "quantity"> & { quantity?: number },
  ) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.slug === newItem.slug && i.size === newItem.size,
      );
      if (existing) {
        return prev.map((i) =>
          i.slug === newItem.slug && i.size === newItem.size
            ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
            : i,
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
    });
  }

  function updateQuantity(slug: string, size: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(slug, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.slug === slug && i.size === size ? { ...i, quantity } : i,
      ),
    );
  }

  function removeItem(slug: string, size: string) {
    setItems((prev) =>
      prev.filter((i) => !(i.slug === slug && i.size === size)),
    );
  }

  function removeAccessories() {
    setItems((prev) =>
      prev.filter(
        (i) => getProductBySlug(i.slug)?.fulfilment !== "accessory",
      ),
    );
  }

  function clearCart() {
    setItems([]);
    // Clear localStorage immediately — don't wait for the persistence effect.
    // The Razorpay payment handler fires outside React's event loop, so the
    // effect may not run before the user navigates away.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const shippingQuote = quoteShipping(items);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        removeAccessories,
        clearCart,
        totalItems,
        shippingQuote,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
