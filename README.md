# Chordscape — Visual Music Playground

> An interactive music playground where people explore original and legally licensed
> songs through MIDI playback, chord visualization, virtual instruments, and colorful
> music-reactive parallax worlds.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## What's inside (MVP)

- **Landing** (`src/pages/Landing.tsx`) — mouse-parallax hero with per-era artwork
  (neon grid / vinyl / cassette / lanterns), floating chord symbols, genre cards.
- **Library** (`src/pages/Library.tsx`) — 10 original songs as colorful cards with
  filters (mood, instrument, difficulty, era, license) + instant audio preview.
- **Player** (`src/pages/PlayerPage.tsx`) — Tone.js transport engine with play/pause/
  stop/restart, tempo, volume, loop, metronome, 4 instruments, transpose ±6,
  chords/melody/full arrangement, chord timeline + inspector (roman numerals,
  keyboard diagram, guitar hints, fingering), virtual piano + computer keys,
  Web MIDI input with fallback message, and 5 modes:
  Listen · Play along (scored) · Follow (must-play-to-advance) · Free play · Remix lab
  (drums, visual theme, save mixes to localStorage).
- **Music engine** (`src/engine/player.ts`) — sample-accurate `Tone.Transport` +
  `Tone.Part` scheduling; durations/tempo stay musical under tempo changes.
- **Song data** (`src/data/songs.ts`) — structured JSON-style catalogue, melodies
  generated deterministically from chord tones; all progressions are original.

## Licensing policy

No copyrighted songs, recordings, or third-party MIDI files are included.
Every song carries a visible license panel (original CC BY 4.0 or public-domain
folk-style dedications). See `src/data/songs.ts`.
