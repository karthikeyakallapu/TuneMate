/* eslint-disable react/prop-types */
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';

const AlbumSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2 p-2 rounded-xl">
          {/* Image Skeleton */}
          <div className="aspect-square w-full">
            <Skeleton 
              height="100%" 
              width="100%" 
              className="rounded-lg"
              baseColor="#1f1f23"
              highlightColor="#2a2a2e"
            />
          </div>
          
          {/* Title Skeleton */}
          <div className="mt-2">
            <Skeleton 
              height={20} 
              width="80%" 
              baseColor="#1f1f23"
              highlightColor="#2a2a2e"
            />
          </div>
          
          {/* Subtitle Skeleton */}
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

export default AlbumSkeleton;