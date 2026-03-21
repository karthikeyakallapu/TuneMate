/* eslint-disable react/prop-types */
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useMediaQuery } from "usehooks-ts";

const MobileAlbumSkeleton = ({ count = 4 }) => {
  return (
    <div className="flex overflow-x-auto gap-4 mt-4 pb-2 scrollbar-hide">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[140px]">
          <div className="flex flex-col gap-2">
            <div className="aspect-square w-full">
              <Skeleton 
                height="100%" 
                width="100%" 
                className="rounded-lg"
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
            </div>
            <div>
              <Skeleton 
                height={18} 
                width="80%" 
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
            </div>
            <div>
              <Skeleton 
                height={14} 
                width="60%" 
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AlbumSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-square w-full">
            <Skeleton 
              height="100%" 
              width="100%" 
              className="rounded-lg"
              baseColor="#1f1f23"
              highlightColor="#2a2a2e"
            />
          </div>
          <div>
            <Skeleton 
              height={20} 
              width="80%" 
              baseColor="#1f1f23"
              highlightColor="#2a2a2e"
            />
          </div>
          <div>
            <Skeleton 
              height={16} 
              width="60%" 
              baseColor="#1f1f23"
              highlightColor="#2a2a2e"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const HomeSkeleton = ({ count = 12 }) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden mb-8">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 via-blue-500/10 to-transparent" />
        
        <div className="relative px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
            {/* Hero Image Skeleton */}
            <div className="flex-shrink-0">
              <Skeleton 
                height={isMobile ? 150 : 200} 
                width={isMobile ? 150 : 200} 
                className="rounded-2xl"
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
            </div>
            
            {/* Hero Info Skeleton */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Skeleton 
                  height={24} 
                  width={120} 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
                <Skeleton 
                  height={isMobile ? 32 : 48} 
                  width="80%" 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
                <Skeleton 
                  height={16} 
                  width="60%" 
                  baseColor="#1f1f23"
                  highlightColor="#2a2a2e"
                />
              </div>
              
              {/* Action Buttons Skeleton */}
              <div className="flex gap-3 mt-4">
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
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4">
        {!isMobile ? (
          <div>
            {/* Section Header Skeleton */}
            <div className="flex justify-between items-center mb-4">
              <Skeleton 
                height={28} 
                width={200} 
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
              <Skeleton 
                height={20} 
                width={80} 
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
            </div>
            
            {/* Album Grid Skeleton */}
            <AlbumSkeleton count={count} />
          </div>
        ) : (
          <div>
            {/* Mobile Section Header Skeleton */}
            <div className="flex justify-between items-center mb-3">
              <Skeleton 
                height={24} 
                width={150} 
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
              <Skeleton 
                height={16} 
                width={60} 
                baseColor="#1f1f23"
                highlightColor="#2a2a2e"
              />
            </div>
            
            {/* Mobile Horizontal Scroll Skeleton */}
            <MobileAlbumSkeleton count={4} />
          </div>
        )}
      </div>
    </div>
  );
};

export { HomeSkeleton, MobileAlbumSkeleton };