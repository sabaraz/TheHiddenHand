import * as React from "react";

export interface PressureBarProps {
  /** Current pressure (filled fragments). @default 0 */
  value?: number;
  /** Capacity before apocalypse. @default 3 */
  max?: number;
  /** Leading label. @default "Pressão" */
  label?: string;
  style?: React.CSSProperties;
}

/**
 * Segmented pressure meter — filled fragments glow blood-red as the
 * table edges toward an apocalyptic event.
 */
export function PressureBar(props: PressureBarProps): JSX.Element;
