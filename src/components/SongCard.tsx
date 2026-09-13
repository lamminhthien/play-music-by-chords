import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Song } from '../types';

const DIFF_COLOR: Record<string, string> = {
  beginner: 'bg-lime-400 text-black',
  intermediate: 'bg-amber-300 text-black',
  advanced: 'bg-rose-400 text-black',
};

export function SongCard({ song, onPreview }: { song: Song; onPreview: (s: Song) => void }) {
  const prog = song.chords.slice(0, 4).map((c) => c.name).join(' – ');
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#141a3d]/90 p-5 shadow-xl"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${song.palette[0]}, ${song.palette[1]}, ${song.palette[2]})` }}
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">{song.title}</h3>
          <p className="text-sm text-slate-300">{song.composer} · {song.genre}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${DIFF_COLOR[song.difficulty]}`}>{song.difficulty}</span>
      </div>
      <p className="mt-2 font-mono text-sm text-cyan-200">{prog}</p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded bg-white/10 px-2 py-0.5">{song.era}</span>
        <span className="rounded bg-white/10 px-2 py-0.5">♩ {song.tempo}</span>
        <span className="rounded bg-white/10 px-2 py-0.5">{song.key}</span>
        <span className="rounded bg-emerald-400/20 px-2 py-0.5 text-emerald-200" title={song.license.notes}>{song.license.label}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onPreview(song)}
          className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-300"
        >
          ▶ Play
        </button>
        <Link
          to={`/play/${song.id}`}
          className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold transition hover:bg-white/10"
        >
          View chords
        </Link>
      </div>
    </motion.article>
  );
}
