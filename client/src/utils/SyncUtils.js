import useWebSocketStore from "@/store/use-socket.js";
import useAuthStore from "@/store/use-auth.js";

export const broadcastAction = (action, payload = {}) => {
  const {
    socket: socketConnection,
    connectionStatus,
    roomId,
  } = useWebSocketStore.getState();
  const userId = useAuthStore.getState().userId;

  if (!socketConnection || socketConnection.readyState !== WebSocket.OPEN) {
    return;
  }

  if (roomId) {
    socketConnection.send(
      JSON.stringify({
        type: "SYNC_ROOM_ACTION",
        payload: {
          roomId,
          userId,
          action,
          ...payload,
        },
      }),
    );
    return;
  }

  if (connectionStatus) {
    socketConnection.send(
      JSON.stringify({
        type: "SYNC_ACTION",
        payload: {
          action,
          senderId: userId,
          ...payload,
        },
      }),
    );
  }
};
