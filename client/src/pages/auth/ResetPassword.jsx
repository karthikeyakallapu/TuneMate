import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useFormData from "@/hooks/useFormData";
import tuneMateInstance from "@/service/api/api";
import Toast from "@/utils/Toasts/Toast";
import useModalStore from "@/store/use-modal-store";
import Wrapper from "@/pages/Wrapper";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, Check, X, ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { openModal } = useModalStore();

  const token = searchParams.get("token") || id || "";
  const tokenMissing = !token;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const { data, handleChange, handleSubmit, isLoading, resetData } = useFormData(
    {
      password: "",
      confirmPassword: "",
      token,
    },
    tuneMateInstance.resetPassword,
  );

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
    if (tokenMissing) {
      Toast({
        type: "error",
        message: "Invalid reset password link. Please request a new one.",
      });
      return false;
    }

    if (data.password.length < 8) {
      Toast({
        type: "error",
        message: "Password must be at least 8 characters long",
      });
      return false;
    }

    if (passwordStrength < 3) {
      Toast({
        type: "error",
        message: "Password must contain uppercase, lowercase, and numbers",
      });
      return false;
    }

    if (data.password !== data.confirmPassword) {
      Toast({ type: "error", message: "Passwords do not match" });
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await handleSubmit();
      const result = response?.data;

      if (result?.type === "success") {
        Toast({
          type: "success",
          message: result.message || "Password reset successfully!",
        });

        setTimeout(() => {
          navigate("/");
          openModal("LOGIN");
        }, 1200);
      } else {
        Toast({
          type: "error",
          message: result?.message || "Failed to reset password.",
        });
      }
    } catch (error) {
      console.error("Error in handleResetPassword:", error);
      Toast({
        type: "error",
        message:
          error.response?.data?.message ||
          "An error occurred while resetting password",
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
    if (passwordStrength === 0) return "Very Weak";
    if (passwordStrength === 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";
    return "Strong";
  };

  return (
    <Wrapper>
      <div className="min-h-[calc(100vh-7rem)] mb-20 md:mb-0 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center"
        >
          <div className="flex flex-col w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-[#11131a] to-[#0a0b10] p-6 text-white shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 mb-4">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Reset Password
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Create a new strong password for your account
              </p>
            </div>

            {tokenMissing && (
              <p className="text-sm text-red-400 text-center mb-4">
                Invalid reset link. Please request a new password reset email.
              </p>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                      passwordFocused ? "text-cyan-400" : "text-gray-400"
                    }`}
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-200"
                    onChange={handlePasswordChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    name="password"
                    value={data.password}
                    placeholder="Enter new password"
                    required
                    disabled={isLoading || tokenMissing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

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
                        Password strength:{" "}
                        <span
                          className={
                            passwordStrength >= 3
                              ? "text-green-400"
                              : "text-yellow-400"
                          }
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {data.password.length}/8+ chars
                      </span>
                    </div>
                    <ul className="text-xs text-gray-500 space-y-1 mt-1">
                      <li className="flex items-center gap-1">
                        {data.password.length >= 8 ? (
                          <Check size={12} className="text-green-400" />
                        ) : (
                          <X size={12} className="text-gray-600" />
                        )}
                        <span>At least 8 characters</span>
                      </li>
                      <li className="flex items-center gap-1">
                        {/[A-Z]/.test(data.password) &&
                        /[a-z]/.test(data.password) ? (
                          <Check size={12} className="text-green-400" />
                        ) : (
                          <X size={12} className="text-gray-600" />
                        )}
                        <span>Uppercase & lowercase letters</span>
                      </li>
                      <li className="flex items-center gap-1">
                        {/[0-9]/.test(data.password) ? (
                          <Check size={12} className="text-green-400" />
                        ) : (
                          <X size={12} className="text-gray-600" />
                        )}
                        <span>At least one number</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                      confirmPasswordFocused ? "text-cyan-400" : "text-gray-400"
                    }`}
                    size={18}
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className={`w-full bg-[#1e1e1e] border rounded-lg pl-10 pr-10 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 transition-all duration-200 ${
                      data.confirmPassword && data.password !== data.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : data.confirmPassword &&
                            data.password === data.confirmPassword
                          ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                          : "border-gray-700 focus:border-cyan-500 focus:ring-cyan-500"
                    }`}
                    onChange={handleChange}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    name="confirmPassword"
                    value={data.confirmPassword}
                    placeholder="Confirm your new password"
                    required
                    disabled={isLoading || tokenMissing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {data.confirmPassword && data.password !== data.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
                {data.confirmPassword && data.password === data.confirmPassword && data.password && (
                  <p className="text-xs text-green-400 mt-1">Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || tokenMissing}
                className="w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Reset Password
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center mt-6">
              <button
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                onClick={() => navigate("/")}
              >
                <ArrowLeft
                  size={16}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Back to Login
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Your password will be encrypted and securely stored
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Wrapper>
  );
};

export default ResetPassword;
