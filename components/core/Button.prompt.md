**Button** — the brand's action control; use `primary` (blood red) for the single committing action on a screen, `secondary` for the rest, `panic` for the reset/abort escape hatch.

```jsx
<Button variant="primary" size="lg">New run</Button>
<Button variant="secondary">Load</Button>
<Button variant="panic">⚠ Pânico</Button>
```

Variants: `primary` | `secondary` | `ghost` | `panic`. Sizes: `sm` | `md` | `lg` (lg matches the start-screen buttons, min-width 220px). Hover brightens red / gilts the border; disabled drops opacity and blocks the cursor.
