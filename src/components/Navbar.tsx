"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, User, ChevronDown } from "lucide-react";
import CartIcon from "@/components/cart/CartIcon";

const navLinks = [
  { label: "HOME", href: "/" },
  { label: "SHOP", href: "/shop" },
  { label: "BATCH ORDERS", href: "/batch-orders" },
  { label: "COMMUNITY", href: "/community" },
  { label: "TRACK ORDER", href: "/track-order" },
];

function checkAuth(): boolean {
  return (
    typeof document !== "undefined" &&
    document.cookie.split(";").some((c) => c.trim() === "ssk_auth=1")
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // Defer cookie read out of the effect body to avoid cascading renders.
  // setTimeout(0) pushes the setState call to the next task, satisfying the
  // react-hooks/set-state-in-effect rule while still being client-only.
  useEffect(() => {
    const id = setTimeout(() => {
      setLoggedIn(checkAuth());
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-maroon-dark">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4">
          <span className="hidden h-10 w-px bg-gold/40 sm:block" aria-hidden="true" />
          <div className="leading-tight">
            <p className="font-display text-xl font-bold tracking-wide text-cream sm:text-2xl">
              Sainik School Kapurthala
            </p>
            <p className="text-[10px] tracking-[0.2em] text-warm-grey">
              ALUMNI MERCHANDISE
            </p>
          </div>
        </div>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-3 text-xs tracking-[0.2em] text-cream/90 lg:flex">
          {navLinks.map((link, i) => (
            <li key={link.label} className="flex items-center gap-3">
              <Link href={link.href} className="transition-colors hover:text-gold">
                {link.label}
              </Link>
              {i < navLinks.length - 1 && (
                <span className="text-gold/40">·</span>
              )}
            </li>
          ))}
        </ul>

        {/* Desktop right side */}
        <div className="hidden items-center gap-4 lg:flex">
          <CartIcon />

          {loggedIn ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs tracking-[0.2em] text-cream transition-colors hover:text-gold"
              >
                <User size={15} />
                ACCOUNT
                <ChevronDown
                  size={12}
                  className={`transition-transform ${accountOpen ? "rotate-180" : ""}`}
                />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 border border-gold/20 bg-maroon-dark shadow-xl">
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-3 text-xs tracking-[0.15em] text-warm-grey transition-colors hover:text-cream"
                  >
                    MY ORDERS
                  </Link>
                  <div className="border-t border-gold/10" />
                  <form method="POST" action="/auth/logout">
                    <button
                      type="submit"
                      className="block w-full px-4 py-3 text-left text-xs tracking-[0.15em] text-warm-grey transition-colors hover:text-cream"
                    >
                      LOGOUT
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs tracking-[0.2em] text-cream transition-colors hover:text-gold"
            >
              SIGN IN
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="text-cream lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-gold/20 bg-maroon-dark px-6 py-6 lg:hidden">
          <ul className="flex flex-col gap-4 text-xs tracking-[0.2em] text-cream/90">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="transition-colors hover:text-gold"
              >
                CART
              </Link>
            </li>

            {loggedIn ? (
              <>
                <li>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="transition-colors hover:text-gold"
                  >
                    MY ORDERS
                  </Link>
                </li>
                <li className="pt-2">
                  <form method="POST" action="/auth/logout">
                    <button
                      type="submit"
                      className="text-gold transition-colors hover:text-cream"
                    >
                      LOGOUT
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <li className="pt-2">
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="text-gold transition-colors hover:text-cream"
                >
                  SIGN IN
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
