const ChatMessageForm = ({ message, onMessageChange, onSubmit }) => {
  const isDisabled = message.trim() === "";

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={message}
        placeholder="Type a message..."
        className="w-52 rounded-lg border border-cyan-300/40 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-400 outline-none transition focus:border-cyan-300/80 focus:ring-2 focus:ring-cyan-400/30"
        onChange={(event) => onMessageChange(event.target.value)}
      />
      <button
        type="submit"
        disabled={isDisabled}
        className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
};

export default ChatMessageForm;
