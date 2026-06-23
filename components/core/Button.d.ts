import * as React from "react";

export interface ButtonProps {
  /** Visual intent. @default "secondary" */
  variant?: "primary" | "secondary" | "ghost" | "panic";
  /** Control size. @default "md" */
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * The Hidden Hand's primary action control. Blood-red primary for
 * commitments, inset secondary for everything else, panic for the
 * reset escape hatch.
 *
 * @startingPoint section="Core" subtitle="Action buttons — primary, secondary, ghost, panic" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
