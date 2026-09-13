import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ParallaxScene } from '../components/ParallaxScene';
import { ERAS, SONGS } from '../data/songs';
import type { Era } from '../types';

const GENRE_CARDS: { label: string; sub: string; link: string; gradient: string }[] = [
  { label: 'Traditional', sub: 'Folk · waltz · festival', link: '/library?era=traditional', gradient: 'from-emerald-500 to-lime-500' },
  { label: '1970s-inspired', sub: 'Soul-pop · disco-funk', link: '/library?era=70s-inspired', gradient: 'from-amber-400 to-rose-500' },
  { label: '1980s-inspired', sub: 'Synthwave · electro-funk', link: '/library?era=80s-inspired', gradient: 'from-fuchsia-500 to-cyan-400' },
  { label: '1990s-inspired', sub: 'Soft rock · alt-rock', link: '/library?era=90s-inspired', gradient: 'from-sky-400 to-indigo-500' },
  { label: 'Piano', sub: 'Keys-first arrangements', link: '/library?instrument=piano', gradient: 'from-slate-200 to-cyan-300' },
  { label: 'Synthwave', sub: 'Neon grids & lasers', link: '/library?era=80s-inspired', gradient: 'from-purple-500 to-pink-500' },
  { label: 'Ballad', sub: 'Slow & singable', link: '/library?mood=calm', gradient: 'from-indigo-400 to-purple-400' },
  { label: 'Folk', sub: 'Porch-stomp tunes', link: '/library?era=traditional', gradient: 'from-green-500 to-amber-400' },
];

export function Landing() {
  const [era, setEra] = useState<Era>('80s-inspired');

  return (
    <div>
      {/* HERO */}
      <header className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden text-center">
        <ParallaxScene era={era} />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <p className="mb-3 inline-block rounded-full border border-cyan-300/40 bg-black/40 px-4 py-1 text-xs font-bold tracking-widest text-cyan-200">
            MIDI PLAYGROUND · 100% ORIGINAL & LICENSED MUSIC
          </p>
          <h1 className="bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-lime-300 bg-clip-text text-6xl font-black text-transparent sm:text-7xl">
            Chordscape
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-200">
            A visual music playground for learning, exploring, and remixing chord-based songs —
            not a repository of copyrighted recordings.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/library" className="rounded-2xl bg-cyan-400 px-8 py-4 text-lg font-black text-black shadow-[0_0_30px_rgba(34,211,238,0.6)] transition hover:scale-105 hover:bg-cyan-300">
              Start Exploring
            </Link>
            <Link to="/library" className="rounded-2xl border border-white/30 bg-black/40 px-8 py-4 text-lg font-bold backdrop-blur transition hover:bg-white/10">
              Browse songs
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span className="text-slate-300">Preview world:</span>
            {ERAS.map((e) => (
              <button
                key={e.id}
                onClick={() => setEra(e.id)}
                className={`rounded-full px-3 py-1 font-bold ${era === e.id ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 z-10 animate-bounce text-2xl">↓</div>
      </header>

      {/* GENRE CARDS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-black">Choose your world</h2>
        <p className="mt-1 text-slate-300">Every era has its own parallax visual theme, instruments, and grooves.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {GENRE_CARDS.map((g) => (
            <Link
              key={g.label}
              to={g.link}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-black transition hover:scale-[1.03] ${g.gradient}`}
            >
              <div className="text-xl font-black">{g.label}</div>
              <div className="text-sm font-bold opacity-70">{g.sub}</div>
              <div className="mt-4 text-sm font-black opacity-0 transition group-hover:opacity-100">Explore →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl font-black">Featured originals</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SONGS.slice(0, 3).map((s) => (
            <Link key={s.id} to={`/play/${s.id}`} className="rounded-2xl border border-white/10 bg-[#141a3d] p-5 transition hover:border-cyan-300/50">
              <div className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${s.palette.join(',')})` }} />
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="text-sm text-slate-300">{s.description}</p>
              <p className="mt-2 font-mono text-sm text-cyan-200">{s.chords.slice(0, 4).map((c) => c.name).join(' – ')}</p>
            </Link>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-slate-300">
          <h3 className="font-bold text-white">Why original music?</h3>
          <p className="mt-1">
            Songs from the 70s, 80s, and 90s are usually still under copyright — compositions, recordings,
            arrangements, and even MIDI files can each carry separate rights. Chordscape instead ships
            original decade-inspired compositions plus public-domain arrangements, each with a visible
            license panel. Learn more on any song page.
          </p>
        </div>
      </section>
    </div>
  );
}
