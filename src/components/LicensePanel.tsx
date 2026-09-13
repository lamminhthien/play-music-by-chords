import type { Song } from '../types';

export function LicensePanel({ song }: { song: Song }) {
  const l = song.license;
  return (
    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-950/40 p-4 text-sm">
      <h4 className="font-bold text-emerald-200">License · {l.label}</h4>
      <dl className="mt-2 space-y-1 text-slate-200">
        <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Composer</dt><dd>{l.composer}</dd></div>
        {l.source && <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Source</dt><dd><a className="underline" href={l.source}>{l.source}</a></dd></div>}
        {l.attribution && <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Attribution</dt><dd>{l.attribution}</dd></div>}
        <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Usage</dt><dd>{l.notes}</dd></div>
        <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Commercial</dt><dd>{l.commercialUse ? 'Allowed' : 'Not allowed'}</dd></div>
        <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Remix</dt><dd>{l.modificationsAllowed ? 'Allowed' : 'Not allowed'}</dd></div>
      </dl>
    </div>
  );
}
