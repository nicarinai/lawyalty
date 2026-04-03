import RoomJoinForm from '@/components/RoomJoinForm';

export default function HomePage() {
  return (
    <main className="h-screen flex items-center justify-center bg-bg dot-grid">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accentHi/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accentHi/30 border border-accent/20 flex items-center justify-center mb-4 shadow-lg shadow-accent/10">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4h8v8H4zM16 4h8v8h-8zM4 16h8v8H4z" stroke="#c0c1ff" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M20 16 L24 20 L20 24" stroke="#4edea3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 20h8" stroke="#4edea3" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">
            Midnight Mermaid
          </h1>
          <p className="text-sm text-subtle mt-1 font-mono tracking-wide">
            collaborative diagram editor
          </p>
        </div>

        <RoomJoinForm />

        <p className="text-center text-xs text-muted mt-6 font-mono">
          Share the room code with collaborators — no account needed
        </p>
      </div>
    </main>
  );
}
