import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminPOS from "./pages/admin/AdminPOS";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminInventory from "./pages/admin/AdminInventory";
import { POSProvider } from "./contexts/POSContext";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <POSProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PWAInstallPrompt>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<AdminPOS />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </PWAInstallPrompt>
        </BrowserRouter>
      </TooltipProvider>
    </POSProvider>
  </QueryClientProvider>
);

export default App;
