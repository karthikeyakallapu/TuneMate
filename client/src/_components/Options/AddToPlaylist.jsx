/* eslint-disable react/prop-types */
import { FiSearch, FiX } from "react-icons/fi";
import { IoMdAdd, IoMdAddCircle, IoMdCheckmark } from "react-icons/io";
import { BiSolidPlaylist, BiPlus, BiCheck } from "react-icons/bi";
import { FaCheckCircle, FaHeart, FaRegHeart } from "react-icons/fa";
import { MdFavorite, MdPlaylistAdd, MdClose } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useAddToPlaylist from "@/hooks/useAddToPlayList.js";
import useAddListStore from "@/store/use-addList.js";
import FavImg from "@/assets/images/favorites.png";
import tuneMateInstance from "@/service/api/api.js";
import Toast from "@/utils/Toasts/Toast.js";
import { mutate } from "swr";
import usePlayerStore from "@/store/use-player.js";
import { useEffect, useRef, useState, useLayoutEffect } from "react";

const AddToPlaylist = ({ clickEvent, component, onPlaylistUpdate }) => {
  const { Favorites, getFavorites } = usePlayerStore();
  const { hideAddToPlaylist, songId } = useAddListStore();
  const addMenuRef = useRef(null);
  const [position, setPosition] = useState("bottom-4");
  const [searchPlaylist, setSearchPlaylist] = useState("");
  const [hoveredPlaylist, setHoveredPlaylist] = useState(null);

  const {
    playlists,
    error,
    isLoading,
    playlistName,
    setPlaylistName,
    showCreatePlaylist,
    handleToggleCreatePlaylist,
    selectedPlaylists,
    togglePlaylistSelection,
    handleCreatePlaylist,
    setShowCreatePlaylist,
    handleSaveChanges,
  } = useAddToPlaylist();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        hideAddToPlaylist();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [addMenuRef, hideAddToPlaylist]);

  useLayoutEffect(() => {
    const calculatePosition = () => {
      if (addMenuRef.current && clickEvent) {
        const rect = addMenuRef.current.getBoundingClientRect();
        const clickY = clickEvent.clientY;
        const spaceAbove = clickY;
        const spaceBelow = window.innerHeight - clickY;
        setPosition(
          spaceBelow < rect.height && spaceAbove > spaceBelow
            ? "bottom-2"
            : "top-2",
        );
      }
    };
    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    return () => window.removeEventListener("resize", calculatePosition);
  }, [clickEvent]);

  const handleFavorite = async (song_id) => {
    try {
      const response = await tuneMateInstance.ManageSongInFavorites(song_id);
      Toast({ type: response.type, message: response.message, duration: 400 });
      await getFavorites();
      mutate("favorites");
    } catch (err) {
      console.error(
        `Error managing favorite status for song_id: ${song_id}`,
        err,
      );
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await handleSaveChanges();
      hideAddToPlaylist();
      if (onPlaylistUpdate) {
        onPlaylistUpdate();
      }
    } catch (err) {
      console.error("Error saving changes:", err);
      Toast({
        type: "error",
        message: "Failed to add to playlist",
        duration: 2000,
      });
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    hideAddToPlaylist();
  };

  const handleCreatePlaylistClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await handleCreatePlaylist();
  };

  const handleCreatePlaylistCancel = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowCreatePlaylist(false);
    setPlaylistName("");
  };

  const handleToggleCreate = (e) => {
    e.stopPropagation();
    e.preventDefault();
    handleToggleCreatePlaylist();
  };

  const handlePlaylistToggle = (e, playlistId) => {
    e.stopPropagation();
    e.preventDefault();
    togglePlaylistSelection(playlistId);
  };

  const handleFavoriteClick = (e, song_id) => {
    e.stopPropagation();
    e.preventDefault();
    handleFavorite(song_id);
  };

  const isFavorite = Favorites.includes(songId);
  const filteredPlaylists = playlists?.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchPlaylist.toLowerCase()),
  );

  if (isLoading) {
    return (
      <motion.div
        ref={addMenuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-2xl w-full md:w-72 z-50 bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-[#2D2E35] shadow-2xl overflow-hidden ${
          position
        } ${
          component === "USER_LIST"
            ? "absolute right-0"
            : "absolute left-0 md:left-1"
        }`}
      >
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading playlists...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        ref={addMenuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-2xl w-full md:w-72 z-50 bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-red-500/30 shadow-2xl overflow-hidden ${
          position
        } ${
          component === "USER_LIST"
            ? "absolute right-0"
            : "absolute left-0 md:left-1"
        }`}
      >
        <div className="p-6 text-center">
          <p className="text-red-400 text-sm">Failed to load playlists</p>
          <Button
            variant="ghost"
            className="mt-3 text-xs"
            onClick={handleCancel}
          >
            Close
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={addMenuRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
      className={`rounded-2xl w-full md:w-80 z-50 bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-[#2D2E35] shadow-2xl overflow-hidden ${
        position
      } ${
        component === "USER_LIST"
          ? "absolute right-0"
          : "absolute left-0 md:left-1"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {/* Header with gradient bar */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
        <div className="p-4 border-b border-[#2D2E35]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MdPlaylistAdd className="text-cyan-400" size={20} />
              <h2 className="font-semibold text-white">Add to Playlist</h2>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <MdClose size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Search Input */}
        <div className="relative mb-4">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <Input
            className="bg-[#222328] border border-[#2D2E35] rounded-xl h-10 pl-9 text-sm text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            placeholder="Search playlists..."
            value={searchPlaylist}
            onChange={(e) => setSearchPlaylist(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          {searchPlaylist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchPlaylist("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Create Playlist Section */}
        <AnimatePresence mode="wait">
          {showCreatePlaylist ? (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-[#222328] rounded-xl p-3 border border-[#2D2E35]">
                <Input
                  className="bg-transparent border-none h-10 text-sm text-white placeholder:text-gray-500 focus:outline-none p-0"
                  placeholder="Playlist name..."
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-gray-400 hover:text-white"
                    onClick={handleCreatePlaylistCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
                    onClick={handleCreatePlaylistClick}
                    disabled={!playlistName.trim()}
                  >
                    <BiPlus className="mr-1" size={14} />
                    Create
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="create-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleToggleCreate}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#222328] transition-all duration-200 group mb-2 border border-dashed border-[#2D2E35] hover:border-cyan-500/50"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BiPlus className="text-cyan-400" size={18} />
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white">
                Create New Playlist
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Playlists List */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1">
          {/* Favorites Section */}
          <div
            className="flex items-center justify-between p-3 rounded-xl hover:bg-[#222328] transition-all duration-200 cursor-pointer group"
            onMouseEnter={() => setHoveredPlaylist("favorites")}
            onMouseLeave={() => setHoveredPlaylist(null)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={FavImg}
                  alt="Favorites"
                  className="h-10 w-10 rounded-xl object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-xl" />
              </div>
              <div>
                <h3 className="font-medium text-white">Favorites</h3>
                <p className="text-xs text-gray-400">Your liked songs</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleFavoriteClick(e, songId)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isFavorite ? (
                <FaHeart className="text-pink-500" size={18} />
              ) : (
                <FaRegHeart
                  className="text-gray-400 group-hover:text-pink-500"
                  size={18}
                />
              )}
            </motion.button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#2D2E35] to-transparent my-2" />

          {/* Playlist Items */}
          <AnimatePresence>
            {filteredPlaylists?.map((playlist, index) => {
              const isSelected = selectedPlaylists.includes(playlist.id);
              return (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onMouseEnter={() => setHoveredPlaylist(playlist.id)}
                  onMouseLeave={() => setHoveredPlaylist(null)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#222328] transition-all duration-200 cursor-pointer group"
                  onClick={(e) => handlePlaylistToggle(e, playlist.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
                          : "bg-[#2D2E35] group-hover:bg-[#3D3E45]"
                      }`}
                    >
                      {playlist.image ? (
                        <img
                          src={playlist.image}
                          alt={playlist.name}
                          className="h-10 w-10 rounded-xl object-cover"
                        />
                      ) : (
                        <BiSolidPlaylist
                          size={20}
                          className={
                            isSelected ? "text-cyan-400" : "text-gray-400"
                          }
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">
                        {playlist.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {playlist.songs.length || 0} songs
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "hover:bg-white/10 text-gray-400"
                    }`}
                  >
                    {isSelected ? (
                      <IoMdCheckmark size={18} />
                    ) : (
                      <IoMdAddCircle size={18} />
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredPlaylists?.length === 0 && searchPlaylist && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-gray-400 text-sm">No playlists found</p>
              <p className="text-xs text-gray-500 mt-1">
                Try a different search
              </p>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#2D2E35]">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-white/10"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 px-4"
            onClick={handleSave}
            disabled={selectedPlaylists.length === 0 && !isFavorite}
          >
            <BiCheck className="mr-1" size={16} />
            Save
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default AddToPlaylist;
