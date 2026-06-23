import React from "react";

/**
 * Button — The Hidden Hand's primary action control.
 *
 * Variants:
 *  - primary   : blood-red filled, white text (commit / "New run")
 *  - secondary : inset surface, gilt border on hover (load / cancel)
 *  - ghost     : transparent, used inside popups
 *  - panic     : red-outlined alarm action ("Pânico")
 */
export function Button({
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
    sm: { padding: "7px 14px", fontSize: "var(--hh-text-sm)", minHeight: 32 },
    md: { padding: "9px 16px", fontSize: "var(--hh-text-base)", minHeight: 40 },
    lg: { padding: "14px 28px", fontSize: "1rem", minHeight: 48, minWidth: 220 },
  };

  const variants = {
    primary: {
      border: "none",
      background: "var(--hh-action-bg)",
      color: "var(--hh-action-fg)",
    },
    secondary: {
      border: "var(--hh-border-width) solid var(--hh-border)",
      background: "var(--hh-surface-2)",
      color: "var(--hh-text-label)",
    },
    ghost: {
      border: "var(--hh-border-width) solid var(--hh-border)",
      background: "transparent",
      color: "var(--hh-text-body)",
    },
    panic: {
      border: "var(--hh-border-width) solid rgba(192, 48, 30, 0.38)",
      background: "var(--hh-surface-2)",
      color: "var(--hh-red)",
    },
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
    ...style,
  };

  const onEnter = (e) => {
    if (disabled) return;
    if (variant === "primary") e.currentTarget.style.background = "var(--hh-action-bg-hover)";
    else if (variant === "panic") {
      e.currentTarget.style.borderColor = "var(--hh-red)";
      e.currentTarget.style.background = "rgba(192, 48, 30, 0.10)";
    } else {
      e.currentTarget.style.borderColor = "var(--hh-accent)";
      e.currentTarget.style.color = "var(--hh-accent)";
    }
  };
  const onLeave = (e) => {
    Object.assign(e.currentTarget.style, {
      background: variants[variant].background,
      borderColor: variants[variant].border?.includes("solid")
        ? variants[variant].border.split("solid ")[1]
        : "",
      color: variants[variant].color,
    });
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={base}
      {...rest}
    >
      {children}
    </button>
  );
}
