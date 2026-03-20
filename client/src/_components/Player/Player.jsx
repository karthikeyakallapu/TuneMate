import { HiUsers, HiOutlineMusicNote, HiOutlineVolumeUp } from "react-icons/hi";
import {
  FiPlay,
  FiPause,
  FiSkipForward,
  FiSkipBack,
  FiRadio,
  FiHeadphones,
} from "react-icons/fi";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MusicSeek from "@/_components/Player/MusicSeek.jsx";
import Volume from "@/_components/Player/Volume.jsx";
import MusicInfo from "@/_components/Player/MusicInfo.jsx";
import UserSync from "../sync/UserSync";
import UserNotifier from "../sync/UserNotifier";
import { useMediaQuery } from "usehooks-ts";
import usePlayerStore from "@/store/use-player.js";
import useAuthStore from "@/store/use-auth.js";
import useWebSocketStore from "@/store/use-socket";
import useUserSyncStore from "@/store/use-userSync";
import useNotifierStore from "@/store/use-Notifier";
import MobileController from "./mobile/MobileController";
import Toast from "@/utils/Toasts/Toast";
import tuneMateInstance from "@/service/api/api";
import MusicControls from "./MusicControls";
import FloatingMessage from "./FloatingMessage";

const Player = () => {
  const {
    song,
    getFavorites,
    loadPlayerState,
    AudioRef,
    handleAudioPlay,
    playSong,
    setMusicSeekTime,
    isPlaying,
  } = usePlayerStore();

  const { isAuthenticated, userId } = useAuthStore();

  const {
    connectWebSocket,
    closeWebSocket,
    socket,
    setConnectionStatus,
    setUserDetails,
    setPendingRoomJoinRequest,
    connectionStatus,
    roomId,
    setRoomId,
  } = useWebSocketStore();

  const { isUserSyncVisible, showUserSync, hideUserSync } = useUserSyncStore();
  const { isNotifierVisible, showNotifier } = useNotifierStore();
  const [incomingMessage, setIncomingMessage] = useState("");
  const [isIncomingMessageVisible, setIsIncomingMessageVisible] =
    useState(false);
  const [isHoveringSync, setIsHoveringSync] = useState(false);
  const floatingMessageTimeoutRef = useRef(null);

  // ----- Initialization -----
  const initializePlayerState = useCallback(async () => {
    try {
      await loadPlayerState();
      await getFavorites();
    } catch (error) {
      console.error("Error loading player state: ", error);
    }
  }, [loadPlayerState, getFavorites]);

  const showIncomingFloatingMessage = useCallback((chat) => {
    const incomingChat = typeof chat === "string" ? chat.trim() : "";
    if (!incomingChat) return;

    setIncomingMessage(incomingChat);
    setIsIncomingMessageVisible(true);

    if (floatingMessageTimeoutRef.current) {
      clearTimeout(floatingMessageTimeoutRef.current);
    }

    floatingMessageTimeoutRef.current = setTimeout(() => {
      setIsIncomingMessageVisible(false);
    }, 3500);
  }, []);

  // Memoize the WebSocket message handler to avoid unnecessary re-creations
  const handleSocketMessage = useCallback(
    async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "CONNECTION_REQUEST":
            setUserDetails(data.payload);
            hideUserSync();
            showNotifier();
            break;

          case "ROOM_JOIN_REQUEST":
            setPendingRoomJoinRequest(data.payload);
            hideUserSync();
            showNotifier();
            break;

          case "CONNECTION_DECLINED":
            Toast({
              type: "error",
              message: `${data.payload.declinedBy} declined to connect`,
            });
            break;

          case "ROOM_JOIN_REQUEST_SENT":
            Toast({
              type: "info",
              message:
                data.payload?.message ||
                "Join request sent. Waiting for host approval.",
            });
            break;

          case "ROOM_JOIN_DECLINED":
            Toast({
              type: "error",
              message:
                data.payload?.message || "Host declined your room join request",
            });
            break;

          case "INVALID_ACTION":
            Toast({
              type: "error",
              message: `${data.payload.message}`,
            });
            break;

          case "CONNECTION_ACCEPTED":
            try {
              setUserDetails(data.payload);
              await tuneMateInstance.updateSyncState(data.payload);
              setConnectionStatus(true);
              Toast({
                type: "success",
                message: `Connected with ${data.payload.username}!`,
              });
            } catch (error) {
              console.error("Error handling connection acceptance:", error);
              Toast({
                type: "error",
                message: "Failed to process connection. Please try again.",
              });
            }
            break;

          case "PLAY_SONG":
            await playSong(data.payload.songId, false);
            break;

          case "HANDLE_SONG_PLAY":
            await handleAudioPlay(false);
            break;

          case "SEEK":
            setMusicSeekTime(data.payload.musicSeekTime, false);
            break;

          case "RECEIVE_CHAT":
            showIncomingFloatingMessage(data.payload.chat);
            break;

          case "ROOM_CREATED":
          case "ROOM_JOINED":
            if (data.payload?.roomId) {
              setRoomId(data.payload.roomId);
            }
            break;

          case "ROOM_LEFT":
            setRoomId(null);
            setPendingRoomJoinRequest(null);
            break;

          case "REMOVED_FROM_ROOM":
            setRoomId(null);
            setPendingRoomJoinRequest(null);
            Toast({
              type: "error",
              message:
                data.payload?.message || "You were removed from the room",
            });
            break;

          case "ROOM_MEMBER_REMOVED":
            Toast({
              type: "info",
              message: data.payload?.username
                ? `${data.payload.username} was removed from the room`
                : "Member removed from the room",
            });
            break;

          case "ROOM_CLOSED":
            setRoomId(null);
            setPendingRoomJoinRequest(null);
            Toast({
              type: "error",
              message: data.payload?.message || "Room has been closed",
            });
            break;

          case "ERROR":
            if (data.payload?.message === "Room not found") {
              setRoomId(null);
              setPendingRoomJoinRequest(null);
            }
            break;

          case "CLOSE_CONNECTION":
            setUserDetails(null);
            await tuneMateInstance.updateSyncState({
              userId: "",
              username: "",
            });
            hideUserSync();
            Toast({
              type: "success",
              message: "Connection closed",
            });
            break;

          default:
            console.warn("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    },
    [
      setUserDetails,
      setPendingRoomJoinRequest,
      setRoomId,
      hideUserSync,
      showNotifier,
      setConnectionStatus,
      setMusicSeekTime,
      playSong,
      handleAudioPlay,
      showIncomingFloatingMessage,
    ],
  );

  // Initialize player state if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializePlayerState();
    }
  }, [isAuthenticated, initializePlayerState]);

  // Connect WebSocket if userId exists
  useEffect(() => {
    if (userId) {
      connectWebSocket(userId);
    }
    return () => closeWebSocket();
  }, [userId, connectWebSocket, closeWebSocket]);

  // Set up WebSocket message handler once the socket is available
  useEffect(() => {
    if (!socket) return;

    const onMessage = (event) => handleSocketMessage(event);
    const onError = () => console.error("WebSocket connection error.");
    const onClose = () => console.info("WebSocket connection closed.");

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);

    return () => {
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
    };
  }, [socket, handleSocketMessage]);

  // Handle audio play state change
  useEffect(() => {
    handleAudioPlay();
  }, [handleAudioPlay]);

  useEffect(() => {
    return () => {
      if (floatingMessageTimeoutRef.current) {
        clearTimeout(floatingMessageTimeoutRef.current);
      }
    };
  }, []);

  const UserSyncMemoized = useMemo(() => <UserSync />, [isUserSyncVisible]);
  const UserNotifierMemoized = useMemo(
    () => <UserNotifier />,
    [isNotifierVisible],
  );

  const isMobile = useMediaQuery("(max-width: 767px)");
  const hasActiveSync = connectionStatus || !!roomId;

  // ----- JSX -----
  if (isMobile) {
    return (
      <>
        <MobileController />
        <FloatingMessage
          message={incomingMessage}
          isVisible={isIncomingMessageVisible}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 right-4 rounded-2xl bg-gradient-to-r from-[#0a0a0f]/95 via-[#121218]/95 to-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 shadow-2xl z-30"
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* MUSIC INFO with animation */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex-shrink-0 min-w-[240px]"
            >
              <MusicInfo song={song} />
            </motion.div>

            {/* PLAYER CONTROLS - CENTER SECTION */}
            <div className="flex-1 flex flex-col items-center gap-2">
              {/* Audio element */}
              <audio
                src={song?.downloadUrl?.[4]?.url}
                autoPlay
                ref={AudioRef}
                className="hidden"
              />

              {/* Main Controls */}
              <div className="flex items-center gap-4">
                <MusicControls />
              </div>

              {/* SEEK BAR */}
              <div className="w-full max-w-md">
                <MusicSeek />
              </div>
            </div>

            {/* RIGHT SECTION - User Sync & Volume */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Connection Status Indicator */}
              {hasActiveSync && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/30"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">
                    {roomId ? "In Room" : "Connected"}
                  </span>
                </motion.div>
              )}

              {/* User Sync Button */}
              <motion.div
                className="relative"
                onHoverStart={() => setIsHoveringSync(true)}
                onHoverEnd={() => setIsHoveringSync(false)}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={showUserSync}
                  className={` p-2.5 rounded-xl transition-all duration-300 ${
                    hasActiveSync
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50"
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <HiUsers
                    size={22}
                    className={`transition-colors duration-300 ${
                      hasActiveSync
                        ? "text-cyan-400"
                        : "text-gray-400 hover:text-white"
                    }`}
                  />

                  {/* Connection badge */}
                  {hasActiveSync && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f]"
                    />
                  )}
                </motion.button>

                {/* Tooltip */}
                <AnimatePresence>
                  {isHoveringSync && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 backdrop-blur-sm rounded-lg text-xs text-white whitespace-nowrap border border-white/10"
                    >
                      {roomId
                        ? "Room Active"
                        : connectionStatus
                          ? "Connected Users"
                          : "Sync with Friends"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Volume Control */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Volume />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        {/* Modals */}
        <AnimatePresence>
          {isUserSyncVisible && UserSyncMemoized}
          {isNotifierVisible && UserNotifierMemoized}
        </AnimatePresence>
      </motion.div>

      {/* Floating Message */}
      <FloatingMessage
        message={incomingMessage}
        isVisible={isIncomingMessageVisible}
      />
    </>
  );
};

export default Player;
