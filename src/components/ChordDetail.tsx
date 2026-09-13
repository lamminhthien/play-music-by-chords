import type { ChordEvent } from '../types';
import { noteToMidi } from '../engine/theory';
import { guitarHint } from '../engine/theory';

/** Chord inspector: name, roman numeral, keyboard diagram, guitar shape, notes, fingering. */
export function ChordDetail({ chord, transpose }: { chord: ChordEvent; transpose: number }) {
  const midis = chord.notes.map((n) => noteToMidi(n) + transpose);
  const lo = Math.min(...midis);
  const hi = Math.max(...midis);
  // diagram window: from lo to hi (clamp width)
  const start = lo;
  const keys: { midi: number; black: boolean }[] = [];
  for (let m = start; m <= hi; m++) {
    const pc = ((m % 12) + 12) % 12;
    keys.push({ midi: m, black: [1, 3, 6, 8, 10].includes(pc) });
  }
  const active = new Set(midis);

  // render piano-strip diagram: whites in flow, blacks overlaid
  const whites = keys.filter((k) => !k.black);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-4xl font-black text-lime-300">{chord.name}</span>
        <span className="rounded bg-white/10 px-2 py-1 font-mono text-sm">{chord.romanNumeral}</span>
        <span className="font-mono text-sm text-slate-300">{chord.notes.join(' – ')}</span>
      </div>
      {chord.fingering && <p className="mt-1 text-sm text-slate-300">Suggested fingering: {chord.fingering}</p>}

      {/* keyboard diagram */}
      <div className="relative mt-3 flex h-20 select-none overflow-hidden rounded-lg">
        {whites.map((k) => (
          <div
            key={k.midi}
            className={`relative flex-1 border border-slate-500 ${active.has(k.midi) ? 'bg-lime-300' : 'bg-slate-100'}`}
          >
            {active.has(k.midi) && <span className="absolute inset-x-0 bottom-1 text-center text-[10px] font-bold text-black">●</span>}
          </div>
        ))}
        {/* black keys positioned proportionally */}
        {keys.filter((k) => k.black).map((k) => {
          const whiteIndex = whites.filter((w) => w.midi < k.midi).length;
          return (
            <div
              key={k.midi}
              className={`absolute top-0 h-1/2 w-[4%] rounded-b ${active.has(k.midi) ? 'bg-lime-400' : 'bg-slate-900'}`}
              style={{ left: `${(whiteIndex / whites.length) * 100}%`, transform: 'translateX(-50%)' }}
            />
          );
        })}
      </div>
      <p className="mt-3 text-sm text-slate-300">🎸 {guitarHint(chord.name)}</p>
    </div>
  );
}
