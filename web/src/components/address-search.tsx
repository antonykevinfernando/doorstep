'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, MapPin } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
}

interface AddressSearchProps {
  value: string;
  onChange: (address: string, name?: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressSearch({ value, onChange, placeholder = 'Search address...', className }: AddressSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [confirmed, setConfirmed] = useState(!!value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
    setConfirmed(!!value);
  }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchMapbox = useCallback(async (q: string) => {
    if (!MAPBOX_TOKEN || q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&types=address,poi&limit=5&country=us,ca`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features) {
        setResults(data.features.map((f: any) => ({ id: f.id, place_name: f.place_name, text: f.text })));
      }
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, []);

  function handleChange(text: string) {
    setQuery(text);
    setConfirmed(false);
    setShowDropdown(true);
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMapbox(text), 350);
  }

  function select(feature: MapboxFeature) {
    setQuery(feature.place_name);
    setConfirmed(true);
    setShowDropdown(false);
    setResults([]);
    onChange(feature.place_name, feature.text);
  }

  function clear() {
    setQuery('');
    setConfirmed(false);
    setResults([]);
    onChange('');
  }

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ''}`}>
      {confirmed && query ? (
        <div className="flex items-center gap-2 text-sm bg-sage/30 text-foreground/80 rounded-lg px-3 h-[42px]">
          <MapPin size={14} className="shrink-0 text-sage-dark" />
          <span className="truncate flex-1">{query}</span>
          <button
            type="button"
            onClick={clear}
            className="ml-auto text-muted-foreground hover:text-foreground shrink-0 text-base leading-none"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { if (results.length > 0 && !confirmed) setShowDropdown(true); }}
            placeholder={placeholder}
            className="pl-9 h-[42px]"
          />
          {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
        </div>
      )}

      {showDropdown && results.length > 0 && !confirmed && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-lg border border-border shadow-xl overflow-hidden">
          {results.map((f) => (
            <button
              type="button"
              key={f.id}
              onClick={() => select(f)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0"
            >
              <p className="text-sm font-medium">{f.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{f.place_name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
