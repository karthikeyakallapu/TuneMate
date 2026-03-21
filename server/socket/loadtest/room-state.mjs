import Redis from "ioredis";

const mode = (process.argv[2] || "seed").toLowerCase();
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const roomId = process.env.LT_ROOM_ID || "lt-room-1";
const roomUserPrefix = process.env.LT_ROOM_USER_PREFIX || "lt-room-user";
const roomUserPoolSize = Math.max(
  1,
  Number(process.env.LT_USER_POOL_SIZE || 5000),
);
const roomHostIndex = Math.max(
  1,
  Math.min(roomUserPoolSize, Number(process.env.LT_HOST_INDEX || 1)),
);
const roomTtlSeconds = Math.max(60, Number(process.env.LT_ROOM_TTL || 36000));
const sampleSongId = process.env.LT_SAMPLE_SONG_ID || "";
const maxBatchSize = 1000;

const redis = new Redis(redisUrl);

const roomKey = `room:${roomId}`;
const roomMembersKey = `room:${roomId}:members`;
const joinRequestSetKey = `room:${roomId}:joinRequest:members`;
const hostUserId = `${roomUserPrefix}-${roomHostIndex}`;

function buildUserId(index) {
  return `${roomUserPrefix}-${index}`;
}

async function seedRoomState() {
  const now = Date.now();

  await redis.del(roomKey, roomMembersKey, joinRequestSetKey);

  await redis.hset(roomKey, {
    hostId: hostUserId,
    hostName: `LoadHost${roomHostIndex}`,
    songId: sampleSongId,
    isPlaying: String(Boolean(sampleSongId)),
    timestamp: "0",
    updatedAt: String(now),
  });
  await redis.expire(roomKey, roomTtlSeconds);
  await redis.expire(roomMembersKey, roomTtlSeconds);

  for (let startIndex = 1; startIndex <= roomUserPoolSize; startIndex += maxBatchSize) {
    const endIndex = Math.min(startIndex + maxBatchSize - 1, roomUserPoolSize);
    const pipeline = redis.pipeline();

    for (let userIndex = startIndex; userIndex <= endIndex; userIndex += 1) {
      const userId = buildUserId(userIndex);
      pipeline.hset(roomMembersKey, userId, `LoadUser${userIndex}`);
      pipeline.hset("user:activeRoom", userId, roomId);
    }

    await pipeline.exec();
  }

  console.log(
    `[loadtest] Seeded room '${roomId}' with ${roomUserPoolSize} users (host: ${hostUserId})`,
  );
}

async function cleanupRoomState() {
  await redis.del(roomKey, roomMembersKey, joinRequestSetKey);

  for (let startIndex = 1; startIndex <= roomUserPoolSize; startIndex += maxBatchSize) {
    const endIndex = Math.min(startIndex + maxBatchSize - 1, roomUserPoolSize);
    const pipeline = redis.pipeline();

    for (let userIndex = startIndex; userIndex <= endIndex; userIndex += 1) {
      const userId = buildUserId(userIndex);
      pipeline.hdel("user:activeRoom", userId);
      pipeline.hdel("user:wsid", userId);
    }

    await pipeline.exec();
  }

  console.log(
    `[loadtest] Cleaned room '${roomId}' and removed ${roomUserPoolSize} test users`,
  );
}

try {
  if (mode === "seed") {
    await seedRoomState();
  } else if (mode === "cleanup") {
    await cleanupRoomState();
  } else {
    console.error("[loadtest] mode must be 'seed' or 'cleanup'");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("[loadtest] Failed to process room state:", error);
  process.exitCode = 1;
} finally {
  redis.disconnect();
}

