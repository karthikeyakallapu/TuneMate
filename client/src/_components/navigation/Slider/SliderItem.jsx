/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import { memo } from "react";
import useHover from "@/hooks/useHover.js";
import usePlayerStore from "@/store/use-player.js";
import PlaylistTile from "@/_components/PlaylistComponents/PlaylistTile";
import { decodeHtmlEntities, truncateString } from "@/utils/MusicUtils.js";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SliderItem = memo(({ playlist, index }) => {
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();
  const { loadPlaylist, isPlaying, currentTrack } = usePlayerStore();
  
  const isCurrentPlaylist = currentTrack?.playlistId === playlist.id;
  
  const handlePlayWholeList = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await loadPlaylist({
        id: id,
        type: "RECOMMENDED_PLAYLIST",
        index: 0
      });
    } catch (error) {
      console.error("Error playing playlist:", error);
    }
  };

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlayWholeList(e, id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index || 0) * 0.05 }}
      whileHover={{ y: -4 }}
      className="relative"
    >
      <Link
        to={`/recommended/${playlist.id}`}
        key={playlist.id}
        className={cn(
          "flex cursor-pointer flex-col rounded-xl justify-center items-start transform transition-all duration-300",
          "m-2 md:m-0 md:pt-4 md:pb-4 md:pl-3 md:pr-3 group",
          isCurrentPlaylist && "ring-2 ring-cyan-400"
        )}
        onMouseEnter={() => handleMouseEnter(playlist.id)}
        onMouseLeave={handleMouseLeave}
        aria-label={`Play ${decodeHtmlEntities(playlist.name)} playlist`}
      >
        {/* Playlist Tile */}
        <PlaylistTile
          playlist={playlist}
          hoveredItemId={hoveredItemId}
          handlePlayWholeList={handlePlayWholeList}
        />

        {/* Playlist Info */}
        <div className="flex flex-col mt-3 w-full">
          <h3 className={cn(
            "text-sm md:text-base font-semibold transition-colors line-clamp-1",
            isCurrentPlaylist ? "text-cyan-400" : "text-white group-hover:text-cyan-400"
          )}>
            {truncateString(decodeHtmlEntities(playlist.name), 20)}
          </h3>
          
          {/* Optional: Show playlist owner or track count */}
          {playlist.owner && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
              {playlist.owner.display_name || playlist.owner}
            </p>
          )}
          
          {playlist.tracks?.total && (
            <p className="text-xs text-gray-500 mt-0.5">
              {playlist.tracks.total} {playlist.tracks.total === 1 ? 'track' : 'tracks'}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
});

SliderItem.displayName = 'SliderItem';

export default SliderItem;