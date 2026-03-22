import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, LogIn, RefreshCw } from "lucide-react";
import useModalStore from "@/store/use-modal-store";

const AuthSessionExpired = ({
  title = "Session Expired",
  message = "Your session expired or is no longer valid. Please log in again.",
  onRetry,
}) => {
  const navigate = useNavigate();
  const { openModal } = useModalStore();

  const handleLogin = () => {
    navigate("/");
    openModal("LOGIN");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-[#11131a] to-[#0a0b10] p-6 text-center shadow-2xl"
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/15 flex items-center justify-center mb-4">
          <AlertTriangle className="text-amber-400" size={24} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-300 leading-6">{message}</p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogin}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-colors text-white"
          >
            <LogIn size={16} />
            Login Again
          </button>

          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-white"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthSessionExpired;
