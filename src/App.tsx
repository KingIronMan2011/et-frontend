import { AboutSection } from "./components/AboutSection";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { CommunitySection } from "./components/CommunitySection";
import { FeaturesSection } from "./components/FeaturesSection";
import { Footer } from "./components/Footer";
import { GallerySection } from "./components/GallerySection";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ProductsSection } from "./components/ProductsSection";
import { VideoSection } from "./components/VideoSection";

function App() {
  return (
    <>
      <BackgroundEffects />
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <GallerySection />
        <VideoSection />
        <ProductsSection />
        <CommunitySection />
        <AboutSection />
      </main>
      <Footer />
    </>
  );
}

export default App;
