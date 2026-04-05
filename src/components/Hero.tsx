import heroCafe from "@/assets/hero-cafe.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-end pb-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroCafe}
          alt="Gods Will Cafe interior with industrial lamps"
          className="w-full h-full object-cover"
        />
        <div className="hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12" data-aos="fade-up">
        <div className="max-w-4xl">
          <p className="text-primary font-display text-sm md:text-base tracking-[0.3em] mb-4 animate-fade-in">
            EST. 2024
          </p>
          <h1 className="text-foreground text-6xl md:text-8xl lg:text-9xl font-display font-bold mb-6 leading-[0.9] animate-fade-in" style={{ animationDelay: "0.1s" }}>
            GODS<br />WILL<br />CAFE
          </h1>
          <p 
            className="text-muted-foreground text-lg md:text-xl max-w-md mb-10 font-sans animate-fade-in" 
            style={{ animationDelay: "0.2s" }}
          >
            Where raw aesthetics meet exceptional coffee. 
            A brutalist sanctuary for the discerning palate.
          </p>
          <div 
            className="flex flex-col sm:flex-row gap-4 animate-fade-in" 
            style={{ animationDelay: "0.3s" }}
          >
            <button className="btn-brutal">
              View Menu
            </button>
            <button className="btn-brutal-outline">
              Find Us
            </button>
          </div>
        </div>
      </div>

      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/30" />
    </section>
  );
};

export default Hero;
