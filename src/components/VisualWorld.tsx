import { useEffect, useRef } from 'react';
import type { Era } from '../types';

/**
 * Music-reactive canvas backdrop for the player page.
 * Pulses with the beat, flashes on chord changes, tinted per song palette.
 */
export function VisualWorld({
  era,
  palette,
  beat,
  chordIndex,
  playing,
  bassLevel,
}: {
  era: Era;
  palette: [string, string, string];
  beat: number;
  chordIndex: number;
  playing: boolean;
  /** 0..1 smoothed bass pulse */
  bassLevel: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ beat, chordIndex, playing, bassLevel });
  stateRef.current = { beat, chordIndex, playing, bassLevel };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let flash = 0;
    let lastChord = stateRef.current.chordIndex;

    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const s = stateRef.current;
      if (s.chordIndex !== lastChord) {
        flash = 1;
        lastChord = s.chordIndex;
      }
      flash *= 0.94;
      const W = canvas.width;
      const H = canvas.height;
      const t = performance.now() / 1000;
      const pulse = s.playing ? 0.5 + 0.5 * Math.abs(Math.sin((s.beat * Math.PI) / 2)) : 0.25;
      const energy = 0.35 + 0.65 * Math.max(pulse, s.bassLevel, flash);

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b1030');
      g.addColorStop(0.55, palette[2] + '44');
      g.addColorStop(1, palette[0] + '33');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // sun / moon
      const sunR = (Math.min(W, H) * 0.18) * (1 + 0.08 * energy);
      const sunX = W / 2;
      const sunY = H * 0.34;
      const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.2);
      sun.addColorStop(0, palette[0]);
      sun.addColorStop(0.5, palette[1] + 'aa');
      sun.addColorStop(1, 'transparent');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // waves that react to melody/beat
      ctx.lineWidth = 2 * devicePixelRatio;
      for (let w = 0; w < 4; w++) {
        ctx.strokeStyle = [palette[0], palette[1], palette[2], '#ffffff'][w] + 'aa';
        ctx.beginPath();
        const baseY = H * (0.55 + w * 0.1);
        for (let x = 0; x <= W; x += 8) {
          const y = baseY + Math.sin(x / (90 + w * 30) + t * (1 + w * 0.3) + s.beat * 0.4) * (14 + energy * 30);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // particles rising, faster with energy
      for (let i = 0; i < 70; i++) {
        const px = ((i * 97) % W + t * (10 + energy * 60) * (1 + (i % 3))) % W;
        const py = H - ((t * (20 + energy * 80) + i * 61) % (H + 40)) + 20;
        ctx.fillStyle = i % 3 === 0 ? palette[0] : i % 3 === 1 ? palette[1] : '#ffffff';
        ctx.globalAlpha = 0.25 + 0.5 * energy * ((i % 5) / 5);
        ctx.beginPath();
        ctx.arc(px, py, (1 + (i % 3)) * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // chord-change flash
      if (flash > 0.02) {
        ctx.fillStyle = palette[1];
        ctx.globalAlpha = flash * 0.25;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      // era overlays
      if (era === '80s-inspired') {
        ctx.strokeStyle = palette[1] + '66';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
          const y = H * 0.62 + i * ((H * 0.38) / 12);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [era, palette]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
