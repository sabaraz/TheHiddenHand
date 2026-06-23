import React from "react";

/**
 * Meter — a thin continuous progress bar for ritual stage progress.
 * The fill sweeps blood → gold → green, reading as a rite moving
 * from danger toward completion.
 */
export function Meter({ value = 0, max = 100, label, style, ...rest }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      style={{
        height: 8,
        border: "var(--hh-border-width) solid var(--hh-border)",
        borderRadius: "var(--hh-radius-pill)",
        overflow: "hidden",
        background: "#151310",
        ...style,
      }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      {...rest}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--hh-blood), var(--hh-gold), var(--hh-green))",
          transition: "width var(--hh-duration-fast) var(--hh-ease)",
        }}
      />
    </div>
  );
}
