import { useMemo } from 'react';
import { isBlackKey, midiToNote, noteToMidi } from '../engine/theory';

const KEY_TO_SEMI: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14,
};

/**
 * Two-octave virtual piano. Highlights expected chord tones,
 * calls onPlay(note) for scoring / sound.
 */
export function Piano({
  from = 'C4',
  octaves = 2,
  highlight = [],
  pressed = [],
  onPlay,
}: {
  from?: string;
  octaves?: number;
  highlight?: string[];
  pressed?: string[];
  onPlay: (note: string) => void;
}) {
  const base = noteToMidi(from);
  const keys = useMemo(() => Array.from({ length: octaves * 12 }, (_, i) => base + i), [base, octaves]);
  const hl = useMemo(() => new Set(highlight.map((n) => { try { return noteToMidi(n); } catch { return -1; } })), [highlight]);
  const pr = useMemo(() => new Set(pressed.map((n) => { try { return noteToMidi(n); } catch { return -2; } })), [pressed]);
  const whites = keys.filter((m) => !isBlackKey(m));

  return (
    <div>
      <div className="relative flex h-40 select-none overflow-hidden rounded-xl border border-white/15 bg-slate-900 sm:h-48" role="group" aria-label="Virtual piano">
        {whites.map((m) => {
          const hot = hl.has(m);
          const down = pr.has(m);
          return (
            <button
              key={m}
              onPointerDown={() => onPlay(midiToNote(m))}
              className={`relative flex-1 border-r border-slate-400 last:border-r-0 ${down ? 'bg-cyan-300' : hot ? 'bg-lime-200' : 'bg-slate-50'} transition-colors`}
              aria-label={midiToNote(m)}
            >
              <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-bold text-slate-500">{midiToNote(m)}</span>
            </button>
          );
        })}
        {keys.filter(isBlackKey).map((m) => {
          const whiteIndex = whites.filter((w) => w < m).length;
          const hot = hl.has(m);
          const down = pr.has(m);
          return (
            <button
              key={m}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPlay(midiToNote(m));
              }}
              className={`absolute top-0 z-10 h-[55%] rounded-b-md border border-black ${down ? 'bg-cyan-400' : hot ? 'bg-lime-400' : 'bg-slate-950'}`}
              style={{ left: `${(whiteIndex / whites.length) * 100}%`, width: `${(1 / whites.length) * 62}%`, transform: 'translateX(-50%)' }}
              aria-label={midiToNote(m)}
            />
          );
        })}
      </div>
      <p className="mt-1 text-xs text-slate-400">Tip: computer keys A–L play white notes, W E T Y U O black notes (when piano focused).</p>
      <KeyboardListener base={base} onPlay={onPlay} />
    </div>
  );
}

function KeyboardListener({ base, onPlay }: { base: number; onPlay: (n: string) => void }) {
  return <KeyHandler base={base} onPlay={onPlay} />;
}

import { useEffect } from 'react';
function KeyHandler({ base, onPlay }: { base: number; onPlay: (n: string) => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const semi = KEY_TO_SEMI[e.key.toLowerCase()];
      if (semi === undefined) return;
      onPlay(midiToNote(base + 12 + semi));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [base, onPlay]);
  return null;
}
