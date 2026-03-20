import { useLocation, useParams, useNavigate } from "react-router-dom";
import usePlayerStore from "@/store/use-player.js";
import useAddListStore from "@/store/use-addList.js";
import { useEffect, useState, useRef } from "react";
import useHover from "@/hooks/useHover.js";
import Wrapper from "@/pages/Wrapper.jsx";
import {
  decodeHtmlEntities,
  formatRelativeTime,
  formatTime,
  truncateString,
  formatPlayCount
} from "@/utils/MusicUtils.js";
import { IoMdRemoveCircle, IoMdAddCircle } from "react-icons/io";
import { 
  FiPlay, 
  FiPause, 
  FiMoreVertical, 
  FiShuffle,
  FiHeart,
  FiShare2
} from "react-icons/fi";
import { FaPlay, FaPause, FaHeart, FaRegHeart } from "react-icons/fa";
import { BiSolidPlaylist, BiPlay, BiPause } from "react-icons/bi";
import { MdPlaylistAdd, MdDelete, MdEdit } from "react-icons/md";
import { HiOutlineClock } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import tuneMateInstance from "@/service/api/api.js";
import UserPlayListSkeleton from "@/_components/skeletons/UserPlayListSkeleton.jsx";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import { useMediaQuery } from "usehooks-ts";
import { LazyLoadImage } from "react-lazy-load-image-component";
import useDropDownStore from "@/store/use-dropDownStore";
import UserPlayListModifyOptions from "@/_components/Options/UserPlayListModifyOptions";
import AddToPlaylist from "@/_components/Options/AddToPlaylist.jsx"; // ADD THIS IMPORT
import { cn } from "@/lib/utils";

const UserPlaylists = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    playSong,
    loadPlaylist,
    playlist,
    playSongByIndex,
    handleAudioPlay,
    setSongForPlayListDropdown,
    isPlaying,
    songId,
    AudioRef
  } = usePlayerStore();
  const { isAddToPlaylistVisible, showAddToPlaylist, component } =
    useAddListStore();
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [clickEvent, setClickEvent] = useState(null);
  const { hoveredItemId, handleMouseEnter, handleMouseLeave } = useHover();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const location = useLocation();
  const isRecommended = location.pathname.startsWith("/recommended");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { showDropDown, components, hideDropDown } = useDropDownStore();
  const wrapperRef = useRef(null);

  const {
    data: single_playlist,
    error,
    isLoading,
    mutate
  } = useSWR(
    id
      ? isRecommended
        ? ["recommended-playlist", id]
        : ["user-playlist", id]
      : null,
    () =>
      isRecommended
        ? tuneMateInstance.getRecommendedPlaylist(id)
        : tuneMateInstance.getUserPlaylist(id)
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 350);
    };

    const handleClickOutside = (event) => {
      if (
        components["USER_PLAYLIST_OPTIONS"] &&
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        hideDropDown("USER_PLAYLIST_OPTIONS");
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [components, hideDropDown]);

  // Handle audio play with user interaction check
  const handleSafeAudioPlay = async () => {
    try {
      if (AudioRef.current) {
        await handleAudioPlay();
      }
    } catch (error) {
      console.warn("Audio play requires user interaction:", error);
      // Show a toast or tooltip indicating user needs to interact first
    }
  };

  if (error) {
    return (
      <Wrapper>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-2xl font-bold text-white mb-2">Failed to Load</h2>
            <p className="text-gray-400">Couldn't load the playlist. Please try again.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      </Wrapper>
    );
  }

  const handlePlayWholeList = async () => {
    await loadPlaylist({
      id: id,
      type: location.pathname.startsWith("/recommended")
        ? "RECOMMENDED_PLAYLIST"
        : "USER_PLAYLIST",
      index: 0
    });
  };

  const handleShufflePlay = async () => {
    if (single_playlist?.songs?.length) {
      const randomIndex = Math.floor(Math.random() * single_playlist.songs.length);
      await loadPlaylist({
        id: id,
        type: location.pathname.startsWith("/recommended")
          ? "RECOMMENDED_PLAYLIST"
          : "USER_PLAYLIST",
        index: randomIndex
      });
    }
  };

  const handleShowLists = (e, song) => {
    e.stopPropagation();
    setClickEvent(e);
    setSelectedSongId(song.id);
    setSelectedSong(song);
    setSongForPlayListDropdown(song);
    showAddToPlaylist(song.id, "USER_LIST");
  };

  const handleLikePlaylist = async () => {
    setIsLiked(!isLiked);
    // API call to like/unlike playlist
  };

  const handleSharePlaylist = () => {
    if (navigator.share) {
      navigator.share({
        title: single_playlist?.name,
        text: `Check out this playlist: ${single_playlist?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const renderPlaylistDetails = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="relative px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
          {/* Playlist Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative group flex-shrink-0"
          >
            <div className="relative">
              {single_playlist?.image ? (
                <LazyLoadImage
                  effect="blur"
                  loading="lazy"
                  src={single_playlist.image}
                  alt={single_playlist.name}
                  className="rounded-2xl transform transition-all duration-500 group-hover:scale-105 w-48 h-48 md:w-56 md:h-56 object-cover shadow-2xl"
                />
              ) : (
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl">
                  <BiSolidPlaylist size={80} color="white" />
                </div>
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </motion.div>

          {/* Playlist Info */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                {isRecommended ? "Recommended" : "Your Playlist"}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              {truncateString(single_playlist?.name, 30)}
            </h1>
            
            {single_playlist?.description && (
              <p className="text-gray-400 text-sm md:text-base mb-3 max-w-2xl">
                {single_playlist.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="font-medium text-white">
                {single_playlist?.owner?.username || "Unknown Artist"}
              </span>
              <span>•</span>
              <span>
                {single_playlist?.songs?.length || 0} {single_playlist?.songs?.length === 1 ? "song" : "songs"}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mt-8 md:mt-10"
        >
          {/* Play Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayWholeList}
            className="group relative px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
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
            onClick={handleLikePlaylist}
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
            onClick={handleSharePlaylist}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          >
            <FiShare2 size={16} className="text-gray-400" />
          </motion.button>

          {/* Options Button */}
          {!isRecommended && (
            <div className="relative" ref={wrapperRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  components["USER_PLAYLIST_OPTIONS"]
                    ? hideDropDown("USER_PLAYLIST_OPTIONS")
                    : showDropDown("USER_PLAYLIST_OPTIONS");
                }}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <FiMoreVertical size={16} className="text-gray-400" />
              </motion.button>
              
              <AnimatePresence>
                {components["USER_PLAYLIST_OPTIONS"] && (
                  <UserPlayListModifyOptions single_playlist={single_playlist} />
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );

  const renderSongsList = () => (
    <div className="flex flex-col pb-10 md:pb-0">
      {/* Sticky Header on Scroll */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="sticky top-[70px] z-30 bg-gradient-to-r from-[#0a0a0f]/95 to-[#050507]/95 backdrop-blur-xl rounded-xl mb-4 border border-white/10"
          >
            <div className="flex items-center px-6 py-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayWholeList}
                className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
              >
                <FaPlay size={12} className="ml-0.5 text-white" />
              </motion.button>
              
              <div className="flex items-center ml-4">
                {single_playlist?.image ? (
                  <LazyLoadImage
                    effect="blur"
                    loading="lazy"
                    src={single_playlist.image}
                    alt={single_playlist.name}
                    className="rounded-lg w-10 h-10 object-cover"
                  />
                ) : (
                  <BiSolidPlaylist size={32} color="#59c2ef" />
                )}
                <h1 className="text-lg md:text-xl font-bold text-white ml-3">
                  {isMobile
                    ? truncateString(single_playlist?.name, 20)
                    : single_playlist?.name}
                </h1>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col mt-4 mb-5">
        {/* Song List Header */}
        <div className="grid grid-cols-10 gap-4 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm sticky top-[138px] left-0 z-30 mb-2 border border-white/10">
          <div className="col-span-1 flex justify-center items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">#</span>
          </div>
          <div className="col-span-3 flex items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Title</span>
          </div>
          <div className="hidden md:flex col-span-2 justify-center items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Album</span>
          </div>
          <div className="col-span-2 hidden md:flex justify-center items-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {isRecommended ? "Plays" : "Date Added"}
            </span>
          </div>
          <div className="col-span-1 hidden md:flex justify-center items-center"></div>
          <div className="col-span-1 hidden md:flex justify-center items-center gap-1">
            <HiOutlineClock size={12} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</span>
          </div>
        </div>

        {/* Songs List */}
        <AnimatePresence>
          {single_playlist?.songs?.length > 0 ? (
            single_playlist.songs.map((song, index) => {
              const isCurrentSong = songId === song.id;
              const isSongPlaying = isCurrentSong && isPlaying;
              
              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onMouseEnter={() => handleMouseEnter(song.id)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    "group grid grid-cols-10 gap-4 m-1 p-3 rounded-xl cursor-pointer transition-all duration-200",
                    isCurrentSong
                      ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
                      : "hover:bg-white/5"
                  )}
                  onClick={() =>
                    playlist.songs.length > 0 && playlist.id === single_playlist.id
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
                  <div className="md:col-span-3 col-span-9 flex items-center gap-3">
                    <LazyLoadImage
                      effect="blur"
                      loading="lazy"
                      src={song.image}
                      alt={song.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-medium truncate",
                        isCurrentSong ? "text-cyan-400" : "text-white"
                      )}>
                        {decodeHtmlEntities(song.name)}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {decodeHtmlEntities(song.artists)}
                      </p>
                    </div>
                  </div>

                  {/* Album Name */}
                  <div className="col-span-2 hidden md:flex justify-center items-center">
                    <p className={cn(
                      "text-sm truncate",
                      isCurrentSong ? "text-cyan-400" : "text-gray-300"
                    )}>
                      {truncateString(decodeHtmlEntities(song.album), 20)}
                    </p>
                  </div>

                  {/* Plays/Date */}
                  <div className="col-span-2 hidden md:flex justify-center items-center">
                    <p className={cn(
                      "text-sm",
                      isCurrentSong ? "text-cyan-400" : "text-gray-400"
                    )}>
                      {isRecommended
                        ? formatPlayCount(song.playCount)
                        : formatRelativeTime(song.addedAt)}
                    </p>
                  </div>

                  {/* Add to Playlist Button */}
                  <div className="hidden md:flex justify-center items-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleShowLists(e, song)}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
                        hoveredItemId === song.id
                          ? "opacity-100 bg-white/10"
                          : "opacity-0 pointer-events-none"
                      )}
                      title="Add to playlist"
                    >
                      <MdPlaylistAdd size={18} className="text-cyan-400" />
                    </motion.button>
                  </div>

                  {/* Duration */}
                  <div className="col-span-1 hidden md:flex justify-center items-center">
                    <p className={cn(
                      "text-sm",
                      isCurrentSong ? "text-cyan-400" : "text-gray-400"
                    )}>
                      {formatTime(song.duration)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-64 text-center"
            >
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-white mb-2">No songs yet</h3>
              <p className="text-gray-400">This playlist is empty. Add some songs to get started!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add to Playlist Modal */}
      <AnimatePresence>
        {isAddToPlaylistVisible && selectedSongId && component === "USER_LIST" && (
          <AddToPlaylist
            clickEvent={clickEvent}
            component={"USER_LIST"}
            onPlaylistUpdate={mutate}
          />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Wrapper>
      <BlockWrapper margin={"mb-8"}>
        {isLoading ? (
          <UserPlayListSkeleton count={10} />
        ) : (
          <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
            {renderPlaylistDetails()}
            {renderSongsList()}
          </div>
        )}
      </BlockWrapper>
    </Wrapper>
  );
};

export default UserPlaylists;