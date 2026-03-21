import useFormData from "@/hooks/useFormData.js";
import tuneMateInstance from "@/service/api/api.js";
import Toast from "@/utils/Toasts/Toast.js";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Check, X } from "lucide-react";

const Register = ({ setShowDetails }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { data, handleChange, handleSubmit, isLoading, resetData, error } =
    useFormData(
      {
        email: "",
        password: "",
        username: "",
        confirmPassword: ""
      },
      tuneMateInstance.registerUser
    );

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    handleChange(e);
    checkPasswordStrength(newPassword);
  };

  const validateForm = () => {
    // Username validation
    if (data.username.length < 3) {
      Toast({ type: "error", message: "Username must be at least 3 characters long" });
      return false;
    }
    
    if (data.username.length > 20) {
      Toast({ type: "error", message: "Username must be less than 20 characters" });
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      Toast({ type: "error", message: "Username can only contain letters, numbers, and underscores" });
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      Toast({ type: "error", message: "Please enter a valid email address" });
      return false;
    }
    
    // Password validation
    if (data.password.length < 8) {
      Toast({ type: "error", message: "Password must be at least 8 characters long" });
      return false;
    }
    
    if (passwordStrength < 3) {
      Toast({ type: "error", message: "Password must contain uppercase, lowercase, and numbers" });
      return false;
    }
    
    // Confirm password
    if (data.password !== data.confirmPassword) {
      Toast({ type: "error", message: "Passwords do not match" });
      return false;
    }
    
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await handleSubmit();
      
      if (response?.data) {
        Toast({ 
          type: response.data.type || "success", 
          message: response.data.message || "Registration successful! Please check your email to verify your account." 
        });
        
        // If registration successful, show success and optionally redirect to login
        if (response.data.type === "success") {
          setTimeout(() => {
            setShowDetails("login");
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      Toast({ 
        type: "error", 
        message: err.response?.data?.message || "An error occurred during registration" 
      });
    } finally {
      resetData();
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-600";
    if (passwordStrength === 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-green-500";
    return "bg-emerald-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "No password";
    if (passwordStrength === 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";
    return "Strong";
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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Join TuneMate and start listening
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Username Field */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-300">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200"
                onChange={handleChange}
                name="username"
                value={data.username}
                placeholder="Choose a username"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Letters, numbers, and underscores only (3-20 characters)
            </p>
          </div>

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
                onChange={handlePasswordChange}
                name="password"
                value={data.password}
                placeholder="Create a password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {data.password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        level <= passwordStrength
                          ? getPasswordStrengthColor()
                          : "bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Password strength: <span className={passwordStrength >= 3 ? "text-green-400" : "text-yellow-400"}>
                      {getPasswordStrengthText()}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {data.password.length}/8+ chars
                  </span>
                </div>
                <ul className="text-xs text-gray-500 space-y-1 mt-1">
                  <li className="flex items-center gap-1">
                    {data.password.length >= 8 ? <Check size={12} className="text-green-400" /> : <X size={12} className="text-gray-600" />}
                    <span>At least 8 characters</span>
                  </li>
                  <li className="flex items-center gap-1">
                    {/[A-Z]/.test(data.password) && /[a-z]/.test(data.password) ? <Check size={12} className="text-green-400" /> : <X size={12} className="text-gray-600" />}
                    <span>Uppercase & lowercase letters</span>
                  </li>
                  <li className="flex items-center gap-1">
                    {/[0-9]/.test(data.password) ? <Check size={12} className="text-green-400" /> : <X size={12} className="text-gray-600" />}
                    <span>At least one number</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full bg-[#1e1e1e] border rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 transition-all duration-200 ${
                  data.confirmPassword && data.password !== data.confirmPassword
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : data.confirmPassword && data.password === data.confirmPassword
                    ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                    : "border-gray-700 focus:border-cyan-500 focus:ring-cyan-500"
                }`}
                onChange={handleChange}
                name="confirmPassword"
                value={data.confirmPassword}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {data.confirmPassword && data.password !== data.confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer Links */}
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
            <span className="text-gray-400">Already have an account?</span>
            <button
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              onClick={() => setShowDetails("login")}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;