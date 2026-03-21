import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';

const SideListSkeleton = ({ count = 8 }) => {
  return (
    <div className="flex flex-col space-y-3 px-2">
      {[...Array(count)].map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200"
        >
          {/* Image Skeleton */}
          <div className="flex-shrink-0">
            <Skeleton 
              height={48} 
              width={48} 
              className="rounded-lg"
              baseColor="#1f1f23"
              highlightColor="#2a2a2e"
            />
          </div>
          
          {/* Text Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <Skeleton 
                height={18} 
                width="85%" 
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

export default SideListSkeleton;