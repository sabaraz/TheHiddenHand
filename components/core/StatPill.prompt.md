**StatPill** — capsule readout for the status bar (cycle / turn / deck count). Pair a Unicode glyph with a value; gilt text, tabular numerals.

```jsx
<StatPill glyph="↻" value={3} title="Ciclo" />
<StatPill glyph="◆" value={12} title="Turno" />
<StatPill glyph="▰" value={28} title="Cartas restantes" />
```

Use the brand glyph set: ↻ cycle, ◆ turn, ▰ deck. Keep them short — pills sit in a wrapping flex row.
