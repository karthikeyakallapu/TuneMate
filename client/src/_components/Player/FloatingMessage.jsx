const FloatingMessage = ({ message, isVisible }) => {
  if (!message) return null;

  return (
    <div
      className={`pointer-events-none fixed bottom-52 right-4 z-40 w-64 transition-all duration-300 md:right-6 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-xl border border-cyan-300/30 bg-zinc-950/95 px-3 py-2 shadow-lg shadow-cyan-900/30 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-300">
          Incoming Message
        </p>
        <p className="mt-1 break-words text-sm text-zinc-100">{message}</p>
      </div>
    </div>
  );
};

export default FloatingMessage;
