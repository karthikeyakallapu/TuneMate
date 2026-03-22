import useFormData from "@/hooks/useFormData.js";
import tuneMateInstance from "@/service/api/api.js";
import Toast from "@/utils/Toasts/Toast.js";
import { useState } from "react";
import Register from "@/pages/auth/register.jsx";
import useAuthStore from "@/store/use-auth.js";
import ResendMail from "./ResendMail";
import ForgotPassword from "./ForgotPassword";
import useModalStore from "@/store/use-modal-store";
import Modal from "@/_components/Modals/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const Login = () => {
  const { closeModal } = useModalStore();
  const [showDetails, setShowDetails] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const { setAccessToken } = useAuthStore();
  
  const { data, handleChange, handleSubmit, isLoading, resetData } =
    useFormData(
      {
        email: "",
        password: ""
      },
      tuneMateInstance.loginUser
    );

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!data.email.trim()) {
      Toast({ type: "error", message: "Please enter your email" });
      return;
    }
    
    if (!data.password) {
      Toast({ type: "error", message: "Please enter your password" });
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      Toast({ type: "error", message: "Please enter a valid email address" });
      return;
    }
    
    try {
      const response = await handleSubmit();
      
      if (response?.data) {
        if (response.data.accessToken) {
          const didSetToken = setAccessToken(response.data.accessToken);
          if (!didSetToken) {
            Toast({
              type: "error",
              message: "Session token is invalid. Please try logging in again.",
            });
            return;
          }

          closeModal();
          Toast({ 
            type: "success", 
            message: response.data.message || "Login successful!" 
          });
        } else if (response.data.type === "error") {
          Toast({ 
            type: "error", 
            message: response.data.message || "Login failed" 
          });
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      Toast({ 
        type: "error", 
        message: err.response?.data?.message || "An error occurred during login" 
      });
    } finally {
      resetData();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Modal>
      <AnimatePresence mode="wait">
        {showDetails === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center"
          >
            <div className="flex flex-col w-full md:w-[30rem] p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Sign in to continue listening
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Field */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200"
                      onChange={handleChange}
                      name="email"
                      value={data.email}
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200"
                      onChange={handleChange}
                      name="password"
                      value={data.password}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Footer Links */}
              <div className="flex flex-col items-center justify-between mt-6 space-y-3">
                <button
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={() => setShowDetails("forgotPassword")}
                >
                  Forgot Password?
                </button>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Not a member?</span>
                  <button
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    onClick={() => setShowDetails("register")}
                  >
                    Create account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showDetails === "register" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Register setShowDetails={setShowDetails} />
          </motion.div>
        )}

        {showDetails === "forgotPassword" && (
          <motion.div
            key="forgotPassword"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ForgotPassword setShowDetails={setShowDetails} />
          </motion.div>
        )}

        {showDetails === "resendMail" && (
          <motion.div
            key="resendMail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ResendMail setShowDetails={setShowDetails} />
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default Login;
