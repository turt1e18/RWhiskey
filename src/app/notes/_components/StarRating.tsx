"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface Props {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}

export const StarRating = ({ value, onChange, size = 24 }: Props) => {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
      {[0, 1, 2, 3, 4].map((i) => {
        const left = i + 0.5;
        const right = i + 1;
        const fillLeft = display >= left;
        const fillRight = display >= right;
        return (
          <div key={i} className="relative" style={{ width: size, height: size }}>
            <Star
              className="absolute inset-0 text-[#3e2616]/30"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
            {/* 왼쪽 절반 */}
            <button
              type="button"
              onMouseEnter={() => setHover(left)}
              onClick={() => onChange(left)}
              className="absolute left-0 top-0 h-full w-1/2 z-10"
              aria-label={`${left}점`}
            />
            <button
              type="button"
              onMouseEnter={() => setHover(right)}
              onClick={() => onChange(right)}
              className="absolute right-0 top-0 h-full w-1/2 z-10"
              aria-label={`${right}점`}
            />
            {fillLeft && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: fillRight ? "100%" : "50%" }}>
                <Star
                  className="text-[#c9a14a] fill-[#d4af37]"
                  style={{ width: size, height: size }}
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        );
      })}
      <span className="ml-3 font-serif text-[#3e2616]/70 text-sm">{display.toFixed(1)} / 5.0</span>
    </div>
  );
};
