import { useEffect } from "react";
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

function App() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { component } = useModalStore();
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      const state = useAuthStore.getState();
      if (state.isAuthenticated && state.accessToken) {
        return;
      }

      try {
        const response = await tuneMateClient.post(ENDPOINTS.refreshToken, null, {
          headers: { "x-skip-auth-refresh": "1" },
        });
        const refreshedToken = response?.data?.data?.accessToken;

        if (!isMounted) {
          return;
        }

        useAuthStore.getState().setAccessToken(refreshedToken);
      } catch (error) {
        // Silent failure is expected when refresh cookie doesn't exist
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
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
        const response = await tuneMateClient.post(ENDPOINTS.refreshToken, null, {
          headers: { "x-skip-auth-refresh": "1" },
        });
        const refreshedToken = response?.data?.data?.accessToken;
        const didSetToken = useAuthStore.getState().setAccessToken(refreshedToken);

        if (!didSetToken) {
          throw new Error("Failed to set refreshed token");
        }
      } catch (error) {
        await useAuthStore.getState().removeAccessToken({
          reason: "expired",
          showToast: true,
          openLoginModal: true,
        });
      }
    }, delayMs);

    return () => {
      window.clearTimeout(refreshTimeout);
    };
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    let refreshInFlightPromise = null;
    const apiClients = [tuneMateClient, socketClient];

    const refreshSession = async () => {
      if (!refreshInFlightPromise) {
        refreshInFlightPromise = (async () => {
          const response = await tuneMateClient.post(ENDPOINTS.refreshToken, null, {
            headers: { "x-skip-auth-refresh": "1" },
          });

          const refreshedToken = response?.data?.data?.accessToken;
          const didSetToken = useAuthStore.getState().setAccessToken(refreshedToken);

          if (!didSetToken) {
            throw new Error(
              "Refresh token response did not contain a valid access token.",
            );
          }

          return refreshedToken;
        })().finally(() => {
          refreshInFlightPromise = null;
        });
      }

      return refreshInFlightPromise;
    };

    const requestInterceptorIds = apiClients.map((client) =>
      client.interceptors.request.use(async (config) => {
        const requestUrl = config?.url || "";
        const skipRefreshFlow =
          config?.headers?.["x-skip-auth-refresh"] === "1" ||
          config?.headers?.["x-skip-auth-refresh"] === 1;

        if (isAuthRequest(requestUrl) || skipRefreshFlow) {
          return config;
        }

        const token = Cookies.get("accessToken");
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
            await useAuthStore.getState().removeAccessToken({
              reason: "expired",
              showToast: true,
              openLoginModal: true,
            });
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          try {
            const refreshedToken = await refreshSession();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
            return client(originalRequest);
          } catch (refreshError) {
            await useAuthStore.getState().removeAccessToken({
              reason: "expired",
              showToast: true,
              openLoginModal: true,
            });
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
