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
  const [isLiked, setIsLiked] = useState(false);

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

  const handleShufflePlay = async () => {
    if (artist?.topSongs?.length) {
      const randomIndex = Math.floor(Math.random() * artist.topSongs.length);
      await loadPlaylist({ id, type: "ARTIST", index: randomIndex });
    }
  };

  const handleLikeArtist = () => {
    setIsLiked(!isLiked);
  };

  const handleShareArtist = () => {
    if (navigator.share) {
      navigator.share({
        title: artist?.name,
        text: `Check out ${artist?.name} on Tunemate`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
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

  if (error || !artist) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/30 via-purple-500/20 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent" />

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-64 h-64 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
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
                      src={artist?.image[1]?.url || artist?.image[0]?.url}
                      alt={artist?.name}
                      effect="blur"
                      className="relative rounded-full w-40 h-40 md:w-56 md:h-56 object-cover shadow-2xl border-4 border-white/20"
                    />
                  ) : (
                    <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-2xl">
                      <BiSolidPlaylist size={80} color="white" />
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
                <div className="flex items-center justify-center md:justify-start gap-3 mb-3 flex-wrap">
                  <h1 className="jaro-head text-4xl md:text-6xl lg:text-7xl text-white">
                    {truncateString(artist?.name, 30)}
                  </h1>
                  {artist?.isVerified && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="relative"
                    >
                      <MdVerifiedUser
                        size={isMobile ? 28 : 36}
                        className="text-cyan-400"
                      />
                      <div className="absolute inset-0 blur-md bg-cyan-400/30 rounded-full" />
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FiUsers className="text-gray-400" size={16} />
                    <span className="text-gray-300 font-semibold">
                      {formatFollowerCount(artist?.followerCount)} Followers
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiHeadphones className="text-gray-400" size={16} />
                    <span className="text-gray-300">
                      {artist?.topSongs?.length || 0} Songs
                    </span>
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
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-pink-500/25 transition-all duration-300"
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
                <FiShuffle size={16} className="text-gray-400" />
              </motion.button>

              {/* Like Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLikeArtist}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                {isLiked ? (
                  <FaHeart size={18} className="text-pink-500" />
                ) : (
                  <FaRegHeart size={18} className="text-gray-400" />
                )}
              </motion.button>

              {/* Share Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShareArtist}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <FaShare size={16} className="text-gray-400" />
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Songs Section */}
        <BlockWrapper margin={"mb-20 md:mb-8"}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
              <h2 className="jaro-head text-2xl md:text-3xl text-white">
                Popular Songs
              </h2>
            </div>

            {/* Songs List */}
            <div className="relative bg-gradient-to-br from-[#1f1f23]/50 to-[#18181b]/50 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5" />

              <div className="relative">
                {/* Header */}
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
                          "group grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-4 md:px-6 py-3 cursor-pointer transition-all duration-200",
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
                        <div className="col-span-1 md:col-span-6 flex items-center gap-3">
                          <LazyLoadImage
                            src={song.image[1]?.url || song.image[0]?.url}
                            alt={song.name}
                            effect="blur"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3
                              className={cn(
                                "font-medium truncate",
                                isCurrentSong ? "text-pink-400" : "text-white",
                              )}
                            >
                              {decodeHtmlEntities(song?.name)}
                            </h3>
                          </div>
                        </div>

                        {/* Album Name */}
                        <div className="hidden md:block col-span-4">
                          <p className="text-sm text-gray-400 truncate">
                            {decodeHtmlEntities(
                              song?.album?.name || song?.album || "Single",
                            )}
                          </p>
                        </div>

                        {/* Duration */}
                        <div className="hidden md:block col-span-1 text-right">
                          <p className="text-sm text-gray-400">
                            {formatTime(song.duration)}
                          </p>
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
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <FiHeadphones size={32} className="text-pink-400" />
                </div>
                <h3 className="jaro-head text-xl text-white mb-2">
                  No songs available
                </h3>
                <p className="text-gray-400">
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
