import { useEffect, useState } from 'react';
import { midiToNote } from '../engine/theory';

export interface MidiState {
  supported: boolean;
  enabled: boolean;
  inputs: string[];
  error?: string;
  lastNote?: { note: string; velocity: number; at: number };
}

/**
 * Web MIDI input hook. Gracefully degrades when unsupported
 * (e.g. Safari) with a fallback message for the on-screen keyboard.
 */
export function useMidi(onNote?: (note: string, velocity: number) => void) {
  const [state, setState] = useState<MidiState>({ supported: true, enabled: false, inputs: [] });

  useEffect(() => {
    const nav = navigator as Navigator & { requestMIDIAccess?: (opts?: { sysex?: boolean }) => Promise<MIDIAccess> };
    if (typeof navigator === 'undefined' || !nav.requestMIDIAccess) {
      setState({ supported: false, enabled: false, inputs: [] });
      return;
    }
    let disposed = false;
    const cleanups: (() => void)[] = [];
    nav
      .requestMIDIAccess()
      .then((access) => {
        if (disposed) return;
        const names: string[] = [];
        access.inputs.forEach((input) => {
          names.push(input.name ?? 'MIDI keyboard');
          const handler = (e: MIDIMessageEvent) => {
            const data = e.data ? Array.from(e.data) : [];
            const [status = 0, pitch = 0, vel = 0] = data;
            if ((status & 0xf0) === 0x90 && vel > 0) {
              const note = midiToNote(pitch);
              const velocity = vel / 127;
              onNote?.(note, velocity);
              setState((s) => ({ ...s, lastNote: { note, velocity, at: Date.now() } }));
            }
          };
          input.onmidimessage = handler;
          cleanups.push(() => {
            input.onmidimessage = null;
          });
        });
        setState({ supported: true, enabled: true, inputs: names });
        access.onstatechange = () => {
          const n: string[] = [];
          access.inputs.forEach((i) => n.push(i.name ?? 'MIDI keyboard'));
          setState((s) => ({ ...s, inputs: n }));
        };
      })
      .catch(() => {
        if (!disposed)
          setState({ supported: true, enabled: false, inputs: [], error: 'MIDI access was blocked by the browser.' });
      });
    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
