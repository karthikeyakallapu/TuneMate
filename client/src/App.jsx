import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import routesConfig from "@/utils/routesConfig";
import Player from "@/_components/Player/Player.jsx";
import NavBar from "@/_components/navigation/Navbar/NavBar.jsx";
import SideBar from "@/_components/navigation/SideBar/SideBar.jsx";
import Login from "@/pages/auth/login.jsx";
import { SkeletonTheme } from "react-loading-skeleton";
import { useMediaQuery } from "usehooks-ts";
import MobileNav from "@/_components/navigation/MobileNav/MobileNav";
import EditPlayList from "./_components/PlaylistComponents/EditPlayList";
import useModalStore from "@/store/use-modal-store.js";
import useAuthStore from "@/store/use-auth.js";
import { tuneMateClient } from "@/service/api/api.js";
import { socketClient } from "@/service/api/socket.js";
import { ENDPOINTS } from "@/service/endpoints/API_ENDPOINTS.js";

const isAuthRequest = (url = "") =>
  typeof url === "string" && url.includes("/api/auth/");

const shouldHandleUnauthorizedResponse = (statusCode, responseCode) =>
  statusCode === 401 || responseCode === "TOKEN_EXPIRED";

const getApiErrorCode = (error) =>
  error?.response?.data?.data?.code || error?.response?.data?.code;

const isStaleRefreshTokenError = (error) =>
  getApiErrorCode(error) === "AUTH_TOKEN_STALE";

const getTokenExpiryMs = (token) => {
  if (!token) {
    return null;
  }

  try {
    const decodedToken = jwtDecode(token);
    return decodedToken?.exp ? decodedToken.exp * 1000 : null;
  } catch (error) {
    return null;
  }
};

const REFRESH_REQUEST_HEADERS = { "x-skip-auth-refresh": "1" };
let refreshInFlightPromise = null;

const performTokenRefreshRequest = async () => {
  const response = await tuneMateClient.post(ENDPOINTS.refreshToken, null, {
    headers: REFRESH_REQUEST_HEADERS,
  });
  const refreshedToken = response?.data?.data?.accessToken;
  const didSetToken = useAuthStore.getState().setAccessToken(refreshedToken);

  if (!didSetToken) {
    throw new Error("Refresh token response did not contain a valid access token.");
  }

  return refreshedToken;
};

const refreshSessionToken = async () => {
  if (!refreshInFlightPromise) {
    refreshInFlightPromise = (async () => {
      try {
        return await performTokenRefreshRequest();
      } catch (error) {
        if (isStaleRefreshTokenError(error)) {
          return await performTokenRefreshRequest();
        }
        throw error;
      }
    })().finally(() => {
      refreshInFlightPromise = null;
    });
  }

  return refreshInFlightPromise;
};

function App() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { component } = useModalStore();
  const { accessToken, isAuthenticated } = useAuthStore();
  const [isSessionBootstrapped, setIsSessionBootstrapped] = useState(() => {
    const state = useAuthStore.getState();
    return Boolean(state.isAuthenticated && state.accessToken);
  });

  useEffect(() => {
    let isMounted = true;
    const fallbackBootstrapTimer = window.setTimeout(() => {
      if (isMounted) {
        setIsSessionBootstrapped(true);
      }
    }, 8000);

    const bootstrapSession = async () => {
      const state = useAuthStore.getState();
      if (state.isAuthenticated && state.accessToken) {
        if (isMounted) {
          setIsSessionBootstrapped(true);
        }
        return;
      }

      try {
        await refreshSessionToken();
      } catch (error) {
        // Silent failure is expected when refresh cookie doesn't exist
      } finally {
        window.clearTimeout(fallbackBootstrapTimer);
        if (isMounted) {
          setIsSessionBootstrapped(true);
        }
      }
    };

    if (!isSessionBootstrapped) {
      void bootstrapSession();
    }

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackBootstrapTimer);
    };
  }, [isSessionBootstrapped]);

  useEffect(() => {
    if (!isSessionBootstrapped || !isAuthenticated || !accessToken) {
      return;
    }

    const tokenExpiryMs = getTokenExpiryMs(accessToken);
    if (!tokenExpiryMs) {
      return;
    }

    const refreshBeforeMs = 60 * 1000;
    const minDelayMs = 5000;
    const delayMs = Math.max(
      tokenExpiryMs - Date.now() - refreshBeforeMs,
      minDelayMs,
    );

    const refreshTimeout = window.setTimeout(async () => {
      try {
        await refreshSessionToken();
      } catch (error) {
        const state = useAuthStore.getState();
        if (state.isAuthenticated) {
          await state.removeAccessToken({
            reason: "expired",
            showToast: true,
            openLoginModal: true,
          });
        }
      }
    }, delayMs);

    return () => {
      window.clearTimeout(refreshTimeout);
    };
  }, [accessToken, isAuthenticated, isSessionBootstrapped]);

  useEffect(() => {
    const apiClients = [tuneMateClient, socketClient];

    const requestInterceptorIds = apiClients.map((client) =>
      client.interceptors.request.use(async (config) => {
        const requestUrl = config?.url || "";
        const skipRefreshFlow =
          config?.headers?.["x-skip-auth-refresh"] === "1" ||
          config?.headers?.["x-skip-auth-refresh"] === 1;

        if (isAuthRequest(requestUrl) || skipRefreshFlow) {
          return config;
        }

        const token = useAuthStore.getState().accessToken || Cookies.get("accessToken");
        config.headers = config.headers || {};

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (config.headers.Authorization) {
          delete config.headers.Authorization;
        }

        return config;
      }),
    );

    const responseInterceptorIds = apiClients.map((client) =>
      client.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error?.config || {};
          const requestUrl = originalRequest?.url || "";
          const responseStatus = error?.response?.status;
          const responseCode =
            error?.response?.data?.data?.code || error?.response?.data?.code;

          if (
            isAuthRequest(requestUrl) ||
            !shouldHandleUnauthorizedResponse(responseStatus, responseCode)
          ) {
            return Promise.reject(error);
          }

          if (originalRequest._retry) {
            const state = useAuthStore.getState();
            if (state.isAuthenticated) {
              await state.removeAccessToken({
                reason: "expired",
                showToast: true,
                openLoginModal: true,
              });
            }
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            const refreshedToken = await refreshSessionToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
            return client(originalRequest);
          } catch (refreshError) {
            const state = useAuthStore.getState();
            if (state.isAuthenticated) {
              await state.removeAccessToken({
                reason: "expired",
                showToast: true,
                openLoginModal: true,
              });
            }
            return Promise.reject(refreshError || error);
          }
        },
      ),
    );

    return () => {
      apiClients.forEach((client, index) => {
        client.interceptors.request.eject(requestInterceptorIds[index]);
        client.interceptors.response.eject(responseInterceptorIds[index]);
      });
    };
  }, []);

  if (!isSessionBootstrapped) {
    return (
      <SkeletonTheme baseColor="#202020" highlightColor="#444">
        <div className="min-h-screen bg-black" />
      </SkeletonTheme>
    );
  }

  return (
    <SkeletonTheme baseColor="#202020" highlightColor="#444">
      <Router>
        <div className="z-50">
          <NavBar />
          {isMobile ? <MobileNav /> : <SideBar />}
        </div>
        <Routes>
          {routesConfig.map((route) => (
            <Route
              key={route.path}
              exact
              path={route.path}
              element={route.element}
            />
          ))}
        </Routes>
        {component === "LOGIN" && <Login />}
        {component === "EDIT_PLAYLIST" && <EditPlayList />}
      </Router>
      <Player />
    </SkeletonTheme>
  );
}

export default App;
