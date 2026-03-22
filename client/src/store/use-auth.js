import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { tuneMateClient } from "@/service/api/api.js";
import { socketClient } from "@/service/api/socket.js";
import Toast from "@/utils/Toasts/Toast.js";
import useModalStore from "./use-modal-store.js";
import useWebSocketStore from "./use-socket.js";
import useUserSyncStore from "./use-userSync.js";

const AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "Lax",
  secure: import.meta.env.PROD,
};

const SESSION_TOAST_COOLDOWN_MS = 3000;
let logoutInFlightPromise = null;
let lastSessionToastTime = 0;

const parseToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
};

const getTokenExpiryMs = (decodedToken) =>
  decodedToken?.exp ? decodedToken.exp * 1000 : null;

const hasTokenExpired = (decodedToken) => {
  const tokenExpiryMs = getTokenExpiryMs(decodedToken);
  if (!tokenExpiryMs) {
    return false;
  }

  return tokenExpiryMs <= Date.now();
};

const getCookie = (cookieName) => Cookies.get(cookieName) || null;

const clearAuthCookies = () => {
  Cookies.remove("accessToken", { path: "/" });
  Cookies.remove("role", { path: "/" });
};

const clearClientAuthorizationHeaders = () => {
  delete tuneMateClient.defaults.headers["Authorization"];
  delete socketClient.defaults.headers["Authorization"];
};

const getUnauthenticatedState = () => ({
  accessToken: null,
  isAuthenticated: false,
  username: null,
  role: null,
  userId: null,
  userSyncKey: null,
  tokenExpiryMs: null,
});

const initializeAuthState = () => {
  const token = getCookie("accessToken");
  if (!token) {
    return getUnauthenticatedState();
  }

  const role = getCookie("role");
  const decodedToken = parseToken(token);

  if (!decodedToken || hasTokenExpired(decodedToken)) {
    clearAuthCookies();
    clearClientAuthorizationHeaders();
    return getUnauthenticatedState();
  }

  return {
    accessToken: token,
    isAuthenticated: true,
    role: role || decodedToken?.role || null,
    userId: decodedToken?.userid || null,
    username: decodedToken?.username || null,
    userSyncKey: decodedToken?.userid || null,
    tokenExpiryMs: getTokenExpiryMs(decodedToken),
  };
};

const useAuthStore = create((set, get) => ({
  ...initializeAuthState(),
  setAccessToken: (token) => {
    const decodedToken = parseToken(token);

    if (!decodedToken || hasTokenExpired(decodedToken)) {
      void get().removeAccessToken({
        reason: "invalid_token",
        showToast: false,
        openLoginModal: false,
      });
      return false;
    }

    if (decodedToken.role) {
      Cookies.set("role", decodedToken.role, AUTH_COOKIE_OPTIONS);
    } else {
      Cookies.remove("role", { path: "/" });
    }

    Cookies.set("accessToken", token, AUTH_COOKIE_OPTIONS);
    tuneMateClient.defaults.headers["Authorization"] = `Bearer ${token}`;
    socketClient.defaults.headers["Authorization"] = `Bearer ${token}`;

    set({
      accessToken: token,
      isAuthenticated: true,
      username: decodedToken.username,
      role: decodedToken.role,
      userId: decodedToken.userid,
      userSyncKey: decodedToken.userid,
      tokenExpiryMs: getTokenExpiryMs(decodedToken),
    });

    return true;
  },

  removeAccessToken: async (
    { reason = "manual", showToast = false, openLoginModal = false } = {},
  ) => {
    if (logoutInFlightPromise) {
      return logoutInFlightPromise;
    }

    logoutInFlightPromise = (async () => {
      const wasAuthenticated =
        get().isAuthenticated || Boolean(getCookie("accessToken"));

      clearAuthCookies();
      clearClientAuthorizationHeaders();
      set(getUnauthenticatedState());

      try {
        await useWebSocketStore
          .getState()
          .closeWebSocket({ clearRoomId: true });
      } catch (error) {
        console.error("Failed to close websocket on logout:", error);
      }

      try {
        await useWebSocketStore.getState().setUserDetails(null);
      } catch (error) {
        console.error("Failed to clear websocket user details:", error);
      }

      try {
        await useUserSyncStore.getState().hideUserSync();
      } catch (error) {
        console.error("Failed to clear user sync state:", error);
      }

      if (showToast && wasAuthenticated) {
        const now = Date.now();
        if (now - lastSessionToastTime >= SESSION_TOAST_COOLDOWN_MS) {
          const message =
            reason === "expired"
              ? "Session expired. Please log in again."
              : "You have been logged out. Please log in again.";

          Toast({
            type: "warning",
            message,
            duration: 2500,
          });

          lastSessionToastTime = now;
        }
      }

      if (openLoginModal) {
        useModalStore.getState().openModal("LOGIN");
      }
    })();

    try {
      await logoutInFlightPromise;
    } finally {
      logoutInFlightPromise = null;
    }
  },
}));

export default useAuthStore;
