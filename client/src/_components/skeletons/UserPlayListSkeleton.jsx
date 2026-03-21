import "react-loading-skeleton/dist/skeleton.css";
import Skeleton from "react-loading-skeleton";

const UserPlayListSkeleton = ({ count = 10 }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
      {/* Playlist Header Section */}
      <div className="relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent" />
        
        <div className="relative px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
            {/* Playlist Image Skeleton */}
            <div className="flex-shrink-0">
              <Skeleton 
                height={180} 
                width={180} 
                className="rounded-2xl"
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
            </div>
            
            {/* Playlist Info Skeleton */}
            <div className="flex-1 space-y-3">
              <div>
                <Skeleton 
                  height={24} 
                  width={120} 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
              </div>
              <div>
                <Skeleton 
                  height={40} 
                  width="70%" 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
              </div>
              <div>
                <Skeleton 
                  height={16} 
                  width="40%" 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons Skeleton */}
          <div className="flex items-center gap-3 mt-8">
            <Skeleton 
              height={44} 
              width={120} 
              className="rounded-full"
              baseColor="#1f1f23"
              highlightColor="#2a2a2e"
            />
            <Skeleton 
              height={44} 
              width={44} 
              className="rounded-full"
              baseColor="#1f1f23"
              highlightColor="#2a2a2e"
            />
          </div>
        </div>
      </div>

      {/* Songs List Section */}
      <div className="px-4">
        {/* Song List Header Skeleton */}
        <div className="grid grid-cols-10 gap-4 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm mb-2 border border-white/10">
          <div className="col-span-1">
            <Skeleton height={12} width={20} baseColor="#1f1f23" highlightColor="#2a2a2e" />
          </div>
          <div className="col-span-3">
            <Skeleton height={12} width={40} baseColor="#1f1f23" highlightColor="#2a2a2e" />
          </div>
          <div className="hidden md:flex col-span-2">
            <Skeleton height={12} width={50} baseColor="#1f1f23" highlightColor="#2a2a2e" />
          </div>
          <div className="hidden md:flex col-span-2">
            <Skeleton height={12} width={60} baseColor="#1f1f23" highlightColor="#2a2a2e" />
          </div>
          <div className="hidden md:flex col-span-1">
            <Skeleton height={12} width={40} baseColor="#1f1f23" highlightColor="#2a2a2e" />
          </div>
        </div>

        {/* Song Items Skeleton */}
        <div className="space-y-2">
          {[...Array(count)].map((_, i) => (
            <div 
              key={i} 
              className="group grid grid-cols-10 gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-200"
            >
              {/* Index/Play Button */}
              <div className="col-span-1 flex justify-center items-center">
                <Skeleton 
                  height={20} 
                  width={20} 
                  circle={true}
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
              </div>
              
              {/* Song Info */}
              <div className="md:col-span-3 col-span-9 flex items-center gap-3">
                <Skeleton 
                  height={40} 
                  width={40} 
                  className="rounded-lg"
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
                <div className="flex-1">
                  <Skeleton 
                    height={16} 
                    width="80%" 
                    baseColor="#1f1f23"
                    highlightColor="#2a2a2e"
                  />
                  <Skeleton 
                    height={12} 
                    width="50%" 
                    className="mt-1"
                    baseColor="#1f1f23"
                    highlightColor="#2a2a2e"
                  />
                </div>
              </div>
              
              {/* Album */}
              <div className="hidden md:flex col-span-2 justify-center items-center">
                <Skeleton 
                  height={14} 
                  width="70%" 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
              </div>
              
              {/* Date/Plays */}
              <div className="hidden md:flex col-span-2 justify-center items-center">
                <Skeleton 
                  height={14} 
                  width="60%" 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
              </div>
              
              {/* Duration */}
              <div className="hidden md:flex col-span-1 justify-center items-center">
                <Skeleton 
                  height={14} 
                  width="50%" 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserPlayListSkeleton;