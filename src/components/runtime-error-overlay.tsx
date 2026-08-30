import { useEffect, useState } from "react";

interface Reported {
  kind: "error" | "rejection";
  message: string;
  detail: string;
}

function extractError(value: unknown): string {
  if (value instanceof Error) return value.stack || value.message || String(value);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function RuntimeErrorOverlay() {
  const [reported, setReported] = useState<Reported | null>(null);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (e.message.includes("ResizeObserver")) return;
      setReported({
        kind: "error",
        message: e.message || `Script error (filename: ${e.filename ?? "unknown"})`,
        detail: e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : "",
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      setReported({
        kind: "rejection",
        message: extractError(e.reason),
        detail: "",
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  if (!reported) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        background: "hsl(264 45% 99%)",
        color: "hsl(230 30% 10%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 700 }}>
        Runtime error reported ({reported.kind})
      </p>
      <pre
        style={{
          maxWidth: 720,
          maxHeight: "60vh",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          borderRadius: 8,
          border: "1px solid hsl(0 70% 60%)",
          background: "hsl(0 80% 96%)",
          padding: 16,
          fontSize: 13,
          color: "hsl(0 60% 35%)",
        }}
      >
        {reported.message}
        {reported.detail ? `\n\nat ${reported.detail}` : ""}
      </pre>
      <button
        type="button"
        onClick={() => setReported(null)}
        style={{
          borderRadius: 8,
          background: "hsl(243 75% 59%)",
          color: "#fff",
          border: "none",
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Dismiss (keep browsing)
      </button>
    </div>
  );
}
