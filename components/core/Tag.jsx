import React from "react";

/**
 * Tag — a small pill that classifies an event (food, suspicion,
 * ritual, apocalyptic…). Muted outline capsule, lowercase content.
 */
export function Tag({ children, style, ...rest }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 7px",
        border: "var(--hh-border-width) solid var(--hh-border)",
        borderRadius: "var(--hh-radius-pill)",
        color: "var(--hh-text-label)",
        fontSize: "0.73rem",
        lineHeight: 1.3,
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
