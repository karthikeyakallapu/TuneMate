import { BiUserPlus, BiArrowBack } from "react-icons/bi";
import useAuthStore from "@/store/use-auth";
import { MdClose } from "react-icons/md";
import { useState, useEffect, useRef } from "react";
import useWebSocketStore from "@/store/use-socket";
import useUserSyncStore from "@/store/use-userSync";
import usePlayerStore from "@/store/use-player";
import { truncateString } from "@/utils/MusicUtils.js";
import { Button } from "@/components/ui/button";
import tuneMateInstance from "@/service/api/api";
import { motion } from "framer-motion";
import ChatMessageForm from "@/_components/Player/ChatMessageForm";
import Toast from "@/utils/Toasts/Toast";
import {
  Loader2,
  Users,
  UserPlus,
  Copy,
  Check,
  Send,
  LogIn,
  Crown,
  LogOut,
  UserX,
} from "lucide-react";
import { useCallback } from "react";

const UserSync = () => {
  const { userSyncKey, username, userId } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [activeMode, setActiveMode] = useState(null); // 'connect', 'create-room', or 'join-room'
  const [chatMessage, setChatMessage] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [joinRoomId, setJoinRoomId] = useState("");
  const {
    connectId,
    setConnectId,
    socket,
    userDetails,
    connectionStatus,
    roomId,
    roomMembers,
    roomHostId,
    setRoomId,
  } = useWebSocketStore();
  const { sendMessage, song, isPlaying, AudioRef } = usePlayerStore();
  const userSyncRef = useRef(null);
  const { hideUserSync } = useUserSyncStore();

  const handleCopy = async (e) => {
    e.stopPropagation();
    setCopied(true);
    const textToCopy = userSyncKey;
    await navigator.clipboard.writeText(textToCopy);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userSyncRef.current && !userSyncRef.current.contains(event.target)) {
        hideUserSync();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hideUserSync]);

  // Handle WebSocket messages
  const handleSocketMessage = useCallback(async (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "ROOM_CREATED":
          if (data.payload?.roomId) {
            setActiveMode(null);
            setIsCreatingRoom(false);

            Toast({
              type: "success",
              message: `Room created! Room ID: ${data.payload.roomId}`,
            });
          }
          break;

        case "ROOM_JOINED":
          if (data.payload?.roomId) {
            setActiveMode(null);
            setIsJoiningRoom(false);
          }
          break;

        case "ROOM_JOIN_REQUEST_SENT":
          setIsJoiningRoom(true);
          break;

        case "ROOM_JOIN_DECLINED":
          setIsJoiningRoom(false);
          Toast({
            type: "error",
            message:
              data.payload?.message || "Host declined your room join request",
          });
          break;

        case "ROOM_LEFT":
          setActiveMode(null);
          setIsJoiningRoom(false);
          setRemovingMemberId(null);
          break;

        case "REMOVED_FROM_ROOM":
          setActiveMode(null);
          setIsJoiningRoom(false);
          setRemovingMemberId(null);
          break;

        case "ROOM_MEMBER_REMOVED":
          setRemovingMemberId(null);
          break;

        case "ROOM_CLOSED":
          setActiveMode(null);
          setRemovingMemberId(null);
          Toast({
            type: "error",
            message: data.payload?.message || "Room has been closed",
          });
          break;

        case "ERROR":
          Toast({
            type: "error",
            message: data.payload?.message || "An error occurred",
          });
          setIsCreatingRoom(false);
          setIsJoiningRoom(false);
          setRemovingMemberId(null);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }, []);

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

  const sendConnectionRequest = (e) => {
    e.stopPropagation();
    socket.send(
      JSON.stringify({
        type: "CONNECTION_REQUEST",
        payload: {
          connectId,
          senderUsername: username,
          senderId: userId,
        },
      }),
    );
  };

  const closeConnection = async (e) => {
    try {
      e.stopPropagation();
      if (connectionStatus) {
        socket.send(
          JSON.stringify({
            type: "CLOSE_CONNECTION",
            payload: {
              acceptedBy: { userId: userId },
              sentBy: { userId: userDetails.userId },
            },
          }),
        );

        setChatMessage("");
        hideUserSync();
        await tuneMateInstance.updateSyncState({ userId: "", username: "" });
      }
    } catch (error) {
      console.error("Error while closing connection:", error);
      Toast({
        type: "error",
        message: "Failed to close connection",
      });
    }
  };

  const handleCreateRoom = () => {
    setIsCreatingRoom(true);
    try {
      const hasSong = Boolean(song?.id);
      const currentTimestamp = Math.max(
        0,
        Number(AudioRef.current?.currentTime || 0),
      );
      const shouldPlayInRoom =
        hasSong && isPlaying && !AudioRef.current?.paused;

      socket.send(
        JSON.stringify({
          type: "CREATE_ROOM",
          payload: {
            createdBy: username,
            createdById: userId,
            songId: hasSong ? song.id : "",
            isPlaying: shouldPlayInRoom,
            timestamp: currentTimestamp,
          },
        }),
      );
    } catch (error) {
      console.error("Error creating room:", error);
      Toast({
        type: "error",
        message: "Failed to create room",
      });
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      Toast({
        type: "error",
        message: "Please enter a Room ID",
      });
      return;
    }

    setIsJoiningRoom(true);
    try {
      socket.send(
        JSON.stringify({
          type: "JOIN_ROOM",
          payload: {
            roomId: joinRoomId,
            userId: userId,
            username: username,
          },
        }),
      );
    } catch (error) {
      console.error("Error joining room:", error);
      Toast({
        type: "error",
        message: "Failed to join room",
      });
      setIsJoiningRoom(false);
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = chatMessage.trim();
    if (trimmedMessage === "") return;

    if (
      socket &&
      socket.readyState === WebSocket.OPEN &&
      (connectionStatus || roomId)
    ) {
      sendMessage({ trimmedMessage, username });
      setChatMessage("");
      return;
    }

    Toast({
      type: "error",
      message: "Unable to send message. WebSocket is not connected.",
    });
  };

  const handleLeaveRoom = (e) => {
    if (e) e.stopPropagation();

    if (socket && socket.readyState === WebSocket.OPEN && roomId) {
      socket.send(
        JSON.stringify({
          type: "LEAVE_ROOM",
          payload: {
            roomId,
            userId,
          },
        }),
      );
    }

    setActiveMode(null);
    setJoinRoomId("");
  };

  const handleRemoveMember = (event, member) => {
    event.stopPropagation();

    if (!isHost || !roomId || !member?.userId || member.userId === userId) {
      return;
    }

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      Toast({
        type: "error",
        message: "Unable to remove member. WebSocket is not connected.",
      });
      return;
    }

    const shouldRemove = window.confirm(
      `Remove ${member.username || "this user"} from the room?`,
    );
    if (!shouldRemove) return;

    setRemovingMemberId(member.userId);

    try {
      socket.send(
        JSON.stringify({
          type: "KICK_ROOM_MEMBER",
          payload: {
            roomId,
            targetUserId: member.userId,
          },
        }),
      );
    } catch (error) {
      console.error("Error removing room member:", error);
      Toast({
        type: "error",
        message: "Failed to remove member from room",
      });
      setRemovingMemberId(null);
    }
  };

  const resetToModeSelection = () => {
    setActiveMode(null);
    setConnectId("");
    setJoinRoomId("");
  };

  const isHost = roomHostId === userId;

  // Connected state UI
  if (connectionStatus && userDetails) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed right-0 bottom-20 md:right-0 md:bottom-24 z-50 w-[320px] md:w-80"
        ref={userSyncRef}
      >
        <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-[#3b3b3f] rounded-xl shadow-2xl overflow-hidden">
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
          </div>

          <div className="relative p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h1 className="text-sm font-medium text-gray-300">
                  Connected with
                </h1>
              </div>
              <Button
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg px-3 py-1 h-8 text-sm transition-all duration-200"
                onClick={closeConnection}
              >
                <MdClose className="mr-1" size={14} />
                Disconnect
              </Button>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-3 mb-3 border border-cyan-500/20">
              <span className="text-cyan-300 font-semibold text-lg">
                {userDetails.username}
              </span>
            </div>

            <div className="mt-2">
              <ChatMessageForm
                message={chatMessage}
                onMessageChange={setChatMessage}
                onSubmit={handleSendMessage}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Room created/joined UI
  if (roomId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed right-0 bottom-20 md:right-0 md:bottom-10 z-50 w-[320px] md:w-80"
        ref={userSyncRef}
      >
        <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-[#3b3b3f] rounded-xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
          </div>

          <div className="relative p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="text-purple-400" size={18} />
                <h1 className="text-sm font-medium text-gray-300">
                  Active Room
                </h1>
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                  {roomMembers.length}{" "}
                  {roomMembers.length === 1 ? "member" : "members"}
                </span>
              </div>
              <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition-all duration-200"
              >
                <LogOut size={12} />
                {isHost ? "Close" : "Leave"}
              </button>
            </div>

            {/* Room ID */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-2.5 mb-3 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Room ID
                  </p>
                  <code className="text-purple-300 font-mono text-sm">
                    {roomId}
                  </code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomId);
                    Toast({ type: "success", message: "Room ID copied!" });
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                Members in Room
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {roomMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {member.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-300 flex-1 truncate">
                      {member.username}
                      {member.userId === userId && (
                        <span className="text-gray-500 text-xs ml-1">
                          (you)
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {member.userId === roomHostId && (
                        <span className="flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">
                          <Crown size={10} />
                          Host
                        </span>
                      )}
                      {isHost && member.userId !== userId && (
                        <button
                          onClick={(event) => handleRemoveMember(event, member)}
                          disabled={removingMemberId === member.userId}
                          className="text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 p-1 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Remove from room"
                        >
                          {removingMemberId === member.userId ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <UserX size={11} />
                          )}
                        </button>
                      )}
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync status */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-300">
                Playback synced across all members
              </span>
            </div>

            {/* Chat */}
            <ChatMessageForm
              message={chatMessage}
              onMessageChange={setChatMessage}
              onSubmit={handleSendMessage}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Mode selection UI
  if (!activeMode) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed right-0 bottom-20 md:right-0 md:bottom-24 z-50 w-[320px] md:w-80"
        ref={userSyncRef}
      >
        <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" />

          {/* Floating Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
          </div>

          {/* Header with user ID */}
          <div className="relative bg-gradient-to-r from-[#2a2a2e] to-[#222226] p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Your Sync ID
              </h1>
              <div className="flex items-center gap-2">
                {copied ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <Copy
                    size={14}
                    className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                    onClick={handleCopy}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-cyan-300 font-mono text-sm font-semibold">
                {truncateString(userSyncKey, 20)}
              </code>
            </div>
          </div>

          {/* Mode selection */}
          <div className="relative p-4 space-y-3">
            <button
              onClick={() => setActiveMode("connect")}
              className="w-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/30 rounded-lg p-3 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="text-blue-400" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">
                    Connect with Friend
                  </h3>
                  <p className="text-xs text-gray-400">
                    Connect directly with another user
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveMode("create-room")}
              className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/30 rounded-lg p-3 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="text-purple-400" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Create a Room</h3>
                  <p className="text-xs text-gray-400">
                    Create a shared listening room
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveMode("join-room")}
              className="w-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/30 rounded-lg p-3 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogIn className="text-green-400" size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Join a Room</h3>
                  <p className="text-xs text-gray-400">
                    Join an existing listening room
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Connect mode UI
  if (activeMode === "connect") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed right-0 bottom-20 md:right-0 md:bottom-24 z-50 w-[320px] md:w-80"
        ref={userSyncRef}
      >
        <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="text-blue-400" size={18} />
                <h1 className="font-semibold text-white">
                  Connect with Friend
                </h1>
              </div>
              <button
                onClick={resetToModeSelection}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Friend's Sync ID
                </label>
                <input
                  type="text"
                  value={connectId || ""}
                  placeholder="Enter their Sync ID"
                  className="w-full bg-[#2a2a2e] p-2.5 rounded-lg outline-none border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm text-white placeholder:text-gray-500"
                  onChange={(e) => setConnectId(e.target.value)}
                />
              </div>

              <button
                className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  connectId
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-blue-500/25"
                    : "bg-[#2a2a2e] text-gray-500 cursor-not-allowed"
                }`}
                disabled={!connectId}
                onClick={sendConnectionRequest}
              >
                Send Connection Request
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Create Room mode UI
  if (activeMode === "create-room") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed right-0 bottom-20 md:right-0 md:bottom-24 z-50 w-[320px] md:w-80"
        ref={userSyncRef}
      >
        <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="text-purple-400" size={18} />
                <h1 className="font-semibold text-white">Create a Room</h1>
              </div>
              <button
                onClick={resetToModeSelection}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center text-gray-300 mb-2">
                <p className="text-sm">
                  Create a shared listening room instantly
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Share the Room ID with friends to join
                </p>
              </div>

              <button
                className="w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-purple-500/25"
                disabled={isCreatingRoom}
                onClick={handleCreateRoom}
              >
                {isCreatingRoom ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Creating Room...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Create Room
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Join Room mode UI
  if (activeMode === "join-room") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed right-0 bottom-20 md:right-0 md:bottom-24 z-50 w-[320px] md:w-80"
        ref={userSyncRef}
      >
        <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500" />

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LogIn className="text-green-400" size={18} />
                <h1 className="font-semibold text-white">Join a Room</h1>
              </div>
              <button
                onClick={resetToModeSelection}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Room ID
                </label>
                <input
                  type="text"
                  value={joinRoomId}
                  placeholder="Enter Room ID to join"
                  className="w-full bg-[#2a2a2e] p-2.5 rounded-lg outline-none border border-white/10 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm text-white placeholder:text-gray-500"
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
              </div>

              <button
                className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  joinRoomId.trim() && !isJoiningRoom
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/25"
                    : "bg-[#2a2a2e] text-gray-500 cursor-not-allowed"
                }`}
                disabled={!joinRoomId.trim() || isJoiningRoom}
                onClick={handleJoinRoom}
              >
                {isJoiningRoom ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Waiting for host...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Join Room
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
};

export default UserSync;
