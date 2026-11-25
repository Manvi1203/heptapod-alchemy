import React, { useEffect, useRef, useState } from "react";
import { SmokeRing } from "@paper-design/shaders-react";
import { LexemeSegment, SentenceAnalysis } from "../engine";

interface Props {
  analysis: SentenceAnalysis;
  isSlop: boolean;
  aiProb: number;
  showAnatomy: boolean;
  darkMode: boolean;
  onHoverChange?: (seg: LexemeSegment | null) => void;
  canvasRefOut?: React.RefObject<HTMLCanvasElement | null>;
}

export const LogogramCanvas: React.FC<Props> = ({
  analysis,
  isSlop,
  aiProb,
  showAnatomy,
  darkMode,
  onHoverChange,
  canvasRefOut,
}) => {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = canvasRefOut || internalRef;
  const mouseRef = useRef({ x: -999, y: -999, active: false });
  const hoveredRef = useRef<LexemeSegment | null>(null);
  const [hovered, setHovered] = useState<LexemeSegment | null>(null);

  useEffect(() => {
    let raf = 0;
    const render = (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        raf = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(300, Math.floor(rect.width));
      const h = Math.max(300, Math.floor(rect.height));
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.29;
      const ink = darkMode ? "#f3efe6" : "#141413";
      const accent = "#c83b28";
      const muted = darkMode ? "rgba(243,239,230,0.22)" : "rgba(20,20,19,0.16)";

      let nearest: LexemeSegment | null = null;
      if (mouseRef.current.active && analysis.segments.length > 0) {
        const dx = mouseRef.current.x - cx;
        const dy = mouseRef.current.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > baseR * 0.45 && dist < baseR * 1.65) {
          const mAng = Math.atan2(dy, dx);
          let best = 999;
          for (const seg of analysis.segments) {
            const diff = Math.abs(Math.atan2(Math.sin(mAng - seg.angle), Math.cos(mAng - seg.angle)));
            if (diff < best) {
              best = diff;
              nearest = seg;
            }
          }
        }
      }
      if (nearest !== hoveredRef.current) {
        hoveredRef.current = nearest;
        setHovered(nearest);
        onHoverChange?.(nearest);
      }

      if (isSlop) {
        const count = Math.max(24, analysis.segments.length * 4);
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2 + t * 0.0004;
          const jitter = Math.sin(t * 0.004 + i * 3.1) * 26;
          const r = baseR + jitter + ((i % 3) - 1) * 18;
          ctx.save();
          ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
          ctx.rotate(ang + Math.sin(t * 0.002 + i) * 0.8);
          ctx.strokeStyle = i % 3 === 0 ? accent : muted;
          ctx.lineWidth = i % 3 === 0 ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(10, 0);
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = accent;
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(`SYNTHETIC PHRASING REJECTED (${Math.round(aiProb * 100)}% AI)`, cx, cy - 6);
        ctx.fillStyle = darkMode ? "#a8a399" : "#6b6860";
        ctx.font = 'italic 16px "Instrument Serif", Georgia, serif';
        ctx.fillText("Heptapod B only inscribes lived human thought.", cx, cy + 16);
        ctx.restore();
        raf = requestAnimationFrame(render);
        return;
      }

      const steps = 220;
      for (let layer = 0; layer < 4; layer++) {
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const p = i / steps;
          const ang = p * Math.PI * 2 - Math.PI / 2;
          const seg =
            analysis.segments[Math.floor(p * analysis.segments.length) % Math.max(1, analysis.segments.length)] || {
              weight: 0.5,
            };
          const breathe = Math.sin(t * 0.0009 + ang * 3 + layer * 1.4) * (2.5 + layer * 1.4);
          const organic = Math.sin(ang * (5 + Math.floor(analysis.seed * 4)) + analysis.seed * 12) * (5 * seg.weight);
          const r = baseR + breathe + organic + (layer - 1.5) * 2.8;
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle =
          layer === 0
            ? ink
            : darkMode
              ? `rgba(243,239,230,${0.28 - layer * 0.05})`
              : `rgba(20,20,19,${0.32 - layer * 0.06})`;
        ctx.lineWidth = layer === 0 ? 4.2 : 1.6 + layer * 1.2;
        ctx.stroke();
      }

      for (const seg of analysis.segments) {
        const isHov = hoveredRef.current?.idx === seg.idx;
        const rBase = baseR + Math.sin(t * 0.0009 + seg.angle * 3) * 3;
        const x0 = cx + Math.cos(seg.angle) * rBase;
        const y0 = cy + Math.sin(seg.angle) * rBase;

        ctx.beginPath();
        ctx.arc(x0, y0, 4 + seg.weight * 12 + (isHov ? 4 : 0), 0, Math.PI * 2);
        ctx.fillStyle = isHov ? accent : darkMode ? "rgba(243,239,230,0.84)" : "rgba(20,20,19,0.86)";
        ctx.fill();

        for (let k = 0; k < seg.tendrils; k++) {
          const dir = k % 2 === 0 ? 1 : -0.68;
          const spread = (k - (seg.tendrils - 1) / 2) * 0.14;
          const len = (18 + seg.weight * 56 + seg.seed * 24) * (isHov ? 1.25 : 1);
          const sway = Math.sin(t * 0.0011 + seg.idx * 1.7 + k * 2.1) * 9;
          const ctrlAng = seg.angle + spread * 0.8 + sway * 0.012;
          const endAng = seg.angle + spread * 1.7 + sway * 0.018;
          const cx1 = cx + Math.cos(ctrlAng) * (rBase + dir * len * 0.55);
          const cy1 = cy + Math.sin(ctrlAng) * (rBase + dir * len * 0.55);
          const ex = cx + Math.cos(endAng) * (rBase + dir * len);
          const ey = cy + Math.sin(endAng) * (rBase + dir * len);

          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo(cx1, cy1, ex, ey);
          ctx.strokeStyle = isHov
            ? accent
            : seg.isTime && k === 0
              ? darkMode
                ? "rgba(235,110,88,0.72)"
                : "rgba(200,59,40,0.62)"
              : darkMode
                ? `rgba(243,239,230,${0.48 - k * 0.08})`
                : `rgba(20,20,19,${0.55 - k * 0.09})`;
          ctx.lineWidth = Math.max(0.8, 3.2 - k * 0.7 + (seg.isEmotion ? 1.1 : 0));
          ctx.lineCap = "round";
          ctx.stroke();

          if (k === 0 && (seg.isEmotion || seg.hasComma)) {
            ctx.beginPath();
            ctx.arc(ex + Math.cos(endAng) * 7, ey + Math.sin(endAng) * 7, 1.8 + seg.weight * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = isHov ? accent : ink;
            ctx.fill();
          }
        }

        if (showAnatomy && (isHov || seg.isEmotion || seg.isTime)) {
          const lx = cx + Math.cos(seg.angle) * (baseR + 82);
          const ly = cy + Math.sin(seg.angle) * (baseR + 82);
          ctx.fillStyle = isHov ? accent : darkMode ? "rgba(243,239,230,0.58)" : "rgba(20,20,19,0.55)";
          ctx.font = `${isHov ? "600 " : ""}11px "IBM Plex Mono", monospace`;
          ctx.textAlign = Math.cos(seg.angle) > 0.25 ? "left" : Math.cos(seg.angle) < -0.25 ? "right" : "center";
          ctx.fillText(seg.word, lx, ly);
        }
      }

      if (showAnatomy) {
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 0.56, 0, Math.PI * 2);
        ctx.setLineDash([2, 6]);
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [analysis, isSlop, aiProb, showAnatomy, darkMode, onHoverChange, canvasRef]);

  return (
    <div className="logogram-frame">
      {/* Paper.design GPU SmokeRing volumetric shader behind the grammatical ink */}
      {!isSlop && (
        <div className="smoke-shader-layer" aria-hidden="true">
          <SmokeRing
            style={{ width: "100%", height: "100%" }}
            colorBack={darkMode ? "#111110" : "#efece4"}
            colors={darkMode ? ["#f3efe6", "#8c8579"] : ["#141413", "#6b6860"]}
            speed={0.28 + Math.min(0.4, analysis.emotionCount * 0.06)}
            radius={0.34}
            thickness={0.28}
            noiseScale={2.2}
          />
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="ink-canvas"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, active: true };
        }}
        onMouseLeave={() => {
          mouseRef.current.active = false;
        }}
      />

      {hovered && !isSlop && <span className="sr-only">{hovered.word}</span>}
    </div>
  );
};
