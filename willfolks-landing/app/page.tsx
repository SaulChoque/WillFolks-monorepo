import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { PhoneShowcase } from "./components/PhoneShowcase";
import { DownloadSection } from "./components/DownloadSection";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <PhoneShowcase />
        <DownloadSection />
      </main>
      <Footer />
    </>
  );
}
