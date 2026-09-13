"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { ASSETS } from "@/lib/assets";
import TiltCard from "@/components/ui/TiltCard";
import MagneticButton from "@/components/ui/MagneticButton";

const CATEGORIES = [
  {
    title: "MEN",
    copy: "Elevated everyday essentials.",
    image: ASSETS.categoryMen,
    index: "01",
  },
  {
    title: "WOMEN",
    copy: "Effortless style for every you.",
    image: ASSETS.categoryWomen,
    index: "02",
  },
  {
    title: "KIDS",
    copy: "Comfort meets cool, everyday.",
    image: ASSETS.categoryKids,
    index: "03",
  },
  {
    title: "ACCESSORIES",
    copy: "The objects that finish a look.",
    image: ASSETS.categoryAccessories,
    index: "04",
  },
] as const;

/**
 * SECTION 2 — Staggered editorial reveal.
 *
 * Two independent motions are composed per card:
 *
 *   • a one-shot reveal (clip-path wipe + rise) that fires as the row enters,
 *     staggered left-to-right;
 *   • a continuous parallax drift whose travel distance varies per column, so
 *     the row never settles into a single flat plane while you scroll past.
 */
export default function CategoryGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-category-card]");

      /* -- Reveal -------------------------------------------------------- */
      gsap.from(cards, {
        yPercent: 14,
        opacity: 0,
        // Wipes the card open from the bottom edge rather than fading it.
        clipPath: "inset(100% 0% 0% 0%)",
        duration: 1.3,
        ease: "power3.out",
        stagger: 0.11,
        scrollTrigger: {
          trigger: sectionRef.current,
          // Fires while the row is still below the fold, so the wipe completes
          // right as it reaches comfortable reading height.
          start: "top 78%",
          once: true,
        },
      });

      gsap.from("[data-category-heading] > *", {
        yPercent: 110,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true },
      });

      /* -- Per-column parallax ------------------------------------------- */
      cards.forEach((card, i) => {
        // Alternating depths: columns 0 and 2 drift further than 1 and 3.
        const travel = i % 2 === 0 ? 72 : 34;

        gsap.fromTo(
          card,
          { y: travel },
          {
            y: -travel,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          },
        );

        // The image inside drifts against its frame for a second layer of depth.
        const media = card.querySelector("[data-category-media]");
        if (media) {
          gsap.fromTo(
            media,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            },
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="categories"
      ref={sectionRef}
      className="relative z-10 bg-ink px-4 py-24 text-bone sm:px-8 sm:py-32"
    >
      {/* -- Section heading ------------------------------------------------ */}
      <div className="mb-16 flex flex-col gap-8 sm:mb-24 sm:flex-row sm:items-end sm:justify-between">
        <div data-category-heading className="overflow-hidden">
          <p className="eyebrow mb-6 text-smoke">
            <span className="block">SHOP BY CATEGORY</span>
          </p>
          <h2 className="display text-[13vw] leading-[0.85] sm:text-[7vw]">
            <span className="block">THE</span>
          </h2>
          <h2 className="display text-[13vw] leading-[0.85] sm:text-[7vw]">
            <span className="block">WARDROBE</span>
          </h2>
        </div>

        <p className="max-w-xs text-sm font-light leading-relaxed text-smoke">
          Four houses, one language. Every piece cut from the same monochrome
          discipline and built to be worn out of season.
        </p>
      </div>

      {/* -- Cards ---------------------------------------------------------- */}
      <div
        // The perspective lives on the container so all four cards tilt within
        // the same virtual camera.
        className="grid grid-cols-1 gap-x-6 gap-y-14 [perspective:1400px] sm:grid-cols-2 lg:grid-cols-4"
      >
        {CATEGORIES.map((category) => (
          <TiltCard key={category.title} className="group" max={7}>
            <article data-category-card className="will-change-transform">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-soft">
                <img
                  data-category-media
                  src={category.image}
                  alt={`${category.title} collection`}
                  className="h-[114%] w-full -translate-y-[6%] object-cover grayscale transition-transform duration-[1.2s] ease-[var(--ease-editorial)] group-hover:scale-[1.06]"
                  draggable={false}
                />

                {/* Floating index — never intercepts the pointer. */}
                <span
                  data-tilt-layer
                  className="pointer-events-none absolute left-4 top-4 text-[10px] tracking-[0.3em] text-bone/70"
                >
                  {category.index}
                </span>

                {/* Wash that lifts on hover, revealing the full image. */}
                <div className="pointer-events-none absolute inset-0 bg-ink/25 transition-opacity duration-700 group-hover:opacity-0" />
              </div>

              <div data-tilt-layer className="pointer-events-none mt-6">
                <h3 className="display text-2xl">{category.title}</h3>
                <p className="mt-2 text-xs font-light leading-relaxed text-smoke">
                  {category.copy}
                </p>
              </div>

              <div className="mt-5">
                <MagneticButton
                  href="#wardrobe"
                  className="border-b border-bone/30 pb-1.5 text-[10px] tracking-[0.24em] text-bone transition-colors hover:border-bone"
                >
                  SHOP {category.title}
                  <span aria-hidden className="translate-y-px">
                    &#8594;
                  </span>
                </MagneticButton>
              </div>
            </article>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
