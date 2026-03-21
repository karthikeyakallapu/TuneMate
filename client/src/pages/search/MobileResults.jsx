import useSearchStore from "@/store/use-search.js";
import { motion, AnimatePresence } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { decodeHtmlEntities, truncateString } from "@/utils/MusicUtils.js";
import usePlayerStore from "@/store/use-player.js";
import { FaPlay, FaPause } from "react-icons/fa";
import { FiSearch, FiMusic, FiTrendingUp } from "react-icons/fi";
import { MdAlbum } from "react-icons/md";
import { IoMic } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce.js";
import MusicServiceInstance from "@/service/api/music_apis.js";
import useSWR from "swr";

const MobileResults = () => {
  const { search } = useSearchStore();
  const { playSong, songId, isPlaying } = usePlayerStore();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useSWR(
    debouncedSearch ? ["mobile-search", debouncedSearch] : null,
    () => MusicServiceInstance.getSearchResults(debouncedSearch),
  );

  const topResult = data?.topQuery?.results[0];

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FiSearch className="text-cyan-400 animate-pulse" size={16} />
          </div>
        </div>
        <p className="mt-4 text-gray-400 text-sm">Searching...</p>
      </div>
    );
  }

  // Welcome State
  if (!search) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
          <FiSearch size={32} className="text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Search for music
        </h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Find your favorite songs, albums, and artists
        </p>
      </motion.div>
    );
  }

  // No Results State
  if (
    !data?.songs?.results?.length &&
    !data?.albums?.results?.length &&
    !data?.artists?.results?.length
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <FiSearch size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          No results found
        </h3>
        <p className="text-gray-400 text-sm max-w-xs">
          We couldn't find anything matching "{search}"
        </p>
        <p className="text-gray-500 text-xs mt-4">
          Try searching with different keywords
        </p>
      </motion.div>
    );
  }

  // Top Result Component
  const renderTopResult = () => {
    if (!topResult) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
          <FiTrendingUp className="text-cyan-400" size={14} />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Top Result
          </h2>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-xl border border-white/10 cursor-pointer"
          onClick={() => topResult.type === "song" && playSong(topResult.id)}
        >
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative p-4">
            <div className="flex items-center gap-4">
              {/* Image */}
              <div className="relative">
                <LazyLoadImage
                  src={topResult.image?.[1]?.url || topResult.image?.[0]?.url}
                  alt=""
                  effect="blur"
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                />
                {topResult.type === "song" && (
                  <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <FaPlay size={12} className="ml-0.5 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm mb-2">
                  <span className="text-[10px] font-medium text-cyan-400 uppercase">
                    {topResult.type}
                  </span>
                </div>
                <h3 className="font-bold text-white text-base mb-1 truncate">
                  {truncateString(decodeHtmlEntities(topResult.title), 25)}
                </h3>
                {topResult.type === "song" && (
                  <p className="text-xs text-gray-400 truncate">
                    {truncateString(decodeHtmlEntities(topResult.singers), 30)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Songs Section
  const renderSongs = () => {
    if (!data?.songs?.results?.length) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
          <FiMusic className="text-cyan-400" size={14} />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Songs
          </h2>
        </div>

        <div className="space-y-1">
          {data.songs.results.slice(0, 5).map((song, index) => {
            const isCurrentSong = songId === song.id;
            const isSongPlaying = isCurrentSong && isPlaying;

            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4 }}
                onMouseEnter={() => setHoveredId(song.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => playSong(song.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                  isCurrentSong
                    ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
                    : "bg-white/5 active:bg-white/10"
                )}
              >
                {/* Index / Play Button */}
                <div className="w-6 text-center">
                  {hoveredId === song.id || isCurrentSong ? (
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
                    <span className="text-xs text-gray-500 font-mono">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Album Art */}
                <div className="relative">
                  <LazyLoadImage
                    effect="blur"
                    src={song.image?.[1]?.url || song.image?.[0]?.url}
                    alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      "font-medium text-sm truncate",
                      isCurrentSong ? "text-cyan-400" : "text-white"
                    )}
                  >
                    {truncateString(decodeHtmlEntities(song.title), 25)}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {decodeHtmlEntities(song.singers)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  // Albums Section
  const renderAlbums = () => {
    if (!data?.albums?.results?.length) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          <MdAlbum className="text-purple-400" size={14} />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Albums
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {data.albums.results.slice(0, 4).map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 0.98 }}
              onClick={() => navigate(`/albums/${album.id}`)}
              className="cursor-pointer"
            >
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-white/10">
                <LazyLoadImage
                  effect="blur"
                  src={album.image?.[2]?.url || album.image?.[1]?.url}
                  alt={album.title}
                  className="w-full aspect-square rounded-lg object-cover mb-2"
                />
                <h3 className="text-sm font-medium text-white truncate">
                  {truncateString(decodeHtmlEntities(album.title), 18)}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {decodeHtmlEntities(album.artist)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Artists Section
  const renderArtists = () => {
    if (!data?.artists?.results?.length) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
          <IoMic className="text-pink-400" size={14} />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Artists
          </h2>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
          {data.artists.results.slice(0, 10).map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(`/artists/${artist.id}`)}
              className="flex-shrink-0 text-center cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 flex items-center justify-center overflow-hidden border border-white/10">
                {artist.image?.[1]?.url ? (
                  <LazyLoadImage
                    effect="blur"
                    src={artist.image[1].url}
                    alt={artist.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">🎤</span>
                )}
              </div>
              <p className="text-xs font-medium text-white mt-2 truncate w-16">
                {truncateString(artist.title, 12)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-20">
      {/* Search Header */}
      <div className="sticky top-[60px] z-10 bg-gradient-to-b from-[#0a0a0f] to-transparent backdrop-blur-sm py-3 mb-2">
        <div className="flex items-center gap-2">
          <FiSearch className="text-cyan-400" size={14} />
          <p className="text-xs text-gray-400">
            Results for "<span className="text-white font-medium">{search}</span>"
          </p>
        </div>
      </div>

      {/* Results Content */}
      <div className="space-y-4">
        {renderTopResult()}
        {renderSongs()}
        {renderAlbums()}
        {renderArtists()}
      </div>
    </div>
  );
};

export default MobileResults;