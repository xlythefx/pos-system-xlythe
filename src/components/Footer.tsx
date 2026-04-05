import { PWAInstallButton } from "./PWAInstallPrompt";

const Footer = () => {
  return (
    <footer className="py-12 bg-charcoal border-t border-border">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="font-display font-bold text-2xl tracking-tight text-foreground">
            GODS WILL CAFE
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 md:gap-8">
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-display tracking-wider uppercase">
              About
            </a>
            <a href="#menu" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-display tracking-wider uppercase">
              Menu
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-display tracking-wider uppercase">
              Contact
            </a>
            <PWAInstallButton className="text-primary hover:text-primary/80 transition-colors text-sm font-display tracking-wider uppercase">
              Add to Home Screen
            </PWAInstallButton>
          </div>

          {/* Copyright */}
          <p className="text-muted-foreground text-sm font-sans">
            © 2024 Gods Will Cafe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
