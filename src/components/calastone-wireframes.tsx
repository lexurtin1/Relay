"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";

/** Golden-ratio icosahedron vertices (unit sphere). */
const PHI = (1 + Math.sqrt(5)) / 2;
const RAW: Array<[number, number, number]> = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
];

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

const VERTS = RAW.map(normalize);

/** Icosahedron edge pairs by vertex index. */
const EDGES: Array<[number, number]> = [
  [0, 1],
  [0, 5],
  [0, 7],
  [0, 10],
  [0, 11],
  [1, 5],
  [1, 7],
  [1, 8],
  [1, 9],
  [2, 3],
  [2, 4],
  [2, 6],
  [2, 10],
  [2, 11],
  [3, 4],
  [3, 6],
  [3, 8],
  [3, 9],
  [4, 5],
  [4, 9],
  [4, 11],
  [5, 9],
  [5, 11],
  [6, 7],
  [6, 8],
  [6, 10],
  [7, 8],
  [7, 10],
  [8, 9],
  [10, 11],
];

type Pt3 = [number, number, number];

function rotateY(v: Pt3, a: number): Pt3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

function rotateX(v: Pt3, a: number): Pt3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

function project(
  v: Pt3,
  cx: number,
  cy: number,
  scale: number,
): { x: number; y: number; z: number } {
  const perspective = 3.2;
  const z = v[2] + perspective;
  const f = (scale * perspective) / z;
  return { x: cx + v[0] * f, y: cy + v[1] * f, z: v[2] };
}

export function CalastoneWireframes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let start = performance.now();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const drawPoly = (
      cx: number,
      cy: number,
      scale: number,
      rotY: number,
      rotX: number,
      teal: string,
      blue: string,
      lineWidth: number,
    ) => {
      const pts = VERTS.map((v) => project(rotateX(rotateY(v, rotY), rotX), cx, cy, scale));
      for (const [a, b] of EDGES) {
        const p0 = pts[a];
        const p1 = pts[b];
        if (!p0 || !p1) continue;
        const depth = (p0.z + p1.z) / 2;
        const t = Math.min(1, Math.max(0, (depth + 1) / 2));
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = mixHex(teal, blue, t);
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    const frame = (now: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const elapsed = (now - start) / 1000;
      const angle = reduceMotion ? 0.35 : elapsed * 0.12;
      const drift = reduceMotion ? 0 : Math.sin(elapsed * 0.2) * 8;

      const styles = getComputedStyle(document.documentElement);
      const teal = styles.getPropertyValue("--relay-wire-teal").trim() || "#80cbc4";
      const blue = styles.getPropertyValue("--relay-wire-blue").trim() || "#1e88e5";
      const opacity = Number(styles.getPropertyValue("--relay-wire-opacity").trim() || "0.12");

      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = opacity;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Upper polyhedron: teal-to-blue behind the Overview KPI band
      drawPoly(
        w * 0.58 + drift,
        h * 0.16,
        Math.min(w, h) * 0.28,
        angle,
        angle * 0.6,
        teal,
        blue,
        1.45,
      );

      // Mid-right companion hexagon
      drawPoly(
        w * 0.88 - drift * 0.35,
        h * 0.4,
        Math.min(w, h) * 0.18,
        -angle * 0.7,
        angle * 0.35 + 0.2,
        teal,
        blue,
        1.2,
      );

      // Lower crop (partially off-screen)
      drawPoly(
        w * 0.36 - drift * 0.5,
        h * 1.04,
        Math.min(w, h) * 0.32,
        -angle * 0.85,
        angle * 0.4 + 0.4,
        teal,
        blue,
        1.25,
      );

      ctx.globalAlpha = 1;
      if (!reduceMotion) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.trim().replace("#", "");
  if (h.length === 3) {
    return [
      parseInt(h[0]! + h[0]!, 16),
      parseInt(h[1]! + h[1]!, 16),
      parseInt(h[2]! + h[2]!, 16),
    ];
  }
  if (h.length === 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return null;
}
