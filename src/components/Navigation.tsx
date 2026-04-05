import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = ["About", "Menu", "Gallery", "Contact"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="font-display font-bold text-lg md:text-xl tracking-tight text-foreground">
            GWC
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-display text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors uppercase"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <button
              onClick={() => navigate('/admin')}
              className="bg-primary text-primary-foreground px-6 py-2 font-display text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              TRY POS
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col gap-6">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="font-display text-lg tracking-wider text-muted-foreground hover:text-foreground transition-colors uppercase"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </a>
              ))}
              <button className="btn-brutal w-full mt-4" onClick={() => { setIsOpen(false); navigate('/admin'); }}>
                TRY POS
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
