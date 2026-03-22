import axios from "axios";
import Cookies from "js-cookie";
import { ENDPOINTS } from "@/service/endpoints/API_ENDPOINTS.js";

const baseURL = import.meta.env.VITE_BACKEND_URL;
const token = Cookies.get("accessToken");

export const tuneMateClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Authorization: token ? `Bearer ${token}` : undefined,
  },
});

class TuneMateService {
  addSongToHistory = async (song) => {
    try {
      const response = await tuneMateClient.post(
        ENDPOINTS.addSongToHistory,
        song,
      );
      return response.data;
    } catch (err) {
      return err;
    }
  };

  getPlaylists = async () => {
    try {
      const response = await tuneMateClient.get(ENDPOINTS.getPlaylists);
      return response.data.playlists;
    } catch (err) {
      throw err;
    }
  };

  loginUser = async (data) => {
    try {
      const response = await tuneMateClient.post(ENDPOINTS.login, data);
      return response.data;
    } catch (err) {
      return err;
    }
  };

  registerUser = async (data) => {
    try {
      const response = await tuneMateClient.post(ENDPOINTS.register, data);
      return response.data;
    } catch (err) {
      return err;
    }
  };

  forgotPassword = async (data) => {
    try {
      const response = await tuneMateClient.post(ENDPOINTS.forgot, data);
      return response.data;
    } catch (err) {
      return err;
    }
  };

  verifyEmail = async (data) => {
    try {
      const response = await tuneMateClient.post(ENDPOINTS.verifyEmail, data);
      return response.data;
    } catch (err) {
      return err;
    }
  };

  refreshToken = async () => {
    try {
      const response = await tuneMateClient.post(ENDPOINTS.refreshToken);
      return response.data;
    } catch (err) {
      return err;
    }
  };

  logoutUser = async () => {
    try {
      const response = await tuneMateClient.post(ENDPOINTS.logout);
      return response.data;
    } catch (err) {
      return err;
    }
  };

  resetPassword = async (data) => {
    try {
      const response = await tuneMateClient.post(ENDPOINTS.resetPassword, data);
      return response.data;
    } catch (err) {
      return err;
    }
  };

  resendVerificationMail = async (data) => {
    try {
      const response = await tuneMateClient.post(
        ENDPOINTS.resendVerificationMail,
        data,
      );
      return response.data;
    } catch (err) {
      return err;
    }
  };

  ManageSongInFavorites = async (id) => {
    try {
      const response = await tuneMateClient.post(
        ENDPOINTS.ManageSongInFavorites,
        { id },
      );
      return response.data;
    } catch (err) {
      return err;
    }
  };

  getFavorites = async () => {
    try {
      const response = await tuneMateClient.get(ENDPOINTS.favorites);
      return response.data.favorites;
    } catch (err) {
      throw err;
    }
  };

  updatePlayerState = async (state) => {
    try {
      const response = await tuneMateClient.post(ENDPOINTS.updatePlayerState, {
        state,
      });
      return response.data;
    } catch (err) {
      return err;
    }
  };

  getPlayerState = async () => {
    try {
      const response = await tuneMateClient.get(ENDPOINTS.loadPlayerState);
      return response.data;
    } catch (err) {
      throw err;
    }
  };
  getUserSongHistory = async () => {
    try {
      const response = await tuneMateClient.get(ENDPOINTS.getUserSongHistory);
      return response.data.history;
    } catch (err) {
      throw err;
    }
  };

  createNewPlaylist = async (data, role) => {
    try {
      if (role === "admin") {
        const response = await tuneMateClient.post(
          ENDPOINTS.createRecommended,
          { playlist: data },
        );
        return response.data;
      }
      const response = await tuneMateClient.post(ENDPOINTS.createNewPlaylist, {
        playlist: data,
      });
      return response.data;
    } catch (err) {
      return err;
    }
  };

  saveSongInPlaylist = async (data, role) => {
    try {
      if (role === "admin") {
        const response = await tuneMateClient.post(
          ENDPOINTS.addSongToRecommended,
          data,
        );
        return response.data;
      }
      const response = await tuneMateClient.post(
        ENDPOINTS.saveSongInPlaylist,
        data,
      );
      return response.data;
    } catch (err) {
      return err;
    }
  };

  removeSongFromPlaylist = async (data, role) => {
    try {
      if (role === "admin") {
        const response = await tuneMateClient.post(
          ENDPOINTS.removeSongFromRecommended,
          data,
        );
        return response.data;
      }
      const response = await tuneMateClient.post(
        ENDPOINTS.removeSongFromPlaylist,
        data,
      );
      return response.data;
    } catch (err) {
      return err;
    }
  };

  getUserPlaylist = async (id) => {
    try {
      const response = await tuneMateClient.get(ENDPOINTS.playlist(id));
      return response.data.playlist[0];
    } catch (err) {
      throw err;
    }
  };

  getTuneMateRecommended = async () => {
    try {
      const response = await tuneMateClient.get(ENDPOINTS.recommended);
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  getRecommendedPlaylist = async (id) => {
    try {
      const response = await tuneMateClient.get(
        ENDPOINTS.recommendedPlaylist(id),
      );
      return response.data.playlist[0];
    } catch (err) {
      throw err;
    }
  };

  updateSyncState = async (state) => {
    try {
      const response = await tuneMateClient.post(
        ENDPOINTS.updateSyncState,
        state,
      );
      return response.data;
    } catch (err) {
      return err;
    }
  };

  deleteUserPlaylist = async (id) => {
    try {
      const response = await tuneMateClient.delete(ENDPOINTS.playlist(id));
      return response.data;
    } catch (err) {
      return err;
    }
  };

  editUserPlaylist = async (data) => {
    const { newPlaylistName, playlistForEdit } = data;
    try {
      const response = await tuneMateClient.put(
        ENDPOINTS.playlist(playlistForEdit.id),
        { newPlaylistName },
      );
      return response.data;
    } catch (err) {
      return err;
    }
  };
}

const tuneMateInstance = new TuneMateService();

export default tuneMateInstance;
