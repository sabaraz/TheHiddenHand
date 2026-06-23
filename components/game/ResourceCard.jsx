import React from "react";

const RESOURCE_META = {
  money:     { mark: "M", label: "Money",    band: "var(--hh-money)" },
  food:      { mark: "F", label: "Food",     band: "var(--hh-food)" },
  cultists:  { mark: "C", label: "Cultist",  band: "var(--hh-cultists)" },
  prisoners: { mark: "P", label: "Prisoner", band: "var(--hh-prisoners)" },
  relics:    { mark: "R", label: "Relic",    band: "var(--hh-relics)" },
  suspicion: { mark: "!", label: "Suspicion",band: "var(--hh-suspicion)" },
};

/**
 * ResourceCard — a single 80×112 sigil card in the player's hand.
 * A colored band fills the top half, a circular letter-mark sits
 * over it, the resource name anchors the bottom. Suspicion pulses.
 */
export function ResourceCard({ resource = "money", style, ...rest }) {
  const meta = RESOURCE_META[resource] || RESOURCE_META.money;
  const isSuspicion = resource === "suspicion";

  return (
    <div
      aria-label={meta.label}
      style={{
        position: "relative",
        width: "var(--hh-resource-card-w)",
        minWidth: "var(--hh-resource-card-w)",
        height: "var(--hh-resource-card-h)",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: "var(--hh-space-3)",
        padding: 9,
        border: `var(--hh-border-width) solid ${isSuspicion ? "rgba(255,59,87,0.7)" : "var(--hh-border)"}`,
        borderRadius: "var(--hh-radius-lg)",
        background: "var(--hh-surface-2)",
        boxShadow: isSuspicion
          ? "0 0 0 1px rgba(255,59,87,0.28), 0 0 18px rgba(255,59,87,0.22), var(--hh-shadow-sm)"
          : "var(--hh-shadow-sm)",
        color: "var(--hh-text-body)",
        overflow: "hidden",
        animation: isSuspicion ? "hh-suspicion-pulse var(--hh-duration-pulse) ease-in-out infinite" : "none",
        ...style,
      }}
      {...rest}
    >
      {/* color band */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "0 0 auto",
          height: "52%",
          borderRadius: "7px 7px 0 0",
          background: meta.band,
          opacity: isSuspicion ? 0.85 : 0.72,
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          width: 26,
          height: 26,
          display: "inline-grid",
          placeItems: "center",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: "50%",
          color: "rgba(255,255,255,0.90)",
          fontSize: "0.74rem",
          fontWeight: 800,
          background: "rgba(0,0,0,0.22)",
        }}
      >
        {meta.mark}
      </span>
      <strong
        style={{
          position: "relative",
          zIndex: 1,
          alignSelf: "end",
          overflowWrap: "anywhere",
          color: "var(--hh-text-body)",
          fontSize: "0.82rem",
          lineHeight: 1.12,
        }}
      >
        {meta.label}
      </strong>
    </div>
  );
}
