import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { tuneMateClient } from "@/service/api/api.js";
import useWebSocketStore from "./use-socket.js";
import useUserSyncStore from "./use-userSync.js";

const parseToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

const getCookie = (cookieName) => Cookies.get(cookieName) || null;

const initializeAuthState = () => {
  const token = getCookie("accessToken");
  const role = getCookie("role");
  const decodedToken = token ? parseToken(token) : null;
  return {
    accessToken: token,
    isAuthenticated: !!token,
    role: role,
    userId: decodedToken?.userid || null,
    username: decodedToken?.username || null,
    userSyncKey: decodedToken ?  decodedToken.userid : null
  };
};

const useAuthStore = create((set) => ({
  ...initializeAuthState(),
  setAccessToken: (token) => {
    const decodedToken = parseToken(token);
    if (!decodedToken) return;
    Cookies.set("role", decodedToken.role, { path: "/" });
    Cookies.set("accessToken", token, { path: "/" });
    tuneMateClient.defaults.headers["Authorization"] = `Bearer ${token}`;
    set({
      accessToken: token,
      isAuthenticated: true,
      username: decodedToken.username,
      role: decodedToken.role,
      userId: decodedToken.userid,
      userSyncKey: decodedToken.userid
    });
  },

  removeAccessToken: async () => {
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("role", { path: "/" });
    delete tuneMateClient.defaults.headers["Authorization"];
    set({
      accessToken: null,
      isAuthenticated: false,
      username: null,
      role: null,
      userId: null,
      userSyncKey: null
    });
    await useWebSocketStore.getState().closeWebSocket({ clearRoomId: true });
    await useWebSocketStore.getState().setUserDetails(null);
    await useUserSyncStore.getState().hideUserSync();
  }
}));

export default useAuthStore;
