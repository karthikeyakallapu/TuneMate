import { useParams } from "react-router-dom";
import usePlayerStore from "@/store/use-player.js";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import MusicServiceInstance from "@/service/api/music_apis.js";
import {
  decodeHtmlEntities,
  formatTime,
  truncateString
} from "@/utils/MusicUtils.js";
import Wrapper from "@/pages/Wrapper.jsx";
import { 
  FaPlay, 
  FaPause, 
  FaHeart, 
  FaRegHeart, 
  FaRandom,
  FaShare,
  FaDownload,
  FaEllipsisH
} from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import { IoMdHeart, IoMdHeartEmpty } from "react-icons/io";
import { HiOutlineClock } from "react-icons/hi";
import { FiMoreHorizontal, FiHeadphones, FiUsers } from "react-icons/fi";
import UserPlayListSkeleton from "@/_components/skeletons/UserPlayListSkeleton.jsx";
import { useMediaQuery } from "usehooks-ts";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import useHover from "@/hooks/useHover.js";

const Playlist = () => {
  const { id } = useParams();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { 
    playSong, 
    loadPlaylist, 
    playlist, 
    playSongByIndex,
    isPlaying,
    currentSong
  } = usePlayerStore();
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();
  
  const [isLiked, setIsLiked] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  const {
    data: PlayList,
    error,
    isLoading,
    mutate
  } = useSWR(id ? ["playlist", id] : null, () =>
    MusicServiceInstance.getPlaylistById(id)
  );

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        setIsScrolled(scrollY > 300);
      }
    };
    
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePlayWholeList = async () => {
    await loadPlaylist({ id, type: "PLAYLIST", index: 0 });
  };

  const handleShufflePlay = async () => {
    if (PlayList?.songs?.length) {
      const randomIndex = Math.floor(Math.random() * PlayList.songs.length);
      await loadPlaylist({ id, type: "PLAYLIST", index: randomIndex });
    }
  };

  const handlePlaySong = (song, index) => {
    if (playlist.songs.length > 0 && playlist.id === PlayList.id) {
      playSongByIndex(index);
    } else {
      playSong(song.id);
    }
  };

  const handleLikePlaylist = async () => {
    setIsLiked(!isLiked);
  };

  const handleSharePlaylist = () => {
    if (navigator.share) {
      navigator.share({
        title: PlayList?.name,
        text: PlayList?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getArtistNames = (song) => {
    if (!song?.artists) return "Unknown Artist";
    if (Array.isArray(song.artists)) {
      return song.artists.map(a => a.name || a).join(", ");
    }
    if (typeof song.artists === "string") {
      return song.artists;
    }
    if (song.artists.name) {
      return song.artists.name;
    }
    return "Unknown Artist";
  };

  const formatFollowerCount = (count) => {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (isLoading) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <UserPlayListSkeleton count={10} />
          </div>
        </div>
      </Wrapper>
    );
  }

  if (error || !PlayList) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-white mb-2">Playlist Not Found</h2>
            <p className="text-gray-400">The playlist you're looking for doesn't exist or has been removed.</p>
          </motion.div>
        </div>
      </Wrapper>
    );
  }

  const totalDuration = PlayList?.songs?.reduce((acc, song) => acc + (song.duration || 0), 0) || 0;
  const formattedDuration = formatTime(totalDuration);

  return (
    <Wrapper>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
        {/* Hero Section */}
        <div ref={heroRef} className="relative overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/30 via-purple-500/20 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
          
          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
              {/* Playlist Image with Glow */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative group flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                  {PlayList.image ? (
                    <LazyLoadImage
                      effect="blur"
                      loading="lazy"
                      src={PlayList?.image[1]?.url || PlayList?.image[0]?.url}
                      alt={PlayList?.name}
                      className="relative rounded-2xl w-48 h-48 md:w-64 md:h-64 object-cover shadow-2xl border-2 border-white/20 transform transition-all duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl">
                      <BiSolidPlaylist size={80} color="white" />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Playlist Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-1 text-center md:text-left"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                  <FiHeadphones className="text-cyan-400" size={12} />
                  <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">Playlist</span>
                </div>
                
                <h1 className="jaro-head text-3xl md:text-5xl lg:text-6xl text-white mb-4 leading-tight">
                  {truncateString(PlayList?.name, 35)}
                </h1>
                
                {PlayList?.description && (
                  <p className="text-gray-400 text-sm md:text-base mb-4 max-w-2xl mx-auto md:mx-0">
                    {PlayList.description}
                  </p>
                )}
                
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FiUsers className="text-gray-400" size={14} />
                    <span className="text-gray-300">
                      {PlayList?.owner?.username || PlayList?.owner || "Unknown Artist"}
                    </span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <div className="flex items-center gap-2">
                    <FiHeadphones className="text-gray-400" size={14} />
                    <span className="text-gray-300">{PlayList.songs?.length || 0} songs</span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <div className="flex items-center gap-2">
                    <HiOutlineClock className="text-gray-400" size={14} />
                    <span className="text-gray-300">{formattedDuration}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center md:justify-start gap-3 mt-8 flex-wrap"
            >
              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayWholeList}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
              >
                <FaPlay size={14} className="ml-0.5" />
                <span>Play All</span>
              </motion.button>

              {/* Shuffle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShufflePlay}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <FaRandom size={16} className="text-gray-400" />
              </motion.button>

              {/* Like Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLikePlaylist}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                {isLiked ? (
                  <FaHeart size={18} className="text-pink-500 animate-bounce" />
                ) : (
                  <FaRegHeart size={18} className="text-gray-400" />
                )}
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSharePlaylist}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <FaShare size={16} className="text-gray-400" />
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Sticky Header on Scroll */}
        <AnimatePresence>
          {isScrolled && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="sticky top-[70px] z-30 bg-gradient-to-r from-[#0a0a0f]/95 to-[#050507]/95 backdrop-blur-xl rounded-xl mx-4 mb-4 border border-white/10"
            >
              <div className="flex items-center px-6 py-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayWholeList}
                  className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                >
                  <FaPlay size={12} className="ml-0.5 text-white" />
                </motion.button>
                
                <div className="flex items-center gap-3">
                  {PlayList.image ? (
                    <LazyLoadImage
                      effect="blur"
                      loading="lazy"
                      src={PlayList?.image[1]?.url || PlayList?.image[0]?.url}
                      alt={PlayList?.name}
                      className="rounded-lg w-10 h-10 object-cover"
                    />
                  ) : (
                    <BiSolidPlaylist size={32} color="#59c2ef" />
                  )}
                  <div>
                    <h3 className="font-semibold text-white text-sm truncate max-w-[200px]">
                      {PlayList?.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {PlayList.songs?.length || 0} songs • {formattedDuration}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Songs List Section */}
        <BlockWrapper margin={"mb-20 md:mb-8"}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10 mb-2">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6">Title</div>
              <div className="col-span-4">Album</div>
              <div className="col-span-1 flex items-center gap-1 justify-end">
                <HiOutlineClock size={14} />
                <span>Duration</span>
              </div>
            </div>

            {/* Songs */}
            <div className="relative bg-gradient-to-br from-[#1f1f23]/50 to-[#18181b]/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5" />
              
              <div className="relative divide-y divide-white/5">
                <AnimatePresence>
                  {PlayList?.songs?.map((song, index) => {
                    const isCurrentSong = currentSong?.id === song.id;
                    const isSongPlaying = isCurrentSong && isPlaying;
                    const artistNames = getArtistNames(song);
                    const albumName = song?.album?.name || song?.album || "Unknown Album";
                    
                    return (
                      <motion.div
                        key={song.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onMouseEnter={() => handleMouseEnter(song.id)}
                        onMouseLeave={handleMouseLeave}
                        className={cn(
                          "group grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 md:px-6 py-3 cursor-pointer transition-all duration-200",
                          isCurrentSong 
                            ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10" 
                            : "hover:bg-white/5"
                        )}
                        onClick={() => handlePlaySong(song, index)}
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
                        <div className="col-span-1 md:col-span-6 flex items-center gap-3">
                          <LazyLoadImage
                            effect="blur"
                            loading="lazy"
                            src={song?.image?.[1]?.url || song?.image?.[0]?.url || song?.image}
                            alt={song.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className={cn(
                              "font-medium truncate",
                              isCurrentSong ? "text-cyan-400" : "text-white"
                            )}>
                              {decodeHtmlEntities(song?.name)}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                              {artistNames}
                            </p>
                          </div>
                        </div>

                        {/* Album Name */}
                        <div className="hidden md:block col-span-4">
                          <p className="text-sm text-gray-400 truncate">
                            {decodeHtmlEntities(albumName)}
                          </p>
                        </div>

                        {/* Duration */}
                        <div className="hidden md:block col-span-1 text-right">
                          <p className="text-sm text-gray-400">
                            {formatTime(song.duration)}
                          </p>
                        </div>

                        {/* Mobile Duration */}
                        {isMobile && (
                          <div className="absolute right-4">
                            <p className="text-xs text-gray-500">
                              {formatTime(song.duration)}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Empty State */}
            {(!PlayList?.songs || PlayList.songs.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                  <FiHeadphones size={32} className="text-cyan-400" />
                </div>
                <h3 className="jaro-head text-xl text-white mb-2">No songs yet</h3>
                <p className="text-gray-400">This playlist is empty. Add some songs to get started!</p>
              </motion.div>
            )}
          </div>
        </BlockWrapper>
      </div>
    </Wrapper>
  );
};

export default Playlist;