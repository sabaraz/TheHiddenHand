import React from "react";

/**
 * ConsequenceChip — the colored micro-label that previews what a
 * choice gives or takes: gain (sage), cost (muted), threat (red),
 * ritual (violet). Sign the text yourself (e.g. "+2 Food", "−1 Money").
 */
export function ConsequenceChip({ kind = "cost", children, style, ...rest }) {
  const kinds = {
    gain: {
      background: "rgba(113, 152, 107, 0.16)",
      color: "var(--hh-green)",
      borderColor: "rgba(113, 152, 107, 0.28)",
    },
    cost: {
      background: "rgba(182, 170, 155, 0.08)",
      color: "var(--hh-muted)",
      borderColor: "rgba(182, 170, 155, 0.18)",
    },
    threat: {
      background: "rgba(192, 48, 30, 0.14)",
      color: "#e06060",
      borderColor: "rgba(192, 48, 30, 0.28)",
    },
    ritual: {
      background: "rgba(167, 139, 250, 0.10)",
      color: "var(--hh-violet)",
      borderColor: "rgba(167, 139, 250, 0.22)",
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 6px",
        borderRadius: "var(--hh-radius-sm)",
        border: `var(--hh-border-width) solid ${kinds[kind].borderColor}`,
        background: kinds[kind].background,
        color: kinds[kind].color,
        fontSize: "0.70rem",
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: "0.01em",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
