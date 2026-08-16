"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitBatchOrderEnquiry } from "@/app/batch-orders/actions";

const inputClass =
  "w-full border border-cream/20 bg-transparent px-4 py-3 text-sm text-cream placeholder:text-warm-grey/60 outline-none transition-colors focus:border-gold";

const labelClass = "text-xs tracking-[0.2em] text-warm-grey";

const PRODUCT_OPTIONS = [
  "T-Shirts",
  "Tracksuits",
  "Sweatshirts",
  "Caps",
  "Mugs",
  "Ties",
  "Not sure yet",
];

type FormState = {
  name: string;
  phone: string;
  email: string;
  batchOrChapter: string;
  eventDate: string;
  headcount: string;
  products: string[];
  notes: string;
  company: string; // honeypot
};

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  batchOrChapter: "",
  eventDate: "",
  headcount: "",
  products: [],
  notes: "",
  company: "",
};

export default function BatchOrderForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleProduct(product: string) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter((p) => p !== product)
        : [...prev.products, product],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await submitBatchOrderEnquiry(form);
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setSubmitted(true);
      toast.success("Enquiry sent — we'll be in touch soon.");
    });
  }

  if (submitted) {
    return (
      <div className="border border-gold/20 px-8 py-16 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-gold">
          ENQUIRY RECEIVED
        </p>
        <h3 className="mt-4 font-display text-3xl text-cream">
          Thank you.
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm text-warm-grey">
          We've received your batch order enquiry and will reach out with
          pricing and next steps shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot field — hidden from real users via CSS, not display:none
          (some bots skip hidden fields entirely) */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.company}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          FULL NAME
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Arjun Singh"
          value={form.name}
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
            value={form.phone}
            onChange={handleChange}
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
            value={form.email}
            onChange={handleChange}
            className={`${inputClass} mt-2`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="batchOrChapter" className={labelClass}>
          BATCH YEAR / CHAPTER / OBA EVENT
        </label>
        <input
          id="batchOrChapter"
          name="batchOrChapter"
          type="text"
          placeholder="e.g. Batch of 2010, Chandigarh Chapter Meet"
          value={form.batchOrChapter}
          onChange={handleChange}
          required
          className={`${inputClass} mt-2`}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="eventDate" className={labelClass}>
            EVENT DATE <span className="text-warm-grey/50">(IF KNOWN)</span>
          </label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            value={form.eventDate}
            onChange={handleChange}
            className={`${inputClass} mt-2`}
          />
        </div>
        <div>
          <label htmlFor="headcount" className={labelClass}>
            APPROX. HEADCOUNT
          </label>
          <input
            id="headcount"
            name="headcount"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 30"
            value={form.headcount}
            onChange={handleChange}
            className={`${inputClass} mt-2`}
          />
        </div>
      </div>

      <div>
        <p className={labelClass}>PRODUCTS INTERESTED IN</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRODUCT_OPTIONS.map((product) => (
            <button
              key={product}
              type="button"
              onClick={() => toggleProduct(product)}
              aria-pressed={form.products.includes(product)}
              className={`border px-3 py-1.5 text-xs tracking-[0.1em] transition-colors ${
                form.products.includes(product)
                  ? "border-gold bg-gold text-maroon-dark"
                  : "border-gold/30 text-warm-grey hover:border-gold hover:text-cream"
              }`}
            >
              {product}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          ANY NOTES <span className="text-warm-grey/50">(OPTIONAL)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Design ideas, colours, deadline, anything else we should know"
          value={form.notes}
          onChange={handleChange}
          className={`${inputClass} mt-2 resize-none`}
        />
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-gold px-8 py-4 text-xs font-semibold tracking-[0.2em] text-maroon-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "SENDING..." : "SUBMIT ENQUIRY"}
      </button>
    </form>
  );
}
