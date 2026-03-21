import useSearchStore from "@/store/use-search.js";
import { useDebounce } from "@/hooks/useDebounce.js";
import MusicServiceInstance from "@/service/api/music_apis.js";
import useSWR from "swr";
import usePlayerStore from "@/store/use-player.js";
import { decodeHtmlEntities, truncateString } from "@/utils/MusicUtils.js";
import { Link } from "react-router-dom";
import Wrapper from "@/pages/Wrapper.jsx";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaPause } from "react-icons/fa";
import { 
  FiMusic, 
  FiUser, 
  FiList, 
  FiSearch,
  FiHeadphones,
  FiTrendingUp
} from "react-icons/fi";
import { MdAlbum } from "react-icons/md";
import { IoMic } from "react-icons/io5";
import { useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import useHover from "@/hooks/useHover.js";

const SearchResults = () => {
  const { search } = useSearchStore();
  const { playSong, isPlaying, songId } = usePlayerStore();
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();
  const debouncedSearch = useDebounce(search, 400);

  const { data, error, isLoading } = useSWR(
    debouncedSearch ? ["search", debouncedSearch] : null,
    () => MusicServiceInstance.getSearchResults(debouncedSearch)
  );

  // Loading State
  if (isLoading) {
    return (
      <Wrapper>
        <BlockWrapper>
          <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiSearch className="text-cyan-400 animate-pulse" size={20} />
                </div>
              </div>
              <p className="mt-4 text-gray-400 nunito-sans-bold">Searching for "{debouncedSearch}"...</p>
            </div>
          </div>
        </BlockWrapper>
      </Wrapper>
    );
  }

  // Error State
  if (error) {
    return (
      <Wrapper>
        <BlockWrapper>
          <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-2xl font-bold text-white mb-2">Search Failed</h2>
              <p className="text-gray-400">Couldn't fetch results. Please try again.</p>
            </motion.div>
          </div>
        </BlockWrapper>
      </Wrapper>
    );
  }

  // No Results State
  if (!data?.songs?.results?.length && !data?.albums?.results?.length && 
      !data?.artists?.results?.length && !data?.playlists?.results?.length) {
    return (
      <Wrapper>
        <BlockWrapper>
          <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <FiSearch className="text-cyan-400" size={32} />
              </div>
              <h2 className="jaro-head text-3xl text-white mb-2">No Results Found</h2>
              <p className="text-gray-400 nunito-sans-bold">
                We couldn't find anything for "{debouncedSearch}"
              </p>
              <p className="text-gray-500 text-sm mt-2">Try searching with different keywords</p>
            </motion.div>
          </div>
        </BlockWrapper>
      </Wrapper>
    );
  }

  const topResult = data?.topQuery?.results[0];

  const renderTopResult = () => {
    if (!topResult) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
          <h1 className="jaro-head text-3xl text-white">Top Result</h1>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="group relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-white/10 cursor-pointer"
          onClick={() => topResult.type === "song" && playSong(topResult.id)}
        >
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
          
          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
          </div>
          
          <div className="relative p-6">
            <div className="flex items-center gap-6">
              {/* Image with Glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                <LazyLoadImage
                  src={topResult.image[1].url}
                  alt=""
                  effect="blur"
                  className="relative h-32 w-32 md:h-40 md:w-40 rounded-2xl object-cover shadow-2xl"
                />
                
                {/* Play Button Overlay */}
                {topResult.type === "song" && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playSong(topResult.id);
                    }}
                    className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                  >
                    <FaPlay size={14} className="ml-0.5 text-white" />
                  </motion.button>
                )}
              </div>
              
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm mb-3">
                  <FiTrendingUp className="text-cyan-400" size={12} />
                  <span className="text-xs font-medium text-cyan-400 uppercase">
                    {topResult.type}
                  </span>
                </div>
                
                <h2 className="jaro-head text-2xl md:text-3xl text-white mb-2">
                  {truncateString(decodeHtmlEntities(topResult.title), 25)}
                </h2>
                
                {topResult.type === "song" && (
                  <p className="nunito-sans-bold text-gray-300 text-sm">
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

  const renderSongs = () => {
    if (!data?.songs?.results.length) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col flex-1"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
          <FiMusic className="text-cyan-400" size={20} />
          <h1 className="jaro-head text-3xl text-white">Songs</h1>
        </div>
        
        <div className="relative bg-gradient-to-br from-[#1f1f23]/50 to-[#18181b]/50 rounded-2xl border border-white/10 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5" />
          
          <div className="relative p-4 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {data.songs.results.slice(0, 5).map((song, index) => {
              const isCurrentPlaying = songId === song.id && isPlaying;
              
              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  onMouseEnter={() => handleMouseEnter(song.id)}
                  onMouseLeave={handleMouseLeave}
                  className="group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-all duration-200"
                  onClick={() => playSong(song.id)}
                >
                  {/* Index/Play Button */}
                  <div className="w-8 text-center">
                    {hoveredItemId === song.id || isCurrentPlaying ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-cyan-400"
                      >
                        {isCurrentPlaying ? (
                          <FaPause size={12} />
                        ) : (
                          <FaPlay size={12} className="ml-0.5" />
                        )}
                      </motion.div>
                    ) : (
                      <span className="text-sm text-gray-500 font-mono">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Song Image */}
                  <LazyLoadImage
                    src={song.image[1].url}
                    alt=""
                    effect="blur"
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  
                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="nunito-sans-bold text-white truncate">
                      {truncateString(decodeHtmlEntities(song.title), 40)}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {truncateString(decodeHtmlEntities(song.singers), 35)}
                    </p>
                  </div>
                  
                  {/* Duration Badge */}
                  <div className="text-xs text-gray-500">
                    {song.duration || "3:45"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderAlbums = () => {
    if (!data?.albums?.results.length) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
          <MdAlbum className="text-purple-400" size={22} />
          <h1 className="jaro-head text-3xl text-white">Albums</h1>
        </div>
        
        <div className="relative bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 rounded-2xl border border-white/10 overflow-hidden p-6">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
          
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.albums.results.slice(0, 10).map((album, index) => (
                <Link to={`/albums/${album.id}`} key={album.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -8, scale: 1.05 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <LazyLoadImage
                        src={album.image[1].url}
                        alt=""
                        effect="blur"
                        className="w-full aspect-square object-cover transform transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Hover Glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl" />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h3 className="nunito-sans-bold text-white text-sm truncate group-hover:text-purple-400 transition-colors">
                        {truncateString(decodeHtmlEntities(album.title), 20)}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {album.year} • {truncateString(decodeHtmlEntities(album.artist), 15)}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderArtists = () => {
    if (!data?.artists?.results.length) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full" />
          <IoMic className="text-pink-400" size={22} />
          <h1 className="jaro-head text-3xl text-white">Artists</h1>
        </div>
        
        <div className="relative bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-red-500/10 rounded-2xl border border-white/10 overflow-hidden p-6">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-rose-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent" />
          
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.artists.results.slice(0, 10).map((artist, index) => (
                <Link to={`/artists/${artist.id}`} key={artist.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -8, scale: 1.05 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-pink-500/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                      <LazyLoadImage
                        src={artist.image[1].url}
                        alt=""
                        effect="blur"
                        className="w-full aspect-square object-cover rounded-full transform transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Hover Glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full blur-xl" />
                      </div>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <h3 className="nunito-sans-bold text-white text-sm truncate group-hover:text-pink-400 transition-colors">
                        {truncateString(decodeHtmlEntities(artist.title), 20)}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {truncateString(decodeHtmlEntities(artist.description), 20)}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderPlaylists = () => {
    if (!data?.playlists?.results.length) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
          <FiList className="text-green-400" size={22} />
          <h1 className="jaro-head text-3xl text-white">Playlists</h1>
        </div>
        
        <div className="relative bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-2xl border border-white/10 overflow-hidden p-6">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent" />
          
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.playlists.results.slice(0, 10).map((playlist, index) => (
                <Link to={`/playlists/${playlist.id}`} key={playlist.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -8, scale: 1.05 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-green-500/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <LazyLoadImage
                        src={playlist.image[1].url}
                        alt=""
                        effect="blur"
                        className="w-full aspect-square object-cover transform transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Hover Glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-xl" />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h3 className="nunito-sans-bold text-white text-sm truncate group-hover:text-green-400 transition-colors">
                        {truncateString(decodeHtmlEntities(playlist.title), 20)}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {truncateString(decodeHtmlEntities(playlist.language), 15)}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Wrapper>
      <BlockWrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
          {/* Search Header */}
          <div className="sticky top-[70px] z-10 bg-gradient-to-b from-[#0a0a0f] to-transparent backdrop-blur-sm px-4 py-4 mb-4">
            <div className="flex items-center gap-2">
              <FiSearch className="text-cyan-400" size={20} />
              <p className="text-gray-400 text-sm">
                Showing results for "<span className="text-white font-semibold">{debouncedSearch}</span>"
              </p>
            </div>
          </div>

          <div className="px-4">
            {/* Top Result and Songs Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderTopResult()}
              {renderSongs()}
            </div>
            
            {/* Other Results with Stunning Backgrounds */}
            {renderAlbums()}
            {renderArtists()}
            {renderPlaylists()}
          </div>
        </div>
      </BlockWrapper>
    </Wrapper>
  );
};

export default SearchResults;