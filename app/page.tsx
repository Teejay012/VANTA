import Navigation from "@/components/Navigation";
import RunwayHero from "@/components/RunwayHero";
import CategoryGrid from "@/components/CategoryGrid";
import FabricSection from "@/components/FabricSection";
import WardrobeSection from "@/components/WardrobeSection";
import ClosingBand from "@/components/ClosingBand";

/**
 * The landing page, read top to bottom:
 *
 *   1. RunwayHero     — 300vh scroll-scrubbed runway, two models, one pin.
 *   2. CategoryGrid   — staggered editorial reveal, tilt + magnetic controls.
 *   3. FabricSection  — WebGL cloth that unrolls as the campaign copy lands.
 *   4. WardrobeSection— drag-to-rotate 3D pieces with material inspection.
 *   5. ClosingBand    — campaign still, services, footer.
 */
export default function Home() {
  return (
    <main className="relative">
      <Navigation />
      <RunwayHero />
      <CategoryGrid />
      <FabricSection />
      <WardrobeSection />
      <ClosingBand />
    </main>
  );
}
