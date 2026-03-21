"use strict";

const DEFAULT_ROOM_ID = process.env.LT_ROOM_ID || "lt-room-1";
const IDLE_USER_PREFIX = process.env.LT_IDLE_USER_PREFIX || "lt-idle-user";
const ROOM_USER_PREFIX = process.env.LT_ROOM_USER_PREFIX || "lt-room-user";
const USER_POOL_SIZE = Math.max(
  1,
  Number(process.env.LT_USER_POOL_SIZE || 5000),
);
const SAMPLE_SONG_ID = process.env.LT_SAMPLE_SONG_ID || "";

let idleCounter = 0;
let roomCounter = 0;

function setWsPath(context, userId) {
  context.vars.userId = userId;
  context.vars.wsPath = `/?userId=${encodeURIComponent(userId)}`;
  context.vars.roomId = DEFAULT_ROOM_ID;
}

function initIdleUser(context, events, done) {
  idleCounter += 1;
  const randomSuffix = Math.floor(Math.random() * 1e9);
  const userId = `${IDLE_USER_PREFIX}-${Date.now()}-${idleCounter}-${randomSuffix}`;
  setWsPath(context, userId);
  return done();
}

function initRoomUser(context, events, done) {
  roomCounter += 1;
  const userIndex = ((roomCounter - 1) % USER_POOL_SIZE) + 1;
  if (roomCounter > USER_POOL_SIZE && roomCounter % USER_POOL_SIZE === 1) {
    console.warn(
      `[loadtest] user pool exhausted at ${USER_POOL_SIZE}; recycling IDs`,
    );
  }

  const userId = `${ROOM_USER_PREFIX}-${userIndex}`;
  setWsPath(context, userId);
  return done();
}

function buildRoomSyncMessage(context, events, done) {
  const roomId = context.vars.roomId || DEFAULT_ROOM_ID;
  const randomValue = Math.random();
  let payload = null;

  if (SAMPLE_SONG_ID && randomValue < 0.08) {
    payload = {
      roomId,
      action: "PLAY_SONG",
      songId: SAMPLE_SONG_ID,
      isPlaying: true,
      timestamp: 0,
    };
  } else if (randomValue < 0.7) {
    const timestamp = Number((Math.random() * 220).toFixed(2));
    payload = {
      roomId,
      action: "SEEK",
      musicSeekTime: Number((Math.random() * 100).toFixed(2)),
      timestamp,
    };
  } else if (randomValue < 0.9) {
    const timestamp = Number((Math.random() * 220).toFixed(2));
    payload = {
      roomId,
      action: "HANDLE_SONG_PLAY",
      isPlaying: Math.random() > 0.4,
      timestamp,
    };
  } else {
    payload = {
      roomId,
      action: "SEND_CHAT",
      chat: `loadtest-${context.vars.userId}-${Date.now()}`,
    };
  }

  context.vars.roomSyncMessage = JSON.stringify({
    type: "SYNC_ROOM_ACTION",
    payload,
  });

  return done();
}

module.exports = {
  initIdleUser,
  initRoomUser,
  buildRoomSyncMessage,
};

