import type { ChordEvent, Song } from '../types';

/**
 * Original compositions created for Chordscape.
 * Nothing here copies any copyrighted song — progressions are common
 * building blocks, melodies are generated from chord tones with
 * era-specific rhythmic patterns.
 */

interface ProgressionSpec {
  chords: { name: string; roman: string; notes: string[]; fingering?: string }[];
}

function expand(
  spec: ProgressionSpec,
  opts: { beatsPerChord: number; repeats: number; melodyOctaveUp?: boolean },
): { chords: ChordEvent[]; roots: string[] } {
  const chords: ChordEvent[] = [];
  const roots: string[] = [];
  for (let r = 0; r < opts.repeats; r++) {
    for (const c of spec.chords) {
      chords.push({ name: c.name, romanNumeral: c.roman, beats: opts.beatsPerChord, notes: c.notes, fingering: c.fingering });
      roots.push(c.notes[0]);
    }
  }
  return { chords, roots };
}

/** Deterministic pseudo-random from seed (mulberry32) so melodies are stable. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const up = (n: string) => {
  const m = n.match(/^([A-G][#b]?)(-?\d)$/);
  if (!m) return n;
  return `${m[1]}${parseInt(m[2], 10) + 1}`;
};

/**
 * Build a simple singable melody: one or two notes per chord chosen from
 * chord tones (plus occasional passing tone), rhythm varies by era.
 */
function makeMelody(
  chords: ChordEvent[],
  seed: number,
  style: 'waltz' | 'ballad' | 'drive' | 'sparse',
): Song['melody'] {
  const rand = rng(seed);
  const melody: Song['melody'] = [];
  let t = 0;
  chords.forEach((ch) => {
    const tones = ch.notes.map(up);
    const n = style === 'sparse' ? 1 : style === 'waltz' ? 2 : style === 'ballad' ? 2 : 3;
    const dur = ch.beats / n;
    for (let i = 0; i < n; i++) {
      // favour higher chord tones on strong beats, random walk otherwise
      const pick = i === 0 ? tones[tones.length - 1] : tones[Math.floor(rand() * tones.length)];
      // occasional rest for air (not on first chord beat)
      if (i > 0 && rand() < 0.18) {
        t += dur;
        continue;
      }
      melody.push({ at: t, beats: +(dur * 0.92).toFixed(2), note: pick });
      t += dur;
    }
  });
  return melody;
}

function buildSong(
  base: Omit<Song, 'chords' | 'melody' | 'bassRoots'> & { beatsPerChord: number; repeats: number },
  prog: ProgressionSpec,
  seed: number,
  melodyStyle: 'waltz' | 'ballad' | 'drive' | 'sparse',
): Song {
  const { chords, roots } = expand(prog, { beatsPerChord: base.beatsPerChord, repeats: base.repeats });
  const { beatsPerChord: _b, repeats: _r, ...rest } = base;
  return { ...rest, chords, melody: makeMelody(chords, seed, melodyStyle), bassRoots: roots };
}

const L = (
  kind: Song['license']['kind'],
  label: string,
  composer: string,
  notes: string,
  extra: Partial<Song['license']> = {},
): Song['license'] => ({
  kind,
  label,
  composer,
  commercialUse: true,
  modificationsAllowed: true,
  attribution: kind === 'cc' ? `“${extra.attribution ?? ''}”` : undefined,
  notes,
  ...extra,
});

export const SONGS: Song[] = [
  buildSong(
    {
      id: 'neon-boulevard',
      title: 'Neon Boulevard',
      composer: 'Chordscape Studio',
      era: '80s-inspired',
      genre: 'Synthwave',
      mood: ['happy', 'dramatic'],
      instruments: ['piano', 'guitar'],
      difficulty: 'beginner',
      tempo: 112,
      key: 'A minor',
      description: 'Driving neon-soaked synth loop — the classic i–VI–III–VII ride down a laser grid.',
      beatsPerChord: 4,
      repeats: 2,
      drumPattern: 'four-floor',
      license: L('original', 'Original CC BY 4.0', 'Chordscape Studio', 'Composed for Chordscape. Free to play, remix and share with attribution.'),
      palette: ['#ff2fb3', '#22d3ee', '#7c3aed'],
    },
    {
      chords: [
        { name: 'Am', roman: 'i', notes: ['A2', 'E3', 'A3', 'C4', 'E4'], fingering: 'LH 5-3-1 · RH 1-2-5' },
        { name: 'F', roman: 'VI', notes: ['F2', 'C3', 'F3', 'A3', 'C4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'C', roman: 'III', notes: ['C3', 'G3', 'C4', 'E4', 'G4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'G', roman: 'VII', notes: ['G2', 'D3', 'G3', 'B3', 'D4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
      ],
    },
    11,
    'drive',
  ),
  buildSong(
    {
      id: 'chrome-sunset',
      title: 'Chrome Sunset',
      composer: 'Chordscape Studio',
      era: '80s-inspired',
      genre: 'Synth-pop ballad',
      mood: ['nostalgic', 'calm'],
      instruments: ['piano', 'guitar'],
      difficulty: 'beginner',
      tempo: 100,
      key: 'D minor',
      description: 'Glassy pads and chrome reflections — a slow-burn vi–IV–I–V in D minor.',
      beatsPerChord: 4,
      repeats: 2,
      drumPattern: 'disco',
      license: L('original', 'Original CC BY 4.0', 'Chordscape Studio', 'Composed for Chordscape. Free to play, remix and share with attribution.'),
      palette: ['#fb923c', '#f472b6', '#38bdf8'],
    },
    {
      chords: [
        { name: 'Dm', roman: 'i', notes: ['D3', 'A3', 'D4', 'F4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'B♭', roman: 'VI', notes: ['Bb2', 'F3', 'Bb3', 'D4'], fingering: 'LH 5-3-1 · RH 1-2-5' },
        { name: 'F', roman: 'III', notes: ['F2', 'C3', 'F3', 'A3'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'C', roman: 'VII', notes: ['C3', 'G3', 'C4', 'E4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
      ],
    },
    22,
    'ballad',
  ),
  buildSong(
    {
      id: 'midnight-arcade',
      title: 'Midnight Arcade',
      composer: 'Chordscape Studio',
      era: '80s-inspired',
      genre: 'Electro-funk',
      mood: ['happy', 'dramatic'],
      instruments: ['guitar', 'piano'],
      difficulty: 'intermediate',
      tempo: 118,
      key: 'E minor',
      description: 'Funky eighth-note stabs over a ii–V–i-flavoured minor loop. Made for remix mode.',
      beatsPerChord: 2,
      repeats: 4,
      drumPattern: 'boom-bap',
      license: L('original', 'Original CC BY 4.0', 'Chordscape Studio', 'Composed for Chordscape. Free to play, remix and share with attribution.'),
      palette: ['#a3e635', '#22d3ee', '#8b5cf6'],
    },
    {
      chords: [
        { name: 'Em9', roman: 'i9', notes: ['E2', 'B2', 'E3', 'G3', 'F#3'], fingering: 'LH 5-1 · RH 1-2-4' },
        { name: 'Am9', roman: 'iv9', notes: ['A2', 'E3', 'A3', 'C4', 'B3'], fingering: 'LH 5-1 · RH 1-2-5' },
        { name: 'B7', roman: 'V7', notes: ['B2', 'F#3', 'B3', 'D#4', 'A3'], fingering: 'LH 5-3-1 · RH 1-2-4' },
      ],
    },
    33,
    'drive',
  ),
  buildSong(
    {
      id: 'golden-sunday',
      title: 'Golden Sunday',
      composer: 'Chordscape Studio',
      era: '70s-inspired',
      genre: 'Soul-pop',
      mood: ['happy', 'nostalgic'],
      instruments: ['piano', 'guitar'],
      difficulty: 'beginner',
      tempo: 96,
      key: 'C major',
      description: 'Warm Rhodes-style soul-pop — I–vi–ii–V with a honeyed melody.',
      beatsPerChord: 4,
      repeats: 2,
      drumPattern: 'disco',
      license: L('original', 'Original CC BY 4.0', 'Chordscape Studio', 'Composed for Chordscape. Free to play, remix and share with attribution.'),
      palette: ['#fbbf24', '#f97316', '#a855f7'],
    },
    {
      chords: [
        { name: 'C', roman: 'I', notes: ['C3', 'G3', 'C4', 'E4', 'G4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'Am7', roman: 'vi7', notes: ['A2', 'E3', 'A3', 'C4', 'G4'], fingering: 'LH 5-1 · RH 1-2-5' },
        { name: 'Dm7', roman: 'ii7', notes: ['D3', 'A3', 'D4', 'F4', 'C4'], fingering: 'LH 5-1 · RH 1-3-5' },
        { name: 'G7', roman: 'V7', notes: ['G2', 'D3', 'G3', 'B3', 'F4'], fingering: 'LH 5-3-1 · RH 1-2-4' },
      ],
    },
    44,
    'ballad',
  ),
  buildSong(
    {
      id: 'velvet-groove',
      title: 'Velvet Groove',
      composer: 'Chordscape Studio',
      era: '70s-inspired',
      genre: 'Disco-funk',
      mood: ['happy'],
      instruments: ['piano', 'guitar'],
      difficulty: 'intermediate',
      tempo: 108,
      key: 'G major',
      description: 'Four-on-the-floor velvet disco with jazzy sevenths. Follow mode favourite.',
      beatsPerChord: 4,
      repeats: 2,
      drumPattern: 'four-floor',
      license: L('original', 'Original CC BY 4.0', 'Chordscape Studio', 'Composed for Chordscape. Free to play, remix and share with attribution.'),
      palette: ['#f43f5e', '#fbbf24', '#7c3aed'],
    },
    {
      chords: [
        { name: 'Gmaj7', roman: 'Imaj7', notes: ['G2', 'D3', 'G3', 'B3', 'F#4'], fingering: 'LH 5-3-1 · RH 1-2-5' },
        { name: 'Em7', roman: 'vi7', notes: ['E2', 'B2', 'E3', 'G3', 'D4'], fingering: 'LH 5-1 · RH 1-3-5' },
        { name: 'C9', roman: 'IV9', notes: ['C3', 'G3', 'C4', 'E4', 'D4'], fingering: 'LH 5-1 · RH 1-3-4' },
        { name: 'D7', roman: 'V7', notes: ['D3', 'A3', 'D4', 'F#4', 'C4'], fingering: 'LH 5-1 · RH 1-3-4' },
      ],
    },
    55,
    'drive',
  ),
  buildSong(
    {
      id: 'rainy-cassette',
      title: 'Rainy Cassette',
      composer: 'Chordscape Studio',
      era: '90s-inspired',
      genre: 'Soft rock',
      mood: ['nostalgic', 'calm'],
      instruments: ['guitar', 'piano'],
      difficulty: 'beginner',
      tempo: 84,
      key: 'G major',
      description: 'Hissy-tape soft rock — vi–IV–I–V to stare out of rainy windows to.',
      beatsPerChord: 4,
      repeats: 2,
      drumPattern: 'folk-strum',
      license: L('original', 'Original CC BY 4.0', 'Chordscape Studio', 'Composed for Chordscape. Free to play, remix and share with attribution.'),
      palette: ['#38bdf8', '#6366f1', '#f472b6'],
    },
    {
      chords: [
        { name: 'Em', roman: 'vi', notes: ['E2', 'B2', 'E3', 'G3', 'B3'], fingering: 'LH 5-1 · RH 1-3-5' },
        { name: 'C', roman: 'IV', notes: ['C3', 'G3', 'C4', 'E4'], fingering: 'LH 5-2-1 · RH 1-3-5' },
        { name: 'G', roman: 'I', notes: ['G2', 'D3', 'G3', 'B3'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'D', roman: 'V', notes: ['D3', 'A3', 'D4', 'F#4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
      ],
    },
    66,
    'sparse',
  ),
  buildSong(
    {
      id: 'flannel-sky',
      title: 'Flannel Sky',
      composer: 'Chordscape Studio',
      era: '90s-inspired',
      genre: 'Alt-rock',
      mood: ['dramatic', 'nostalgic'],
      instruments: ['guitar', 'piano'],
      difficulty: 'intermediate',
      tempo: 92,
      key: 'D major',
      description: 'Big flannel guitars — I–V–vi–IV with an anthemic lift.',
      beatsPerChord: 4,
      repeats: 2,
      drumPattern: 'boom-bap',
      license: L('original', 'Original CC BY 4.0', 'Chordscape Studio', 'Composed for Chordscape. Free to play, remix and share with attribution.'),
      palette: ['#22c55e', '#eab308', '#ef4444'],
    },
    {
      chords: [
        { name: 'G', roman: 'IV', notes: ['G2', 'D3', 'G3', 'B3', 'D4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'D', roman: 'I', notes: ['D3', 'A3', 'D4', 'F#4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'Bm', roman: 'vi', notes: ['B2', 'F#3', 'B3', 'D4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'A', roman: 'V', notes: ['A2', 'E3', 'A3', 'C#4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
      ],
    },
    77,
    'drive',
  ),
  buildSong(
    {
      id: 'mountain-folk',
      title: 'Mountain Folk',
      composer: 'Traditional-style original',
      era: 'traditional',
      genre: 'Folk',
      mood: ['happy', 'calm'],
      instruments: ['guitar', 'piano'],
      difficulty: 'beginner',
      tempo: 100,
      key: 'G major',
      description: 'A porch-stomp folk tune — I–IV–I–V with a whistlable melody.',
      beatsPerChord: 2,
      repeats: 4,
      drumPattern: 'folk-strum',
      license: L('public-domain', 'Public domain (original folk-style tune)', 'Traditional-style, arranged for Chordscape', 'Dedicated to the public domain. No attribution required.', {
        commercialUse: true,
      }),
      palette: ['#16a34a', '#65a30d', '#f59e0b'],
    },
    {
      chords: [
        { name: 'G', roman: 'I', notes: ['G2', 'D3', 'G3', 'B3'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'C', roman: 'IV', notes: ['C3', 'G3', 'C4', 'E4'], fingering: 'LH 5-2-1 · RH 1-3-5' },
        { name: 'G', roman: 'I', notes: ['G2', 'D3', 'G3', 'B3'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'D', roman: 'V', notes: ['D3', 'A3', 'D4', 'F#4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
      ],
    },
    88,
    'ballad',
  ),
  buildSong(
    {
      id: 'lantern-dance',
      title: 'Lantern Dance',
      composer: 'Traditional-style original',
      era: 'traditional',
      genre: 'Festival dance',
      mood: ['happy'],
      instruments: ['piano', 'guitar'],
      difficulty: 'intermediate',
      tempo: 120,
      key: 'C major (pentatonic)',
      description: 'Pentatonic lantern-festival dance — bright, quick, and joyful.',
      beatsPerChord: 2,
      repeats: 4,
      drumPattern: 'folk-strum',
      license: L('public-domain', 'Public domain (original festival tune)', 'Traditional-style, arranged for Chordscape', 'Dedicated to the public domain. No attribution required.'),
      palette: ['#ef4444', '#f59e0b', '#fbbf24'],
    },
    {
      chords: [
        { name: 'C', roman: 'I', notes: ['C3', 'G3', 'C4', 'E4', 'G4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'G', roman: 'V', notes: ['G2', 'D3', 'G3', 'B3', 'D4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'Am', roman: 'vi', notes: ['A2', 'E3', 'A3', 'C4', 'E4'], fingering: 'LH 5-3-1 · RH 1-2-5' },
        { name: 'F', roman: 'IV', notes: ['F2', 'C3', 'F3', 'A3', 'C4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
      ],
    },
    99,
    'drive',
  ),
  buildSong(
    {
      id: 'moonlit-waltz',
      title: 'Moonlit Waltz',
      composer: 'Chordscape arrangement (classical style)',
      era: 'traditional',
      genre: 'Classical waltz',
      mood: ['calm', 'nostalgic'],
      instruments: ['piano', 'guitar'],
      difficulty: 'advanced',
      tempo: 90,
      key: 'C major',
      description: 'An original waltz in classical style — I–V–vi–IV in 3/4, with candlelit piano.',
      timeSignature: [3, 4],
      beatsPerChord: 3,
      repeats: 3,
      drumPattern: 'waltz',
      license: L('public-domain', 'Public domain arrangement', 'Classical-style original arrangement for Chordscape', 'Dedicated to the public domain. No attribution required.'),
      palette: ['#818cf8', '#c084fc', '#f0abfc'],
    },
    {
      chords: [
        { name: 'C', roman: 'I', notes: ['C3', 'G3', 'C4', 'E4', 'G4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
        { name: 'G7', roman: 'V7', notes: ['G2', 'D3', 'G3', 'B3', 'F4'], fingering: 'LH 5-3-1 · RH 1-2-4' },
        { name: 'Am', roman: 'vi', notes: ['A2', 'E3', 'A3', 'C4', 'E4'], fingering: 'LH 5-3-1 · RH 1-2-5' },
        { name: 'Fmaj7', roman: 'IVmaj7', notes: ['F2', 'C3', 'F3', 'A3', 'E4'], fingering: 'LH 5-3-1 · RH 1-3-5' },
      ],
    },
    111,
    'waltz',
  ),
];

export const ERAS: { id: Song['era']; label: string; blurb: string }[] = [
  { id: 'traditional', label: 'Traditional', blurb: 'Folk tunes, festival dances & a moonlit waltz' },
  { id: '70s-inspired', label: '1970s-inspired', blurb: 'Soul-pop warmth & velvet disco grooves' },
  { id: '80s-inspired', label: '1980s-inspired', blurb: 'Neon grids, chrome synths & laser lines' },
  { id: '90s-inspired', label: '1990s-inspired', blurb: 'Cassette textures & alt-rock anthems' },
];

export function songDurationBeats(song: Song): number {
  return song.chords.reduce((s, c) => s + c.beats, 0);
}

export function chordAtBeat(song: Song, beat: number): { index: number; chord: ChordEvent; startBeat: number } {
  let t = 0;
  for (let i = 0; i < song.chords.length; i++) {
    const c = song.chords[i];
    if (beat < t + c.beats) return { index: i, chord: c, startBeat: t };
    t += c.beats;
  }
  const last = song.chords[song.chords.length - 1];
  return { index: song.chords.length - 1, chord: last, startBeat: t - last.beats };
}
