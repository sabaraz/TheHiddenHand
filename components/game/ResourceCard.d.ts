import * as React from "react";

export interface ResourceCardProps {
  /** Which resource sigil to render. @default "money" */
  resource?: "money" | "food" | "cultists" | "prisoners" | "relics" | "suspicion";
  style?: React.CSSProperties;
}

/**
 * A single sigil card in the player's hand. Each resource has a
 * fixed band color and letter-mark; Suspicion gets an alarm pulse.
 * Render one card per unit held.
 *
 * @startingPoint section="Game" subtitle="Resource sigil card — one per unit in hand" viewport="700x150"
 */
export function ResourceCard(props: ResourceCardProps): JSX.Element;
