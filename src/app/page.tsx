import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import Categories from "@/components/Categories";
import Footer from "@/components/Footer";
import Locations from "@/components/Locations";
import Partners from "@/components/Partners";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      {/* Add spacing for fixed header */}
      <div className="pt-20 md:pt-28" />
      <HeroSlider />
      <Categories />
      <Partners />
      <Locations />
      <Footer />
    </div>
  );
}
