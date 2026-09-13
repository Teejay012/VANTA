"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { ASSETS } from "@/lib/assets";
import MagneticButton from "@/components/ui/MagneticButton";
import HoverText from "@/components/ui/HoverText";
import EditorialImage from "@/components/ui/EditorialImage";
import Marquee from "@/components/ui/Marquee";

const SERVICES = [
  ["FAST DELIVERY", "Quick & safe, worldwide"],
  ["EASY RETURNS", "Within 15 days"],
  ["QUALITY ASSURED", "Milled and cut in house"],
  ["SECURE PAYMENT", "100% secure checkout"],
] as const;

const FOOTER_LINKS = [
  ["SHOP", ["Men", "Women", "Kids", "Accessories"]],
  ["HOUSE", ["Atelier", "Materials", "Stockists", "Contact"]],
] as const;

/**
 * SECTION 5 — the closing campaign spread.
 *
 * Built as a layered editorial page rather than a banner: the two words of the
 * headline sit on *different planes*, with the landscape plate wedged between
 * them, so "NEW" is occluded by the photograph while "VIBES" crosses in front
 * of it. A portrait plate offset below on a slower parallax gives the spread a
 * third depth, and a scroll-reactive ticker runs the seam between them.
 *
 * That interleaving is the whole idea — flat type over a flat image is what
 * makes a campaign band read as a stock hero.
 */
export default function ClosingBand() {
  const sectionRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Each plate travels at its own rate; the gap between those rates is
      // what the eye reads as depth.
      gsap.fromTo(
        "[data-plate='wide']",
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-spread]",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        },
      );

      gsap.fromTo(
        "[data-plate='tall']",
        { yPercent: 14 },
        {
          yPercent: -14,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-spread]",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.4,
          },
        },
      );

      // The two headline words arrive from opposite edges and settle.
      gsap.from("[data-word='new']", {
        xPercent: -14,
        opacity: 0,
        duration: 1.4,
        ease: "power4.out",
        scrollTrigger: { trigger: "[data-spread]", start: "top 72%", once: true },
      });
      gsap.from("[data-word='vibes']", {
        xPercent: 14,
        opacity: 0,
        duration: 1.4,
        ease: "power4.out",
        scrollTrigger: { trigger: "[data-spread]", start: "top 72%", once: true },
      });

      gsap.from("[data-closing-line]", {
        yPercent: 110,
        opacity: 0,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.09,
        scrollTrigger: { trigger: "[data-spread]", start: "top 62%", once: true },
      });

      gsap.from("[data-service]", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-services]", start: "top 88%", once: true },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 bg-bone text-ink">
      {/* -- Ticker: reacts to scroll speed and direction ------------------- */}
      <Marquee className="border-y border-ink/10 bg-ink py-4 text-bone">
        {["NEW SEASON", "COLLECTION 2026", "SHOT IN MONOCHROME", "VANTA"].map(
          (word) => (
            <span
              key={word}
              className="flex items-center gap-8 whitespace-nowrap px-8 text-[11px] tracking-[0.32em]"
            >
              {word}
              <span className="inline-block h-1 w-1 rounded-full bg-bone/50" />
            </span>
          ),
        )}
      </Marquee>

      {/* -- The spread ------------------------------------------------------ */}
      <div data-spread className="relative overflow-hidden px-4 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-28">
        <div className="relative mx-auto max-w-[1400px]">
          {/* Plane 1 — "NEW" sits behind the landscape plate. */}
          <h2
            data-word="new"
            className="display relative z-0 text-[26vw] leading-[0.78] text-ink sm:text-[17vw]"
          >
            NEW
          </h2>

          {/* Plane 2 — the wide plate, overlapping the word above it. */}
          <div
            data-plate="wide"
            className="relative z-10 -mt-[6vw] ml-auto w-[86%] will-change-transform sm:-mt-[5vw] sm:w-[62%]"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-stone">
              <EditorialImage
                src={ASSETS.editorial}
                alt="VANTA new season campaign"
                wrapperClassName="h-full w-full"
                className="h-full w-full object-cover grayscale transition-transform duration-[1.4s] ease-[var(--ease-editorial)] hover:scale-105"
              />
              {/* Lifts the plate's lower edge towards the paper so the word
                  crossing in front of it keeps its contrast. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bone/85 to-transparent" />
            </div>
          </div>

          {/* Plane 3 — "VIBES" crosses in front of the plate. */}
          <h2
            data-word="vibes"
            className="display relative z-20 -mt-[9vw] text-[26vw] leading-[0.78] text-ink sm:-mt-[6vw] sm:text-[17vw]"
          >
            VIBES
          </h2>

          {/* -- Copy column and the offset portrait plate ------------------- */}
          <div className="mt-8 flex flex-col gap-10 sm:mt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-16">
            <div className="max-w-sm">
              <div className="overflow-hidden">
                <p data-closing-line className="eyebrow mb-5 text-ink/60">
                  NEW SEASON
                </p>
              </div>
              <div className="overflow-hidden">
                <p
                  data-closing-line
                  className="text-base font-light leading-relaxed text-ink/80"
                >
                  Everything new and now — cut from the same monochrome
                  discipline, built to be worn long after the campaign is over.
                </p>
              </div>
              <div className="mt-8">
                <MagneticButton
                  href="#categories"
                  className="bg-ink px-8 py-4 text-[10px] tracking-[0.24em] text-bone"
                >
                  <HoverText>EXPLORE COLLECTION</HoverText>
                </MagneticButton>
              </div>
            </div>

            <div
              data-plate="tall"
              className="w-[62%] self-end will-change-transform sm:w-[26%] sm:self-start"
            >
              <div className="aspect-[3/4] overflow-hidden bg-stone">
                <EditorialImage
                  src={ASSETS.editorialPortrait}
                  alt="VANTA campaign portrait"
                  wrapperClassName="h-full w-full"
                  className="h-full w-full object-cover grayscale transition-transform duration-[1.4s] ease-[var(--ease-editorial)] hover:scale-105"
                />
              </div>
              <p className="eyebrow mt-4 text-ink/50">FIG. 02 — THE COAT</p>
            </div>
          </div>
        </div>
      </div>

      {/* -- Service strip --------------------------------------------------- */}
      <div
        data-services
        className="grid grid-cols-2 gap-y-10 border-y border-ink/10 bg-stone px-4 py-14 sm:px-8 lg:grid-cols-4"
      >
        {SERVICES.map(([title, copy]) => (
          <div key={title} data-service className="group/service">
            <HoverText className="eyebrow mb-3 block">{title}</HoverText>
            <p className="text-xs font-light text-ink/60 transition-colors duration-500 group-hover/service:text-ink">
              {copy}
            </p>
          </div>
        ))}
      </div>

      {/* -- Footer ---------------------------------------------------------- */}
      <footer className="px-4 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div>
            <HoverText
              as="p"
              className="display text-[16vw] leading-none tracking-[0.14em] sm:text-7xl"
              stagger={0.04}
            >
              VANTA
            </HoverText>
            <p className="mt-5 max-w-xs text-xs font-light leading-relaxed text-ink/50">
              Fashion that moves with you. Collection 2026, shot in monochrome.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {FOOTER_LINKS.map(([heading, items]) => (
              <div key={heading}>
                <p className="eyebrow mb-5 text-ink/40">{heading}</p>
                <ul className="space-y-3 text-xs font-light text-ink/70">
                  {items.map((item) => (
                    <li key={item}>
                      <a href="#top" className="inline-block">
                        <HoverText>{item}</HoverText>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rule mt-14" />
        <p className="mt-6 text-[10px] tracking-[0.22em] text-ink/40">
          &copy; 2026 VANTA — ALL RIGHTS RESERVED
        </p>
      </footer>
    </section>
  );
}
