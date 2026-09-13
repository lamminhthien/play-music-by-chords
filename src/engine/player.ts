import * as Tone from 'tone';
import type { ArrangeMode, DrumPattern, InstrumentId, Song } from '../types';
import { transposeNote } from './theory';

export interface PlayerState {
  playing: boolean;
  beat: number;
  chordIndex: number;
  tempo: number;
  volume: number;
  loop: boolean;
  metronome: boolean;
  instrument: InstrumentId;
  transpose: number;
  arrange: ArrangeMode;
  drum: DrumPattern;
}

export type PlayerListener = (s: PlayerState) => void;

/**
 * Tone.js Transport-based MIDI-style playback engine.
 * Chords / bass / melody / drums are scheduled on Tone.Transport,
 * so play / pause / stop / tempo / loop behave sample-accurately.
 */
export class SongPlayer {
  private song: Song;
  private listeners = new Set<PlayerListener>();
  private synth: Tone.PolySynth | null = null;
  private bass: Tone.MonoSynth | null = null;
  private kick: Tone.MembraneSynth | null = null;
  private hat: Tone.NoiseSynth | null = null;
  private click: Tone.Synth | null = null;
  private part: Tone.Part | null = null;
  private uiTimer: ReturnType<typeof setInterval> | null = null;

  private state: PlayerState;
  private beat = 0;

  constructor(song: Song) {
    this.song = song;
    this.state = {
      playing: false,
      beat: 0,
      chordIndex: 0,
      tempo: song.tempo,
      volume: 0.8,
      loop: true,
      metronome: false,
      instrument: song.instruments[0],
      transpose: 0,
      arrange: 'full',
      drum: song.drumPattern,
    };
  }

  get totalBeats() {
    return this.song.chords.reduce((s, c) => s + c.beats, 0);
  }

  subscribe(fn: PlayerListener) {
    this.listeners.add(fn);
    fn({ ...this.state });
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    const s = { ...this.state, beat: this.beat };
    this.listeners.forEach((fn) => fn(s));
  }

  private ensureInstruments() {
    if (this.synth) return;
    this.synth = new Tone.PolySynth(Tone.Synth, this.synthOptions(this.state.instrument)).toDestination();
    this.bass = new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      filter: { Q: 1, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.4 },
    }).toDestination();
    this.kick = new Tone.MembraneSynth().toDestination();
    this.hat = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.08, sustain: 0 } }).toDestination();
    this.click = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0 } }).toDestination();
    this.applyVolume();
  }

  private synthOptions(inst: InstrumentId) {
    switch (inst) {
      case 'guitar':
        return { oscillator: { type: 'triangle' as const }, envelope: { attack: 0.005, decay: 0.4, sustain: 0.25, release: 0.5 } };
      case 'piano':
      default:
        return { oscillator: { type: 'triangle' as const }, envelope: { attack: 0.002, decay: 0.5, sustain: 0.3, release: 1.0 } };
    }
  }

  setInstrument(inst: InstrumentId) {
    this.state.instrument = inst;
    if (this.synth) this.synth.set(this.synthOptions(inst) as object);
    this.emit();
  }

  setTempo(bpm: number) {
    this.state.tempo = Math.min(200, Math.max(40, Math.round(bpm)));
    Tone.Transport.bpm.value = this.state.tempo;
    this.emit();
  }

  setVolume(v: number) {
    this.state.volume = v;
    this.applyVolume();
    this.emit();
  }

  private applyVolume() {
    Tone.Destination.volume.value = this.state.volume <= 0.001 ? -60 : -24 + this.state.volume * 24;
  }

  toggleLoop() {
    this.state.loop = !this.state.loop;
    Tone.Transport.loop = this.state.loop;
    this.emit();
  }

  toggleMetronome() {
    this.state.metronome = !this.state.metronome;
    this.emit();
  }

  setTranspose(semi: number) {
    this.state.transpose = Math.min(6, Math.max(-6, semi));
    if (this.state.playing) this.rebuildPart();
    this.emit();
  }

  setArrange(a: ArrangeMode) {
    this.state.arrange = a;
    if (this.state.playing) this.rebuildPart();
    this.emit();
  }

  setDrum(d: DrumPattern) {
    this.state.drum = d;
    if (this.state.playing) this.rebuildPart();
    this.emit();
  }

  seek(beat: number) {
    const b = Math.min(this.totalBeats - 0.01, Math.max(0, beat));
    this.beat = b;
    if (this.state.playing) {
      Tone.Transport.seconds = this.beatToSeconds(b);
    }
    this.syncChordIndex();
    this.emit();
  }

  private beatToSeconds(b: number) {
    return (b / this.state.tempo) * 60;
  }

  private syncChordIndex() {
    let t = 0;
    for (let i = 0; i < this.song.chords.length; i++) {
      if (this.beat < t + this.song.chords[i].beats) {
        this.state.chordIndex = i;
        return;
      }
      t += this.song.chords[i].beats;
    }
    this.state.chordIndex = this.song.chords.length - 1;
  }

  /** Beat (quarter-note count, may be fractional) -> Transport bars:quarters:sixteenths */
  private beatToNotation(b: number): string {
    const bars = Math.floor(b / 4);
    const q = Math.floor(b % 4);
    const six = Math.round((b % 1) * 4);
    return `${bars}:${q}:${six}`;
  }

  /** Build (or rebuild) the Transport part for the whole song. */
  private rebuildPart() {
    this.part?.dispose();
    const { transpose, arrange, drum } = this.state;
    const playChords = arrange !== 'melody';
    const playMelody = arrange !== 'chords';
    const total = this.totalBeats;
    const spb = 60 / this.state.tempo;
    type Ev = (time: number) => void;
    const events: [string, Ev][] = [];

    let t = 0;
    this.song.chords.forEach((ch, ci) => {
      const at = this.beatToNotation(t);
      const durSec = ch.beats * spb;
      const idx = ci;
      const sb = t;
      if (playChords) {
        const notes = ch.notes.map((n) => transposeNote(n, transpose));
        const root = transposeNote(ch.notes[0], transpose - 12);
        events.push([
          at,
          (time) => {
            this.synth?.triggerAttackRelease(notes, durSec * 0.95, time);
            this.bass?.triggerAttackRelease(root, Math.min(durSec * 0.5, 0.6), time, 0.7);
            Tone.Draw.schedule(() => {
              this.beat = sb;
              this.state.chordIndex = idx;
              this.emit();
            }, time);
          },
        ]);
      } else {
        events.push([
          at,
          (time) => {
            Tone.Draw.schedule(() => {
              this.beat = sb;
              this.state.chordIndex = idx;
              this.emit();
            }, time);
          },
        ]);
      }
      t += ch.beats;
    });

    if (playMelody) {
      const vel = 0.65;
      for (const m of this.song.melody) {
        const note = transposeNote(m.note, transpose);
        const len = m.beats * spb;
        events.push([this.beatToNotation(m.at), (time) => this.synth?.triggerAttackRelease(note, len * 0.9, time, vel)]);
      }
    }

    this.addDrums(events, drum);

    // metronome clicks
    for (let b = 0; b < total; b++) {
      if (b % 4 === 0) {
        events.push([
          this.beatToNotation(b),
          (time) => {
            if (this.state.metronome) this.click?.triggerAttackRelease('A6', 0.05, time, 0.25);
          },
        ]);
      }
    }

    this.part = new Tone.Part(
      (time, fn) => (fn as unknown as Ev)(time as unknown as number),
      events as unknown as [string, never][],
    );
    this.part.start(0);
  }

  private addDrums(events: [string, (time: number) => void][], pattern: DrumPattern) {
    const total = this.totalBeats;
    const at = (b: number) => this.beatToNotation(b);
    for (let b = 0; b < total; b++) {
      const inBar = b % 4;
      switch (pattern) {
        case 'four-floor':
          events.push([at(b), (time) => this.kick?.triggerAttackRelease('C1', 0.12, time)]);
          if (inBar % 2 === 1) events.push([at(b + 0.5), (time) => this.hat?.triggerAttackRelease('16n', time)]);
          break;
        case 'disco':
          events.push([at(b), (time) => this.kick?.triggerAttackRelease(inBar % 2 === 0 ? 'C1' : 'G1', 0.1, time)]);
          events.push([at(b + 0.5), (time) => this.hat?.triggerAttackRelease('16n', time)]);
          break;
        case 'boom-bap':
          if (inBar === 0 || inBar === 2) events.push([at(b), (time) => this.kick?.triggerAttackRelease('C1', 0.14, time)]);
          if (inBar === 1 || inBar === 3) events.push([at(b), (time) => this.hat?.triggerAttackRelease('8n', time)]);
          break;
        case 'waltz':
          events.push([at(b), (time) => this.kick?.triggerAttackRelease(inBar === 0 ? 'C1' : 'G1', 0.12, time)]);
          break;
        case 'folk-strum':
          if (inBar === 0) events.push([at(b), (time) => this.kick?.triggerAttackRelease('C1', 0.1, time)]);
          events.push([at(b + 0.5), (time) => this.hat?.triggerAttackRelease('32n', time)]);
          break;
        default:
          break;
      }
    }
  }

  private startUiTimer() {
    this.stopUiTimer();
    this.uiTimer = setInterval(() => {
      if (!this.state.playing) return;
      this.beat = Math.min(this.totalBeats, Tone.Transport.seconds / (60 / this.state.tempo));
      this.syncChordIndex();
      const endBeat = this.totalBeats;
      if (this.beat >= endBeat - 0.02 && !this.state.loop) {
        this.stop();
        return;
      }
      this.emit();
    }, 90);
  }

  private stopUiTimer() {
    if (this.uiTimer) clearInterval(this.uiTimer);
    this.uiTimer = null;
  }

  async play() {
    await Tone.start();
    this.ensureInstruments();
    if (this.state.playing) return;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = this.state.tempo;
    Tone.Transport.loop = this.state.loop;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = this.beatToNotation(this.totalBeats);
    if (this.beat >= this.totalBeats - 0.05) this.beat = 0;
    this.rebuildPart();
    this.state.playing = true;
    this.syncChordIndex();
    Tone.Transport.seconds = this.beatToSeconds(this.beat);
    Tone.Transport.start();
    this.startUiTimer();
    this.emit();
  }

  pause() {
    Tone.Transport.pause();
    this.synth?.releaseAll();
    this.beat = Math.min(this.totalBeats, Tone.Transport.seconds / (60 / this.state.tempo));
    this.state.playing = false;
    this.stopUiTimer();
    this.syncChordIndex();
    this.emit();
  }

  stop() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.part?.dispose();
    this.part = null;
    this.synth?.releaseAll();
    this.beat = 0;
    this.state.chordIndex = 0;
    this.state.playing = false;
    this.stopUiTimer();
    this.emit();
  }

  restart() {
    const wasPlaying = this.state.playing;
    this.stop();
    if (wasPlaying) void this.play();
  }

  /** Play a single note immediately (virtual piano / MIDI in). */
  async pluck(note: string, velocity = 0.8) {
    await Tone.start();
    this.ensureInstruments();
    this.synth?.triggerAttackRelease(note, 0.6, Tone.now(), velocity);
  }

  /** Play a full chord immediately (click-to-hear). */
  async strum(notes: string[]) {
    await Tone.start();
    this.ensureInstruments();
    const tp = notes.map((n) => transposeNote(n, this.state.transpose));
    this.synth?.triggerAttackRelease(tp, 1.2, Tone.now(), 0.7);
  }

  dispose() {
    this.stop();
    this.synth?.dispose();
    this.bass?.dispose();
    this.kick?.dispose();
    this.hat?.dispose();
    this.click?.dispose();
    this.synth = null;
  }
}
