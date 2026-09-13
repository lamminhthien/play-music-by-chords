export type Era = 'traditional' | '70s-inspired' | '80s-inspired' | '90s-inspired';
export type Mood = 'happy' | 'calm' | 'dramatic' | 'nostalgic';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type LicenseKind = 'original' | 'public-domain' | 'cc';
export type InstrumentId = 'piano' | 'guitar';
export type DrumPattern = 'none' | 'four-floor' | 'disco' | 'boom-bap' | 'waltz' | 'folk-strum';

export interface ChordEvent {
  name: string;
  romanNumeral: string;
  beats: number;
  /** Spelled pitch names with octave, e.g. ["A3","C4","E4"] */
  notes: string[];
  fingering?: string;
}

export interface MelodyEvent {
  /** beats from start of song */
  at: number;
  beats: number;
  note: string;
}

export interface LicenseInfo {
  kind: LicenseKind;
  label: string;
  composer: string;
  source?: string;
  attribution?: string;
  commercialUse: boolean;
  modificationsAllowed: boolean;
  notes: string;
}

export interface Song {
  id: string;
  title: string;
  composer: string;
  era: Era;
  genre: string;
  mood: Mood[];
  instruments: InstrumentId[];
  difficulty: Difficulty;
  tempo: number;
  key: string;
  timeSignature?: [number, number];
  description: string;
  chords: ChordEvent[];
  melody: MelodyEvent[];
  bassRoots?: string[];
  drumPattern: DrumPattern;
  license: LicenseInfo;
  palette: [string, string, string];
}

export type PlayMode = 'listen' | 'play-chords' | 'follow' | 'free' | 'remix';
export type ArrangeMode = 'full' | 'chords' | 'melody';
