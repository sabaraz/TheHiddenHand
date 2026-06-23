import React from "react";
import { ConsequenceChip } from "../core/ConsequenceChip.jsx";

/**
 * ChoiceCard — one selectable option on an opened event. A heavy
 * tone-colored label sits above a divided consequence ledger
 * (gains on top, costs below). Tone tints the label + hover border.
 *
 * `gains` / `costs` are arrays of { kind, text }.
 */
export function ChoiceCard({
  label,
  tone = "neutral",
  gains = [],
  costs = [],
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const toneBorder = {
    neutral: "var(--hh-border-gilt)",
    danger: "rgba(192, 48, 30, 0.62)",
    success: "rgba(113, 152, 107, 0.44)",
    info: "rgba(102, 138, 171, 0.44)",
  };
  const toneLabel = {
    neutral: "var(--hh-text-body)",
    danger: "var(--hh-blood)",
    success: "var(--hh-green)",
    info: "var(--hh-blue)",
  };

  const Row = (items) =>
    items.length ? (
      items.map((c, i) => (
        <ConsequenceChip key={i} kind={c.kind}>
          {c.text}
        </ConsequenceChip>
      ))
    ) : (
      <span style={{ color: "rgba(182,170,155,0.28)", fontSize: "0.75rem" }}>—</span>
    );

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = "var(--hh-red)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = toneBorder[tone]; }}
      style={{
        width: "100%",
        minHeight: "clamp(86px, 11vw, 132px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "clamp(14px,2vw,22px) clamp(16px,2.6vw,28px)",
        border: `var(--hh-border-width) solid ${toneBorder[tone]}`,
        borderRadius: "var(--hh-radius-md)",
        background: "rgba(0, 0, 0, 0.72)",
        color: "var(--hh-text-body)",
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.58 : 1,
        transition: "border-color var(--hh-duration-fast) var(--hh-ease)",
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          display: "block",
          fontWeight: 720,
          fontSize: "clamp(1rem, 2.4vw, 1.34rem)",
          lineHeight: 1.22,
          marginBottom: "clamp(10px,1.6vw,16px)",
          color: toneLabel[tone],
        }}
      >
        {label}
      </span>
      <div style={{ borderTop: "var(--hh-border-width) solid var(--hh-border)", paddingTop: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, minHeight: 20 }}>{Row(gains)}</div>
        <div style={{ height: 1, background: "var(--hh-border)", margin: "6px 0", opacity: 0.5 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, minHeight: 20 }}>{Row(costs)}</div>
      </div>
    </button>
  );
}
