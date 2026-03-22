import { Link, useLocation } from "react-router-dom";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import tuneMateInstance from "@/service/api/api.js";
import useAuthStore from "@/store/use-auth.js";
import SideListSkeleton from "@/_components/skeletons/SideListSkeleton.jsx";
import { FaHistory, FaClock, FaHeart, FaMusic } from "react-icons/fa";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { RiPlayListFill, RiPlayList2Fill } from "react-icons/ri";
import { HiOutlineLibrary } from "react-icons/hi";
import ApiError from "@/_components/Error/ApiError";
import PlayListItem from "./PlayListItem";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import { useSidebar } from "@/store/use-sidebar";
import { cn } from "@/lib/utils";

const SideOptions = () => {
  const { collapse } = useSidebar((state) => state);
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const {
    data: playlists,
    error,
    isLoading,
  } = useSWR(isAuthenticated ? "user-playlists" : null, () =>
    tuneMateInstance.getPlaylists(),
  );
  const safePlaylists = Array.isArray(playlists) ? playlists : [];

  if (error) return <ApiError />;

  const navItems = [
    {
      to: "/recents",
      icon: FaHistory,
      activeIcon: FaClock,
      label: "Recents",
      color: "from-blue-500 to-cyan-500",
    },
    {
      to: "/favorites",
      icon: IoMdHeartEmpty,
      activeIcon: IoMdHeart,
      label: "Favorites",
      color: "from-pink-500 to-rose-500",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0e0e10] to-[#0a0a0c]">
      {/* Navigation Items */}
      <div className="px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link to={item.to} key={item.to}>
              <motion.div
                whileHover={{ x: collapse ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-center rounded-xl transition-all duration-300 cursor-pointer group",
                  collapse ? "justify-center px-2 py-3" : "px-3 py-2.5",
                  isActive
                    ? "bg-gradient-to-r from-white/10 to-white/5 shadow-lg"
                    : "hover:bg-white/5",
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Icon */}
                <div className={cn("relative", isActive && "text-cyan-400")}>
                  <Icon
                    size={collapse ? 24 : 22}
                    className={cn(
                      "transition-all duration-300",
                      isActive
                        ? "text-cyan-400"
                        : "text-gray-400 group-hover:text-white",
                    )}
                  />

                  {/* Glow Effect */}
                  {isActive && (
                    <div className="absolute inset-0 blur-md bg-cyan-400/20 rounded-full -z-10" />
                  )}
                </div>

                {/* Label */}
                {!collapse && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "ml-3 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-white",
                    )}
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

      {/* Playlists Header */}
      {!collapse && (
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <RiPlayListFill className="text-gray-500" size={16} />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Your Playlists
            </h2>
          </div>
        </div>
      )}

      {/* Scrollable Playlists Section */}
      <div
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar",
          collapse ? "px-1" : "px-2",
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <SideListSkeleton count={5} collapsed={collapse} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05 }}
              className="space-y-1"
            >
              {safePlaylists.map((playlist, index) => (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <PlayListItem playlist={playlist} collapse={collapse} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && safePlaylists.length === 0 && !collapse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
          >
            <RiPlayList2Fill className="text-gray-600 mb-2" size={32} />
            <p className="text-xs text-gray-500">No playlists yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Create your first playlist
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom Gradient */}
      <div className="h-8 bg-gradient-to-t from-[#0a0a0c] to-transparent pointer-events-none" />
    </div>
  );
};

export default SideOptions;
