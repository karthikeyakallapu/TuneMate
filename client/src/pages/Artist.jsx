import Wrapper from "@/pages/Wrapper.jsx";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import MusicServiceInstance from "@/service/api/music_apis.js";
import {
  decodeHtmlEntities,
  formatTime,
  truncateString,
  getAllArtists,
} from "@/utils/MusicUtils.js";
import { MdVerified, MdVerifiedUser } from "react-icons/md";
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaRegHeart,
  FaShare,
  FaEllipsisH,
} from "react-icons/fa";
import {
  FiShuffle,
  FiMoreHorizontal,
  FiHeadphones,
  FiUsers,
} from "react-icons/fi";
import { BiSolidPlaylist, BiPlay } from "react-icons/bi";
import usePlayerStore from "@/store/use-player.js";
import UserPlayListSkeleton from "@/_components/skeletons/UserPlayListSkeleton.jsx";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import { useMediaQuery } from "usehooks-ts";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useState } from "react";
import { cn } from "@/lib/utils";
import useHover from "@/hooks/useHover.js";

const Artist = () => {
  const { id } = useParams();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const {
    playSong,
    loadPlaylist,
    playlist,
    playSongByIndex,
    isPlaying,
    songId,
  } = usePlayerStore();
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();

  const {
    data: artist,
    error,
    isLoading,
  } = useSWR(id ? ["artist", id] : null, () =>
    MusicServiceInstance.getArtistById(id),
  );

  const handlePlayWholeList = async () => {
    await loadPlaylist({ id, type: "ARTIST", index: 0 });
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
          <div className="px-4 py-8">
            <UserPlayListSkeleton count={8} />
          </div>
        </div>
      </Wrapper>
    );
  }

  if (error || !artist) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🎤</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Artist Not Found
            </h2>
            <p className="text-gray-400">
              The artist you're looking for doesn't exist.
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
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/30 via-purple-500/20 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent" />

          {/* Floating Particles - Hidden on mobile for performance */}
          {!isMobile && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-20 w-64 h-64 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
            </div>
          )}

          <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end items-center gap-6 md:gap-8">
              {/* Artist Image with Glow */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative group flex-shrink-0"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                  {artist.image ? (
                    <LazyLoadImage
                      src={artist?.image?.[1]?.url || artist?.image?.[0]?.url}
                      alt={artist?.name}
                      effect="blur"
                      className="relative rounded-full w-32 h-32 md:w-56 md:h-56 object-cover shadow-2xl border-4 border-white/20"
                    />
                  ) : (
                    <div className="relative w-32 h-32 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-2xl">
                      <BiSolidPlaylist
                        size={isMobile ? 50 : 80}
                        color="white"
                      />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Artist Info */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-1 text-center md:text-left"
              >
                <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-2 md:mb-3 flex-wrap">
                  <h1 className="jaro-head text-2xl md:text-6xl lg:text-7xl text-white">
                    {truncateString(artist?.name, isMobile ? 20 : 30)}
                  </h1>
                  {artist?.isVerified && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="relative"
                    >
                      <MdVerifiedUser
                        size={isMobile ? 20 : 36}
                        className="text-cyan-400"
                      />
                      <div className="absolute inset-0 blur-md bg-cyan-400/30 rounded-full" />
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-center md:justify-start gap-3 md:gap-4 mb-3 md:mb-4">
                  <div className="flex items-center gap-1 md:gap-2">
                    <FiUsers
                      size={isMobile ? 12 : 16}
                      className="text-gray-400"
                    />
                    <span className="text-xs md:text-sm text-gray-300 font-semibold">
                      {formatFollowerCount(artist?.followerCount)} Followers
                    </span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <FiHeadphones
                      size={isMobile ? 12 : 16}
                      className="text-gray-400"
                    />
                    <span className="text-xs md:text-sm text-gray-300">
                      {artist?.topSongs?.length || 0} Songs
                    </span>
                  </div>
                </div>

                {/* Artist Bio - Optional */}
                {artist?.bio && !isMobile && (
                  <p className="text-gray-400 text-sm max-w-2xl mx-auto md:mx-0">
                    {truncateString(artist.bio, 150)}
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
                className="px-5 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-pink-500/25 transition-all duration-300 text-sm md:text-base"
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
              <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
              <h2 className="jaro-head text-xl md:text-2xl lg:text-3xl text-white">
                Popular Songs
              </h2>
            </div>

            {/* Songs List */}
            <div className="relative bg-gradient-to-br from-[#1f1f23]/50 to-[#18181b]/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5" />

              <div className="relative">
                {/* Header - Hidden on mobile */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-white/10">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-6">Title</div>
                  <div className="col-span-4">Album</div>
                  <div className="col-span-1 text-right">Duration</div>
                </div>

                {/* Songs */}
                <div className="divide-y divide-white/5">
                  {artist?.topSongs?.map((song, index) => {
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
                            ? "bg-gradient-to-r from-pink-500/10 to-purple-500/10"
                            : "hover:bg-white/5",
                        )}
                        onClick={() =>
                          playlist.songs.length > 0 && playlist.id === artist.id
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
                                    : "text-gray-500",
                                )}
                              >
                                {index + 1}
                              </span>
                            )}
                          </div>

                          {/* Song Info */}
                          <div className="col-span-6 flex items-center gap-3">
                            <LazyLoadImage
                              src={song.image?.[1]?.url || song.image?.[0]?.url}
                              alt={song.name}
                              effect="blur"
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3
                                className={cn(
                                  "font-medium truncate",
                                  isCurrentSong
                                    ? "text-pink-400"
                                    : "text-white",
                                )}
                              >
                                {decodeHtmlEntities(song?.name)}
                              </h3>
                            </div>
                          </div>

                          {/* Album Name */}
                          <div className="col-span-4">
                            <p className="text-sm text-gray-400 truncate">
                              {decodeHtmlEntities(
                                song?.album?.name || song?.album || "Single",
                              )}
                            </p>
                          </div>

                          {/* Duration */}
                          <div className="col-span-1 text-right">
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
                                className="text-pink-400"
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
                                    ? "text-pink-400"
                                    : "text-gray-500",
                                )}
                              >
                                {index + 1}
                              </span>
                            )}
                          </div>

                          {/* Album Art */}
                          <LazyLoadImage
                            src={song.image?.[1]?.url || song.image?.[0]?.url}
                            alt={song.name}
                            effect="blur"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />

                          {/* Song Info */}
                          <div className="flex-1 min-w-0">
                            <h3
                              className={cn(
                                "font-medium text-sm truncate",
                                isCurrentSong ? "text-pink-400" : "text-white",
                              )}
                            >
                              {decodeHtmlEntities(song?.name)}
                            </h3>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {decodeHtmlEntities(
                                song?.album?.name || song?.album || "Single",
                              )}
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
            {(!artist?.topSongs || artist.topSongs.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 md:py-20 text-center"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-3 md:mb-4">
                  <FiHeadphones
                    size={isMobile ? 24 : 32}
                    className="text-pink-400"
                  />
                </div>
                <h3 className="jaro-head text-lg md:text-xl text-white mb-2">
                  No songs available
                </h3>
                <p className="text-gray-400 text-sm">
                  This artist hasn't released any songs yet.
                </p>
              </motion.div>
            )}
          </div>
        </BlockWrapper>
      </div>
    </Wrapper>
  );
};

export default Artist;
