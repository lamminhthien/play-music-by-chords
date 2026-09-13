import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Era } from '../types';

const NOTES = ['♪', '♫', 'Am', 'F', 'C', 'G', 'Dm7', '♩', 'Em9', '𝄞'];

/** Mouse-parallax hero: background / midground / foreground move at different rates. */
export function ParallaxScene({ era }: { era: Era }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setT({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* BACKGROUND — stars / sun */}
      <div
        className="absolute inset-[-40px] transition-transform duration-200 ease-out"
        style={{ transform: `translate(${t.x * -14}px, ${t.y * -10}px)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1030] via-[#25135e] to-[#0b1030]" />
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: i % 5 === 0 ? 3 : 1.5,
              height: i % 5 === 0 ? 3 : 1.5,
              opacity: 0.25 + ((i * 13) % 50) / 100,
            }}
          />
        ))}
        <div
          className="absolute left-1/2 top-[16%] h-64 w-64 -translate-x-1/2 rounded-full blur-2xl"
          style={{ background: 'radial-gradient(circle, #fb923c 0%, #f472b6 45%, transparent 70%)', opacity: era === 'traditional' ? 0.5 : 0.85 }}
        />
      </div>

      {/* MIDGROUND — era artwork */}
      <div
        className="absolute inset-[-30px] transition-transform duration-200 ease-out"
        style={{ transform: `translate(${t.x * 22}px, ${t.y * 16}px)` }}
      >
        {era === '80s-inspired' && (
          <>
            <div className="neon-grid absolute bottom-0 h-1/2 w-full opacity-70" style={{ transform: 'perspective(400px) rotateX(55deg) scale(1.6)', transformOrigin: 'bottom' }} />
            <div className="absolute bottom-[38%] left-[8%] h-40 w-24 rounded bg-gradient-to-t from-fuchsia-900 to-cyan-400 opacity-60 blur-[1px]" />
            <div className="absolute bottom-[38%] right-[10%] h-56 w-28 rounded bg-gradient-to-t from-purple-900 to-pink-400 opacity-60 blur-[1px]" />
            <div className="absolute bottom-[38%] left-[30%] right-[30%] h-[3px] bg-cyan-300 shadow-[0_0_18px_4px_#22d3ee]" />
          </>
        )}
        {era === '70s-inspired' && (
          <>
            <div className="vinyl-spin absolute right-[12%] top-[24%] h-52 w-52 rounded-full bg-black shadow-[0_0_60px_10px_rgba(251,191,36,0.35)]">
              <div className="absolute inset-[38%] rounded-full bg-amber-400" />
              <div className="absolute inset-[46%] rounded-full bg-[#0b1030]" />
            </div>
            <div className="absolute bottom-0 h-1/3 w-full bg-gradient-to-t from-orange-600/60 to-transparent" />
          </>
        )}
        {era === '90s-inspired' && (
          <>
            <div className="float-slow absolute left-[10%] top-[26%] h-28 w-44 rounded-lg border-4 border-cyan-300 bg-gradient-to-br from-indigo-600 to-pink-500 p-2 opacity-80">
              <div className="flex justify-between"><div className="h-6 w-6 rounded-full bg-[#0b1030]" /><div className="h-6 w-6 rounded-full bg-[#0b1030]" /></div>
              <div className="mx-auto mt-2 h-3 w-3/4 rounded bg-cyan-200/70" />
            </div>
            <div className="absolute right-[14%] top-[30%] h-20 w-20 rotate-12 bg-lime-400 opacity-70" />
            <div className="absolute bottom-[16%] left-[55%] h-16 w-16 rounded-full bg-yellow-300 opacity-70" />
          </>
        )}
        {era === 'traditional' && (
          <>
            <div className="absolute bottom-0 h-[42%] w-full bg-gradient-to-t from-emerald-900 via-emerald-800/40 to-transparent" style={{ clipPath: 'polygon(0 55%, 12% 30%, 24% 55%, 38% 20%, 52% 50%, 66% 25%, 80% 55%, 100% 35%, 100% 100%, 0 100%)' }} />
            <div className="float-med absolute left-[16%] top-[30%] text-5xl">🏮</div>
            <div className="float-slow absolute right-[18%] top-[24%] text-4xl">🏮</div>
          </>
        )}
      </div>

      {/* FOREGROUND — floating notes & chord symbols */}
      <div
        className="absolute inset-[-20px] transition-transform duration-200 ease-out"
        style={{ transform: `translate(${t.x * 46}px, ${t.y * 34}px)` }}
      >
        {NOTES.map((n, i) => (
          <motion.span
            key={i}
            className="absolute font-bold text-cyan-200/80"
            style={{ left: `${6 + ((i * 41) % 88)}%`, top: `${12 + ((i * 29) % 70)}%`, fontSize: 16 + ((i * 7) % 26) }}
            animate={{ y: [0, -16, 0], rotate: [-4, 5, -4] }}
            transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: 'easeInOut' }}
          >
            {n}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
