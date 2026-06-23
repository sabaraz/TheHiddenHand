import * as React from "react";

export interface MeterProps {
  /** Current progress. @default 0 */
  value?: number;
  /** Full value. @default 100 */
  max?: number;
  /** Accessible label. */
  label?: string;
  style?: React.CSSProperties;
}

/**
 * Thin continuous progress bar for ritual stages. Fill sweeps
 * blood → gold → green as the rite nears completion.
 */
export function Meter(props: MeterProps): JSX.Element;
