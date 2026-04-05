import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Menu from "@/components/Menu";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    AOS.init({ duration: 600, once: true, offset: 60 });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <div data-aos="fade-up">
        <About />
      </div>
      <div data-aos="fade-up">
        <Menu />
      </div>
      <div data-aos="fade-up">
        <Contact />
      </div>
      <div data-aos="fade-up">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
