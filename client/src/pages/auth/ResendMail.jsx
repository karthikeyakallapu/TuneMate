import useFormData from "@/hooks/useFormData.js";
import tuneMateInstance from "@/service/api/api.js";
import Toast from "@/utils/Toasts/Toast.js";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, Send, ArrowLeft } from "lucide-react";

const ResendMail = ({ setShowDetails }) => {
  const [emailFocused, setEmailFocused] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  
  const { data, handleChange, handleSubmit, isLoading, resetData, error } =
    useFormData(
      {
        email: ""
      },
      tuneMateInstance.resendVerificationMail
    );

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResend = async (e) => {
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
        message: `Please wait ${cooldown} seconds before requesting again` 
      });
      return;
    }
    
    try {
      const response = await handleSubmit();
      
      if (response?.data) {
        Toast({ 
          type: response.data.type || "success", 
          message: response.data.message || "Verification email sent successfully!" 
        });
        
        // Increment resend count and start cooldown
        setResendCount(prev => prev + 1);
        setCooldown(60); // 60 seconds cooldown
        
        // Start cooldown timer
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Clear form after successful send (optional)
        // resetData();
      }
    } catch (err) {
      console.error("Resend error:", err);
      Toast({ 
        type: "error", 
        message: err.response?.data?.message || "Failed to resend verification email" 
      });
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
            Resend Verification Email
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Enter your email address to receive a new verification link
          </p>
        </div>

        <form onSubmit={handleResend} className="space-y-4">
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
              We'll send a verification link to this email address
            </p>
          </div>

          {/* Resend Button */}
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
                Send Verification Email
              </>
            )}
          </button>
        </form>

        {/* Additional Info */}
        {resendCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
          >
            <p className="text-xs text-blue-300 text-center">
              Verification email sent! Please check your inbox and spam folder.
              If you don't receive it, you can request again in {cooldown || 60} seconds.
            </p>
          </motion.div>
        )}

        {/* Back to Login Link */}
        <div className="flex items-center justify-center mt-6">
          <button
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
            onClick={() => setShowDetails("login")}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
              onClick={() => {
                // You can add a help modal or contact support here
                window.open("mailto:support@tunemate.com", "_blank");
              }}
            >
              contact support
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ResendMail;