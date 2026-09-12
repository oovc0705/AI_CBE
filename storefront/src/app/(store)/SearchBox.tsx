'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Suggestion {
  id: number;
  name: string;
}

export default function SearchBox({ dark = false }: { dark?: boolean } = {}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [allProducts, setAllProducts] = useState<Suggestion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load product list once for client-side suggestions
  const loadProducts = useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch('/api/products?page=0&size=100');
      if (!res.ok) return;
      const json = await res.json();
      if (json.code === 200) {
        const items = (json.data.content ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
        }));
        setAllProducts(items);
        setLoaded(true);
      }
    } catch { /* ignore */ }
  }, [loaded]);

  // Debounced filter
  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!value.trim()) {
        setSuggestions([]);
        return;
      }
      const q = value.toLowerCase();
      const matches = allProducts.filter((p) =>
        p.name.toLowerCase().includes(q)
      ).slice(0, 6);
      setSuggestions(matches);
      setOpen(matches.length > 0);
    }, 300);
  };

  // Load products on first focus
  const handleFocus = () => {
    loadProducts();
    if (query.trim() && suggestions.length > 0) {
      setOpen(true);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (s: Suggestion) => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(s.name)}`);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-xs">
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={handleFocus}
            placeholder="Search products..."
            className={`pl-9 pr-3 py-2 text-body-sm rounded-full border transition-all duration-300 w-full ${
              dark
                ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40'
                : 'input-field'
            }`}
            aria-label="Search products"
            autoComplete="off"
          />
        </div>
      </form>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[var(--radius-input)] shadow-[var(--shadow-elevation-2)] z-50 overflow-hidden animate-fade-in">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-body-sm text-gray-700 hover:bg-gray-100 hover:text-brand transition-fast flex items-center gap-2 min-h-[44px]"
                onClick={() => handleSuggestionClick(s)}
              >
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="truncate">{s.name}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-body-sm text-brand font-medium hover:bg-gray-100 transition-fast border-t border-gray-100 min-h-[44px]"
              onClick={() => {
                setOpen(false);
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
            >
              View all results for &ldquo;{query}&rdquo;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
