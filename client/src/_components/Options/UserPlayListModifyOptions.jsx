import { motion } from "framer-motion";
import tuneMateInstance from "@/service/api/api";
import { mutate as globalMutate } from "swr";
import { useNavigate } from "react-router-dom";
import Toast from "@/utils/Toasts/Toast";
import useModalStore from "@/store/use-modal-store";
import usePlayerStore from "@/store/use-player";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useState } from "react";

const UserPlayListModifyOptions = ({ single_playlist, onClose }) => {
  const navigate = useNavigate();
  const { openModal } = useModalStore();
  const { setPlaylistForEdit } = usePlayerStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePlaylist = async () => {
    // Custom confirmation modal instead of browser confirm
    const userConfirmed = window.confirm(
      `Are you sure you want to delete "${single_playlist.name}"?\n\nThis action cannot be undone.`
    );
    
    if (userConfirmed) {
      setIsDeleting(true);
      try {
        await tuneMateInstance.deleteUserPlaylist(single_playlist.id);
        
        // Use global mutate to update the sidebar playlists
        await globalMutate("user-playlists");
        
        Toast({
          type: "success",
          message: `"${single_playlist.name}" has been deleted successfully`
        });
        
        // Close the options menu
        if (onClose) onClose();
        
        // Navigate to home if we're currently on the deleted playlist page
        if (window.location.pathname.includes(`/playlist/${single_playlist.id}`)) {
          navigate("/");
        }
      } catch (error) {
        Toast({
          type: "error",
          message: error.response?.data?.message || "Failed to delete playlist. Please try again."
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditPlaylist = () => {
    setPlaylistForEdit({
      name: single_playlist.name,
      id: single_playlist.id,
      description: single_playlist.description,
      image: single_playlist.image
    });
    openModal("EDIT_PLAYLIST");
    if (onClose) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative z-50"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b] rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[180px]">
     
        {/* Options */}
        <div className="py-1">
          {/* Edit Button */}
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEditPlaylist}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group"
          >
            <FiEdit2 size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Edit Details</span>
          </motion.button>

          {/* Delete Button */}
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDeletePlaylist}
            disabled={isDeleting}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <FiTrash2 size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                <span>Delete Playlist</span>
              </>
            )}
          </motion.button>
        </div>
 
      </div>
    </motion.div>
  );
};

export default UserPlayListModifyOptions;
