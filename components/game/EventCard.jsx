import React from "react";
import { Tag } from "../core/Tag.jsx";

/**
 * EventCard — the tarot-proportioned card at the center of the
 * table. Two states:
 *  - closed : face-down draw; kind kicker, big title, summary, hint
 *  - open   : same, threat-red edge, with classification tags
 */
export function EventCard({
  kind = "common",
  title,
  body,
  tags = [],
  open = false,
  onClick,
  style,
  ...rest
}) {
  const interactive = !open && typeof onClick === "function";
  return (
    <article
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      aria-label={title}
      style={{
        width: "min(100%, 400px)",
        aspectRatio: "var(--hh-card-aspect)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: "clamp(18px, 4vw, 28px)",
        border: `var(--hh-border-width) solid ${open ? "var(--hh-border-threat)" : "var(--hh-border-gilt-strong)"}`,
        borderRadius: "var(--hh-radius-lg)",
        background: "rgba(0, 0, 0, 0.94)",
        boxShadow: "var(--hh-shadow-lg)",
        overflow: "hidden",
        cursor: interactive ? "pointer" : "default",
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: "clamp(10px,2vw,16px)" }}>
          <span
            style={{
              color: "var(--hh-red)",
              fontWeight: 700,
              fontSize: "0.76rem",
              textTransform: "uppercase",
              letterSpacing: "var(--hh-tracking-label)",
            }}
          >
            {kind}
          </span>
          {!open && (
            <span
              style={{
                fontSize: "0.70rem",
                color: "rgba(182,170,155,0.48)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              toque para abrir
            </span>
          )}
        </div>
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            lineHeight: 0.98,
            fontWeight: 820,
            color: "var(--hh-cream)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            color: "var(--hh-cream)",
            lineHeight: 1.48,
            fontSize: "clamp(0.9rem, 1.7vw, 1.04rem)",
          }}
        >
          {body}
        </p>
        {open && tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
