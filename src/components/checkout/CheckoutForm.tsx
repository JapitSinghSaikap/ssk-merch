"use client";

import { useState, useTransition } from "react";
import { useCart } from "@/components/cart/CartContext";
import OrderTotals from "@/components/cart/OrderTotals";
import { toast } from "sonner";
import { initOrder, verifyPayment } from "@/app/checkout/actions";
import type { AddressFields } from "@/app/checkout/actions";

const inputClass =
  "w-full border border-cream/20 bg-transparent px-4 py-3 text-sm text-cream placeholder:text-warm-grey/60 outline-none transition-colors focus:border-gold";

const labelClass = "text-xs tracking-[0.2em] text-warm-grey";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

type Prefill = {
  customerName: string;
  email: string;
  phone: string;
};

export default function CheckoutForm({ prefill }: { prefill?: Prefill }) {
  const { items, shippingQuote, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState("");

  const [address, setAddress] = useState<AddressFields>({
    customerName: prefill?.customerName ?? "",
    phone: prefill?.phone ?? "",
    email: prefill?.email ?? "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await initOrder(address, items);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      try {
        await loadRazorpay();
      } catch {
        const msg = "Could not load payment gateway. Please try again.";
        setError(msg);
        toast.error(msg);
        return;
      }

      const { razorpayOrderId, amount, keyId } = result;

      const options = {
        key: keyId,
        amount: amount * 100,
        currency: "INR",
        name: "Sainik School Kapurthala",
        description: "Alumni Merchandise",
        order_id: razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verification = await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          if (verification.success) {
            clearCart();
            setSuccessOrderId(razorpayOrderId);
            setOrderSuccess(true);
            toast.success("Order placed successfully!");
          } else {
            const msg = verification.error ?? "Payment verification failed. Contact support.";
            setError(msg);
            toast.error(msg);
          }
        },
        prefill: {
          name: address.customerName,
          email: address.email,
          contact: address.phone,
        },
        theme: { color: "#c9a84c" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-gold">
          ORDER CONFIRMED
        </p>
        <h2 className="mt-4 font-display text-4xl text-cream">
          Thank you for your order.
        </h2>
        <p className="mt-3 text-sm text-warm-grey">
          Estimated delivery: 10–15 days. Updates will be sent to your
          registered email.
        </p>
        <p className="mt-4 text-xs text-warm-grey/60">
          Order ref: {successOrderId}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-6xl px-6 py-16 lg:px-10"
    >
      <p className="text-xs font-medium tracking-[0.3em] text-gold">
        CHECKOUT
      </p>
      <h1 className="mt-2 font-display text-4xl text-cream">Your order</h1>

      <div className="mt-12 grid grid-cols-1 gap-16 lg:grid-cols-2">
        {/* Cart summary */}
        <div>
          <p className="text-xs tracking-[0.2em] text-warm-grey">
            ORDER SUMMARY
          </p>
          <div className="mt-4 divide-y divide-gold/20 border border-gold/20">
            {items.map((item) => (
              <div
                key={`${item.slug}-${item.size}`}
                className="flex items-center justify-between px-4 py-4"
              >
                <div>
                  <p className="text-sm text-cream">{item.name}</p>
                  <p className="mt-0.5 text-xs text-warm-grey">
                    {[item.color, item.size, `×${item.quantity}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <p className="text-sm text-cream">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <OrderTotals quote={shippingQuote} />
          </div>
        </div>

        {/* Address form */}
        <div className="space-y-5">
          <p className="text-xs tracking-[0.2em] text-warm-grey">
            DELIVERY DETAILS
          </p>

          <div>
            <label htmlFor="customerName" className={labelClass}>
              FULL NAME
            </label>
            <input
              id="customerName"
              name="customerName"
              type="text"
              placeholder="Arjun Singh"
              value={address.customerName}
              onChange={handleChange}
              required
              className={`${inputClass} mt-2`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelClass}>
                PHONE
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={address.phone}
                onChange={handleChange}
                required
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                EMAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={address.email}
                onChange={handleChange}
                required
                className={`${inputClass} mt-2`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="addressLine1" className={labelClass}>
              ADDRESS LINE 1
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              type="text"
              placeholder="House / Flat no., Street"
              value={address.addressLine1}
              onChange={handleChange}
              required
              className={`${inputClass} mt-2`}
            />
          </div>

          <div>
            <label htmlFor="addressLine2" className={labelClass}>
              ADDRESS LINE 2{" "}
              <span className="text-warm-grey/50">(OPTIONAL)</span>
            </label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              placeholder="Landmark, Colony"
              value={address.addressLine2}
              onChange={handleChange}
              className={`${inputClass} mt-2`}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="city" className={labelClass}>
                CITY
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="Kapurthala"
                value={address.city}
                onChange={handleChange}
                required
                className={`${inputClass} mt-2`}
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="state" className={labelClass}>
                STATE
              </label>
              <input
                id="state"
                name="state"
                type="text"
                placeholder="Punjab"
                value={address.state}
                onChange={handleChange}
                required
                className={`${inputClass} mt-2`}
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="pincode" className={labelClass}>
                PINCODE
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                placeholder="144601"
                maxLength={6}
                value={address.pincode}
                onChange={handleChange}
                required
                pattern="\d{6}"
                className={`${inputClass} mt-2`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className={labelClass}>
              ORDER NOTES <span className="text-warm-grey/50">(OPTIONAL)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any special instructions"
              value={address.notes}
              onChange={handleChange}
              className={`${inputClass} mt-2 resize-none`}
            />
          </div>

          {error && <p className="text-xs text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={isPending || items.length === 0 || !shippingQuote.canCheckout}
            className="w-full bg-gold px-8 py-4 text-xs font-semibold tracking-[0.2em] text-maroon-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "PROCESSING..." : "PLACE ORDER"}
          </button>
        </div>
      </div>
    </form>
  );
}
