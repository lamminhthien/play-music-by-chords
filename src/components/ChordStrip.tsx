import type { Song } from '../types';
import { chordAtBeat, songDurationBeats } from '../data/songs';

/** Chord timeline with playhead: Am F C G |---|---|---|--- ● */
export function ChordStrip({
  song,
  beat,
  chordIndex,
  onSeek,
  onStrum,
}: {
  song: Song;
  beat: number;
  chordIndex: number;
  onSeek: (beat: number) => void;
  onStrum: (index: number) => void;
}) {
  const total = songDurationBeats(song);
  let t = 0;
  const segs = song.chords.map((c, i) => {
    const start = t;
    t += c.beats;
    return { c, i, start, widthPct: (c.beats / total) * 100 };
  });

  return (
    <div>
      <div className="flex w-full overflow-hidden rounded-xl border border-white/15" role="listbox" aria-label="Chord progression">
        {segs.map(({ c, i, start, widthPct }) => (
          <button
            key={i}
            onClick={() => {
              onSeek(start + 0.01);
              onStrum(i);
            }}
            title={`${c.name} (${c.romanNumeral}) — click to hear`}
            className={`relative border-r border-white/10 px-2 py-3 text-center transition last:border-r-0 ${
              i === chordIndex ? 'bg-cyan-300 text-black' : 'bg-white/5 hover:bg-white/15'
            }`}
            style={{ width: `${widthPct}%` }}
          >
            <div className="truncate text-sm font-black sm:text-base">{c.name}</div>
            <div className={`text-[11px] ${i === chordIndex ? 'text-black/70' : 'text-slate-400'}`}>{c.romanNumeral}</div>
          </button>
        ))}
      </div>
      <div className="mt-2">
        <input
          type="range"
          min={0}
          max={total}
          step={0.1}
          value={Math.min(beat, total)}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full"
          aria-label="Song position in beats"
        />
        <div className="flex justify-between font-mono text-[11px] text-slate-400">
          <span>● beat {beat.toFixed(1)} / {total} · {chordAtBeat(song, beat).chord.name}</span>
          <span>{song.timeSignature ? song.timeSignature.join('/') : '4/4'}</span>
        </div>
      </div>
    </div>
  );
}
