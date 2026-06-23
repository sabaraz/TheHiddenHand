import * as React from "react";

export interface TagProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Small muted-outline capsule used to classify events
 * (food, suspicion, ritual, apocalyptic). Lowercase content.
 */
export function Tag(props: TagProps): JSX.Element;
