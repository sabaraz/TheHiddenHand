**Meter** — continuous progress bar for ritual stage progress. The blood → gold → green gradient fill reads as a rite moving from danger to completion. Use for anything continuous; use `PressureBar` for segmented threat.

```jsx
<Meter value={state.ritual.stageProgress} max={stage.requiredProgress} label="Progresso ritual" />
```
