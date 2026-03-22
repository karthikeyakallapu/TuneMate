import { getPrismaInstance } from "../../utils/prisma/prisma.js";

export const PlaylistController = () => {
  return {
    async getRecommended(req, res) {
      try {
        const prisma = await getPrismaInstance();

        const playlists = await prisma.recommended.findMany({
          select: {
            id: true,
            name: true,
            image: true,
            type: true
          }
        });

        const tuneMateUpdates = await prisma.tuneMateUpdates.findMany({
          select: {
            title: true,
            Content: true
          }
        });

        return res.status(200).json({
          playlists,
          tuneMateUpdates
        });
      } catch (err) {
        console.error("Error in getRecommended:", err);
        return res.status(500).json({
          data: {
            message: "Failed to load recommended playlists.",
            type: "error"
          }
        });
      }
    },
    async createRecommended(req, res) {
      const { playlist } = req.body;

      try {
        const prisma = await getPrismaInstance();

        const existingPlaylist = await prisma.recommended.findFirst({
          where: {
            name: playlist
          }
        });

        if (existingPlaylist) {
          return res.status(200).json({
            data: { message: "Playlist Already Exists", type: "error" }
          });
        }

        await prisma.recommended.create({
          data: {
            name: playlist
          }
        });

        return res
          .status(201)
          .json({ data: { message: "Playlist Created", type: "success" } });
      } catch (err) {
        console.error("Error in createRecommended:", err);
        return res.status(500).json({
          data: { message: "Failed to create playlist.", type: "error" }
        });
      }
    },
    async addSongToRecommended(req, res) {
      const { playlists, song } = req.body;
      try {
        const prisma = await getPrismaInstance();
        const allPlaylists = await prisma.recommended.findMany({
          where: {
            id: { in: playlists }
          },
          select: { id: true, songs: true }
        });

        const updates = allPlaylists.map(async (playlist) => {
          const songExists = playlist.songs.some((s) => s.id === song.id);
          if (!songExists) {
            return prisma.recommended.update({
              where: { id: playlist.id },
              data: {
                songs: {
                  push: { ...song, addedAt: new Date() }
                },
                image: song.image
              }
            });
          }
        });

        await Promise.all(updates);
        res.status(200).json({
          data: {
            message: "Song added",
            type: "success"
          }
        });
      } catch (error) {
        console.error("Error saving song to playlists:", error);
        return res.status(500).json({
          data: {
            message: "An error occurred while adding the song to playlists",
            type: "error"
          }
        });
      }
    },
    async removeSongFromRecommended(req, res) {
      const { playlists, id: songId } = req.body;
      try {
        const prisma = await getPrismaInstance();

        const allPlaylists = await prisma.recommended.findMany({
          where: {
            id: { in: playlists }
          },
          select: { id: true, songs: true }
        });

        const updates = allPlaylists.map(async (playlist) => {
          const updatedSongs = playlist.songs.filter((s) => s.id !== songId);

          const lastSong =
            updatedSongs.length > 0
              ? updatedSongs[updatedSongs.length - 1]
              : null;

          return prisma.recommended.update({
            where: { id: playlist.id },
            data: {
              songs: { set: updatedSongs },
              image: lastSong ? lastSong.image : ""
            }
          });
        });

        await Promise.all(updates);
        res.status(200).json({
          data: {
            message: "Song removed",
            type: "success"
          }
        });
      } catch (err) {
        console.error("Error in removeSongFromRecommended:", err);
        return res.status(500).json({
          data: { message: "Failed to remove song.", type: "error" }
        });
      }
    },
    async getRecommendedSongs(req, res) {
      const { id: playlist_id } = req.params;
      try {
        const prisma = await getPrismaInstance();

        const playlist = await prisma.recommended.findMany({
          where: {
            id: playlist_id
          }
        });

        playlist[0]?.songs.sort(
          (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
        );

        if (!playlist || playlist.length === 0)
          return res.status(404).json({ message: "Playlist not found" });

        return res.status(200).json({ playlist: playlist });
      } catch (err) {
        console.error("Error in getRecommendedSongs:", err);
        return res.status(500).json({
          data: { message: "Failed to load playlist songs.", type: "error" }
        });
      }
    }
  };
};
