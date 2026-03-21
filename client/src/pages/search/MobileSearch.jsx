import useSearchStore from "@/store/use-search.js";
import Wrapper from "@/pages/Wrapper.jsx";
import { FiSearch } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { IoClose } from "react-icons/io5";
import MobileResults from "./MobileResults";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const MobileSearch = () => {
  const { search, setSearch } = useSearchStore();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const clearSearch = () => {
    setSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Wrapper>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
        {/* Search Header */}
        <div className="sticky top-0 left-0 z-30 bg-gradient-to-b from-[#0a0a0f] to-[#0a0a0f]/95 backdrop-blur-sm">
          {/* Search Bar Container */}
          <div className="px-3 pt-4 pb-3">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`
                flex items-center bg-[#1e1e1e] rounded-xl transition-all duration-200
                ${isFocused ? "ring-2 ring-cyan-500/50 border-cyan-500/50" : "border border-gray-700"}
              `}
            >
              {/* Search Icon */}
              <div className="pl-4">
                <FiSearch
                  size={18}
                  className={isFocused ? "text-cyan-400" : "text-gray-400"}
                />
              </div>

              {/* Search Input */}
              <Input
                ref={inputRef}
                className="flex-1 bg-transparent h-[48px] text-base text-white border-none focus:outline-none focus-visible:ring-0 placeholder:text-gray-500"
                placeholder="Search for songs, albums, or artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />

              {/* Clear Button */}
              <AnimatePresence>
                {search && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="pr-4"
                  >
                    <button
                      onClick={clearSearch}
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Clear search"
                    >
                      <IoClose
                        size={18}
                        className="text-gray-400 hover:text-white"
                      />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Search Stats */}
            {search && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 pb-2"
              >
                <p className="text-xs text-gray-500">
                  Showing results for "{search}"
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="px-3 pb-20">
          <AnimatePresence mode="wait">
            <MobileResults key={search} />
          </AnimatePresence>
        </div>

        {/* No Results Message */}
        {search && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-20 left-0 right-0 text-center pointer-events-none"
          >
            <p className="text-xs text-gray-500">Press enter to search</p>
          </motion.div>
        )}
      </div>
    </Wrapper>
  );
};

export default MobileSearch;
