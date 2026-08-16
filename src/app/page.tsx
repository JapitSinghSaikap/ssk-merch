import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Heritage from "@/components/Heritage";
import ShopShowcase from "@/components/ShopShowcase";
import BatchOrdersBanner from "@/components/BatchOrdersBanner";
import WhyMerchExists from "@/components/WhyMerchExists";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Heritage />
        <ShopShowcase />
        <BatchOrdersBanner />
        <WhyMerchExists />
      </main>
      <Footer />
    </div>
  );
}
