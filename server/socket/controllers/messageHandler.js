import MESSAGE_TYPES from "../utils/messageTypes.js";
import SyncControllerInstance from "./SyncController.js";
import RoomControllerInstance from "./RoomController.js";

export const handleMessage = async (ws, data) => {
  const { type, payload } = data;
  console.log("Received message of type:", type, "with payload:", payload);
  switch (type) {
    case MESSAGE_TYPES.CONNECTION_REQUEST:
      const { connectId, senderUsername } = payload;
      await SyncControllerInstance.sendConnectionRequest(
        connectId,
        senderUsername,
        ws.userId,
      );
      break;

    case MESSAGE_TYPES.CONNECTION_ACCEPTED:
      await SyncControllerInstance.acceptConnectionRequest(payload);
      break;

    case MESSAGE_TYPES.CONNECTION_DECLINED:
      await SyncControllerInstance.declineConnectionRequest(payload);
      break;

    case MESSAGE_TYPES.SYNC_ACTION:
      await SyncControllerInstance.syncAction({
        ...(payload || {}),
        senderId: ws.userId,
      });
      break;

    case MESSAGE_TYPES.CLOSE_CONNECTION:
      await SyncControllerInstance.closeConnection(payload);
      break;

    case MESSAGE_TYPES.CREATE_ROOM:
      await RoomControllerInstance.createRoom(payload);
      break;

    case MESSAGE_TYPES.JOIN_ROOM:
      await RoomControllerInstance.joinRoom(payload, ws.userId);
      break;

    case MESSAGE_TYPES.RESPOND_ROOM_JOIN_REQUEST:
      await RoomControllerInstance.respondToJoinRoomRequest(payload, ws.userId);
      break;

    case MESSAGE_TYPES.KICK_ROOM_MEMBER:
      await RoomControllerInstance.kickRoomMember(payload, ws.userId);
      break;

    case MESSAGE_TYPES.LEAVE_ROOM:
      await RoomControllerInstance.leaveRoom(payload, ws.userId);
      break;

    case MESSAGE_TYPES.SYNC_ROOM_ACTION:
      await RoomControllerInstance.syncAction(payload, ws.userId);
      break;

    default:
      console.error("Unknown message type:", type);
  }
};
