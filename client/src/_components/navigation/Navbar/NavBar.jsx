import useAuthStore from "@/store/use-auth.js";
import { LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import useSearchStore from "@/store/use-search.js";
import { FiSearch } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import UserLogo from "@/assets/images/user.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMediaQuery } from "usehooks-ts";
import { MdLogin } from "react-icons/md";
import useModalStore from "@/store/use-modal-store";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NavBar = () => {
  const { openModal } = useModalStore();
  const { isAuthenticated, removeAccessToken, username } = useAuthStore();
  const { search, setSearch } = useSearchStore();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isSearchRoute =
    location.pathname === "/search" || location.pathname === "/m/search";

  // Clear search when navigating away from search page
  useEffect(() => {
    if (!isSearchRoute && search) {
      setSearch("");
    }
  }, [isSearchRoute, search, setSearch]);

  const handleLogout = async () => {
    try {
      // Optional: Call logout API if needed
      // await tuneMateInstance.logout();
      removeAccessToken();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value && !isSearchRoute) {
      navigate("/search");
    }
  };

  const clearSearch = () => {
    setSearch("");
    if (isSearchRoute) {
      navigate(-1); // Go back to previous page
    }
  };

  return (
    <nav className="flex h-[70px] justify-between text-white bg-[#0e0e10] fixed top-0 left-0 p-2 lg:px-4 items-center w-full space-x-4 z-40 border-b border-white/10 shadow-lg">
      {/* Logo */}
      <Link to={"/"} className="hover:opacity-80 transition-opacity">
        <motion.h1 
          whileHover={{ scale: 1.05 }}
          className="black-han-sans-regular text-2xl md:text-3xl ml-2 font-semibold tracking-wide bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        >
          TuneMate
        </motion.h1>
      </Link>

      {/* Search Bar - Desktop */}
      {!isMobile && (
        <div className="flex items-center flex-1 justify-center max-w-2xl mx-4">
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch size={18} />
            </div>
            
            <Input
              className="w-full bg-[#1e1e1e] h-[42px] text-[15px] border border-white/10 rounded-lg pl-10 pr-10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-200"
              placeholder="Search for songs, albums, or artists..."
              value={search}
              onChange={handleSearch}
              onFocus={() => {
                setIsSearchFocused(true);
                if (!search) navigate("/search");
              }}
              onBlur={() => setIsSearchFocused(false)}
            />
            
            <AnimatePresence>
              {search && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-3 top-2 transform -translate-y-1/2 cursor-pointer hover:bg-white/10 rounded-full p-1 transition-colors"
                  onClick={clearSearch}
                >
                  <IoClose size={18} className="text-gray-400 hover:text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
 
      {/* User Actions */}
      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          {/* Username Display - Optional */}
          {username && (
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-300">{username}</span>
            </div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors group"
            title="Logout"
          >
            <LogOut size={20} className="text-gray-400 group-hover:text-red-400 transition-colors" />
            <span className="hidden md:inline text-sm text-gray-300 group-hover:text-red-400">
              Logout
            </span>
          </motion.button>
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openModal("LOGIN")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
        >
          <MdLogin size={20} />
          <span className="hidden md:inline text-sm font-medium">Login</span>
        </motion.button>
      )}
    </nav>
  );
};

export default NavBar;
