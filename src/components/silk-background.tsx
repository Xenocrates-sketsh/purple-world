import * as React from "react";

import { cn } from "@/lib/cn";
import { SILK_ENABLED } from "@/lib/config";

/** Brand palette, dark → light (baked into a 256-step LUT). */
const PURPLE_SILK = ["#0c0714", "#2e1065", "#6d28d9", "#a855f7", "#e9d5ff"];

/** Rotating palette set — the waves drift through these over time. */
const PALETTE_SET: string[][] = [
  PURPLE_SILK,
  ["#071018", "#0e3a4a", "#0ea5e9", "#818cf8", "#d9f6ff"],
  ["#160a24", "#7c2d12", "#f97316", "#ec4899", "#ffe4ef"],
  ["#04121f", "#123a6d", "#2563eb", "#22d3ee", "#e0f7ff"],
  ["#0e0a1c", "#3b0764", "#9333ea", "#f0abfc", "#fdf4ff"],
];

function randomPalette(except: string[]): string[] {
  const pool = PALETTE_SET.filter((p) => p.join() !== except.join());
  return pool[Math.floor(Math.random() * pool.length)] ?? PURPLE_SILK;
}

type Lut = { r: Uint8Array; g: Uint8Array; b: Uint8Array };

function blendLuts(a: Lut, b: Lut, t: number): Lut {
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const bch = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    r[i] = a.r[i] + (b.r[i] - a.r[i]) * t;
    g[i] = a.g[i] + (b.g[i] - a.g[i]) * t;
    bch[i] = a.b[i] + (b.b[i] - a.b[i]) * t;
  }
  return { r, g, b: bch };
}

/** Noise overlay: feTurbulence SVG inlined as data URI, no network needed. */
const GRAIN_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = Number.parseInt(h, 16);
  if (!Number.isFinite(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildLut(colors: string[]) {
  const stops = (colors.length >= 2 ? colors : [colors[0] ?? "#000", "#fff"]).map(hexToRgb);
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const b = new Uint8Array(256);
  const seg = stops.length - 1;
  for (let i = 0; i < 256; i++) {
    const f = (i / 255) * seg;
    const idx = Math.min(seg - 1, Math.floor(f));
    const t = f - idx;
    const a = stops[idx];
    const c = stops[idx + 1];
    r[i] = a[0] + (c[0] - a[0]) * t;
    g[i] = a[1] + (c[1] - a[1]) * t;
    b[i] = a[2] + (c[2] - a[2]) * t;
  }
  return { r, g, b };
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

interface ShaderWavesProps {
  variant?: string;
  colors?: string[];
  speed?: number;
  scale?: number;
  resolution?: number;
  interactive?: boolean;
  grain?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const PALETTES: Record<string, string[]> = {
  purple: PURPLE_SILK,
};

export function ShaderWaves({
  variant = "purple",
  colors,
  speed = 1,
  scale = 1,
  resolution = 128,
  interactive = false,
  grain = false,
  children,
  className,
}: ShaderWavesProps) {
  const reducedMotion = useReducedMotion();
  const reduced = Boolean(reducedMotion);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const pointerRef = React.useRef({ x: 0, y: 0, active: false });

  const palette = React.useMemo(
    () => (colors && colors.length > 0 ? colors : PALETTES[variant] ?? PURPLE_SILK),
    [colors, variant]
  );
  const paletteKey = palette.join(",");

  const safeSpeed = speed > 0 ? speed : 1;
  const safeScale = scale > 0 ? scale : 1;
  const safeResolution = Math.max(24, Math.min(240, Math.round(resolution)));

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lut = buildLut(paletteKey.split(","));
    // Palette drift: hold each palette ~20s, crossfade over ~5s.
    let lutFrom: Lut = lut;
    let lutTo: Lut = buildLut(randomPalette(paletteKey.split(",")));
    let blend = 1;
    let lastSwitch = performance.now();
    const activeLut = (): Lut => (blend >= 1 ? lutFrom : blendLuts(lutFrom, lutTo, blend));
    const off = document.createElement("canvas");
    const offCtx = off.getContext("2d");
    if (!offCtx) return;

    let width = 0;
    let height = 0;
    let bufW = 0;
    let bufH = 0;
    let image: ImageData | null = null;

    const allocBuffer = () => {
      const ar = width / height || 1;
      if (ar >= 1) {
        bufW = safeResolution;
        bufH = Math.max(1, Math.round(safeResolution / ar));
      } else {
        bufH = safeResolution;
        bufW = Math.max(1, Math.round(safeResolution * ar));
      }
      off.width = bufW;
      off.height = bufH;
      image = offCtx.createImageData(bufW, bufH);
    };

    const renderField = (t: number, ox: number, oy: number) => {
      if (!image) return;
      const cur = activeLut();
      const data = image.data;
      const aspect = bufW / bufH || 1;
      const freq = 3 / safeScale;
      let i = 0;
      for (let py = 0; py < bufH; py++) {
        const ny = ((py / bufH) * 2 - 1) * freq + oy;
        for (let px = 0; px < bufW; px++) {
          const nx = ((px / bufW) * 2 - 1) * aspect * freq + ox;
          const w = Math.sin(nx * 1.3 + t * 0.7) * 0.6;
          const v =
            Math.sin((nx + w) * 2.1 + t * 0.5) +
            Math.sin((ny - w) * 1.8 - t * 0.4) +
            Math.sin(nx * 0.7 + ny * 0.9 + t * 0.6) +
            Math.sin(Math.hypot(nx, ny) * 1.5 - t * 0.45);
          let val = v * 0.125 + 0.5;
          val = val < 0 ? 0 : val > 1 ? 1 : val;
          const idx = (val * 255) | 0;
          data[i++] = cur.r[idx];
          data[i++] = cur.g[idx];
          data[i++] = cur.b[idx];
          data[i++] = 255;
        }
      }
      offCtx.putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(off, 0, 0, bufW, bufH, 0, 0, width, height);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      allocBuffer();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    if (reduced) {
      renderField(0.6, 0, 0);
      return () => ro.disconnect();
    }

    let curX = 0;
    let curY = 0;
    const start = performance.now();
    let prev = start;

    const loop = (now: number) => {
      const dt = Math.min(100, now - prev);
      prev = now;
      const t = ((now - start) / 1000) * safeSpeed;
      if (now - lastSwitch > 15000) {
        lutFrom = activeLut();
        lutTo = buildLut(randomPalette([]));
        if (lutTo === lutFrom) lutTo = buildLut(PURPLE_SILK);
        blend = 0;
        lastSwitch = now;
      }
      if (blend < 1) blend = Math.min(1, blend + dt / 5000);
      const p = pointerRef.current;
      const targetX = p.active ? p.x : 0;
      const targetY = p.active ? p.y : 0;
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      renderField(t, curX * 0.9, curY * 0.9);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
              if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(loop);
              }
            } else if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
          });
    io?.observe(canvas);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      io?.disconnect();
      ro.disconnect();
    };
  }, [paletteKey, safeSpeed, safeScale, safeResolution, reduced]);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = pointerRef.current;
    p.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    p.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    p.active = true;
  }

  function handlePointerLeave() {
    pointerRef.current.active = false;
  }

  return (
    <div
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
      className={cn("relative isolate overflow-hidden bg-[#0c0714]", className)}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-90" />
        {grain && (
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: GRAIN_URL, backgroundSize: "180px 180px" }}
          />
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * App-wide living background: slow heavy purple waves behind everything.
 * Kill-switch: VITE_SILK=off. Honors reduced-motion (static frame).
 */
export function SilkBackground() {
  if (!SILK_ENABLED) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <ShaderWaves
        colors={PURPLE_SILK}
        speed={0.35}
        scale={1.5}
        resolution={128}
        grain
        className="h-full w-full"
      />
    </div>
  );
}
