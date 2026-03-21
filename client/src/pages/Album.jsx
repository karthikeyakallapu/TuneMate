import Wrapper from "@/pages/Wrapper.jsx";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import MusicServiceInstance from "@/service/api/music_apis.js";
import { useParams } from "react-router-dom";
import {
  decodeHtmlEntities,
  formatTime,
  truncateString,
} from "@/utils/MusicUtils.js";
import usePlayerStore from "@/store/use-player.js";
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaRegHeart,
  FaShare,
  FaCalendarAlt,
} from "react-icons/fa";
import { FiShuffle, FiClock, FiMusic, FiHeadphones } from "react-icons/fi";
import { BiSolidPlaylist } from "react-icons/bi";
import UserPlayListSkeleton from "@/_components/skeletons/UserPlayListSkeleton.jsx";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import { useMediaQuery } from "usehooks-ts";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useState } from "react";
import { cn } from "@/lib/utils";
import useHover from "@/hooks/useHover.js";

const Album = () => {
  const { id } = useParams();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const {
    playSong,
    playlist,
    loadPlaylist,
    playSongByIndex,
    isPlaying,
    songId,
  } = usePlayerStore();
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();

  const {
    data: album,
    error,
    isLoading,
  } = useSWR(id ? ["album", id] : null, () =>
    MusicServiceInstance.getAlbumById(id),
  );

  const handlePlayWholeList = async () => {
    await loadPlaylist({ id: album?.id, type: "ALBUM", index: 0 });
  };

  const getArtistNames = () => {
    if (!album?.artists?.primary) return "Various Artists";
    if (Array.isArray(album.artists.primary)) {
      return album.artists.primary.map((artist) => artist.name).join(", ");
    }
    if (typeof album.artists.primary === "string") {
      return album.artists.primary;
    }
    return "Various Artists";
  };

  const formatTotalDuration = () => {
    if (!album?.songs?.length) return null;
    const totalSeconds = album.songs.reduce(
      (acc, song) => acc + (song.duration || 0),
      0,
    );
    const minutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
          <div className="px-4 py-8">
            <UserPlayListSkeleton count={8} />
          </div>
        </div>
      </Wrapper>
    );
  }

  if (error || !album) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Album Not Found
            </h2>
            <p className="text-gray-400">
              The album you're looking for doesn't exist.
            </p>
          </motion.div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] pb-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/30 via-cyan-500/20 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />

          {/* Floating Particles - Hidden on mobile for performance */}
          {!isMobile && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
            </div>
          )}

          <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end items-center gap-6 md:gap-8">
              {/* Album Art */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative group flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                  {album.image ? (
                    <LazyLoadImage
                      src={album?.image?.[1]?.url || album?.image?.[0]?.url}
                      alt={album?.name}
                      effect="blur"
                      className="relative rounded-2xl w-40 h-40 md:w-64 md:h-64 object-cover shadow-2xl border-2 border-white/20"
                    />
                  ) : (
                    <div className="relative w-40 h-40 md:w-64 md:h-64 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl">
                      <BiSolidPlaylist
                        size={isMobile ? 60 : 80}
                        color="white"
                      />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Album Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-1 text-center md:text-left"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm mb-3 md:mb-4">
                  <FiMusic className="text-cyan-400" size={12} />
                  <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    Album
                  </span>
                </div>

                <h1 className="jaro-head text-2xl md:text-5xl lg:text-6xl text-white mb-3 leading-tight">
                  {truncateString(
                    decodeHtmlEntities(album?.name),
                    isMobile ? 25 : 30,
                  )}
                </h1>

                <p className="ubuntu-bold text-base md:text-xl text-cyan-400 mb-2">
                  {truncateString(getArtistNames(), isMobile ? 30 : undefined)}
                </p>

                <div className="flex items-center justify-center md:justify-start gap-3 text-xs md:text-sm text-gray-400 mb-3">
                  {album?.year && (
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt size={isMobile ? 10 : 12} />
                      <span>{album.year}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <FiMusic size={isMobile ? 10 : 12} />
                    <span>
                      {album?.songCount || album?.songs?.length || 0} Songs
                    </span>
                  </div>
                  {album?.songs?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <FiClock size={isMobile ? 10 : 12} />
                      <span>{formatTotalDuration()}</span>
                    </div>
                  )}
                </div>

                {album?.description && !isMobile && (
                  <p className="text-gray-400 text-sm max-w-2xl mx-auto md:mx-0">
                    {truncateString(album.description, 100)}
                  </p>
                )}
              </motion.div>
            </div>

            {/* Action Buttons - Responsive */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mt-6 md:mt-8 flex-wrap"
            >
              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayWholeList}
                className="px-5 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-sm md:text-base"
              >
                <FaPlay size={isMobile ? 12 : 14} className="ml-0.5" />
                <span>Play All</span>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Songs Section */}
        <BlockWrapper margin={"mb-20 md:mb-8"}>
          <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
              <h2 className="jaro-head text-xl md:text-2xl lg:text-3xl text-white">
                Tracklist
              </h2>
            </div>

            {/* Songs List */}
            <div className="relative bg-gradient-to-br from-[#1f1f23]/50 to-[#18181b]/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5" />

              <div className="relative">
                {/* Header - Hidden on mobile */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-7">Title</div>
                  <div className="col-span-4 text-right">Duration</div>
                </div>

                {/* Songs */}
                <div className="divide-y divide-white/5">
                  {album?.songs?.map((song, index) => {
                    const isCurrentSong = songId === song.id;
                    const isSongPlaying = isCurrentSong && isPlaying;

                    return (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onMouseEnter={() => handleMouseEnter(song.id)}
                        onMouseLeave={handleMouseLeave}
                        className={cn(
                          "group cursor-pointer transition-all duration-200",
                          isCurrentSong
                            ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
                            : "hover:bg-white/5",
                        )}
                        onClick={() =>
                          playlist.songs.length > 0 && playlist.id === album.id
                            ? playSongByIndex(index)
                            : playSong(song.id)
                        }
                      >
                        {/* Desktop Layout */}
                        <div className="hidden md:grid grid-cols-12 gap-4 items-center px-6 py-3">
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
                              <span
                                className={cn(
                                  "text-sm font-mono",
                                  isCurrentSong
                                    ? "text-cyan-400"
                                    : "text-gray-500",
                                )}
                              >
                                {index + 1}
                              </span>
                            )}
                          </div>

                          {/* Song Info */}
                          <div className="col-span-7">
                            <h3
                              className={cn(
                                "font-medium truncate",
                                isCurrentSong ? "text-cyan-400" : "text-white",
                              )}
                            >
                              {decodeHtmlEntities(song?.name)}
                            </h3>
                          </div>

                          {/* Duration */}
                          <div className="col-span-4 text-right">
                            <p className="text-sm text-gray-400">
                              {formatTime(song.duration)}
                            </p>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="md:hidden flex items-center gap-3 px-4 py-3">
                          {/* Index / Play Icon */}
                          <div className="w-8 flex justify-center">
                            {hoveredItemId === song.id || isCurrentSong ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-cyan-400"
                              >
                                {isSongPlaying ? (
                                  <FaPause size={12} />
                                ) : (
                                  <FaPlay size={10} className="ml-0.5" />
                                )}
                              </motion.div>
                            ) : (
                              <span
                                className={cn(
                                  "text-xs font-mono",
                                  isCurrentSong
                                    ? "text-cyan-400"
                                    : "text-gray-500",
                                )}
                              >
                                {index + 1}
                              </span>
                            )}
                          </div>

                          {/* Song Info */}
                          <div className="flex-1 min-w-0">
                            <h3
                              className={cn(
                                "font-medium text-sm truncate",
                                isCurrentSong ? "text-cyan-400" : "text-white",
                              )}
                            >
                              {decodeHtmlEntities(song?.name)}
                            </h3>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {truncateString(getArtistNames(), 25)}
                            </p>
                          </div>

                          {/* Duration */}
                          <div className="flex-shrink-0">
                            <p className="text-xs text-gray-500">
                              {formatTime(song.duration)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Empty State */}
            {(!album?.songs || album.songs.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 md:py-20 text-center"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-3 md:mb-4">
                  <FiHeadphones
                    size={isMobile ? 24 : 32}
                    className="text-cyan-400"
                  />
                </div>
                <h3 className="jaro-head text-lg md:text-xl text-white mb-2">
                  No tracks available
                </h3>
                <p className="text-gray-400 text-sm">
                  This album doesn't have any songs yet.
                </p>
              </motion.div>
            )}
          </div>
        </BlockWrapper>
      </div>
    </Wrapper>
  );
};

export default Album;
