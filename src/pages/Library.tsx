import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SONGS } from '../data/songs';
import { SongCard } from '../components/SongCard';
import { SongPlayer } from '../engine/player';
import type { Difficulty, Era, InstrumentId, LicenseKind, Mood, Song } from '../types';

export function Library() {
  const [params, setParams] = useSearchParams();
  const [mood, setMood] = useState<Mood | ''>((params.get('mood') as Mood) || '');
  const [instrument, setInstrument] = useState<InstrumentId | ''>((params.get('instrument') as InstrumentId) || '');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('' );
  const [era, setEra] = useState<Era | ''>((params.get('era') as Era) || '');
  const [license, setLicense] = useState<LicenseKind | ''>('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const playerRef = useRef<SongPlayer | null>(null);

  useEffect(() => {
    const p: Record<string, string> = {};
    if (mood) p.mood = mood;
    if (instrument) p.instrument = instrument;
    if (era) p.era = era;
    setParams(p, { replace: true });
  }, [mood, instrument, era, setParams]);

  const filtered = useMemo(
    () =>
      SONGS.filter(
        (s) =>
          (!mood || s.mood.includes(mood)) &&
          (!instrument || s.instruments.includes(instrument)) &&
          (!difficulty || s.difficulty === difficulty) &&
          (!era || s.era === era) &&
          (!license || s.license.kind === license),
      ),
    [mood, instrument, difficulty, era, license],
  );

  useEffect(() => () => playerRef.current?.dispose(), []);

  const togglePreview = async (song: Song) => {
    if (previewId === song.id) {
      playerRef.current?.stop();
      setPreviewId(null);
      return;
    }
    playerRef.current?.dispose();
    const p = new SongPlayer(song);
    playerRef.current = p;
    setPreviewId(song.id);
    await p.play();
  };

  const select = 'rounded-lg border border-white/15 bg-[#141a3d] px-3 py-2 text-sm';

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-black">Music library</h1>
      <p className="mt-1 text-slate-300">Ten original & public-domain songs. Press play for an instant preview, or open chords to learn.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select className={select} value={era} onChange={(e) => setEra(e.target.value as Era | '')} aria-label="Filter by era">
          <option value="">All eras</option>
          <option value="traditional">Traditional</option>
          <option value="70s-inspired">70s-inspired</option>
          <option value="80s-inspired">80s-inspired</option>
          <option value="90s-inspired">90s-inspired</option>
        </select>
        <select className={select} value={mood} onChange={(e) => setMood(e.target.value as Mood | '')} aria-label="Filter by mood">
          <option value="">All moods</option>
          <option value="happy">Happy</option>
          <option value="calm">Calm</option>
          <option value="dramatic">Dramatic</option>
          <option value="nostalgic">Nostalgic</option>
        </select>
        <select className={select} value={instrument} onChange={(e) => setInstrument(e.target.value as InstrumentId | '')} aria-label="Filter by instrument">
          <option value="">All instruments</option>
          <option value="piano">Piano</option>
          <option value="guitar">Guitar</option>
          <option value="synth">Synth</option>
          <option value="strings">Strings</option>
        </select>
        <select className={select} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | '')} aria-label="Filter by difficulty">
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select className={select} value={license} onChange={(e) => setLicense(e.target.value as LicenseKind | '')} aria-label="Filter by license">
          <option value="">All licenses</option>
          <option value="original">Original</option>
          <option value="public-domain">Public domain</option>
          <option value="cc">Creative Commons</option>
        </select>
        {(mood || instrument || difficulty || era || license) && (
          <button onClick={() => { setMood(''); setInstrument(''); setDifficulty(''); setEra(''); setLicense(''); }} className="rounded-lg px-3 py-2 text-sm text-cyan-300 underline">
            Clear filters
          </button>
        )}
      </div>

      {previewId && (
        <div className="mt-4 rounded-xl border border-cyan-300/40 bg-cyan-950/60 px-4 py-2 text-sm">
          ♪ Previewing <b>{SONGS.find((s) => s.id === previewId)?.title}</b> — press the card's Play button again to stop.
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <div key={s.id} className={previewId === s.id ? 'rounded-2xl ring-2 ring-cyan-300' : 'rounded-2xl'}>
            <SongCard song={s} onPreview={togglePreview} />
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="mt-10 text-center text-slate-400">No songs match — try clearing a filter.</p>}
    </div>
  );
}
