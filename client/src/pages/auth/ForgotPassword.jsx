import useFormData from "@/hooks/useFormData.js";
import tuneMateInstance from "@/service/api/api.js";
import Toast from "@/utils/Toasts/Toast.js";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, Send, ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPassword = ({ setShowDetails }) => {
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { data, handleChange, handleSubmit, isLoading, resetData, error } =
    useFormData(
      {
        email: "",
      },
      tuneMateInstance.forgotPassword,
    );

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    // Validate email
    if (!data.email.trim()) {
      Toast({ type: "error", message: "Please enter your email address" });
      return;
    }

    if (!validateEmail(data.email)) {
      Toast({ type: "error", message: "Please enter a valid email address" });
      return;
    }

    // Check cooldown
    if (cooldown > 0) {
      Toast({
        type: "warning",
        message: `Please wait ${cooldown} seconds before requesting again`,
      });
      return;
    }

    try {
      const response = await handleSubmit();

      if (response?.data) {
        Toast({
          type: response.data.type || "success",
          message:
            response.data.message || "Password reset email sent successfully!",
        });

        // Show success state
        setEmailSent(true);

        // Start cooldown timer
        setCooldown(60); // 60 seconds cooldown
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error("Error in handleForgotPassword:", err);
      Toast({
        type: "error",
        message: err.response?.data?.message || "Failed to send reset email",
      });
    } finally {
      resetData();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center"
    >
      <div className="flex flex-col w-full max-w-md p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 mb-4">
            <Mail className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Forgot Password?
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        {/* Success State */}
        {emailSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Check Your Email
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-sm font-medium text-cyan-400 mb-4">
                {data.email}
              </p>
              <p className="text-xs text-gray-400">
                Didn't receive the email? Check your spam folder or{" "}
                {cooldown > 0 ? (
                  <span className="text-yellow-400">
                    try again in {cooldown} seconds
                  </span>
                ) : (
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    click here to resend
                  </button>
                )}
              </p>
            </div>

            <button
              className="w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/25"
              onClick={() => setShowDetails("login")}
            >
              Back to Login
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {/* Email Field */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    emailFocused ? "text-cyan-400" : "text-gray-400"
                  }`}
                  size={18}
                />
                <input
                  type="email"
                  className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200"
                  onChange={handleChange}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  name="email"
                  value={data.email}
                  placeholder="Enter your registered email"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                We'll send a password reset link to this email address
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || cooldown > 0}
              className="w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sending...
                </>
              ) : cooldown > 0 ? (
                <>
                  <Send size={18} />
                  Resend Available in {cooldown}s
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Reset Link
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Links */}
        {!emailSent && (
          <>
            <div className="flex flex-col items-center justify-center mt-6 space-y-3">
              <div className="flex items-center gap-4">
                <button
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={() => setShowDetails("resendMail")}
                >
                  Resend Verification Mail
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Remember your password?</span>
                <button
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  onClick={() => setShowDetails("login")}
                >
                  Back to Login
                </button>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Having trouble?{" "}
                <button
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={() =>
                    window.open("mailto:support@tunemate.com", "_blank")
                  }
                >
                  Contact Support
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
