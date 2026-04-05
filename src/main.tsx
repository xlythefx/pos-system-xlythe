import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <App />
  </ThemeProvider>
);
