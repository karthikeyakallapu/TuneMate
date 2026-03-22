import useSWR, { mutate } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import tuneMateInstance from "@/service/api/api.js";
import usePlayerStore from "@/store/use-player.js";
import Wrapper from "@/pages/Wrapper.jsx";
import useHover from "@/hooks/useHover.js";
import useAuthStore from "@/store/use-auth.js";
import {
  decodeHtmlEntities,
  formatTime,
  truncateString,
} from "@/utils/MusicUtils.js";
import { IoMdRemoveCircle, IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { FaPause, FaPlay, FaRandom } from "react-icons/fa";
import { FiShuffle, FiHeadphones, FiMusic, FiHeart } from "react-icons/fi";
import Toast from "@/utils/Toasts/Toast.js";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import { useMediaQuery } from "usehooks-ts";
import UserPlayListSkeleton from "@/_components/skeletons/UserPlayListSkeleton";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import AuthSessionExpired from "@/_components/Error/AuthSessionExpired";
import { isAxiosErrorLike, isUnauthorizedError } from "@/utils/authError";

const Favorites = () => {
  const { playSong, loadPlaylist, playlist, playSongByIndex } =
    usePlayerStore();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { getFavorites, songId, isPlaying } = usePlayerStore();
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();

  const [isScrolled, setIsScrolled] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const heroRef = useRef(null);

  const {
    data: favorites,
    error,
    isLoading,
  } = useSWR(isAuthenticated ? "favorites" : null, () =>
    tuneMateInstance.getFavorites(),
  );
  const requestError =
    error || (isAxiosErrorLike(favorites) ? favorites : null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        setIsScrolled(scrollY > 300);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Create floating hearts animation
  const createFloatingHeart = () => {
    const id = Date.now();
    setFloatingHearts((prev) => [
      ...prev,
      { id, x: Math.random() * 100, duration: 2 + Math.random() * 2 },
    ]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((heart) => heart.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        createFloatingHeart();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const removeSongFromFavorites = async (e, songId) => {
    try {
      e.stopPropagation();
      const response = await tuneMateInstance.ManageSongInFavorites(songId);
      Toast({ type: response.type, message: response.message, duration: 400 });
      mutate("favorites");
      await getFavorites();
    } catch (error) {
      console.error("Error removing song from favorites:", error);
    }
  };

  const handlePlayWholeList = async () => {
    await loadPlaylist({ id: "FAVORITES", type: "FAVORITES", index: 0 });
  };

  const formatTotalDuration = () => {
    if (!favorites?.length) return "0:00";
    const totalSeconds = favorites.reduce(
      (acc, song) => acc + (song.duration || 0),
      0,
    );
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  if (requestError) {
    if (isUnauthorizedError(requestError)) {
      return (
        <Wrapper>
          <AuthSessionExpired onRetry={() => mutate("favorites")} />
        </Wrapper>
      );
    }

    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center px-4"
          >
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Failed to Load Favorites
            </h2>
            <p className="text-gray-400">
              Couldn't load your favorite songs. Please try again.
            </p>
          </motion.div>
        </div>
      </Wrapper>
    );
  }

  const renderAlbumDetails = () => (
    <div ref={heroRef} className="relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-500/30 via-rose-500/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent" />

      {/* Floating Hearts Animation - Hidden on mobile for performance */}
      {!isMobile && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {floatingHearts.map((heart) => (
              <motion.div
                key={heart.id}
                initial={{ y: "100vh", x: `${heart.x}%`, opacity: 1, scale: 0 }}
                animate={{ y: "-20vh", opacity: 0, scale: 1 }}
                transition={{ duration: heart.duration, ease: "easeOut" }}
                className="absolute bottom-0"
              >
                <IoMdHeart
                  className="text-pink-400/30"
                  size={24 + Math.random() * 20}
                />
              </motion.div>
            ))}
          </div>

          {/* Animated Heart Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0, 1, 0],
                  y: [0, -100],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              >
                <IoMdHeart
                  className="text-pink-400/20"
                  size={16 + Math.random() * 16}
                />
              </motion.div>
            ))}
          </div>
        </>
      )}

      <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end items-center gap-6 md:gap-8">
          {/* Animated Heart Icon - Responsive sizing */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative group flex-shrink-0"
          >
            <div className="relative">
              {/* Glow Effect */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-300"
              />

              {/* Heart Container - Responsive sizes */}
              <div className="relative w-32 h-32 md:w-64 md:h-64 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl flex items-center justify-center border-2 border-white/20 backdrop-blur-sm overflow-hidden">
                {/* Pulsing Background */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl"
                />

                {/* Main Heart Icon */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <IoMdHeart
                    size={isMobile ? 60 : 100}
                    className="text-white/90 md:text-[120px] drop-shadow-2xl"
                  />
                </motion.div>

                {/* Small Floating Hearts - Hidden on mobile */}
                {!isMobile &&
                  [...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 0.8, 0],
                        x: Math.sin(i) * 40,
                        y: Math.cos(i) * 40,
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      className="absolute"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `rotate(${i * 45}deg)`,
                      }}
                    >
                      <IoMdHeart className="text-pink-300" size={16} />
                    </motion.div>
                  ))}
              </div>
            </div>
          </motion.div>

          {/* Favorites Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <FiHeart className="text-pink-400" size={12} />
              </motion.div>
              <span className="text-xs font-medium text-pink-400 uppercase tracking-wider">
                Your Collection
              </span>
            </div>

            <h1 className="jaro-head text-2xl md:text-5xl lg:text-6xl text-white mb-4 leading-tight">
              Favorite Songs
            </h1>

            <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FiMusic className="text-gray-400" size={14} />
                <span className="text-gray-300">
                  {favorites?.length || 0} Songs
                </span>
              </div>
              <span className="text-gray-500">•</span>
              <div className="flex items-center gap-2">
                <FiHeadphones className="text-gray-400" size={14} />
                <span className="text-gray-300">{formatTotalDuration()}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center md:justify-start gap-3 mt-6 md:mt-8 flex-wrap"
        >
          {/* Play Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayWholeList}
            className="px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-pink-500/25 transition-all duration-300 text-sm md:text-base"
          >
            <FaPlay size={isMobile ? 12 : 14} className="ml-0.5" />
            <span>Play All</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );

  const renderSongsList = () => (
    <div className="flex flex-col pb-20 md:pb-0">
      {/* Sticky Header on Scroll */}
      <AnimatePresence>
        {isScrolled && favorites?.length > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="sticky top-[70px] z-30 bg-gradient-to-r from-[#0a0a0f]/95 to-[#050507]/95 backdrop-blur-xl rounded-xl mx-4 mb-4 border border-white/10"
          >
            <div className="flex items-center px-4 md:px-6 py-3 gap-3 md:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayWholeList}
                className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex-shrink-0"
              >
                <FaPlay size={12} className="ml-0.5 text-white" />
              </motion.button>

              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="rounded-lg w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <IoMdHeart className="text-pink-400" size={isMobile ? 16 : 20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white text-sm truncate">
                    Favorite Songs
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {favorites?.length || 0} songs • {formatTotalDuration()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Songs List */}
      {isAuthenticated && (
        <div className="flex flex-col mt-4 mb-5 px-4 md:px-0">
          {favorites?.length > 0 ? (
            <div className="relative bg-gradient-to-br from-[#1f1f23]/50 to-[#18181b]/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5" />

              <div className="relative">
                {/* Header - Hidden on mobile */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-7">Title</div>
                  <div className="col-span-3 text-right">Duration</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Songs */}
                <div className="divide-y divide-white/5">
                  {favorites.map((song, index) => {
                    const isCurrentSong = songId === song.id;
                    const isSongPlaying = isCurrentSong && isPlaying;

                    return (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onMouseEnter={() => handleMouseEnter(song.id)}
                        onMouseLeave={handleMouseLeave}
                        className={cn(
                          "group relative grid grid-cols-12 gap-4 items-center px-4 md:px-6 py-3 cursor-pointer transition-all duration-200",
                          isCurrentSong
                            ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10"
                            : "hover:bg-white/5"
                        )}
                        onClick={() =>
                          playlist.songs.length > 0 &&
                          playlist.id === "FAVORITES"
                            ? playSongByIndex(index)
                            : playSong(song.id)
                        }
                      >
                        {/* Index / Play Icon */}
                        <div className="col-span-2 md:col-span-1 flex justify-start md:justify-center items-center">
                          {hoveredItemId === song.id || isCurrentSong ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-pink-400"
                            >
                              {isSongPlaying ? (
                                <FaPause size={14} />
                              ) : (
                                <FaPlay size={12} className="ml-0.5" />
                              )}
                            </motion.div>
                          ) : (
                            <span
                              className={cn(
                                "text-sm font-mono",
                                isCurrentSong
                                  ? "text-pink-400"
                                  : "text-gray-500"
                              )}
                            >
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* Song Info */}
                        <div className="col-span-8 md:col-span-7 flex items-center gap-3">
                          <LazyLoadImage
                            effect="blur"
                            loading="lazy"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            src={song.imageUrl}
                            alt={song.name}
                          />
                          <div className="flex-1 min-w-0">
                            <h3
                              className={cn(
                                "font-medium truncate text-sm md:text-base",
                                isCurrentSong ? "text-pink-400" : "text-white"
                              )}
                            >
                              {truncateString(
                                decodeHtmlEntities(song.name),
                                isMobile ? 25 : undefined
                              )}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                              {truncateString(
                                decodeHtmlEntities(song.primaryArtists),
                                isMobile ? 30 : undefined
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Duration - Hidden on mobile */}
                        <div className="hidden md:block col-span-3 text-right">
                          <p className="text-sm text-gray-400">
                            {formatTime(song.duration)}
                          </p>
                        </div>

                        {/* Remove Button */}
                        <div className="hidden md:block col-span-1 text-right">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => removeSongFromFavorites(e, song.id)}
                            className={cn(
                              "p-2 rounded-full transition-all duration-200",
                              hoveredItemId === song.id
                                ? "opacity-100 bg-white/10"
                                : "opacity-0 pointer-events-none"
                            )}
                          >
                            <IoMdRemoveCircle
                              size={20}
                              className="text-pink-400 hover:text-pink-300"
                            />
                          </motion.button>
                        </div>

                        {/* Mobile Remove Button - Position fixed */}
                        {isMobile && hoveredItemId === song.id && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <button
                              onClick={(e) =>
                                removeSongFromFavorites(e, song.id)
                              }
                              className="p-2 rounded-full bg-white/10"
                            >
                              <IoMdRemoveCircle
                                size={18}
                                className="text-pink-400"
                              />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-2xl px-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-4"
              >
                <IoMdHeartEmpty size={isMobile ? 30 : 40} className="text-pink-400" />
              </motion.div>
              <h3 className="jaro-head text-lg md:text-xl text-white mb-2">
                No favorite songs yet
              </h3>
              <p className="text-gray-400 text-sm md:text-base max-w-md px-4">
                Start adding songs to your favorites by clicking the heart icon
                on any song.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Wrapper>
      <BlockWrapper margin={"mb-16 md:mb-8"}>
        {isLoading ? (
          <UserPlayListSkeleton count={10} />
        ) : (
          <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
            {renderAlbumDetails()}
            {renderSongsList()}
          </div>
        )}
      </BlockWrapper>
    </Wrapper>
  );
};

export default Favorites;
