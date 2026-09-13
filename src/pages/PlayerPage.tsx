import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SONGS, chordAtBeat, songDurationBeats } from '../data/songs';
import { SongPlayer, type PlayerState } from '../engine/player';
import { chordPitchClasses, noteToMidi, transposeNote } from '../engine/theory';
import { useMidi } from '../engine/midi';
import { VisualWorld } from '../components/VisualWorld';
import { ChordStrip } from '../components/ChordStrip';
import { ChordDetail } from '../components/ChordDetail';
import { Piano } from '../components/Piano';
import { LicensePanel } from '../components/LicensePanel';
import type { ArrangeMode, DrumPattern, Era, InstrumentId, PlayMode, Song } from '../types';

interface RemixPreset {
  name: string;
  tempo: number;
  instrument: InstrumentId;
  transpose: number;
  arrange: ArrangeMode;
  drum: DrumPattern;
  visualEra: Era;
}

const COLLECTION_KEY = 'chordscape-collection';

export function PlayerPage() {
  const { songId } = useParams();
  const song: Song | undefined = SONGS.find((s) => s.id === songId);

  const playerRef = useRef<SongPlayer | null>(null);
  const [ps, setPs] = useState<PlayerState | null>(null);
  const [mode, setMode] = useState<PlayMode>('listen');
  const [followIndex, setFollowIndex] = useState(0);
  const [followHits, setFollowHits] = useState<Set<number>>(new Set());
  const [followDone, setFollowDone] = useState(false);
  const [score, setScore] = useState<{ hit: number; total: number }>({ hit: 0, total: 0 });
  const [pressed, setPressed] = useState<string[]>([]);
  const [visualEra, setVisualEra] = useState<Era | null>(null);
  const [collection, setCollection] = useState<(RemixPreset & { songId: string })[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(COLLECTION_KEY) ?? '[]');
    } catch {
      return [];
    }
  });

  // per-chord pitch-class hits for play-along scoring
  const hitsRef = useRef<Map<number, Set<number>>>(new Map());
  const lastChordRef = useRef(0);

  useEffect(() => {
    if (!song) return;
    const p = new SongPlayer(song);
    playerRef.current = p;
    const unsub = p.subscribe(setPs);
    setFollowIndex(0);
    setFollowHits(new Set());
    setFollowDone(false);
    setScore({ hit: 0, total: 0 });
    hitsRef.current = new Map();
    lastChordRef.current = 0;
    setVisualEra(null);
    return () => {
      unsub();
      p.dispose();
      playerRef.current = null;
    };
  }, [song]);

  // grade previous chord when the playhead advances (play-chords mode)
  useEffect(() => {
    if (!song || !ps || mode !== 'play-chords') return;
    const prev = lastChordRef.current;
    if (ps.chordIndex !== prev) {
      const expected = chordPitchClasses(song.chords[prev].notes, ps.transpose);
      const got = hitsRef.current.get(prev) ?? new Set<number>();
      const hit = [...expected].every((pc) => got.has(pc));
      setScore((s) => ({ hit: s.hit + (hit ? 1 : 0), total: s.total + 1 }));
      lastChordRef.current = ps.chordIndex;
    }
  }, [ps?.chordIndex, mode, song, ps]);

  const flashPressed = useCallback((note: string) => {
    setPressed((p) => [...p.slice(-7), note]);
    window.setTimeout(() => setPressed((p) => p.filter((n) => n !== note)), 700);
  }, []);

  const handleNote = useCallback(
    (note: string, velocity = 0.8) => {
      const p = playerRef.current;
      if (!p || !song || !ps) return;
      void p.pluck(transposeNote(note, 0), velocity);
      flashPressed(note);
      const pc = (((noteToMidi(note) % 12) + 12) % 12);

      if (mode === 'follow') {
        const expected = chordPitchClasses(song.chords[followIndex].notes, ps.transpose);
        if (expected.has(pc)) {
          const next = new Set(followHits);
          next.add(pc);
          // complete when all pitch classes covered
          if ([...expected].every((e) => next.has(e))) {
            void p.strum(song.chords[followIndex].notes);
            if (followIndex + 1 >= song.chords.length) {
              setFollowDone(true);
            } else {
              setFollowIndex(followIndex + 1);
              setFollowHits(new Set());
            }
          } else {
            setFollowHits(next);
          }
        }
      } else if (mode === 'play-chords') {
        const m = hitsRef.current.get(ps.chordIndex) ?? new Set<number>();
        m.add(pc);
        hitsRef.current.set(ps.chordIndex, m);
      }
    },
    [song, ps, mode, followIndex, followHits, flashPressed],
  );

  const midi = useMidi(handleNote);
  // feed external MIDI lastNote into sound even if hook callback stale — hook already calls handleNote.

  const beat = ps?.beat ?? 0;
  const chordIndex = ps?.chordIndex ?? 0;
  const current = song ? chordAtBeat(song, Math.min(beat, songDurationBeats(song) - 0.01)).chord : null;

  const highlightNotes = useMemo(() => {
    if (!song || !ps) return [];
    if (mode === 'follow') return song.chords[followIndex].notes.map((n) => transposeNote(n, ps.transpose));
    if (mode === 'free') return [];
    return (current?.notes ?? []).map((n) => transposeNote(n, ps.transpose));
  }, [song, ps, mode, followIndex, current]);

  const saveRemix = () => {
    if (!song || !ps) return;
    const preset: RemixPreset & { songId: string } = {
      songId: song.id,
      name: `${song.title} (my mix ${collection.length + 1})`,
      tempo: ps.tempo,
      instrument: ps.instrument,
      transpose: ps.transpose,
      arrange: ps.arrange,
      drum: ps.drum,
      visualEra: visualEra ?? song.era,
    };
    const next = [...collection, preset];
    setCollection(next);
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
  };

  const applyPreset = (pr: RemixPreset) => {
    const p = playerRef.current;
    if (!p) return;
    p.setTempo(pr.tempo);
    p.setInstrument(pr.instrument);
    p.setTranspose(pr.transpose);
    p.setArrange(pr.arrange);
    p.setDrum(pr.drum);
    setVisualEra(pr.visualEra);
  };

  if (!song) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-black">Song not found</h1>
        <Link to="/library" className="mt-4 inline-block text-cyan-300 underline">Back to library</Link>
      </div>
    );
  }

  const total = songDurationBeats(song);
  const era = visualEra ?? song.era;
  const bassLevel = ps?.playing ? 1 - (beat % 1) : 0;

  const btn = (active: boolean) =>
    `rounded-xl px-3 py-2 text-sm font-bold transition ${active ? 'bg-cyan-300 text-black' : 'bg-white/10 hover:bg-white/20'}`;

  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10">
        <VisualWorld era={era} palette={song.palette} beat={beat} chordIndex={mode === 'follow' ? followIndex : chordIndex} playing={ps?.playing ?? mode === 'follow'} bassLevel={bassLevel} />
        <div className={`absolute inset-0 ${song.era === '90s-inspired' ? 'scanlines' : ''} ${song.era === '70s-inspired' ? 'grain' : ''}`} />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link to="/library" className="text-sm text-cyan-200 underline">← Library</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black drop-shadow">{song.title}</h1>
            <p className="text-slate-200">{song.composer} · {song.genre} · {song.key} · ♩ {song.tempo} → {ps?.tempo}</p>
          </div>
          <div className="flex gap-2">
            {(['listen', 'play-chords', 'follow', 'free', 'remix'] as PlayMode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); if (m === 'follow') { playerRef.current?.pause(); setFollowIndex(0); setFollowHits(new Set()); setFollowDone(false); } }} className={btn(mode === m)} title={m}>
                {m === 'listen' ? 'Listen' : m === 'play-chords' ? 'Play along' : m === 'follow' ? 'Follow' : m === 'free' ? 'Free play' : 'Remix'}
              </button>
            ))}
          </div>
        </div>

        {/* TRANSPORT */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => void playerRef.current?.play()} className="rounded-xl bg-lime-400 px-5 py-2 font-black text-black hover:bg-lime-300">▶ Play</button>
            <button onClick={() => playerRef.current?.pause()} className={btn(false)}>⏸ Pause</button>
            <button onClick={() => playerRef.current?.stop()} className={btn(false)}>⏹ Stop</button>
            <button onClick={() => playerRef.current?.restart()} className={btn(false)}>↺ Restart</button>
            <button onClick={() => playerRef.current?.toggleLoop()} className={btn(!!ps?.loop)} title="Loop">🔁 {ps?.loop ? 'On' : 'Off'}</button>
            <button onClick={() => playerRef.current?.toggleMetronome()} className={btn(!!ps?.metronome)} title="Metronome">🥁 {ps?.metronome ? 'On' : 'Off'}</button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Tempo: <b>{ps?.tempo}</b> BPM
              <input type="range" min={40} max={200} value={ps?.tempo ?? song.tempo} onChange={(e) => playerRef.current?.setTempo(+e.target.value)} className="w-full" />
            </label>
            <label className="text-sm">Volume: <b>{Math.round((ps?.volume ?? 0) * 100)}%</b>
              <input type="range" min={0} max={1} step={0.01} value={ps?.volume ?? 0.8} onChange={(e) => playerRef.current?.setVolume(+e.target.value)} className="w-full" />
            </label>
            <label className="text-sm">Transpose: <b>{ps?.transpose ?? 0 > 0 ? `+${ps?.transpose}` : ps?.transpose}</b>
              <span className="flex gap-2">
                <button className={btn(false)} onClick={() => playerRef.current?.setTranspose((ps?.transpose ?? 0) - 1)}>−</button>
                <button className={btn(false)} onClick={() => playerRef.current?.setTranspose((ps?.transpose ?? 0) + 1)}>+</button>
              </span>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="py-2 text-slate-300">Instrument:</span>
            {(['piano', 'guitar', 'synth', 'strings'] as InstrumentId[]).map((i) => (
              <button key={i} onClick={() => playerRef.current?.setInstrument(i)} className={btn(ps?.instrument === i)}>{i}</button>
            ))}
            <span className="py-2 pl-4 text-slate-300">Arrangement:</span>
            {(['full', 'chords', 'melody'] as ArrangeMode[]).map((a) => (
              <button key={a} onClick={() => playerRef.current?.setArrange(a)} className={btn(ps?.arrange === a)}>{a}</button>
            ))}
          </div>
        </div>

        {/* CHORD DISPLAY */}
        {mode !== 'free' && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur">
            <div className="flex items-baseline justify-between">
              <h2 className="font-bold text-slate-200">Chord progression</h2>
              {mode === 'play-chords' && <span className="text-sm text-lime-300">Score: {score.hit}/{score.total} chords nailed</span>}
              {mode === 'follow' && <span className="text-sm text-cyan-200">Play chord {followIndex + 1}/{song.chords.length} to continue</span>}
            </div>
            {mode === 'follow' ? (
              <div className="mt-2">
                <FollowStrip song={song} index={followIndex} transpose={ps?.transpose ?? 0} done={followDone}
                  onHear={() => void playerRef.current?.strum(song.chords[followIndex].notes)}
                  onRestart={() => { setFollowIndex(0); setFollowHits(new Set()); setFollowDone(false); }} />
              </div>
            ) : (
              <div className="mt-2">
                <ChordStrip song={song} beat={beat} chordIndex={chordIndex}
                  onSeek={(b) => playerRef.current?.seek(b)}
                  onStrum={(i) => void playerRef.current?.strum(song.chords[i].notes)} />
              </div>
            )}
            {current && mode !== 'follow' && (
              <div className="mt-3"><ChordDetail chord={current} transpose={ps?.transpose ?? 0} /></div>
            )}
            {mode === 'follow' && !followDone && (
              <div className="mt-3"><ChordDetail chord={song.chords[followIndex]} transpose={ps?.transpose ?? 0} /></div>
            )}
          </div>
        )}

        {/* PIANO + MIDI */}
        {(mode !== 'listen' || true) && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-slate-200">
                {mode === 'free' ? 'Free play' : mode === 'follow' ? 'Your turn — play the highlighted chord' : 'Play along on the keys'}
              </h2>
              <span className="text-xs text-slate-300">
                {midi.supported
                  ? midi.inputs.length > 0
                    ? `🎹 MIDI connected: ${midi.inputs.join(', ')}`
                    : '🎹 No external keyboard detected — on-screen keys ready.'
                  : '⚠️ External MIDI is currently supported in selected browsers. You can still use the on-screen keyboard.'}
              </span>
            </div>
            <div className="mt-3">
              <Piano highlight={highlightNotes} pressed={pressed} onPlay={(n) => handleNote(n)} />
            </div>
          </div>
        )}

        {/* REMIX */}
        {mode === 'remix' && (
          <div className="mt-4 rounded-2xl border border-fuchsia-300/30 bg-black/50 p-4 backdrop-blur">
            <h2 className="font-bold text-fuchsia-200">Remix lab</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="py-2 text-slate-300">Drums:</span>
              {(['none', 'four-floor', 'disco', 'boom-bap', 'waltz', 'folk-strum'] as DrumPattern[]).map((d) => (
                <button key={d} onClick={() => playerRef.current?.setDrum(d)} className={btn(ps?.drum === d)}>{d}</button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="py-2 text-slate-300">Visual world:</span>
              {(['traditional', '70s-inspired', '80s-inspired', '90s-inspired'] as Era[]).map((e) => (
                <button key={e} onClick={() => setVisualEra(e)} className={btn(era === e)}>{e}</button>
              ))}
            </div>
            <button onClick={saveRemix} className="mt-3 rounded-xl bg-fuchsia-400 px-4 py-2 font-bold text-black hover:bg-fuchsia-300">💾 Save mix to my collection</button>
            {collection.filter((c) => c.songId === song.id).length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {collection.filter((c) => c.songId === song.id).map((c, i) => (
                  <li key={i} className="flex items-center gap-2 rounded bg-white/5 px-3 py-2">
                    <span className="flex-1">{c.name} — {c.tempo} BPM · {c.instrument} · {c.drum} · {c.visualEra}</span>
                    <button className="text-cyan-300 underline" onClick={() => applyPreset(c)}>Load</button>
                    <button className="text-rose-300 underline" onClick={() => {
                      const next = collection.filter((_, j) => j !== collection.indexOf(c));
                      setCollection(next);
                      localStorage.setItem(COLLECTION_KEY, JSON.stringify(next));
                    }}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* LICENSE */}
        <div className="mt-4"><LicensePanel song={song} /></div>
        <p className="mt-2 font-mono text-xs text-slate-400">beat {beat.toFixed(1)}/{total} · {song.chords.length} chords · {song.melody.length} melody notes · {song.drumPattern} drums</p>
      </div>
    </div>
  );
}

function FollowStrip({ song, index, transpose, done, onHear, onRestart }: {
  song: Song; index: number; transpose: number; done: boolean; onHear: () => void; onRestart: () => void;
}) {
  if (done) {
    return (
      <div className="rounded-xl bg-lime-400/20 p-4 text-center">
        <p className="text-xl font-black text-lime-300">🎉 You played the whole progression!</p>
        <button onClick={onRestart} className="mt-2 rounded-xl bg-lime-400 px-4 py-2 font-bold text-black">Play again</button>
      </div>
    );
  }
  return (
    <div className="flex w-full overflow-hidden rounded-xl border border-white/15">
      {song.chords.map((c, i) => (
        <div key={i} className={`flex-1 border-r border-white/10 px-2 py-3 text-center last:border-r-0 ${i === index ? 'bg-cyan-300 text-black' : i < index ? 'bg-lime-400/30' : 'bg-white/5'}`}>
          <div className="truncate text-sm font-black sm:text-base">{c.name}</div>
          <div className={`text-[11px] ${i === index ? 'text-black/70' : 'text-slate-400'}`}>{i < index ? '✓' : transpose ? `${c.romanNumeral}` : c.romanNumeral}</div>
        </div>
      ))}
      <button onClick={onHear} className="bg-white/10 px-4 text-sm font-bold hover:bg-white/20" title="Hear the target chord">🔊 Hint</button>
    </div>
  );
}
