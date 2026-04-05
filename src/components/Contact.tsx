import { MapPin, Phone, Mail, Instagram } from "lucide-react";

const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      label: "Location",
      value: "Pantok, Binangonan, Rizal",
      href: "https://maps.google.com/?q=Pantok+Binangonan+Rizal"
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+1 (718) 555-0142",
      href: "tel:+17185550142"
    },
    {
      icon: Mail,
      label: "Email",
      value: "hello@godswillcafe.com",
      href: "mailto:hello@godswillcafe.com"
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: "@godswillcafe",
      href: "https://instagram.com/godswillcafe"
    }
  ];

  return (
    <section id="contact" className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-16 md:gap-20" data-aos="fade-up">
          {/* Left: Info */}
          <div>
            <p className="text-primary font-display text-sm tracking-[0.3em] mb-4">
              FIND US
            </p>
            <h2 className="text-foreground mb-8">
              VISIT<br />THE SPACE
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-12">
              Located in Pantok, Binangonan, Rizal. Open 24 hours, 7 days a week — 
              your favorite coffee spot is always ready for you.
            </p>

            {/* Contact Info */}
            <div className="space-y-6">
              {contactInfo.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-start gap-4 group"
                >
                  <item.icon 
                    className="w-5 h-5 text-primary mt-1 group-hover:scale-110 transition-transform" 
                    strokeWidth={1.5} 
                  />
                  <div>
                    <p className="text-muted-foreground text-sm font-display tracking-wider uppercase">
                      {item.label}
                    </p>
                    <p className="text-foreground font-sans group-hover:text-primary transition-colors">
                      {item.value}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Right: Hours */}
          <div className="brutal-card h-fit">
            <h3 className="text-primary mb-8 pb-4 border-b border-border">
              HOURS
            </h3>
            <div className="space-y-4 font-sans">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monday — Sunday</span>
                <span className="text-foreground font-semibold">24 Hours</span>
              </div>
            </div>

            <div className="brutal-line my-8" />

            <p className="text-muted-foreground text-sm mb-6">
              Reservations recommended for groups of 6+
            </p>
            <button className="btn-brutal w-full">
              Make a Reservation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
