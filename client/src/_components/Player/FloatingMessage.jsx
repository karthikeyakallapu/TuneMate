// FloatingMessage.jsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FloatingMessage = ({ message, isVisible, onAutoHide }) => {
  if (!message) return null;

  // Auto-hide after 5 seconds
  useEffect(() => {
    if (isVisible && onAutoHide) {
      const timer = setTimeout(() => {
        onAutoHide();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onAutoHide]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          className="pointer-events-none fixed bottom-52 left-4 z-50 w-80 transition-all duration-500 md:right-6"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.9, opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="rounded-xl border border-cyan-300/30 bg-gradient-to-br from-zinc-950/95 to-zinc-900/95 px-4 py-3 shadow-lg shadow-cyan-900/30 backdrop-blur-md"
          >
            {/* Header with avatar and sender info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {message?.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-cyan-300">
                  {message?.username}
                </p>
              </div>
            </div>

            {/* Message content */}
            <p className="mt-1 break-words text-sm text-zinc-200 leading-relaxed">
              {message?.trimmedMessage}
            </p>

            {/* Timestamp (optional) */}
            {message?.timestamp && (
              <p className="mt-2 text-[10px] text-zinc-500 text-right">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FloatingMessage;
