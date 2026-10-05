import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply the saved dark mode choice before first paint to avoid a flash.
try {
  if (localStorage.getItem("nutrigen_dark_mode") === "1") {
    document.documentElement.classList.add("dark");
  }
} catch {
  // storage unavailable: stay on the light theme
}

createRoot(document.getElementById("root")!).render(<App />);
