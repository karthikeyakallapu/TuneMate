import Wrapper from "./Wrapper";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import tuneMateInstance from "@/service/api/api.js";
import { Link } from "react-router-dom";
import usePlayerStore from "@/store/use-player.js";
import useAuthStore from "@/store/use-auth.js";
import MusicSlider from "@/_components/navigation/Slider/Slider";
import { decodeHtmlEntities, truncateString } from "@/utils/MusicUtils.js";
import { FaPlay, FaPause } from "react-icons/fa";
import { 
  FiTrendingUp, 
  FiClock, 
  FiMusic, 
  FiHeadphones,
  FiArrowRight,
  FiShuffle
} from "react-icons/fi";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import useHover from "@/hooks/useHover.js";
import { useMediaQuery } from "usehooks-ts";
import {
  HomeSkeleton,
  AlbumSkeleton,
  MobileAlbumSkeleton
} from "@/_components/skeletons/HomeSkeleton";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useState } from "react";

const Home = () => {
  const { playSong, isPlaying, songId } = usePlayerStore();
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { isAuthenticated } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);

  const {
    data: recommended,
    error,
    isLoading
  } = useSWR("tunemate-recommend", () =>
    tuneMateInstance.getTuneMateRecommended()
  );

  const {
    data: songHistory,
    err,
    isLoading: RecentsLoading
  } = useSWR(isAuthenticated ? "user-song-history" : null, () =>
    tuneMateInstance.getUserSongHistory()
  );

  if (error || err) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400">Failed to load content. Please try again.</p>
          </motion.div>
        </div>
      </Wrapper>
    );
  }

  const featuredSong = recommended?.tuneMateUpdates?.[0];

  return (
    <Wrapper>
      <div className="bg-gradient-to-b from-[#0f0f12] to-[#0a0a0c] rounded-xl min-h-[calc(100vh-7rem)] mb-20 md:mb-0 overflow-hidden">
        
        {/* Hero Section - Song of the Week with Modern Design */}
        <AnimatePresence>
          {featuredSong && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="relative overflow-hidden rounded-2xl mx-4 mt-4 mb-8"
            >
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 animate-gradient-x" />
              <div className="absolute inset-0 bg-black/50" />
              
              {/* Floating Particles */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
              </div>

              <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  {/* Album Art with Glow Effect */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                    <LazyLoadImage
                      alt={featuredSong?.Content?.name}
                      effect="blur"
                      className="relative w-40 h-40 md:w-56 md:h-56 rounded-2xl shadow-2xl object-cover"
                      wrapperProps={{
                        style: { transitionDelay: "0.5s" }
                      }}
                      src={featuredSong?.Content?.image}
                    />
                    
                    {/* Play Button Overlay */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => playSong(featuredSong?.Content?.songId)}
                      className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                    >
                      <FaPlay size={18} className="ml-0.5 text-white" />
                    </motion.button>
                  </motion.div>

                  {/* Song Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm mb-4 border border-white/20">
                      <FiTrendingUp className="text-cyan-400" size={14} />
                      <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                        SONG OF THE WEEK
                      </span>
                    </div>
                    
                    <h1 className="jaro-head text-4xl md:text-6xl lg:text-7xl text-white mb-3 leading-tight">
                      {featuredSong?.title}
                    </h1>
                    
                    <h2 className="ubuntu-bold text-xl md:text-3xl text-cyan-400 mb-2">
                      {featuredSong?.Content?.name}
                    </h2>
                    
                    <p className="nunito-sans-bold text-gray-400 text-sm md:text-base mb-4">
                      {featuredSong?.Content?.album}
                    </p>
                    
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => playSong(featuredSong?.Content?.songId)}
                        className="px-8 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
                      >
                        <FaPlay size={12} />
                        <span>Play Now</span>
                      </motion.button>
                      
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FiHeadphones size={14} />
                        <span className="nunito-sans-bold">2.5M plays</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommended Section with Modern Header */}
        <div className="px-4 mt-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between mb-4 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
              <h2 className="jaro-head text-2xl md:text-3xl text-white">
                Tunemate Recommended
              </h2>
            </div>
            <div className="h-px flex-1 ml-4 bg-gradient-to-r from-cyan-500/30 to-transparent" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="ml-4 text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <FiShuffle size={12} />
              <span>Mix</span>
            </motion.button>
          </motion.div>
          
          {isLoading ? (
            <HomeSkeleton count={6} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MusicSlider
                title=""
                musicList={recommended?.playlists}
              />
            </motion.div>
          )}
        </div>

        {/* Recently Played Section with Modern Cards */}
        {isAuthenticated && (
          <div className="px-4 mt-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                <h2 className="jaro-head text-2xl md:text-3xl text-white">
                  Recently Played
                </h2>
              </div>
              <Link to="/recents">
                <motion.button
                  whileHover={{ scale: 1.05, x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1 group"
                >
                  <span className="nunito-sans-bold">View All</span>
                  <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </motion.div>

            {RecentsLoading ? (
              <div className="pl-4 mt-4 mb-4 pr-4 pb-4">
                {isMobile ? (
                  <MobileAlbumSkeleton count={2} />
                ) : (
                  <AlbumSkeleton count={6} />
                )}
              </div>
            ) : (
              <>
                {songHistory?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {songHistory.slice(0, 12).map((song, index) => {
                      const isCurrentPlaying = songId === song.id && isPlaying;
                      
                      return (
                        <motion.div
                          key={song.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -8, scale: 1.02 }}
                          onMouseEnter={() => handleMouseEnter(song.id)}
                          onMouseLeave={handleMouseLeave}
                          className="group cursor-pointer"
                          onClick={() => playSong(song.id)}
                        >
                          <div className="relative rounded-xl overflow-hidden">
                            {/* Glow Effect on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                            
                            <LazyLoadImage
                              alt={song.name}
                              effect="blur"
                              loading="lazy"
                              className="w-full aspect-square object-cover transform transition-transform duration-700 group-hover:scale-110"
                              src={song.image}
                            />
                            
                            {/* Play Button */}
                            {(hoveredItemId === song.id || isCurrentPlaying) && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-20"
                              >
                                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110">
                                  {isCurrentPlaying ? (
                                    <FaPause size={20} className="text-white" />
                                  ) : (
                                    <FaPlay size={18} className="ml-0.5 text-white" />
                                  )}
                                </div>
                              </motion.div>
                            )}
                            
                            {/* Index Badge */}
                            <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20 z-10">
                              <span className="text-xs font-mono text-white font-bold">
                                {index + 1}
                              </span>
                            </div>

                            {/* Duration Badge */}
                            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs text-gray-300 z-10">
                              3:45
                            </div>
                          </div>
                          
                          <div className="mt-3 space-y-1">
                            <h3 className="nunito-sans-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
                              {truncateString(decodeHtmlEntities(song.name), 20)}
                            </h3>
                            <p className="ubuntu-bold text-xs text-gray-400 truncate">
                              {truncateString(decodeHtmlEntities(song.album), 25)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/10"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                      <FiHeadphones size={32} className="text-purple-400" />
                    </div>
                    <h3 className="jaro-head text-xl text-white mb-2">No recent songs</h3>
                    <p className="nunito-sans-bold text-gray-400 text-sm">Start listening to see your history here</p>
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}

        {/* Decorative Bottom Gradient */}
        <div className="h-24 bg-gradient-to-t from-[#0a0a0c] to-transparent pointer-events-none" />
      </div>
    </Wrapper>
  );
};

export default Home;