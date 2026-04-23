'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SUGGESTIONS = ['ALPHA', 'BRAVO', 'SIGMA', 'DELTA', 'OMEGA'];

export default function RoomJoinForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const normalize = (v: string) =>
    v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim();
    if (!code) {
      setError('Enter a room code to continue.');
      inputRef.current?.focus();
      return;
    }
    router.push(`/room/${encodeURIComponent(normalize(code))}`);
  };

  const useSuggestion = (s: string) => {
    setRoomCode(s);
    setError('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-panel border border-border rounded-xl p-6 shadow-2xl shadow-black/50"
    >
      <label className="block mb-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle block mb-2">
          Room Code
        </span>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={roomCode}
            onChange={e => {
              setRoomCode(normalize(e.target.value));
              setError('');
            }}
            placeholder="e.g. ALPHA"
            maxLength={8}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-elevated border border-border rounded-lg px-4 py-3 font-mono text-base text-text placeholder-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors uppercase tracking-[0.15em]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-br from-accent to-accentHi rounded-lg font-semibold text-sm text-bg hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            Join
          </button>
        </div>
        {error && (
          <p className="mt-2 text-[11px] font-mono text-error animate-fade-in">
            ⚠ {error}
          </p>
        )}
      </label>

      {/* Quick-join suggestions */}
      <div className="mt-4">
        <span className="text-[9px] font-mono uppercase tracking-widest text-muted block mb-2">
          Quick rooms
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => useSuggestion(s)}
              className="px-3 py-1 rounded-md bg-elevated border border-border text-[10px] font-mono text-subtle hover:text-accent hover:border-accent/40 transition-colors"
            >
              #{s}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted leading-relaxed">
        New room code? Just type it — the room is created automatically.
      </p>
    </form>
  );
}
