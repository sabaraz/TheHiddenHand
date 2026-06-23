/* @ds-bundle: {"format":3,"namespace":"TheHiddenHandDesignSystem_9a3a95","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ConsequenceChip","sourcePath":"components/core/ConsequenceChip.jsx"},{"name":"StatPill","sourcePath":"components/core/StatPill.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"ChoiceCard","sourcePath":"components/game/ChoiceCard.jsx"},{"name":"EventCard","sourcePath":"components/game/EventCard.jsx"},{"name":"Meter","sourcePath":"components/game/Meter.jsx"},{"name":"PressureBar","sourcePath":"components/game/PressureBar.jsx"},{"name":"ResourceCard","sourcePath":"components/game/ResourceCard.jsx"}],"sourceHashes":{"components/core/Button.jsx":"316092d96aed","components/core/ConsequenceChip.jsx":"66dccb6520a7","components/core/StatPill.jsx":"7fcd86433944","components/core/Tag.jsx":"161f8a238e40","components/game/ChoiceCard.jsx":"c00f85d76ca3","components/game/EventCard.jsx":"184dd3405024","components/game/Meter.jsx":"4ce544453ba7","components/game/PressureBar.jsx":"5e85b9081aaa","components/game/ResourceCard.jsx":"872530f1fa0a","ui_kits/the-hidden-hand/data.js":"986248fdacc9","ui_kits/the-hidden-hand/screens.jsx":"db7691639f04"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TheHiddenHandDesignSystem_9a3a95 = window.TheHiddenHandDesignSystem_9a3a95 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — The Hidden Hand's primary action control.
 *
 * Variants:
 *  - primary   : blood-red filled, white text (commit / "New run")
 *  - secondary : inset surface, gilt border on hover (load / cancel)
 *  - ghost     : transparent, used inside popups
 *  - panic     : red-outlined alarm action ("Pânico")
 */
function Button({
  variant = "secondary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  style,
  children,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: "7px 14px",
      fontSize: "var(--hh-text-sm)",
      minHeight: 32
    },
    md: {
      padding: "9px 16px",
      fontSize: "var(--hh-text-base)",
      minHeight: 40
    },
    lg: {
      padding: "14px 28px",
      fontSize: "1rem",
      minHeight: 48,
      minWidth: 220
    }
  };
  const variants = {
    primary: {
      border: "none",
      background: "var(--hh-action-bg)",
      color: "var(--hh-action-fg)"
    },
    secondary: {
      border: "var(--hh-border-width) solid var(--hh-border)",
      background: "var(--hh-surface-2)",
      color: "var(--hh-text-label)"
    },
    ghost: {
      border: "var(--hh-border-width) solid var(--hh-border)",
      background: "transparent",
      color: "var(--hh-text-body)"
    },
    panic: {
      border: "var(--hh-border-width) solid rgba(192, 48, 30, 0.38)",
      background: "var(--hh-surface-2)",
      color: "var(--hh-red)"
    }
  };
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--hh-space-2)",
    borderRadius: "var(--hh-radius-md)",
    fontFamily: "var(--hh-font-sans)",
    fontWeight: "var(--hh-weight-semibold)",
    letterSpacing: variant === "primary" ? "0.05em" : "0",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    transition: "background var(--hh-duration-fast) var(--hh-ease), border-color var(--hh-duration-fast) var(--hh-ease), color var(--hh-duration-fast) var(--hh-ease)",
    ...sizes[size],
    ...variants[variant],
    ...style
  };
  const onEnter = e => {
    if (disabled) return;
    if (variant === "primary") e.currentTarget.style.background = "var(--hh-action-bg-hover)";else if (variant === "panic") {
      e.currentTarget.style.borderColor = "var(--hh-red)";
      e.currentTarget.style.background = "rgba(192, 48, 30, 0.10)";
    } else {
      e.currentTarget.style.borderColor = "var(--hh-accent)";
      e.currentTarget.style.color = "var(--hh-accent)";
    }
  };
  const onLeave = e => {
    Object.assign(e.currentTarget.style, {
      background: variants[variant].background,
      borderColor: variants[variant].border?.includes("solid") ? variants[variant].border.split("solid ")[1] : "",
      color: variants[variant].color
    });
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    style: base
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/ConsequenceChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ConsequenceChip — the colored micro-label that previews what a
 * choice gives or takes: gain (sage), cost (muted), threat (red),
 * ritual (violet). Sign the text yourself (e.g. "+2 Food", "−1 Money").
 */
function ConsequenceChip({
  kind = "cost",
  children,
  style,
  ...rest
}) {
  const kinds = {
    gain: {
      background: "rgba(113, 152, 107, 0.16)",
      color: "var(--hh-green)",
      borderColor: "rgba(113, 152, 107, 0.28)"
    },
    cost: {
      background: "rgba(182, 170, 155, 0.08)",
      color: "var(--hh-muted)",
      borderColor: "rgba(182, 170, 155, 0.18)"
    },
    threat: {
      background: "rgba(192, 48, 30, 0.14)",
      color: "#e06060",
      borderColor: "rgba(192, 48, 30, 0.28)"
    },
    ritual: {
      background: "rgba(167, 139, 250, 0.10)",
      color: "var(--hh-violet)",
      borderColor: "rgba(167, 139, 250, 0.22)"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
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
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { ConsequenceChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ConsequenceChip.jsx", error: String((e && e.message) || e) }); }

// components/core/StatPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatPill — a compact status readout used in the game status bar
 * (cycle, turn, cards remaining). Pill-shaped, gilt text, tabular.
 * Optionally prefixed with a Unicode glyph (↻ ◆ ▰).
 */
function StatPill({
  glyph,
  label,
  value,
  title,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    title: title,
    "aria-label": title || label,
    style: {
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
      ...style
    }
  }, rest), glyph ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, glyph) : null, label ? /*#__PURE__*/React.createElement("span", null, label) : null, value != null ? /*#__PURE__*/React.createElement("span", null, value) : null);
}
Object.assign(__ds_scope, { StatPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatPill.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag — a small pill that classifies an event (food, suspicion,
 * ritual, apocalyptic…). Muted outline capsule, lowercase content.
 */
function Tag({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 7px",
      border: "var(--hh-border-width) solid var(--hh-border)",
      borderRadius: "var(--hh-radius-pill)",
      color: "var(--hh-text-label)",
      fontSize: "0.73rem",
      lineHeight: 1.3,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/game/ChoiceCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ChoiceCard — one selectable option on an opened event. A heavy
 * tone-colored label sits above a divided consequence ledger
 * (gains on top, costs below). Tone tints the label + hover border.
 *
 * `gains` / `costs` are arrays of { kind, text }.
 */
function ChoiceCard({
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
    info: "rgba(102, 138, 171, 0.44)"
  };
  const toneLabel = {
    neutral: "var(--hh-text-body)",
    danger: "var(--hh-blood)",
    success: "var(--hh-green)",
    info: "var(--hh-blue)"
  };
  const Row = items => items.length ? items.map((c, i) => /*#__PURE__*/React.createElement(__ds_scope.ConsequenceChip, {
    key: i,
    kind: c.kind
  }, c.text)) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "rgba(182,170,155,0.28)",
      fontSize: "0.75rem"
    }
  }, "\u2014");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: e => {
      if (!disabled) e.currentTarget.style.borderColor = "var(--hh-red)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.borderColor = toneBorder[tone];
    },
    style: {
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
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontWeight: 720,
      fontSize: "clamp(1rem, 2.4vw, 1.34rem)",
      lineHeight: 1.22,
      marginBottom: "clamp(10px,1.6vw,16px)",
      color: toneLabel[tone]
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "var(--hh-border-width) solid var(--hh-border)",
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      minHeight: 20
    }
  }, Row(gains)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--hh-border)",
      margin: "6px 0",
      opacity: 0.5
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      minHeight: 20
    }
  }, Row(costs))));
}
Object.assign(__ds_scope, { ChoiceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ChoiceCard.jsx", error: String((e && e.message) || e) }); }

// components/game/EventCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * EventCard — the tarot-proportioned card at the center of the
 * table. Two states:
 *  - closed : face-down draw; kind kicker, big title, summary, hint
 *  - open   : same, threat-red edge, with classification tags
 */
function EventCard({
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
  return /*#__PURE__*/React.createElement("article", _extends({
    role: interactive ? "button" : undefined,
    tabIndex: interactive ? 0 : undefined,
    onClick: interactive ? onClick : undefined,
    "aria-label": title,
    style: {
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
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      marginBottom: "clamp(10px,2vw,16px)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--hh-red)",
      fontWeight: 700,
      fontSize: "0.76rem",
      textTransform: "uppercase",
      letterSpacing: "var(--hh-tracking-label)"
    }
  }, kind), !open && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "0.70rem",
      color: "rgba(182,170,155,0.48)",
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "toque para abrir")), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 12px",
      fontSize: "clamp(2rem, 5vw, 3.25rem)",
      lineHeight: 0.98,
      fontWeight: 820,
      color: "var(--hh-cream)"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "var(--hh-cream)",
      lineHeight: 1.48,
      fontSize: "clamp(0.9rem, 1.7vw, 1.04rem)"
    }
  }, body), open && tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 12
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: t
  }, t)))));
}
Object.assign(__ds_scope, { EventCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/EventCard.jsx", error: String((e && e.message) || e) }); }

// components/game/Meter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Meter — a thin continuous progress bar for ritual stage progress.
 * The fill sweeps blood → gold → green, reading as a rite moving
 * from danger toward completion.
 */
function Meter({
  value = 0,
  max = 100,
  label,
  style,
  ...rest
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      height: 8,
      border: "var(--hh-border-width) solid var(--hh-border)",
      borderRadius: "var(--hh-radius-pill)",
      overflow: "hidden",
      background: "#151310",
      ...style
    },
    role: "progressbar",
    "aria-valuenow": Math.round(pct),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-label": label
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${pct}%`,
      background: "linear-gradient(90deg, var(--hh-blood), var(--hh-gold), var(--hh-green))",
      transition: "width var(--hh-duration-fast) var(--hh-ease)"
    }
  }));
}
Object.assign(__ds_scope, { Meter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/Meter.jsx", error: String((e && e.message) || e) }); }

// components/game/PressureBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PressureBar — a row of segmented fragments showing accumulated
 * pressure toward an apocalyptic event. Filled fragments glow red.
 * Default capacity is 3 (the game's apocalypse threshold).
 */
function PressureBar({
  value = 0,
  max = 3,
  label = "Pressão",
  style,
  ...rest
}) {
  const filled = Math.min(value, max);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      ...style
    },
    "aria-label": `${label} ${filled}/${max}`
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "0.73rem",
      color: "rgba(182,170,155,0.55)",
      textTransform: "uppercase",
      letterSpacing: "var(--hh-tracking-label)",
      marginRight: 2
    }
  }, label), Array.from({
    length: max
  }, (_, i) => {
    const isFilled = i < filled;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      "aria-hidden": "true",
      style: {
        width: 30,
        height: 7,
        borderRadius: "var(--hh-radius-xs)",
        border: `var(--hh-border-width) solid ${isFilled ? "var(--hh-red)" : "rgba(192,48,30,0.28)"}`,
        background: isFilled ? "var(--hh-red)" : "transparent",
        boxShadow: isFilled ? "var(--hh-glow-pressure)" : "none"
      }
    });
  }));
}
Object.assign(__ds_scope, { PressureBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/PressureBar.jsx", error: String((e && e.message) || e) }); }

// components/game/ResourceCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const RESOURCE_META = {
  money: {
    mark: "M",
    label: "Money",
    band: "var(--hh-money)"
  },
  food: {
    mark: "F",
    label: "Food",
    band: "var(--hh-food)"
  },
  cultists: {
    mark: "C",
    label: "Cultist",
    band: "var(--hh-cultists)"
  },
  prisoners: {
    mark: "P",
    label: "Prisoner",
    band: "var(--hh-prisoners)"
  },
  relics: {
    mark: "R",
    label: "Relic",
    band: "var(--hh-relics)"
  },
  suspicion: {
    mark: "!",
    label: "Suspicion",
    band: "var(--hh-suspicion)"
  }
};

/**
 * ResourceCard — a single 80×112 sigil card in the player's hand.
 * A colored band fills the top half, a circular letter-mark sits
 * over it, the resource name anchors the bottom. Suspicion pulses.
 */
function ResourceCard({
  resource = "money",
  style,
  ...rest
}) {
  const meta = RESOURCE_META[resource] || RESOURCE_META.money;
  const isSuspicion = resource === "suspicion";
  return /*#__PURE__*/React.createElement("div", _extends({
    "aria-label": meta.label,
    style: {
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
      boxShadow: isSuspicion ? "0 0 0 1px rgba(255,59,87,0.28), 0 0 18px rgba(255,59,87,0.22), var(--hh-shadow-sm)" : "var(--hh-shadow-sm)",
      color: "var(--hh-text-body)",
      overflow: "hidden",
      animation: isSuspicion ? "hh-suspicion-pulse var(--hh-duration-pulse) ease-in-out infinite" : "none",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: "0 0 auto",
      height: "52%",
      borderRadius: "7px 7px 0 0",
      background: meta.band,
      opacity: isSuspicion ? 0.85 : 0.72,
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
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
      background: "rgba(0,0,0,0.22)"
    }
  }, meta.mark), /*#__PURE__*/React.createElement("strong", {
    style: {
      position: "relative",
      zIndex: 1,
      alignSelf: "end",
      overflowWrap: "anywhere",
      color: "var(--hh-text-body)",
      fontSize: "0.82rem",
      lineHeight: 1.12
    }
  }, meta.label));
}
Object.assign(__ds_scope, { ResourceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/game/ResourceCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/the-hidden-hand/data.js
try { (() => {
/* The Hidden Hand — sample event deck + initial state for the UI kit.
   Lifted from the real eventPools.json so the recreation plays true.
   Each choice declares `cost` (paid), `effects` (resource/pressure deltas),
   and a `tone`. humanPower spends a Prisoner first, else a Cultist. */
(function () {
  window.HH_INITIAL = {
    Money: 3,
    Food: 3,
    Cultists: 2,
    Prisoners: 0,
    Relics: 0,
    Suspicion: 0
  };
  window.HH_EVENTS = [{
    id: "begging-bowl",
    kind: "common",
    title: "Day Work",
    tags: ["money", "food"],
    body: "Keeping a low profile means blending in. There is always work for someone willing not to ask questions.",
    choices: [{
      id: "stay",
      label: "Stay out of sight today",
      tone: "info",
      effects: {
        Pressure: 1
      }
    }, {
      id: "send",
      label: "Send the most forgettable faces",
      tone: "success",
      cost: {
        humanPower: 1
      },
      effects: {
        Money: 2,
        Food: 1
      }
    }, {
      id: "long",
      label: "Work the longer route, risk the extra hours",
      tone: "danger",
      cost: {
        humanPower: 1
      },
      effects: {
        Money: 3,
        Food: 1,
        Suspicion: 1
      }
    }]
  }, {
    id: "cellar-door",
    kind: "common",
    title: "The Back Room",
    tags: ["cult", "food"],
    body: "Someone below the floor promises anything to see daylight again.",
    choices: [{
      id: "ignore",
      label: "Leave them — let the noise be their problem",
      tone: "danger",
      effects: {
        Suspicion: 1
      }
    }, {
      id: "keep",
      label: "Feed and maintain the arrangement",
      tone: "info",
      cost: {
        Food: 1
      },
      effects: {
        Prisoners: 1
      }
    }, {
      id: "convert",
      label: "Let their desperation become allegiance",
      tone: "success",
      cost: {
        Food: 1,
        humanPower: 1
      },
      effects: {
        Cultists: 1,
        Suspicion: 1
      }
    }]
  }, {
    id: "street-sermon",
    kind: "common",
    title: "Coded Words",
    tags: ["cult", "suspicion"],
    body: "The right sentence, spoken in the right place, lodges itself in a stranger's thoughts for days.",
    choices: [{
      id: "watch",
      label: "Say nothing today, watch instead",
      tone: "info",
      effects: {
        Pressure: 1
      }
    }, {
      id: "preach",
      label: "Speak obliquely at the edge of a crowd",
      tone: "info",
      effects: {
        Cultists: 1,
        Suspicion: 1
      }
    }, {
      id: "coded",
      label: "Leave coded notes with the right people",
      tone: "success",
      cost: {
        Money: 1
      },
      effects: {
        Cultists: 1
      }
    }]
  }, {
    id: "mandatory-starvation",
    kind: "mandatory",
    title: "Empty Shelves",
    tags: ["food", "apocalyptic"],
    body: "The cabinets are bare. Those sharing the space look at one another with calculating eyes.",
    choices: [{
      id: "cache",
      label: "Break open the emergency reserve",
      tone: "success",
      cost: {
        Money: 1
      },
      effects: {
        Food: 2
      }
    }, {
      id: "thin",
      label: "Ensure survival at one person's expense",
      tone: "danger",
      cost: {
        humanPower: 1
      },
      effects: {
        Food: 3,
        Suspicion: 1
      }
    }, {
      id: "starve",
      label: "Let the shortage run its course",
      tone: "danger",
      effects: {
        Cultists: -1,
        Suspicion: 2
      }
    }]
  }, {
    id: "relic-in-the-wall",
    kind: "opportunity",
    title: "Something Old",
    tags: ["relic", "money"],
    body: "Behind old plaster, a hand of blackened silver waits with fingers curled inward.",
    choices: [{
      id: "mark",
      label: "Mark the spot and come back later",
      tone: "info",
      effects: {
        Pressure: 1
      }
    }, {
      id: "claim",
      label: "Retrieve it carefully before dawn",
      tone: "success",
      cost: {
        Money: 2
      },
      effects: {
        Relics: 1
      }
    }, {
      id: "grab",
      label: "Take it now without preparation",
      tone: "danger",
      cost: {
        humanPower: 1
      },
      effects: {
        Relics: 1,
        Suspicion: 1
      }
    }]
  }, {
    id: "mandatory-police-raid",
    kind: "mandatory",
    title: "Door Knock",
    tags: ["suspicion", "apocalyptic"],
    body: "Boots cross the threshold before anyone remembers to lock the door.",
    choices: [{
      id: "bribe",
      label: "Handle it with money",
      tone: "success",
      cost: {
        Money: 3
      },
      effects: {
        Suspicion: -3
      }
    }, {
      id: "frame",
      label: "Hand them a convenient culprit",
      tone: "success",
      cost: {
        Prisoners: 1
      },
      effects: {
        Suspicion: -4
      }
    }, {
      id: "scatter",
      label: "Scatter into the alleys",
      tone: "danger",
      effects: {
        Cultists: -1,
        Suspicion: -2
      }
    }]
  }, {
    id: "ledger-smoke",
    kind: "common",
    title: "Paper Trail",
    tags: ["money", "suspicion"],
    body: "The accounts have begun to read like a confession. Numbers that should not line up are lining up.",
    choices: [{
      id: "burn",
      label: "Destroy everything and work from memory",
      tone: "danger",
      effects: {
        Money: -1,
        Pressure: 1
      }
    }, {
      id: "cook",
      label: "Rewrite the records cleanly",
      tone: "success",
      cost: {
        Money: 1
      },
      effects: {
        Suspicion: -1
      }
    }, {
      id: "outsource",
      label: "Pay someone to make it disappear entirely",
      tone: "success",
      cost: {
        Money: 2,
        humanPower: 1
      },
      effects: {
        Suspicion: -2
      }
    }]
  }];
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/the-hidden-hand/data.js", error: String((e && e.message) || e) }); }

// ui_kits/the-hidden-hand/screens.jsx
try { (() => {
/* The Hidden Hand — interactive recreation built on the design system.
   Composes EventCard, ChoiceCard, ResourceCard, PressureBar, StatPill,
   Button, Meter from the bundled component library. */
const {
  useState
} = React;
const DS = window.TheHiddenHandDesignSystem_9a3a95;
const {
  Button,
  StatPill,
  EventCard,
  ChoiceCard,
  ResourceCard,
  PressureBar
} = DS;
const RES_ORDER = ["Money", "Food", "Cultists", "Prisoners", "Relics", "Suspicion"];
const SUSPICION_LIMIT = 8;

/* ── chips from a choice's cost + effects ─────────────────────────── */
function buildChips(choice) {
  const gains = [];
  const costs = [];
  const cost = choice.cost || {};
  for (const [res, amt] of Object.entries(cost)) {
    if (amt <= 0) continue;
    const label = res === "humanPower" ? "Cultists/Prisoners" : res;
    costs.push({
      kind: "cost",
      text: `−${amt} ${label}`
    });
  }
  for (const [res, amt] of Object.entries(choice.effects || {})) {
    if (res === "Pressure") {
      if (amt > 0) costs.push({
        kind: "threat",
        text: `+${amt} Pressure`
      });else if (amt < 0) gains.push({
        kind: "gain",
        text: `−${Math.abs(amt)} Pressure`
      });
    } else if (amt > 0) {
      gains.push({
        kind: res === "Suspicion" ? "threat" : "gain",
        text: `+${amt} ${res}`
      });
    } else if (amt < 0) {
      gains.push({
        kind: res === "Suspicion" ? "gain" : "cost",
        text: `−${Math.abs(amt)} ${res}`
      });
    }
  }
  return {
    gains,
    costs
  };
}
function canAfford(choice, r) {
  const cost = choice.cost || {};
  for (const [res, amt] of Object.entries(cost)) {
    if (res === "humanPower") {
      if (r.Cultists + r.Prisoners < amt) return false;
    } else if ((r[res] || 0) < amt) return false;
  }
  return true;
}

/* ── header ───────────────────────────────────────────────────────── */
function AppHeader({
  onMenu
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      height: "var(--hh-header-h)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      background: "var(--hh-bg-deep)",
      borderBottom: "1px solid var(--hh-line-soft)",
      boxShadow: "var(--hh-shadow-header)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "0.88rem",
      fontWeight: 700,
      letterSpacing: "0.10em",
      color: "var(--hh-cream)",
      textTransform: "uppercase"
    }
  }, "The Hidden Hand"), /*#__PURE__*/React.createElement("button", {
    onClick: onMenu,
    "aria-label": "Abrir menu",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      border: "1px solid var(--hh-line)",
      borderRadius: 6,
      background: "var(--hh-surface-2)",
      color: "var(--hh-muted)",
      cursor: "pointer",
      fontSize: 16
    }
  }, "\u2630"));
}

/* ── start screen ─────────────────────────────────────────────────── */
function StartScreen({
  onNew,
  onLoad,
  message
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: "var(--hh-header-h) 0 0 0",
      zIndex: 90,
      display: "grid",
      placeItems: "center",
      padding: "40px 20px",
      overflow: "hidden",
      background: "var(--hh-backdrop-altar)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      width: "min(68vw, 400px)",
      aspectRatio: "1 / 1.414",
      border: "1px solid rgba(246,218,157,0.16)",
      borderRadius: 8,
      background: "linear-gradient(180deg, rgba(246,218,157,0.035), rgba(0,0,0,0)), rgba(22,20,17,0.9)",
      boxShadow: "var(--hh-shadow-xl)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      zIndex: 1,
      width: "min(92vw, 300px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: 18,
      border: "1px solid var(--hh-line)",
      borderRadius: 8,
      background: "rgba(12,11,9,0.92)",
      boxShadow: "var(--hh-shadow-lg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onNew
  }, "New run"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    onClick: onLoad
  }, "Load")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "16px 0 0",
      fontSize: "0.84rem",
      color: "var(--hh-muted)",
      minHeight: "1.4em",
      textAlign: "center"
    }
  }, message)));
}

/* ── menu popup ───────────────────────────────────────────────────── */
function MenuPopup({
  open,
  onClose,
  onNew,
  log,
  message
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 200,
      background: "rgba(0,0,0,0.66)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-end",
      paddingTop: "var(--hh-header-h)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "min(300px, 90vw)",
      maxHeight: "calc(100vh - var(--hh-header-h))",
      display: "flex",
      flexDirection: "column",
      background: "var(--hh-bg-deep)",
      borderLeft: "1px solid var(--hh-line)",
      borderBottom: "1px solid var(--hh-line)",
      boxShadow: "var(--hh-shadow-popup)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "13px 16px",
      borderBottom: "1px solid var(--hh-line)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "0.78rem",
      fontWeight: 700,
      color: "var(--hh-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.10em"
    }
  }, "Menu"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Fechar",
    style: {
      width: 26,
      height: 26,
      border: "1px solid var(--hh-line)",
      borderRadius: 4,
      background: "transparent",
      color: "var(--hh-muted)",
      cursor: "pointer",
      fontSize: "1.1rem",
      lineHeight: 1
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: "14px 16px",
      borderBottom: "1px solid var(--hh-line)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    style: {
      justifyContent: "flex-start"
    }
  }, "Salvar"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    style: {
      justifyContent: "flex-start"
    },
    onClick: onNew
  }, "New run"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    style: {
      justifyContent: "flex-start"
    }
  }, "Load"), /*#__PURE__*/React.createElement(Button, {
    variant: "panic",
    style: {
      justifyContent: "flex-start"
    },
    onClick: onNew
  }, "\u26A0 P\xE2nico")), message ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      padding: "8px 16px",
      fontSize: "0.82rem",
      color: "var(--hh-muted)"
    }
  }, message) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      padding: "12px 16px 16px",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 8px",
      fontSize: "0.75rem",
      fontWeight: 700,
      color: "var(--hh-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, "Log"), /*#__PURE__*/React.createElement("ol", {
    style: {
      display: "flex",
      flexDirection: "column-reverse",
      gap: 7,
      margin: 0,
      padding: "0 2px 0 16px",
      overflowY: "auto",
      color: "var(--hh-muted)",
      fontSize: "0.84rem",
      lineHeight: 1.45
    }
  }, log.map((e, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, e))))));
}

/* ── resource hand ────────────────────────────────────────────────── */
function Hand({
  resources
}) {
  const cards = [];
  for (const res of RES_ORDER) {
    const n = Math.max(0, resources[res] || 0);
    for (let i = 0; i < n; i++) cards.push(/*#__PURE__*/React.createElement(ResourceCard, {
      key: res + i,
      resource: res.toLowerCase()
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--hh-muted)",
      fontSize: "0.82rem",
      fontFamily: "var(--hh-font-mono)"
    }
  }, "\uD83C\uDCCF ", cards.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      overflowX: "auto",
      padding: "2px 0 8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "max-content",
      minWidth: "100%",
      display: "flex",
      gap: "clamp(7px,1.4vw,13px)"
    }
  }, cards.length ? cards : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--hh-faint)",
      fontSize: "0.84rem"
    }
  }, "A m\xE3o est\xE1 vazia."))));
}

/* ── game view ────────────────────────────────────────────────────── */
function GameView({
  state,
  onOpen,
  onChoice
}) {
  const {
    resources,
    pressure,
    turn,
    deckIndex,
    events,
    eventOpen
  } = state;
  const event = events[deckIndex % events.length];
  const cycle = Math.floor(turn / 5) + 1;
  const deckLeft = events.length;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("main", {
    style: {
      padding: "14px 16px 248px",
      maxWidth: 1280,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(StatPill, {
    glyph: "\u21BB",
    value: cycle,
    title: "Ciclo"
  }), /*#__PURE__*/React.createElement(StatPill, {
    glyph: "\u25C6",
    value: turn,
    title: "Turno"
  }), /*#__PURE__*/React.createElement(StatPill, {
    glyph: "\u25B0",
    value: deckLeft,
    title: "Cartas restantes"
  })), !eventOpen ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      width: "min(100%,760px)",
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(EventCard, {
    kind: event.kind,
    title: event.title,
    body: event.body,
    onClick: onOpen
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(280px,42%) minmax(300px,48%)",
      gap: "clamp(18px,4vw,56px)",
      justifyContent: "center",
      alignItems: "start",
      width: "min(100%,1100px)",
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(EventCard, {
    kind: event.kind,
    title: event.title,
    body: event.body,
    tags: event.tags,
    open: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "clamp(14px,2.2vw,24px)"
    }
  }, event.choices.map(c => {
    const {
      gains,
      costs
    } = buildChips(c);
    return /*#__PURE__*/React.createElement(ChoiceCard, {
      key: c.id,
      label: c.label,
      gains: gains,
      costs: costs,
      disabled: !canAfford(c, resources),
      onClick: () => onChoice(c)
    });
  })))), /*#__PURE__*/React.createElement("footer", {
    style: {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
      background: "linear-gradient(180deg, rgba(10,9,8,0), var(--hh-bg-deep) 26%)",
      borderTop: "1px solid var(--hh-line-soft)",
      padding: "14px 16px 16px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(PressureBar, {
    value: pressure,
    max: 3
  })), /*#__PURE__*/React.createElement(Hand, {
    resources: resources
  }))));
}

/* ── game over ────────────────────────────────────────────────────── */
function GameOver({
  onRestart
}) {
  return /*#__PURE__*/React.createElement("main", {
    style: {
      display: "grid",
      placeItems: "center",
      padding: "60px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "min(100%,400px)"
    }
  }, /*#__PURE__*/React.createElement(EventCard, {
    kind: "apocalyptic",
    title: "The Door Opens Wrong",
    body: "A partida terminou em colapso ritual. A suspeita consumiu o por\xE3o.",
    open: true,
    tags: ["derrota"]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onRestart
  }, "Nova partida"))));
}

/* ── app root ─────────────────────────────────────────────────────── */
function App() {
  const fresh = () => ({
    screen: "start",
    menuOpen: false,
    eventOpen: false,
    gameStatus: "playing",
    resources: {
      ...window.HH_INITIAL
    },
    pressure: 0,
    turn: 0,
    deckIndex: 0,
    events: window.HH_EVENTS,
    log: ["A porta do porão fecha por dentro."],
    message: "",
    menuMessage: ""
  });
  const [s, setS] = useState(fresh);
  const startNew = () => setS({
    ...fresh(),
    screen: "game"
  });
  const load = () => setS(p => ({
    ...p,
    message: "Nenhuma partida salva."
  }));
  const choose = choice => setS(p => {
    const r = {
      ...p.resources
    };
    const cost = choice.cost || {};
    for (const [res, amt] of Object.entries(cost)) {
      if (res === "humanPower") {
        let left = amt;
        const takeP = Math.min(r.Prisoners, left);
        r.Prisoners -= takeP;
        left -= takeP;
        r.Cultists -= left;
      } else r[res] -= amt;
    }
    let pressure = p.pressure;
    for (const [res, amt] of Object.entries(choice.effects || {})) {
      if (res === "Pressure") pressure = Math.max(0, pressure + amt);else r[res] = Math.max(0, (r[res] || 0) + amt);
    }
    const log = [...p.log, `${choice.label}.`];
    const lost = r.Suspicion >= SUSPICION_LIMIT;
    return {
      ...p,
      resources: r,
      pressure,
      turn: p.turn + 1,
      deckIndex: (p.deckIndex + 1) % p.events.length,
      eventOpen: false,
      log,
      gameStatus: lost ? "lost" : "playing",
      screen: lost ? "over" : "game"
    };
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(AppHeader, {
    onMenu: () => setS(p => ({
      ...p,
      menuOpen: true
    }))
  }), s.screen === "start" && /*#__PURE__*/React.createElement(StartScreen, {
    onNew: startNew,
    onLoad: load,
    message: s.message
  }), s.screen === "game" && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: "var(--hh-header-h)"
    }
  }, /*#__PURE__*/React.createElement(GameView, {
    state: s,
    onOpen: () => setS(p => ({
      ...p,
      eventOpen: true
    })),
    onChoice: choose
  })), s.screen === "over" && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: "var(--hh-header-h)"
    }
  }, /*#__PURE__*/React.createElement(GameOver, {
    onRestart: startNew
  })), /*#__PURE__*/React.createElement(MenuPopup, {
    open: s.menuOpen,
    onClose: () => setS(p => ({
      ...p,
      menuOpen: false
    })),
    onNew: () => setS({
      ...fresh(),
      screen: "game"
    }),
    log: s.log,
    message: s.menuMessage
  }));
}
window.HHApp = App;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/the-hidden-hand/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ConsequenceChip = __ds_scope.ConsequenceChip;

__ds_ns.StatPill = __ds_scope.StatPill;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.ChoiceCard = __ds_scope.ChoiceCard;

__ds_ns.EventCard = __ds_scope.EventCard;

__ds_ns.Meter = __ds_scope.Meter;

__ds_ns.PressureBar = __ds_scope.PressureBar;

__ds_ns.ResourceCard = __ds_scope.ResourceCard;

})();
