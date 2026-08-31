import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import { ErrorBoundary } from "./components/error-boundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);