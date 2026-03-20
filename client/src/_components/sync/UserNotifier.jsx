import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaTimes, FaUserPlus, FaHeadphones } from "react-icons/fa";
import { FiUser, FiClock, FiUsers } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import useAuthStore from "@/store/use-auth";
import useWebSocketStore from "@/store/use-socket";
import useNotifierStore from "@/store/use-Notifier";
import useUserSyncStore from "@/store/use-userSync";
import tuneMateInstance from "@/service/api/api";
import Toast from "@/utils/Toasts/Toast";
import { useState } from "react";

const UserNotifier = () => {
  const {
    socket,
    userDetails,
    setConnectionStatus,
    pendingRoomJoinRequest,
    setPendingRoomJoinRequest,
  } = useWebSocketStore();
  const { userId, username } = useAuthStore();
  const { hideNotifier } = useNotifierStore();
  const { showUserSync } = useUserSyncStore();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const requestType = pendingRoomJoinRequest
    ? "room"
    : userDetails
      ? "connection"
      : null;

  const requesterDetails =
    requestType === "room"
      ? {
          userId: pendingRoomJoinRequest?.userId,
          username: pendingRoomJoinRequest?.username,
        }
      : userDetails;

  const closeRoomJoinRequestCard = () => {
    setPendingRoomJoinRequest(null);
    hideNotifier();
  };

  const acceptConnectionRequest = async () => {
    setConnectionStatus(true);
    const payload = {
      acceptedBy: { username, userId },
      sentBy: {
        userId: requesterDetails.userId,
        username: requesterDetails.username,
      },
    };

    socket.send(
      JSON.stringify({
        type: "CONNECTION_ACCEPTED",
        payload,
      }),
    );

    await tuneMateInstance.updateSyncState({
      userId: requesterDetails.userId,
      username: requesterDetails.username,
    });

    Toast({
      type: "success",
      message: `Connected with ${requesterDetails.username}!`,
    });

    setTimeout(() => {
      hideNotifier();
      showUserSync();
      setIsAccepting(false);
    }, 500);
  };

  const declineConnectionRequest = () => {
    socket.send(
      JSON.stringify({
        type: "CONNECTION_DECLINED",
        payload: {
          sentBy: {
            userId: requesterDetails.userId,
            username: requesterDetails.username,
          },
        },
      }),
    );

    Toast({
      type: "info",
      message: "Connection request declined",
    });

    setTimeout(() => {
      hideNotifier();
      setIsDeclining(false);
    }, 300);
  };

  const acceptRoomJoinRequest = () => {
    socket.send(
      JSON.stringify({
        type: "RESPOND_ROOM_JOIN_REQUEST",
        payload: {
          roomId: pendingRoomJoinRequest.roomId,
          requesterId: pendingRoomJoinRequest.userId,
          approved: true,
        },
      }),
    );

    Toast({
      type: "success",
      message: `Approved ${pendingRoomJoinRequest.username}'s join request`,
    });

    setTimeout(() => {
      closeRoomJoinRequestCard();
      setIsAccepting(false);
    }, 300);
  };

  const declineRoomJoinRequest = () => {
    socket.send(
      JSON.stringify({
        type: "RESPOND_ROOM_JOIN_REQUEST",
        payload: {
          roomId: pendingRoomJoinRequest.roomId,
          requesterId: pendingRoomJoinRequest.userId,
          approved: false,
        },
      }),
    );

    Toast({
      type: "info",
      message: `${pendingRoomJoinRequest.username}'s request declined`,
    });

    setTimeout(() => {
      closeRoomJoinRequestCard();
      setIsDeclining(false);
    }, 300);
  };

  const acceptRequest = async (e) => {
    try {
      e.stopPropagation();
      setIsAccepting(true);

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        Toast({
          type: "error",
          message: "WebSocket is not connected",
        });
        setIsAccepting(false);
        return;
      }

      if (requestType === "room") {
        acceptRoomJoinRequest();
        return;
      }

      await acceptConnectionRequest();
    } catch (error) {
      console.error("Error accepting request:", error);
      Toast({
        type: "error",
        message: "Failed to accept request. Please try again.",
      });
      setIsAccepting(false);
    }
  };

  const declineRequest = (e) => {
    try {
      e.stopPropagation();
      setIsDeclining(true);

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        Toast({
          type: "error",
          message: "WebSocket is not connected",
        });
        setIsDeclining(false);
        return;
      }

      if (requestType === "room") {
        declineRoomJoinRequest();
        return;
      }

      declineConnectionRequest();
    } catch (error) {
      console.error("Error declining request:", error);
      Toast({
        type: "error",
        message: "Failed to decline request. Please try again.",
      });
      setIsDeclining(false);
    }
  };

  if (!requestType || !requesterDetails) {
    return null;
  }

  const headerTitle =
    requestType === "room" ? "Room Join Request" : "Connection Request";
  const headerSubtitle =
    requestType === "room"
      ? "Host approval required"
      : "Someone wants to sync";
  const profileTag =
    requestType === "room"
      ? `Wants to join room ${pendingRoomJoinRequest.roomId}`
      : "Music Lover";
  const acceptText =
    requestType === "room"
      ? isAccepting
        ? "Approving..."
        : "Approve"
      : isAccepting
        ? "Accepting..."
        : "Accept";
  const declineText =
    requestType === "room"
      ? isDeclining
        ? "Declining..."
        : "Decline"
      : isDeclining
        ? "Declining..."
        : "Decline";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed right-4 bottom-20 md:right-6 md:bottom-10 z-50"
      >
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse" />

          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse delay-1000" />
          </div>

          <div className="relative bg-gradient-to-br from-[#1f1f23] to-[#18181b] border border-white/10 rounded-xl shadow-2xl w-[320px] md:w-80 overflow-hidden">
            <button
              onClick={declineRequest}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <IoMdClose size={16} />
            </button>

            <div className="p-5 pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    {requestType === "room" ? (
                      <FiUsers size={16} className="text-white" />
                    ) : (
                      <FaUserPlus size={16} className="text-white" />
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#18181b] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {headerTitle}
                  </h3>
                  <p className="text-xs text-gray-400">{headerSubtitle}</p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-xl font-bold text-white">
                    {requesterDetails.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-white">
                    {requesterDetails.username}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <FiUser className="text-cyan-400" size={10} />
                    <span className="text-xs text-gray-400">{profileTag}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5">
                  <FiClock className="text-cyan-400" size={12} />
                  <span className="text-xs text-gray-300">Just now</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5">
                  <FaHeadphones className="text-purple-400" size={12} />
                  <span className="text-xs text-gray-300">Online</span>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={acceptRequest}
                  disabled={isAccepting}
                  className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAccepting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{acceptText}</span>
                    </>
                  ) : (
                    <>
                      <FaCheck size={12} />
                      <span>{acceptText}</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={declineRequest}
                  disabled={isDeclining}
                  className="flex-1 py-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeclining ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{declineText}</span>
                    </>
                  ) : (
                    <>
                      <FaTimes size={12} />
                      <span>{declineText}</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            <div className="h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserNotifier;
