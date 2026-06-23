import * as React from "react";

export interface Consequence {
  kind: "gain" | "cost" | "threat" | "ritual";
  text: string;
}

export interface ChoiceCardProps {
  /** The decision text — kept in second person, plain, ominous. */
  label: string;
  /** Tone tints the label and hover border. @default "neutral" */
  tone?: "neutral" | "danger" | "success" | "info";
  /** Outcomes the player wins (top row). */
  gains?: Consequence[];
  /** Outcomes the player pays (bottom row). */
  costs?: Consequence[];
  /** Unaffordable choices render disabled. */
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * One selectable option on an opened event. A heavy tone-colored
 * label over a divided ledger of gains and costs (ConsequenceChips).
 *
 * @startingPoint section="Game" subtitle="Selectable event choice with gain/cost ledger" viewport="700x180"
 */
export function ChoiceCard(props: ChoiceCardProps): JSX.Element;
