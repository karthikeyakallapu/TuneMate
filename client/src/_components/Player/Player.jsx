import { HiUsers } from "react-icons/hi";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
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
  } = usePlayerStore();

  const { isAuthenticated, userId } = useAuthStore();

  const {
    connectWebSocket,
    closeWebSocket,
    socket,
    setConnectionStatus,
    setUserDetails,
  } = useWebSocketStore();

  const { isUserSyncVisible, showUserSync, hideUserSync } = useUserSyncStore();
  const { isNotifierVisible, showNotifier } = useNotifierStore();
  const [incomingMessage, setIncomingMessage] = useState("");
  const [isIncomingMessageVisible, setIsIncomingMessageVisible] =
    useState(false);
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

          case "CONNECTION_DECLINED":
            Toast({
              type: "error",
              message: `${data.payload.declinedBy} declined to connect`,
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
                message: `${data.payload.username} accepted`,
              });
            } catch (error) {
              console.error("Error handling connection acceptance:", error);
              Toast({
                type: "error",
                message:
                  "Failed to process connection acceptance. Please try again.",
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

          case "CLOSE_CONNECTION":
            setUserDetails(null);
            await tuneMateInstance.updateSyncState({
              userId: "",
              username: "",
            });
            hideUserSync();
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
    if (socket) {
      socket.onmessage = handleSocketMessage;
      socket.onerror = () => console.error("WebSocket connection error.");
      socket.onclose = () => console.info("WebSocket connection closed.");
    }
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

  // ----- JSX -----
  return (
    <>
      {isMobile ? (
        <MobileController />
      ) : (
        <div className="fixed bottom-0 left-0 w-full p-[0.6rem] rounded text-amber-50 z-30 player-background">
          <div className="flex justify-between items-center">
            {/* MUSIC INFO */}
            <div>
              <MusicInfo song={song} />
            </div>

            {/* PLAYER CONTROLS */}
            <div className="flex justify-center items-center">
              <audio
                src={song?.downloadUrl[4]?.url}
                autoPlay
                ref={AudioRef}
              ></audio>

              <div className="mr-4">
                <MusicControls />
              </div>

              {/* MUSIC SEEK BAR */}
              <div className="ml-4">
                <MusicSeek />
              </div>
            </div>

            {/* USER SYNC AND VOLUME */}
            <div className="flex justify-end items-center relative">
              <div className="mr-5">
                <HiUsers size={22} cursor={"pointer"} onClick={showUserSync} />
                {isUserSyncVisible && UserSyncMemoized}
              </div>
              {isNotifierVisible && UserNotifierMemoized}
              <div>
                <Volume />
              </div>
            </div>
          </div>
        </div>
      )}
      <FloatingMessage
        message={incomingMessage}
        isVisible={isIncomingMessageVisible}
      />
    </>
  );
};

export default Player;
