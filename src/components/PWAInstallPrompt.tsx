import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://"));

const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const isInstalled = () => {
  if (typeof window === "undefined") return true;
  return isStandalone();
};

type DeferredPrompt = { prompt: () => Promise<{ outcome: string }> };

interface PWAInstallContextType {
  isInstalled: boolean;
  showInstallModal: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

export const usePWAInstall = () => {
  const ctx = useContext(PWAInstallContext);
  return ctx;
};

export const PWAInstallButton = ({ className, children }: { className?: string; children?: ReactNode }) => {
  const ctx = usePWAInstall();
  if (!ctx || ctx.isInstalled) return null;
  return (
    <button
      onClick={ctx.showInstallModal}
      className={className}
      type="button"
    >
      {children ?? "Add to Home Screen"}
    </button>
  );
};

interface PWAInstallPromptProps {
  children?: ReactNode;
}

export const PWAInstallPrompt = ({ children }: PWAInstallPromptProps) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt | null>(null);
  const installed = isInstalled();

  useEffect(() => {
    if (installed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as DeferredPrompt);
    };

    window.addEventListener("beforeinstallprompt", handler);
    setShowBanner(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [installed]);

  const showInstallModal = () => setShowModal(true);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setShowModal(false);
      setShowBanner(false);
    }
  };

  const handleDismissBanner = () => {
    sessionStorage.setItem("pwa-install-dismissed", "true");
    setShowBanner(false);
  };

  const InstallContent = () => (
    <div className="space-y-4">
      {isIOS() ? (
        <>
          <p className="text-sm text-muted-foreground">
            To add God's Will Cafe to your home screen:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
            <li>Tap the <Share className="inline h-4 w-4 mx-1" /> Share button in your browser (Safari address bar or menu)</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
            <li>Tap <strong>Add</strong> in the top right</li>
          </ol>
        </>
      ) : deferredPrompt ? (
        <Button onClick={handleInstall} className="w-full" size="lg">
          <Download className="h-5 w-5 mr-2" />
          Add to Home Screen
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Look for the install option in your browser menu (⋮ or …) → &quot;Install app&quot; or &quot;Add to Home screen&quot;.
        </p>
      )}
    </div>
  );

  return (
    <PWAInstallContext.Provider value={{ isInstalled: installed, showInstallModal }}>
      {children}
      {/* Banner - only when not installed */}
      {!installed && showBanner && !sessionStorage.getItem("pwa-install-dismissed") && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-4 shadow-lg animate-fade-in-up"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-display font-medium text-foreground text-sm">
                Add to Home Screen
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isIOS()
                  ? "Tap the button to see how."
                  : "Install for quick access and a better experience."}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => setShowModal(true)}
                className="touch-target"
              >
                <Download className="h-4 w-4 mr-2" />
                Add to Home Screen
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 touch-target" onClick={handleDismissBanner}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Install Modal - available via footer button or banner */}
      {!installed && (
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Add to Home Screen</DialogTitle>
            <DialogDescription>
              Install God's Will Cafe as an app on your device.
            </DialogDescription>
          </DialogHeader>
          <InstallContent />
        </DialogContent>
      </Dialog>
      )}
    </PWAInstallContext.Provider>
  );
};
