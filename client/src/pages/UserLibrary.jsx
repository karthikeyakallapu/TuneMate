import Wrapper from "./Wrapper";
import BlockWrapper from "@/_components/Wrappers/BlockWrapper";
import ApiError from "@/_components/Error/ApiError";
import tuneMateInstance from "@/service/api/api";
import useSWR from "swr";
import useAuthStore from "@/store/use-auth";
import SideListSkeleton from "@/_components/skeletons/SideListSkeleton";
import { Link } from "react-router-dom";
import { BiSolidPlaylist } from "react-icons/bi";
import { FaHistory, FaHeadphones } from "react-icons/fa";
import { IoMdHeart } from "react-icons/io";
import { MdPlaylistAdd, MdLibraryMusic } from "react-icons/md";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

const UserLibrary = () => {
  const { isAuthenticated } = useAuthStore();
  const [hoveredItem, setHoveredItem] = useState(null);

  const {
    data: playlists,
    error,
    isLoading,
  } = useSWR(isAuthenticated ? "user-playlists" : null, () =>
    tuneMateInstance.getPlaylists(),
  );

  if (error) return <ApiError />;

  const quickAccessItems = [
    {
      to: "/recents",
      icon: FaHistory,
      label: "Recents",
      description: "Recently played songs",
      color: "from-cyan-500 to-blue-500",
    },
    {
      to: "/favorites",
      icon: IoMdHeart,
      label: "Favorites",
      description: "Your liked songs",
      color: "from-pink-500 to-rose-500",
    },
  ];

  return (
    <Wrapper>
      <BlockWrapper margin={"mb-6"}>
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
          <div className="flex flex-col p-4 md:p-6 pt-8">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                <MdLibraryMusic className="text-cyan-400" size={14} />
                <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                  Your Collection
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl jaro-head bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Your Library
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                All your playlists and saved content in one place
              </p>
            </div>

            {isLoading ? (
              <div className="pt-4">
                <SideListSkeleton count={8} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Quick Access Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {quickAccessItems.map((item) => (
                    <Link to={item.to} key={item.to}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={() => setHoveredItem(item.label)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          "relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300",
                          "bg-gradient-to-r from-[#1f1f23] to-[#18181b] border border-white/10",
                          "hover:shadow-lg hover:shadow-cyan-500/10",
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-full bg-gradient-to-r flex items-center justify-center",
                              item.color,
                            )}
                          >
                            <item.icon size={22} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg">
                              {item.label}
                            </h3>
                            <p className="text-xs text-gray-400">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Hover Glow Effect */}
                        {hoveredItem === item.label && (
                          <motion.div
                            layoutId="quickAccessGlow"
                            className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  ))}
                </div>

                {/* Playlists Section */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Your Playlists
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        {playlists?.length || 0} playlists created by you
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence>
                      {playlists?.length > 0 ? (
                        playlists.map((playlist, index) => (
                          <motion.div
                            key={playlist.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ x: 4 }}
                          >
                            <Link to={`/u/playlists/${playlist.id}`}>
                              <div
                                className={cn(
                                  "flex items-center cursor-pointer rounded-xl overflow-hidden p-3 transition-all duration-200",
                                  "bg-gradient-to-r from-[#1f1f23] to-[#18181b] border border-white/10",
                                  "hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5",
                                )}
                              >
                                {/* Playlist Image */}
                                <div className="relative flex-shrink-0">
                                  {playlist.image ? (
                                    <LazyLoadImage
                                      effect="blur"
                                      wrapperProps={{
                                        style: { transitionDelay: "0.5s" },
                                      }}
                                      loading="lazy"
                                      src={playlist.image}
                                      alt={playlist.name}
                                      className="h-12 w-12 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                                      <BiSolidPlaylist
                                        size={28}
                                        className="text-cyan-400"
                                      />
                                    </div>
                                  )}

                                  {/* Song Count Badge */}
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black/80 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <span className="text-[10px] text-gray-300">
                                      {playlist.songs.length}
                                    </span>
                                  </div>
                                </div>

                                {/* Playlist Info */}
                                <div className="flex-1 min-w-0 ml-3">
                                  <h3 className="font-semibold text-white text-sm truncate">
                                    {playlist.name}
                                  </h3>
                                  <p className="text-xs text-gray-400 truncate">
                                    {playlist.songs.length}{" "}
                                    {playlist.songs.length === 1
                                      ? "song"
                                      : "songs"}
                                    {playlist.updatedAt && (
                                      <span className="ml-2">
                                        • Updated{" "}
                                        {new Date(
                                          playlist.updatedAt,
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </p>
                                </div>

                                {/* Play Icon on Hover */}
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  whileHover={{ opacity: 1, scale: 1 }}
                                  className="flex-shrink-0 mr-2"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                                    <FaHeadphones
                                      size={12}
                                      className="text-white"
                                    />
                                  </div>
                                </motion.div>
                              </div>
                            </Link>
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl"
                        >
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                            <MdPlaylistAdd
                              size={32}
                              className="text-cyan-400"
                            />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            No playlists yet
                          </h3>
                          <p className="text-gray-400 text-sm max-w-md">
                            Create your first playlist to organize your favorite
                            songs
                          </p>
                          <button className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-white text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                            Create Playlist
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Total Stats */}
                {playlists?.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Total Playlists: {playlists.length}</span>
                      <span>
                        Total Songs:{" "}
                        {playlists.reduce((acc, p) => acc + p.songs.length, 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </BlockWrapper>
    </Wrapper>
  );
};

export default UserLibrary;
