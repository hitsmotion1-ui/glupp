"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  showValue?: boolean;
  count?: number;
}

export function StarRating({ value, onChange, size = 20, readonly = false, showValue = false, count }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const activeValue = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => setHover(null)}
            className={`transition-transform ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"}`}
          >
            <Star
              size={size}
              className={`transition-colors ${
                star <= activeValue
                  ? "text-[#F0C460] fill-[#F0C460]"
                  : "text-[#3A3530]"
              }`}
            />
          </button>
        ))}
      </div>
      {showValue && value !== null && value > 0 && (
        <span className="text-xs text-glupp-text-muted ml-1.5">
          {value.toFixed(1)}
          {count !== undefined && <span className="opacity-60"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
