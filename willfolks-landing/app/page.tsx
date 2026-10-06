import { HeroSection } from "./components/HeroSection";
import { HowItWorks } from "./components/HowItWorks";
import { FeatureShowcase } from "./components/FeatureShowcase";
import { DownloadSection } from "./components/DownloadSection";
import { FaqSection } from "./components/FaqSection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <FeatureShowcase />
      <DownloadSection />
      <FaqSection />
    </main>
  );
}
