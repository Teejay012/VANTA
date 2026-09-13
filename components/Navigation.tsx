"use client";

import { useEffect, useState } from "react";

const PRIMARY = ["MEN", "WOMEN", "KIDS", "BEAUTY"];
const UTILITY = ["SEARCH", "LOGIN", "WISHLIST", "CART (0)"];

/**
 * The fixed chrome: an announcement rail and the main bar.
 *
 * The bar inverts to matte black once the runway hero has been scrolled past,
 * so it stays legible over both the stone hero and the dark sections below.
 */
export default function Navigation() {
  const [inverted, setInverted] = useState(false);

  useEffect(() => {
    // Cheap scroll listener rather than a ScrollTrigger — this only needs a
    // single boolean and should keep working if GSAP is still loading.
    const onScroll = () => setInverted(window.scrollY > window.innerHeight * 2.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Announcement rail */}
      <div className="flex items-center justify-between bg-ink px-4 py-2 text-[9px] tracking-[0.25em] text-bone sm:px-8 sm:text-[10px]">
        <span>FREE DELIVERY ON ORDERS ABOVE $199</span>
        <span className="hidden gap-6 sm:flex">
          <span>DOWNLOAD APP</span>
          <span aria-hidden>|</span>
          <span>TRACK ORDER</span>
          <span aria-hidden>|</span>
          <span>HELP</span>
        </span>
      </div>

      {/* Main bar */}
      <nav
        className={`flex items-center justify-between px-4 py-5 transition-colors duration-500 sm:px-8 ${
          inverted ? "bg-ink/90 text-bone backdrop-blur-md" : "text-ink"
        }`}
      >
        <ul className="hidden gap-7 text-[10px] tracking-[0.22em] md:flex">
          {PRIMARY.map((item) => (
            <li key={item}>
              <a href="#categories" className="transition-opacity hover:opacity-50">
                {item}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile: a single condensed entry point keeps the bar uncluttered. */}
        <span className="text-[10px] tracking-[0.22em] md:hidden">MENU</span>

        <a
          href="#top"
          className="display text-xl tracking-[0.32em] sm:text-2xl"
          aria-label="VANTA — home"
        >
          VANTA
        </a>

        <ul className="hidden gap-6 text-[10px] tracking-[0.22em] md:flex">
          {UTILITY.map((item) => (
            <li key={item}>
              <a href="#wardrobe" className="transition-opacity hover:opacity-50">
                {item}
              </a>
            </li>
          ))}
        </ul>

        <span className="text-[10px] tracking-[0.22em] md:hidden">CART (0)</span>
      </nav>
    </header>
  );
}
