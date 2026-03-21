import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import tuneMateInstance from "@/service/api/api.js";
import useHover from "@/hooks/useHover.js";
import usePlayerStore from "@/store/use-player.js";
import Wrapper from "@/pages/Wrapper.jsx";
import { decodeHtmlEntities, truncateString, formatTime } from "@/utils/MusicUtils.js";
import { FaPlay, FaPause, FaHistory } from "react-icons/fa";
import { FiHeadphones, FiMusic, FiClock } from "react-icons/fi";
import { IoTimeOutline } from "react-icons/io5";
import AlbumSkeleton from "@/_components/skeletons/AlbumSkeleton.jsx";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const UserRecents = () => {
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();
  const { playSong, isPlaying, songId } = usePlayerStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const headerRef = useRef(null);
  
  const {
    data: songHistory,
    error,
    isLoading
  } = useSWR("user-recents", () => tuneMateInstance.getUserSongHistory());

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const scrollY = window.scrollY;
        setIsScrolled(scrollY > 200);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (error) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🕐</div>
            <h2 className="text-2xl font-bold text-white mb-2">Failed to Load History</h2>
            <p className="text-gray-400">Couldn't load your listening history. Please try again.</p>
          </motion.div>
        </div>
      </Wrapper>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const totalListeningTime = () => {
    if (!songHistory?.length) return "0 min";
    const totalSeconds = songHistory.reduce((acc, song) => acc + (song.duration || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  // Use a unique key combining id and index to avoid duplicate keys
  const getUniqueKey = (song, index) => {
    return `${song.id}_${index}`;
  };

  const renderGridMode = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {songHistory?.map((song, index) => {
        const isCurrentSong = songId === song.id;
        const isSongPlaying = isCurrentSong && isPlaying;
        
        return (
          <motion.div
            key={getUniqueKey(song, index)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -8 }}
            onMouseEnter={() => handleMouseEnter(song.id)}
            onMouseLeave={handleMouseLeave}
            className={cn(
              "group cursor-pointer rounded-xl overflow-hidden transition-all duration-300",
              isCurrentSong ? "ring-2 ring-cyan-400" : "hover:shadow-2xl"
            )}
            onClick={() => playSong(song.id)}
          >
            <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b]">
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden">
                <LazyLoadImage
                  effect="blur"
                  loading="lazy"
                  src={song.image}
                  alt={song.name}
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Play Button Overlay */}
                {(hoveredItemId === song.id || isCurrentSong) && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110",
                      isSongPlaying && "animate-pulse"
                    )}>
                      {isSongPlaying ? (
                        <FaPause size={18} className="text-white" />
                      ) : (
                        <FaPlay size={16} className="ml-0.5 text-white" />
                      )}
                    </div>
                  </motion.div>
                )}
                
                {/* Index Badge */}
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-xs font-mono text-white">{index + 1}</span>
                </div>
                
                {/* Duration Badge */}
                {song.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs text-gray-300">
                    {formatTime(song.duration)}
                  </div>
                )}
              </div>
              
              {/* Song Info */}
              <div className="p-3">
                <h3 className={cn(
                  "font-medium text-sm truncate",
                  isCurrentSong ? "text-cyan-400" : "text-white group-hover:text-cyan-400 transition-colors"
                )}>
                  {truncateString(decodeHtmlEntities(song.name), 20)}
                </h3>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {truncateString(decodeHtmlEntities(song.album), 25)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <FiClock className="text-gray-500" size={10} />
                  <span className="text-xs text-gray-500">
                    {formatDate(song.playedAt)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const renderListMode = () => (
    <div className="relative bg-gradient-to-br from-[#1f1f23]/50 to-[#18181b]/50 rounded-2xl border border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5" />
      
      <div className="relative">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-4">Album</div>
          <div className="col-span-2 text-right">Played</div>
        </div>

        {/* Songs */}
        <div className="divide-y divide-white/5">
          {songHistory?.map((song, index) => {
            const isCurrentSong = songId === song.id;
            const isSongPlaying = isCurrentSong && isPlaying;
            
            return (
              <motion.div
                key={getUniqueKey(song, index)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onMouseEnter={() => handleMouseEnter(song.id)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "group grid grid-cols-12 gap-4 items-center px-4 md:px-6 py-3 cursor-pointer transition-all duration-200",
                  isCurrentSong
                    ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10"
                    : "hover:bg-white/5"
                )}
                onClick={() => playSong(song.id)}
              >
                {/* Index / Play Icon */}
                <div className="col-span-1 flex justify-center items-center">
                  {hoveredItemId === song.id || isCurrentSong ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-cyan-400"
                    >
                      {isSongPlaying ? (
                        <FaPause size={14} />
                      ) : (
                        <FaPlay size={12} className="ml-0.5" />
                      )}
                    </motion.div>
                  ) : (
                    <span className={cn(
                      "text-sm font-mono",
                      isCurrentSong ? "text-cyan-400" : "text-gray-500"
                    )}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Song Info */}
                <div className="col-span-5 flex items-center gap-3">
                  <LazyLoadImage
                    effect="blur"
                    loading="lazy"
                    src={song.image}
                    alt={song.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium truncate",
                      isCurrentSong ? "text-cyan-400" : "text-white"
                    )}>
                      {decodeHtmlEntities(song.name)}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {decodeHtmlEntities(song.album)}
                    </p>
                  </div>
                </div>

                {/* Album */}
                <div className="hidden md:block col-span-4">
                  <p className="text-sm text-gray-400 truncate">
                    {decodeHtmlEntities(song.album)}
                  </p>
                </div>

                {/* Played Time */}
                <div className="col-span-2 text-right">
                  <p className="text-sm text-gray-400">
                    {formatDate(song.playedAt)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <Wrapper>
      <BlockWrapper margin={"mb-20 md:mb-8"}>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
          {/* Header Section */}
          <div ref={headerRef} className="relative overflow-hidden mb-8">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/30 via-blue-500/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
            
            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                    <FaHistory className="text-cyan-400" size={12} />
                    <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">Listening History</span>
                  </div>
                  
                  <h1 className="jaro-head text-3xl md:text-5xl lg:text-6xl text-white mb-4">
                    Recently Played
                  </h1>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FiMusic className="text-gray-400" size={14} />
                      <span className="text-gray-300">{songHistory?.length || 0} Songs</span>
                    </div>
                    <span className="text-gray-500">•</span>
                    <div className="flex items-center gap-2">
                      <FiHeadphones className="text-gray-400" size={14} />
                      <span className="text-gray-300">{totalListeningTime()}</span>
                    </div>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm transition-all duration-200",
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm transition-all duration-200",
                      viewMode === "list"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="max-w-7xl mx-auto px-4 pb-12">
            {isLoading ? (
              <AlbumSkeleton count={12} />
            ) : (
              <AnimatePresence mode="wait">
                {songHistory?.length > 0 ? (
                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {viewMode === "grid" ? renderGridMode() : renderListMode()}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-2xl"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                      <FiHeadphones size={40} className="text-cyan-400" />
                    </div>
                    <h3 className="jaro-head text-xl text-white mb-2">No listening history yet</h3>
                    <p className="text-gray-400 max-w-md">
                      Start listening to music to see your recent plays here. Your history will appear as you listen.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </BlockWrapper>
    </Wrapper>
  );
};

export default UserRecents;