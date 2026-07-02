// src/components/common/SearchBar.jsx
import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function SearchBar({ onSearch, placeholder = 'Search...', className = '' }) {
  const { isDarkMode } = useTheme();
  const [query, setQuery] = useState('');

  const handleSearch = (value) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} size={20} />
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'}`}
      />
      {query && (
        <button
          onClick={() => handleSearch('')}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}