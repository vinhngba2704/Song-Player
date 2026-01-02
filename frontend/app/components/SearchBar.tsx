'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className="relative w-full group max-w-full mx-auto">
      {/* Icon Search */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        <Search className="w-5 h-5 text-zinc-500 group-focus-within:text-white transition-colors" />
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tìm kiếm bài hát, nghệ sĩ..."
        className="w-full bg-[#242424] hover:bg-[#2a2a2a] text-white text-sm py-3.5 pl-12 pr-10 rounded-full 
                   border border-transparent focus:border-zinc-700 focus:bg-[#2d2d2d] focus:outline-none 
                   shadow-2xl transition-all duration-300 placeholder:text-zinc-500"
      />

      {/* Nút Clear nhanh */}
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}