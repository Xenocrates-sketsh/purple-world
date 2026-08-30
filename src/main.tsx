import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import { ErrorBoundary } from "./components/error-boundary";
import { RuntimeErrorOverlay } from "./components/runtime-error-overlay";
import "./index.css";

const PW_BUILD_STAMP = "2026-08-19b";
if (import.meta.env.PROD) {
  document.documentElement.dataset.build = PW_BUILD_STAMP;
}

try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RuntimeErrorOverlay />
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
} catch (e: unknown) {
  // DEBUG: top-level render threw before ErrorBoundary could catch it.
  const err = e as Error;
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML =
      '<pre style="position:fixed;inset:0;z-index:2147483647;margin:0;padding:16px;background:#fff5f5;color:#7a0000;border:none;font:13px/1.5 ui-monospace,monospace;white-space:pre-wrap;overflow:auto;">' +
      "TOP-LEVEL RENDER CRASH\n\n" +
      (err?.name || "Error") + ": " + (err?.message || String(err)) +
      "\n\n" + (err?.stack || "") +
      "</pre>";
  }
  throw e;
}