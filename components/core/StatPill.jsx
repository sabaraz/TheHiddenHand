import React from "react";

/**
 * StatPill — a compact status readout used in the game status bar
 * (cycle, turn, cards remaining). Pill-shaped, gilt text, tabular.
 * Optionally prefixed with a Unicode glyph (↻ ◆ ▰).
 */
export function StatPill({ glyph, label, value, title, style, ...rest }) {
  return (
    <span
      title={title}
      aria-label={title || label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--hh-space-2)",
        minHeight: 26,
        minWidth: 42,
        padding: "3px 10px",
        border: "var(--hh-border-width) solid var(--hh-border)",
        borderRadius: "var(--hh-radius-pill)",
        background: "rgba(40, 35, 29, 0.74)",
        color: "var(--hh-cream)",
        whiteSpace: "nowrap",
        fontSize: "0.80rem",
        fontWeight: 720,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
      {...rest}
    >
      {glyph ? <span aria-hidden="true">{glyph}</span> : null}
      {label ? <span>{label}</span> : null}
      {value != null ? <span>{value}</span> : null}
    </span>
  );
}
