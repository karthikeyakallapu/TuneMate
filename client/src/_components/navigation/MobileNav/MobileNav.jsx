import { Link, useLocation } from "react-router-dom";
import { FaHistory, FaPlay } from "react-icons/fa";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { AiFillHome, AiOutlineHome } from "react-icons/ai";
import { FiSearch } from "react-icons/fi";
import { MdLibraryMusic, MdOutlineLibraryMusic } from "react-icons/md";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const location = useLocation();
  
  const navItems = [
    {
      path: "/",
      icon: AiFillHome,
      inactiveIcon: AiOutlineHome,
      label: "Home"
    },
    {
      path: "/m/search",
      icon: FiSearch,
      inactiveIcon: FiSearch,
      label: "Search"
    },
    {
      path: "/your-library",
      icon: MdLibraryMusic,
      inactiveIcon: MdOutlineLibraryMusic,
      label: "Library"
    },
    {
      path: "/favorites",
      icon: IoMdHeart,
      inactiveIcon: IoMdHeartEmpty,
      label: "Favorites",
      activeColor: "text-pink-400"
    }
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="h-16 w-full fixed bottom-0 left-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.icon : item.inactiveIcon;
          const isFavorites = item.path === "/favorites";
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex-1 flex flex-col items-center justify-center group"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center"
              >
                {/* Active Indicator */}
                {active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute -top-1 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                {/* Icon */}
                <Icon
                  size={22}
                  className={cn(
                    "transition-all duration-200",
                    active 
                      ? isFavorites 
                        ? "text-pink-400" 
                        : "text-cyan-400"
                      : "text-gray-500 group-hover:text-gray-300"
                  )}
                />
                
                {/* Label */}
                <span
                  className={cn(
                    "text-xs mt-1 transition-all duration-200",
                    active 
                      ? isFavorites 
                        ? "text-pink-400" 
                        : "text-cyan-400"
                      : "text-gray-500 group-hover:text-gray-300"
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;