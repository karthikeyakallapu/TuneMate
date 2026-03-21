import { create } from "zustand";

const useWebSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  connectionStatus: false,
  roomId: null,
  roomMembers: [],
  roomHostId: null,
  connectId: null,
  userDetails: null,
  pendingRoomJoinRequest: null,
  setUserDetails: (userDetails) => set({ userDetails }),
  setPendingRoomJoinRequest: (pendingRoomJoinRequest) =>
    set({ pendingRoomJoinRequest }),
  setConnectId: (connectId) => set({ connectId }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setRoomId: (roomId) => set({ roomId }),
  setRoomMembers: (members) => set({ roomMembers: members }),
  clearRoomId: () => set({ roomId: null, roomMembers: [], roomHostId: null }),
  setSocket: (socket) => set({ socket }),

  connectWebSocket: (userId) => {
    const existingSocket = get().socket;
    if (
      existingSocket &&
      (existingSocket.readyState === WebSocket.OPEN ||
        existingSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const baseURL = import.meta.env.VITE_SOCKET_SERVER_URL;
    const socket = new WebSocket(`${baseURL}?userId=${userId}`);
    socket.onopen = () => {
      set({ connected: true, socket });
      // Server will auto-rejoin room if user has an active one
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          (data.type === "ROOM_CREATED" || data.type === "ROOM_JOINED") &&
          data.payload?.roomId
        ) {
          set({
            roomId: data.payload.roomId,
            roomMembers: data.payload.members || [],
            roomHostId: data.payload.hostId || null,
          });
        }

        if (data.type === "MEMBERS_UPDATED" && data.payload?.members) {
          set({ roomMembers: data.payload.members });
        }

        if (data.type === "ROOM_JOIN_REQUEST" && data.payload) {
          set({ pendingRoomJoinRequest: data.payload });
        }

        if (
          data.type === "ROOM_LEFT" ||
          data.type === "ROOM_CLOSED" ||
          data.type === "REMOVED_FROM_ROOM"
        ) {
          set({
            roomId: null,
            roomMembers: [],
            roomHostId: null,
            pendingRoomJoinRequest: null,
          });
        }

        if (
          data.type === "ERROR" &&
          data.payload?.message === "Room not found"
        ) {
          set({
            roomId: null,
            roomMembers: [],
            roomHostId: null,
            pendingRoomJoinRequest: null,
          });
        }
      } catch (error) {
        console.error("Failed to parse socket message:", error);
      }
    };

    socket.onclose = () => {
      set({
        connected: false,
        socket: null,
        connectionStatus: false,
        userDetails: null,
        pendingRoomJoinRequest: null,
      });
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      set({
        connected: false,
        socket: null,
        connectionStatus: false,
        userDetails: null,
        pendingRoomJoinRequest: null,
      });
    };
  },

  closeWebSocket: ({ clearRoomId = false } = {}) => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }

    set({
      connected: false,
      socket: null,
      connectionStatus: false,
      userDetails: null,
      pendingRoomJoinRequest: null,
      ...(clearRoomId
        ? { roomId: null, roomMembers: [], roomHostId: null }
        : {}),
    });
  },
}));

export default useWebSocketStore;
