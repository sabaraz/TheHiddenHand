import * as React from "react";

export interface StatPillProps {
  /** Leading Unicode glyph, e.g. "↻" cycle, "◆" turn, "▰" deck. */
  glyph?: string;
  /** Optional text label. */
  label?: string;
  /** Numeric or string value. */
  value?: string | number;
  /** Accessible title / tooltip. */
  title?: string;
  style?: React.CSSProperties;
}

/**
 * Compact pill readout for the game status bar — cycle, turn,
 * cards remaining. Gilt text on a translucent capsule.
 */
export function StatPill(props: StatPillProps): JSX.Element;
