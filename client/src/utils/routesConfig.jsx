import React from "react";

const Home = React.lazy(() => import("@/pages/Home"));
const Album = React.lazy(() => import("@/pages/Album"));
const SearchResults = React.lazy(() => import("@/pages/search/SearchResults"));
const Artist = React.lazy(() => import("@/pages/Artist"));
const Playlist = React.lazy(() => import("@/pages/Playlist"));
const Favorites = React.lazy(() => import("@/pages/Favorites"));
const UserPlaylists = React.lazy(() => import("@/pages/UserPlaylists"));
const UserRecents = React.lazy(() => import("@/pages/UserRecents"));
const MobileSearch = React.lazy(() => import("@/pages/search/MobileSearch"));
const UserLibrary = React.lazy(() => import("@/pages/UserLibrary"));
const ResetPassword = React.lazy(() => import("@/pages/auth/ResetPassword"));
const VerifyEmail = React.lazy(() => import("@/pages/auth/VerifyEmail"));
import PrivateRoute from "./PrivateRoute";

const routesConfig = [
  { path: "/", element: <Home /> },
  { path: "/albums/:id", element: <Album /> },
  {
    path: "/artists/:id",
    element: <Artist />
  },
  { path: "/playlists/:id", element: <Playlist /> },
  { path: "/search", element: <SearchResults /> },
  { path: "/m/search", element: <MobileSearch /> },
  {
    path: "/recents",
    element: (
      <PrivateRoute>
        <UserRecents />
      </PrivateRoute>
    )
  },
  {
    path: "/favorites",
    element: (
      <PrivateRoute>
        <Favorites />
      </PrivateRoute>
    )
  },
  {
    path: "/u/playlists/:id",
    element: (
      <PrivateRoute>
        <UserPlaylists />
      </PrivateRoute>
    )
  },
  { path: "/recommended/:id", element: <UserPlaylists /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/reset-password/:id", element: <ResetPassword /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  {
    path: "/your-library",
    element: (
      <PrivateRoute>
        <UserLibrary />
      </PrivateRoute>
    )
  }
];

export default routesConfig;
