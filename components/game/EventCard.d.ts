import * as React from "react";

export interface EventCardProps {
  /** Event class shown in the kicker (common, mandatory, ritual, opportunity, apocalyptic). */
  kind?: string;
  /** Short, declarative title — two or three words. */
  title: string;
  /** Atmospheric body copy, third person, present tense. */
  body: string;
  /** Theme keywords, shown as Tags when open. */
  tags?: string[];
  /** Open state switches the edge to threat-red and reveals tags. @default false */
  open?: boolean;
  /** Click handler (closed → open). */
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

/**
 * The tarot-proportioned event card at the center of the table.
 * Closed it invites a tap; open it reveals classification tags and
 * pairs with a column of ChoiceCards.
 *
 * @startingPoint section="Game" subtitle="Center-table event card (closed / open)" viewport="700x420"
 */
export function EventCard(props: EventCardProps): JSX.Element;
