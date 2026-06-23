import * as React from "react";

export interface ConsequenceChipProps {
  /** Semantic kind drives color. @default "cost" */
  kind?: "gain" | "cost" | "threat" | "ritual";
  /** Pre-signed label text, e.g. "+2 Food" / "−1 Money". */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Colored micro-label previewing a choice's outcome. Sage = gain,
 * muted = resource cost, red = threat (Suspicion / Pressure),
 * violet = ritual effect.
 */
export function ConsequenceChip(props: ConsequenceChipProps): JSX.Element;
