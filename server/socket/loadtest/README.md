# Socket Load Testing (Artillery)

This folder provides a repeatable way to estimate practical WebSocket concurrency for the socket service.

## Profiles

- `artillery.idle.yml`: high concurrent connections, low message volume.
- `artillery.room-sync.yml`: active room sync traffic (`SEEK`, `HANDLE_SONG_PLAY`, `SEND_CHAT`, optional `PLAY_SONG`).

## Prerequisites

- Redis is running and reachable from `REDIS_URL`.
- Socket server is running (default: `ws://localhost:4100`).
- Artillery is available:
  - global install, or
  - `npx artillery ...`

## Quick Run

From `server/socket`:

1. Idle concurrency baseline:
   - `npm run loadtest:idle`

2. Room-sync profile (requires seed first):
   - `npm run loadtest:seed-room`
   - `npm run loadtest:room`
   - `npm run loadtest:cleanup-room`

## Environment Variables

You can tune test scale with env vars:

- `LT_ROOM_ID` default: `lt-room-1`
- `LT_ROOM_USER_PREFIX` default: `lt-room-user`
- `LT_IDLE_USER_PREFIX` default: `lt-idle-user`
- `LT_USER_POOL_SIZE` default: `5000`
- `LT_SAMPLE_SONG_ID` default: empty
- `LT_ROOM_TTL` default: `36000` (seconds)
- `LT_HOST_INDEX` default: `1`

Example (PowerShell):

```powershell
$env:LT_USER_POOL_SIZE="10000"
$env:LT_ROOM_ID="lt-room-a"
npm run loadtest:seed-room
npm run loadtest:room
npm run loadtest:cleanup-room
```

## Interpreting Results

Track these while running:

- Socket server CPU and memory
- Redis CPU, ops/sec, pub/sub throughput
- Artillery latency percentiles and errors

Stop increasing arrival rate when:

- p95/p99 latency rises sharply,
- disconnect/error rates increase,
- or Redis/socket CPU saturates.

