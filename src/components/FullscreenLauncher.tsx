'use client';
import { useEffect, useState } from 'react';
import { Zap, Maximize2 } from 'lucide-react';

export default function FullscreenLauncher() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if not already fullscreen
    if (!document.fullscreenElement) {
      setVisible(true);
    }
  }, []);

  async function launch() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Browser denied — still dismiss the overlay
    }
    setVisible(false);
  }

  function skip(e: React.MouseEvent) {
    e.stopPropagation();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      onClick={launch}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 cursor-pointer select-none"
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.12)_0%,_transparent_70%)] pointer-events-none" />

      {/* Logo */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-900/60">
          <Zap size={44} className="text-white" />
        </div>
      </div>

      <h1 className="text-5xl font-black text-white tracking-tight mb-2">Velora</h1>
      <p className="text-slate-400 text-base mb-16">Cashier System</p>

      {/* Tap prompt */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-full border border-indigo-500/40 bg-indigo-500/10 animate-pulse">
          <Maximize2 size={20} className="text-indigo-400" />
        </div>
        <p className="text-slate-300 text-sm font-medium tracking-wide">
          Tap anywhere to launch fullscreen
        </p>
      </div>

      {/* Skip */}
      <button
        onClick={skip}
        className="absolute bottom-8 text-slate-600 hover:text-slate-400 text-sm transition-colors px-4 py-2"
      >
        Continue without fullscreen
      </button>
    </div>
  );
}
