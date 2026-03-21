/* eslint-disable react/prop-types */
import { BiSolidPlaylist } from "react-icons/bi";
import { FaPlay, FaPause } from "react-icons/fa";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import usePlayerStore from "@/store/use-player.js";

const PlaylistTile = ({ playlist, hoveredItemId, handlePlayWholeList }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isPlaying, songId, currentTrack } = usePlayerStore();

  const isHovered = hoveredItemId === playlist.id;
  const isCurrentPlaylist = currentTrack?.playlistId === playlist.id;
  const isPlayingCurrent = isCurrentPlaylist && isPlaying;

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="relative group">
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        {playlist.image && !imageError ? (
          <>
            {/* Skeleton Loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 animate-pulse rounded-lg" />
            )}

            <LazyLoadImage
              alt={playlist.name || "Playlist cover"}
              effect="blur"
              loading="lazy"
              className={cn(
                "rounded-lg h-32 w-32 md:h-44 md:w-44 object-cover transition-all duration-500",
                imageLoaded ? "opacity-100" : "opacity-0",
                isHovered && "scale-110",
              )}
              src={playlist.image}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          // Fallback Icon with Gradient Background
          <div className="h-32 w-32 md:h-44 md:w-44 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
            <BiSolidPlaylist
              size={70}
              className="text-cyan-400/50 md:text-[100px] transition-all duration-300 group-hover:scale-110"
            />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play Button Overlay */}
        <AnimatePresence>
          {(isHovered || isCurrentPlaylist) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-sm"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handlePlayWholeList(e, playlist.id)}
                className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg hover:shadow-cyan-500/50 transition-shadow",
                  isPlayingCurrent && "animate-pulse",
                )}
                aria-label={`Play ${playlist.name}`}
              >
                {isPlayingCurrent ? (
                  <FaPause className="text-white text-sm md:text-base" />
                ) : (
                  <FaPlay className="text-white text-sm md:text-base ml-0.5" />
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Track Count Badge */}
        {playlist.tracks?.total && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-xs text-gray-300">
              {playlist.tracks.total}
            </span>
          </div>
        )}

        {/* Private Playlist Badge */}
        {playlist.public === false && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-xs text-gray-300">Private</span>
          </div>
        )}

        {/* Current Playing Indicator */}
        {isCurrentPlaylist && isPlaying && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Hover Glow Effect */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl -z-10"
        />
      )}
    </div>
  );
};

export default PlaylistTile;
