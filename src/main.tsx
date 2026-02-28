import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { WorkersProvider } from "@/contexts/WorkersContext"; // adjust path if needed

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WorkersProvider>
      <App />
    </WorkersProvider>
  </StrictMode>,
);
