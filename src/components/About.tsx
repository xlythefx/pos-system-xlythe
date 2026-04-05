import { Coffee, Lamp, Clock } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: Coffee,
      title: "Single Origin",
      description: "Ethically sourced beans from the world's finest regions, roasted in-house weekly."
    },
    {
      icon: Lamp,
      title: "Industrial Design",
      description: "Raw concrete meets warm Edison lighting. A space designed to inspire contemplation."
    },
    {
      icon: Clock,
      title: "Open 24 Hours",
      description: "We never close. Day or night, your perfect cup is always waiting for you."
    }
  ];

  return (
    <section id="about" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-20" data-aos="fade-right">
          <div>
            <p className="text-primary font-display text-sm tracking-[0.3em] mb-4">
              OUR PHILOSOPHY
            </p>
            <h2 className="text-foreground">
              RAW.<br />REAL.<br />REFINED.
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Gods Will Cafe emerged from a singular vision: to create a space where 
              brutalist architecture and artisanal coffee culture collide. No pretense. 
              No excess. Just pure, uncompromising quality in every cup and every corner.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="brutal-line mb-20" />

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12" data-aos="fade-up">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="brutal-card group hover:border-primary transition-colors"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <feature.icon 
                className="w-8 h-8 text-primary mb-6 group-hover:scale-110 transition-transform" 
                strokeWidth={1.5}
              />
              <h3 className="text-foreground mb-4">{feature.title}</h3>
              <p className="text-muted-foreground font-sans leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
