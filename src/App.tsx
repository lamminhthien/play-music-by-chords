import { Link, Route, Routes } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Library } from './pages/Library';
import { PlayerPage } from './pages/PlayerPage';

export function App() {
  return (
    <div className="min-h-full">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1030]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-xl font-black text-transparent">
            ♪ Chordscape
          </Link>
          <div className="flex gap-4 text-sm font-bold">
            <Link to="/" className="hover:text-cyan-300">Home</Link>
            <Link to="/library" className="hover:text-cyan-300">Library</Link>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/library" element={<Library />} />
        <Route path="/play/:songId" element={<PlayerPage />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-slate-400">
        Chordscape — an interactive music playground. All songs are original or public-domain arrangements with visible licenses.
        External MIDI works in selected browsers (Chrome/Edge/Opera); otherwise use the on-screen keyboard.
      </footer>
    </div>
  );
}
