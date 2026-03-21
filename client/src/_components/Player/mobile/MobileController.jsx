import React, { useEffect, useMemo, useCallback } from "react";
import usePlayerStore from "@/store/use-player.js";
import { FaPause, FaPlay } from "react-icons/fa";
import useMobileScreen from "@/store/use-MobileScreen";
import {
  decodeHtmlEntities,
  getAllArtists,
  truncateString
} from "@/utils/MusicUtils.js";
import { MdFavorite } from "react-icons/md";
import { IoMdAddCircle } from "react-icons/io";
import useAddListStore from "@/store/use-addList.js";
import useAuthStore from "@/store/use-auth.js";
import MusicSeek from "../MusicSeek";
import MusicControls from "../MusicControls";
import AddToPlaylist from "@/_components/Options/AddToPlaylist.jsx";
import AdminAddToPlaylist from "@/_components/admin/AdminAddToPlaylist.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { HiUsers } from "react-icons/hi";
import useUserSyncStore from "@/store/use-userSync";
import useNotifierStore from "@/store/use-Notifier";
import UserSync from "@/_components/sync/UserSync";
import UserNotifier from "@/_components/sync/UserNotifier";

const MobileController = () => {
  const { 
    song, 
    isPlaying, 
    handleAudioPlay, 
    AudioRef, 
    Favorites, 
    setDuration,
    currentTrack
  } = usePlayerStore();
  const { showUserSync, isUserSyncVisible } = useUserSyncStore();
  const { isNotifierVisible } = useNotifierStore();
  const { role } = useAuthStore();
  const { isFullScreen, openFullScreen, closeFullScreen } = useMobileScreen();
  const { isAddToPlaylistVisible, showAddToPlaylist, component } =
    useAddListStore();

  // Use currentTrack if available, fallback to song
  const currentSong = currentTrack || song;

  // Handle audio play state change
  useEffect(() => {
    handleAudioPlay(false, false);
  }, [handleAudioPlay]);

  // Handle audio loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (AudioRef.current) {
      setDuration(AudioRef.current.duration);
    }
  }, [AudioRef, setDuration]);

  // Get image URL safely
  const getImageUrl = useCallback(() => {
    if (!currentSong) return null;
    
    // Try different image sources
    if (currentSong.image) {
      if (Array.isArray(currentSong.image)) {
        // Try different sizes
        return currentSong.image[2]?.url || 
               currentSong.image[1]?.url || 
               currentSong.image[0]?.url;
      }
      return currentSong.image;
    }
    
    if (currentSong.imageUrl) return currentSong.imageUrl;
    if (currentSong.albumArt) return currentSong.albumArt;
    
    return null;
  }, [currentSong]);

  // Get song name safely
  const getSongName = useCallback(() => {
    if (!currentSong) return "No song playing";
    return currentSong.name || currentSong.title || "Unknown Track";
  }, [currentSong]);

  // Get artist name safely
  const getArtistName = useCallback(() => {
    if (!currentSong) return "";
    
    if (currentSong.artists) {
      return getAllArtists(currentSong);
    }
    
    if (currentSong.primaryArtists) {
      return decodeHtmlEntities(currentSong.primaryArtists);
    }
    
    if (currentSong.artist) {
      return decodeHtmlEntities(currentSong.artist);
    }
    
    return "Unknown Artist";
  }, [currentSong]);

  const UserSyncMemoized = useMemo(() => <UserSync />, [isUserSyncVisible]);
  const UserNotifierMemoized = useMemo(
    () => <UserNotifier />,
    [isNotifierVisible]
  );

  // Don't render if no song is playing
  if (!currentSong) {
    return null;
  }

  const imageUrl = getImageUrl();
  const songName = getSongName();
  const artistName = getArtistName();

  return (
    <>
      {/* Persistent Audio Element */}
      <audio
        src={currentSong?.downloadUrl?.[4]?.url || currentSong?.url}
        autoPlay
        ref={AudioRef}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Mobile Player Controller - Fixed positioning */}
      <motion.div
        className="fixed left-0 right-0 w-full p-3 z-40 bg-gradient-to-r from-[#1a1a1e] to-[#0f0f12] border-t border-white/10 shadow-lg"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex justify-between items-center gap-3">
          {/* Song Info */}
          <div 
            className="flex items-center flex-1 min-w-0 cursor-pointer"
            onClick={openFullScreen}
          >
            {/* Album Art */}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={songName}
                className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">🎵</span>
              </div>
            )}
            
            {/* Song Details */}
            <div className="flex flex-col ml-3 min-w-0 flex-1">
              <h3 className="text-sm md:text-base font-semibold text-white truncate">
                {truncateString(decodeHtmlEntities(songName), 20)}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {truncateString(decodeHtmlEntities(artistName), 25)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Sync Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showUserSync();
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <HiUsers size={22} className="text-gray-400 hover:text-cyan-400" />
              </button>
              {isUserSyncVisible && UserSyncMemoized}
              {isNotifierVisible && UserNotifierMemoized}
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAudioPlay();
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              {isPlaying ? (
                <FaPause size={16} className="text-white" />
              ) : (
                <FaPlay size={14} className="text-white ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Full-Screen Player */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            className="fixed inset-0 w-full h-full bg-gradient-to-b from-[#0a0a0f] to-[#050507] z-50 overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.4,
              ease: [0.42, 0, 0.58, 1]
            }}
          >
            <div className="flex flex-col h-full">
              {/* Header with Close Button */}
              <div className="flex justify-between items-center p-4 border-b border-white/10">
                <div className="w-10" />
                <h2 className="text-white font-semibold">Now Playing</h2>
                <button
                  onClick={closeFullScreen}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center px-6 py-8">
                {/* Album Art */}
                <motion.div
                  className="flex justify-center mb-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={songName}
                        className="w-64 h-64 md:w-80 md:h-80 rounded-2xl shadow-2xl object-cover"
                      />
                    ) : (
                      <div className="w-64 h-64 md:w-80 md:h-80 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl">
                        <span className="text-white text-6xl">🎵</span>
                      </div>
                    )}
                    {/* Vinyl Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                </motion.div>

                {/* Music Info */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">
                      {decodeHtmlEntities(songName)}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      {decodeHtmlEntities(artistName)}
                    </p>
                  </div>
                  <button
                    onClick={() => showAddToPlaylist(currentSong?.id, "MUSIC_INFO")}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                  >
                    {Favorites?.includes(currentSong?.id) ? (
                      <MdFavorite size={24} className="text-pink-500" />
                    ) : (
                      <IoMdAddCircle size={24} className="text-cyan-400" />
                    )}
                  </button>
                </div>

                {/* Music Seek Bar */}
                <div className="mb-4">
                  <MusicSeek />
                </div>

                {/* Music Controls */}
                <div className="mb-8">
                  <MusicControls />
                </div>

                {/* Add to Playlist Modal */}
                <AnimatePresence>
                  {isAddToPlaylistVisible && component === "MUSIC_INFO" && (
                    role === "user" ? <AddToPlaylist /> : <AdminAddToPlaylist />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileController;
