import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { PhoneShowcase } from "./components/PhoneShowcase";
import { DownloadSection } from "./components/DownloadSection";
import { FaqSection } from "./components/FaqSection";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <PhoneShowcase />
        <DownloadSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
