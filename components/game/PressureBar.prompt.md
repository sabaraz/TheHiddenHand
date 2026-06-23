**PressureBar** — segmented threat meter. Each filled fragment glows blood-red; reaching `max` (default 3) is what triggers an apocalyptic event. Deferring choices is the main way pressure climbs.

```jsx
<PressureBar value={2} max={3} />
```

Keep it narrow and inline. This is the only horizontal meter that uses fragments — continuous progress (rituals) uses `Meter`.
