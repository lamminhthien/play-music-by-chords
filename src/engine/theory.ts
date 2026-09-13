const SEMI: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteToMidi(note: string): number {
  const m = note.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!m) throw new Error(`Bad note: ${note}`);
  return SEMI[m[1]] + (parseInt(m[2], 10) + 1) * 12;
}

export function midiToNote(midi: number): string {
  const name = NAMES[((midi % 12) + 12) % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${name}${oct}`;
}

export function transposeNote(note: string, semitones: number): string {
  return midiToNote(noteToMidi(note) + semitones);
}

/** White/black key layout helper for the virtual piano. */
export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

/** Pitch classes of a chord (for play-along checking), transposed. */
export function chordPitchClasses(notes: string[], transpose = 0): Set<number> {
  return new Set(notes.map((n) => (noteToMidi(n) + transpose) % 12));
}

/** Simple guitar-shape hint derived from chord name root. */
export function guitarHint(chordName: string): string {
  const root = chordName.match(/^[A-G][#b♭]?/)?.[0] ?? 'C';
  const minor = /m(?!aj)/.test(chordName);
  const seven = /7|9/.test(chordName);
  return `Guitar: ${root} ${minor ? 'minor' : 'major'} open shape${seven ? ' + pinky on high-E 3rd fret' : ''} — root on ${root} string, strum from bass.`;
}
