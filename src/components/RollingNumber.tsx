import React, { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  decimals?: number;
  style?: React.CSSProperties;
  color?: string;
}

export function RollingNumber({ value, decimals = 0, style, color = "inherit" }: Props) {
  const formatted = value.toFixed(decimals);

  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", overflow: "visible", ...style }}>
      {formatted.split("").map((char, i) => (
        // Key from the RIGHT so length changes don't recycle wrong Digit instances
        <Digit key={formatted.length - 1 - i} char={char} color={color} />
      ))}
    </span>
  );
}

function Digit({ char, color }: { char: string; color: string }) {
  const isNum = /\d/.test(char);

  // Use a ref for the "previous" value to avoid the stale-closure bug.
  // prevRef always holds what was last rendered — the effect never reads stale state.
  const prevRef   = useRef<string>(char);
  const [prev, setPrev]         = useState<string>(char);
  const [animating, setAnimating] = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (char === prevRef.current) return;    // nothing changed
    setPrev(prevRef.current);               // save old value for the exit animation
    prevRef.current = char;                 // update ref immediately (no stale read)
    setAnimating(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAnimating(false), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [char]);

  if (!isNum) {
    return (
      <span style={{ color: color === "inherit" ? undefined : color, opacity: 0.6 }}>
        {char}
      </span>
    );
  }

  return (
    <span style={{
      display: "inline-block",
      overflow: "hidden",
      position: "relative",
      height: "1em",
      lineHeight: "1em",
    }}>
      {/* Current digit — slides up when animating */}
      <span style={{
        display: "block",
        transform: animating ? "translateY(-100%)" : "translateY(0)",
        transition: animating ? "transform 0.25s cubic-bezier(0.4,0,0.2,1)" : "none",
        color,
      }}>
        {char}
      </span>
      {/* Previous digit — enters from below while current exits upward */}
      {animating && (
        <span style={{
          position: "absolute",
          top: "100%",
          left: 0,
          color,
          transform: "translateY(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {prev}
        </span>
      )}
    </span>
  );
}
