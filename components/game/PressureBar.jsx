import React from "react";

/**
 * PressureBar — a row of segmented fragments showing accumulated
 * pressure toward an apocalyptic event. Filled fragments glow red.
 * Default capacity is 3 (the game's apocalypse threshold).
 */
export function PressureBar({ value = 0, max = 3, label = "Pressão", style, ...rest }) {
  const filled = Math.min(value, max);
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 7, ...style }}
      aria-label={`${label} ${filled}/${max}`}
      {...rest}
    >
      <span
        style={{
          fontSize: "0.73rem",
          color: "rgba(182,170,155,0.55)",
          textTransform: "uppercase",
          letterSpacing: "var(--hh-tracking-label)",
          marginRight: 2,
        }}
      >
        {label}
      </span>
      {Array.from({ length: max }, (_, i) => {
        const isFilled = i < filled;
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: 30,
              height: 7,
              borderRadius: "var(--hh-radius-xs)",
              border: `var(--hh-border-width) solid ${isFilled ? "var(--hh-red)" : "rgba(192,48,30,0.28)"}`,
              background: isFilled ? "var(--hh-red)" : "transparent",
              boxShadow: isFilled ? "var(--hh-glow-pressure)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}
