import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogIn,
  MailCheck,
  XCircle,
} from "lucide-react";
import tuneMateInstance from "@/service/api/api.js";
import useModalStore from "@/store/use-modal-store";
import Wrapper from "@/pages/Wrapper";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openModal } = useModalStore();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      if (!token) {
        if (!isMounted) return;
        setStatus("error");
        setMessage(
          "Verification token is missing. Please use the latest verification email link.",
        );
        return;
      }

      const response = await tuneMateInstance.verifyEmail({ token });

      if (!isMounted) return;

      if (response?.data?.type === "success") {
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully.");
        return;
      }

      setStatus("error");
      setMessage(
        response?.data?.message ||
          "Verification failed. Please request a new verification email.",
      );
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleOpenLogin = () => {
    navigate("/");
    openModal("LOGIN");
  };

  return (
    <Wrapper>
      <div className="min-h-[calc(100vh-7rem)] mb-20 md:mb-0 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-gradient-to-b from-[#11131a] to-[#0a0b10] p-8 text-white shadow-2xl"
        >
          <div className="flex items-center justify-center mb-4">
            {status === "loading" && (
              <div className="w-14 h-14 rounded-full bg-cyan-500/15 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
              </div>
            )}

            {status === "success" && (
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
            )}

            {status === "error" && (
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
            )}
          </div>

          <h1 className="text-center text-2xl font-semibold mb-2">
            {status === "loading" && "Verifying Email"}
            {status === "success" && "Email Verified"}
            {status === "error" && "Verification Failed"}
          </h1>

          <p className="text-center text-sm text-gray-300 leading-6">
            {message}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {status === "success" && (
              <button
                onClick={handleOpenLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-colors"
              >
                <LogIn size={16} />
                Login Now
              </button>
            )}

            {status === "error" && (
              <button
                onClick={handleOpenLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-colors"
              >
                <MailCheck size={16} />
                Open Login
              </button>
            )}

            <button
              onClick={() => navigate("/")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </Wrapper>
  );
};

export default VerifyEmail;
