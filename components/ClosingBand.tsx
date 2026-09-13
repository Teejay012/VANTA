"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { ASSETS } from "@/lib/assets";
import MagneticButton from "@/components/ui/MagneticButton";

const SERVICES = [
  ["FAST DELIVERY", "Quick & safe, worldwide"],
  ["EASY RETURNS", "Within 15 days"],
  ["QUALITY ASSURED", "Milled and cut in house"],
  ["SECURE PAYMENT", "100% secure checkout"],
] as const;

/**
 * Closing editorial band and footer. A single full-bleed campaign still with a
 * slow parallax on the image, set against the copy — the visual full stop
 * after the 3D wardrobe.
 */
export default function ClosingBand() {
  const sectionRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // The image travels further than its frame, so the frame acts as a
      // window onto a moving plate.
      gsap.fromTo(
        "[data-closing-media]",
        { yPercent: -8, scale: 1.12 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-closing-frame]",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        },
      );

      gsap.from("[data-closing-line]", {
        yPercent: 110,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
        stagger: 0.09,
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
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
      {/* -- Campaign band -------------------------------------------------- */}
      <div
        data-closing-frame
        className="relative h-[78vh] min-h-[440px] w-full overflow-hidden bg-stone"
      >
        <img
          data-closing-media
          src={ASSETS.editorial}
          alt="VANTA new season campaign"
          className="absolute inset-0 h-full w-full object-cover grayscale will-change-transform"
          draggable={false}
        />

        {/* Copy sits in the frame's negative space; the layer is click-through
            apart from its single call to action. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center px-4 sm:px-8">
          <div className="overflow-hidden">
            <p data-closing-line className="eyebrow mb-6 text-ink">
              NEW SEASON
            </p>
          </div>
          <div className="overflow-hidden">
            <h2 data-closing-line className="display text-[17vw] leading-[0.84] sm:text-[9vw]">
              NEW
            </h2>
          </div>
          <div className="overflow-hidden">
            <h2 data-closing-line className="display text-[17vw] leading-[0.84] sm:text-[9vw]">
              VIBES
            </h2>
          </div>
          <div className="mt-8 overflow-hidden">
            <p data-closing-line className="max-w-xs text-sm font-light leading-relaxed text-ink/80">
              Discover everything new and now.
            </p>
          </div>
          <div className="mt-8">
            <MagneticButton
              href="#categories"
              className="pointer-events-auto bg-ink px-8 py-3.5 text-[10px] tracking-[0.24em] text-bone"
            >
              EXPLORE COLLECTION
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* -- Service strip --------------------------------------------------- */}
      <div
        data-services
        className="grid grid-cols-2 gap-y-10 border-y border-ink/10 bg-stone px-4 py-14 sm:px-8 lg:grid-cols-4"
      >
        {SERVICES.map(([title, copy]) => (
          <div key={title} data-service>
            <p className="eyebrow mb-3">{title}</p>
            <p className="text-xs font-light text-ink/60">{copy}</p>
          </div>
        ))}
      </div>

      {/* -- Footer ---------------------------------------------------------- */}
      <footer className="px-4 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
          <div>
            <p className="display text-5xl tracking-[0.18em] sm:text-7xl">VANTA</p>
            <p className="mt-5 max-w-xs text-xs font-light leading-relaxed text-ink/50">
              Fashion that moves with you. Collection 2026, shot in monochrome.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {[
              ["SHOP", ["Men", "Women", "Kids", "Accessories"]],
              ["HOUSE", ["Atelier", "Materials", "Stockists", "Contact"]],
            ].map(([heading, items]) => (
              <div key={heading as string}>
                <p className="eyebrow mb-5 text-ink/40">{heading}</p>
                <ul className="space-y-2.5 text-xs font-light text-ink/70">
                  {(items as string[]).map((item) => (
                    <li key={item}>
                      <a href="#top" className="transition-opacity hover:opacity-50">
                        {item}
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
