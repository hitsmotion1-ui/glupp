"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Search, Plus, MapPin } from "lucide-react";

interface Brewery {
  id: string;
  name: string;
  city: string | null;
  country_code: string | null;
}

interface BrewerySelectProps {
  value: string;
  onChange: (name: string, breweryId?: string) => void;
  onCityChange?: (city: string) => void;
  placeholder?: string;
  className?: string;
}

export function BrewerySelect({ value, onChange, onCityChange, placeholder, className }: BrewerySelectProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Brewery[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search breweries
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("breweries")
          .select("id, name, city, country_code")
          .ilike("name", `%${query}%`)
          .order("name")
          .limit(8);
        setSuggestions(data || []);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (brewery: Brewery) => {
    setQuery(brewery.name);
    onChange(brewery.name, brewery.id);
    if (brewery.city && onCityChange) {
      onCityChange(brewery.city);
    }
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setShowSuggestions(true);
  };

  const exactMatch = suggestions.some(s => s.name.toLowerCase() === query.toLowerCase());

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder || "Ex: Brasserie d'Achouffe"}
          className={className || "w-full px-3 py-2.5 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors"}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border border-glupp-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || (query.length >= 2 && !loading && !exactMatch)) && (
        <div className="absolute z-50 w-full mt-1 bg-glupp-card border border-glupp-border rounded-glupp shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleSelect(b)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-glupp-accent/10 transition-colors border-b border-glupp-border/30 last:border-0"
            >
              <span className="text-glupp-cream">{b.name}</span>
              {b.city && (
                <span className="text-[10px] text-glupp-text-muted ml-2 flex items-center gap-0.5 inline-flex">
                  <MapPin size={8} />
                  {b.city}
                </span>
              )}
            </button>
          ))}

          {/* Option pour créer une nouvelle brasserie */}
          {query.length >= 2 && !exactMatch && (
            <button
              type="button"
              onClick={() => {
                onChange(query);
                setShowSuggestions(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-glupp-accent hover:bg-glupp-accent/10 transition-colors flex items-center gap-1.5"
            >
              <Plus size={12} />
              Creer &quot;{query}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
