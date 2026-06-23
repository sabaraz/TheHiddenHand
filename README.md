# The Hidden Hand — Design System

A design system for **The Hidden Hand** (*A Mão Sob o Assoalho*), a single-player
occult card game. You play the unseen hand managing a doomsday cult hidden in a
basement (*porão*): each cycle you draw event cards, spend resources, keep
**Suspicion** down, and feed a hidden ritual toward completion — while the deck
itself deteriorates and the outside world closes in.

The product is a self-contained HTML/CSS/JS prototype. This system extracts its
visual language — a warm, candlelit near-black table; parchment text; blood-red
threat; tarot-proportioned cards — into reusable tokens, components, and a
playable UI kit.

## Sources
- **GitHub:** [`sabaraz/TheHiddenHand`](https://github.com/sabaraz/TheHiddenHand)
  — the original prototype (modular HTML/CSS/JS). Everything here is derived from
  its `styles/main.css`, `data/*.json`, and `ui/render.js`. Explore the repo to
  recreate game screens or extend the event/ritual content with higher fidelity.

The original ships no bundled fonts; it uses Inter via the system stack. This
system pins **Inter** (display + body) and adds **JetBrains Mono** (stats/log)
as webfonts. See *Caveats*.

---

## The game — design v0.1 (reverse-engineered)

> This section reconstructs the game's design **from the source code** — `data/*.json`,
> `engine/*`, `rules/*`, `ui/render.js`. It is faithful to what the code does today
> (v0.1); known gaps are flagged. Use it to build screens, write new events, or
> brief a collaborator on what the game *is*.

### Premise
You are the **hidden hand** — the unseen organizer of a doomsday cult sheltering
in a locked basement (*porão*). It is a single-player, card-driven game of
attrition and complicity: keep your people fed and unnoticed while you secretly
assemble a forbidden rite. The fiction never names the atrocities; the mechanics
make you commit them anyway. Win by completing the ritual before the world breaks
the door down.

### The six resources
The whole game is the management of six resources (`engine/initialState.js`):

| Resource | Start | Role |
|---|---|---|
| **Money** | 3 | universal currency — bribes, supplies, cover-ups |
| **Food** | 3 | keeps the flock alive; starvation kills Cultists |
| **Cultists** | 2 | followers; a unit of *labor* and a thing you can lose |
| **Prisoners** | 0 | the captive; expendable labor / scapegoats |
| **Relics** | 0 | rare arcane objects; substitute for many costs |
| **Suspicion** | 0 | the danger meter — the only resource you *don't* want |

- **humanPower** is an abstract labor cost paid by **a Cultist *or* a Prisoner**.
  (See *Resource substitution* below — who pays is a real decision.)
- **Suspicion** never helps. Choices that raise it are the cheap path; choices
  that lower it cost Money, Relics, or people. Its card alarm-pulses on the table.

### The core loop
1. **Cycles** generate a deck. `engine/cycleBuilder.js` assembles each cycle's
   event deck from pools, sized by the active **cycle profile**.
2. **Draw → open → choose.** You draw one event card face-down, tap to open it,
   and pick **one of (usually) three choices**.
3. Each choice declares `cost`, `effects`, a `destination`, and a `tone`. Effects
   adjust resources, **Pressure**, or **ritual** progress.
4. The card's **destination** decides its fate; the next card is drawn; repeat
   until the deck empties and the next cycle is built — harder than the last.

### Event types & card behavior
From `data/eventPools.json`:

- **common** — the bread-and-butter trades (*Day Work*, *Coded Words*).
- **mandatory** — crises you must resolve before moving on (*Empty Shelves*,
  *Door Knock*); `cycleBehavior: persistent`.
- **opportunity** — one-time finds (*Something Old*); `unique`, consumed when used.
- **ritual** — advance or begin the rite (*The Pattern*, *Night Work*); some
  require an active ritual (`requiresActiveRitual`).
- **apocalyptic** — escalated, punishing versions (*Second Visit*, *Documented*,
  *Wrong Shape*) reached by taking reckless paths.

**`destination`** (what happens to the card after you choose): `remove` (gone for
good), `return` (back into the deck), `discard` (to the discard pile),
`defer` (pushed back, **raises Pressure**), `brutalize` / `upgrade` (replace it
with a worse `upgradeTo` event), `stabilize` (eases Pressure).

### Pressure & escalation
- **Pressure** is the slow build toward catastrophe. Deferring or hoarding adds
  it; it shows as a 3-fragment red meter (`renderPressureBar`).
- After **3 deferrals / full pressure** (`deferralsBeforeApocalypse: 3`) the game
  injects **apocalyptic** events.
- Taking the unsafe option on certain events **brutalizes** them — swapping in an
  escalated card via `upgradeTo` (`rules/escalationRules.js`), up to
  `brutalizeLimit: 2`.

### The ritual (the win condition)
Two rites are defined in `data/rituals.json`:

- **A Mão Sob o Assoalho** (*finalSummoning*) — "builds in layers; while active it
  stabilizes the cycle; each failure feeds what's below." `failureLimit: 3`.
- **O Pacto do Limiar** (*twilightPact*) — "volatile, unpredictable; asks little
  each time, but hesitation costs double." `failureLimit: 2`.

Each ritual is a sequence of **stages** (e.g. *Traçar o Círculo → A Primeira
Palavra → Sangue Fala → A Vigília → A Oferenda → A Mão Aberta*). Every stage has a
`requiredProgress`, an `advanceCost` (resources spent to progress), and a
`failurePenalty` (usually +Suspicion, sometimes losing Money/Cultists).
`engine/ritualEngine.js` tracks stage progress and failures.

- **While a ritual is active, it stabilizes the cycle** — incentive to start one.
- **Complete all stages → you win:** *"The Hidden Hand Opens."*
- **Exceed the failure limit → the rite collapses → you lose:** *"The Door Opens
  Wrong."*

### Difficulty curve (cycle profiles)
`data/cycleProfiles.json` ramps the deck as cycles advance:

| From cycle | Name | Persistent events | Ritual events | Escalation |
|---|---|---|---|---|
| 1 | **Whispers** | 7 | 1 | 1 |
| 3 | **Pressure** | 9 | 2 | 2 |
| 5 | **The Door Splinters** | 10 | 3 | 3 |

More events, more ritual demands, harsher escalation each tier.

### Resource substitution (a design tension, partly unimplemented)
Some costs can be paid more than one way:

- `allowRelicSubstitution: true` — a **Relic** can stand in for the listed cost.
- **humanPower** — pay with **a Cultist or a Prisoner** (different strategic weight).
- Several apocalyptic events should let you **spend Suspicion down** with a Relic.

v0.1 resolves these **automatically** (the engine picks who pays). The design
intent — and the UI-kit proposal — is to make substitution a **player choice**:
the option stays enabled, you select which sigil in your hand to consume, and only
then is the play confirmed. *Disabled* should mean "no combination can pay," never
"the system picked a path you didn't approve."

### State & persistence
Game state is a single object (`createInitialState`) and is **saved to
`localStorage`** (`storage/saveManager.js`) — *New run*, *Load*, *Save*, and a
*Pânico* hard-reset are exposed in the menu.

### Known gaps in v0.1
- Win/lose triggers exist but the **balance** (Suspicion ceiling, exact failure
  math) is still rough.
- **Substitution is auto-resolved**, not player-driven (see above).
- Only **two rituals** and a **single deck of ~13 events** are authored — content
  is a vertical slice, not a full game.
- The shell mixes **pt-BR chrome with English card text** by design, but some
  strings are still untranslated either way.

---

## Content fundamentals

**Bilingual by design.** The shell is Portuguese (pt-BR) — UI chrome, ritual
names, log lines (*"A porta do porão fecha por dentro."*, *Pânico*, *Cartas
restantes*). The drawn-card fiction is terse English (*"Empty Shelves"*, *"Door
Knock"*). Keep this split: **chrome and system voice in pt-BR, event/card flavor
in English.**

**Titles are short and oblique.** Two or three plain words that name a mundane
surface hiding dread: *Day Work*, *The Back Room*, *Paper Trail*, *Long Tongue*,
*Something Old*. Never melodramatic ("The Cursed Cellar of Doom") — the horror is
in understatement.

**Body copy: third person, present tense, implication over statement.** *"The
cabinets are bare. Those sharing the space look at one another with calculating
eyes."* It describes a scene and lets the player infer the atrocity. Cannibalism,
murder, and human sacrifice are never named — they are "ensure survival at one
person's expense", "hand them a convenient culprit", "the offering".

**Choices are second-person imperatives**, also euphemistic: *"Let their
desperation become allegiance"*, *"Spread it thin before envy organizes"*. Each
choice states the action, never the consequence — the consequence is the chip
ledger below it.

**Casing.** Event titles use Title Case. UI labels and section headers are
UPPERCASE with wide tracking (institutional, clinical). Body and choices are
sentence case.

**No emoji as content.** A few Unicode glyphs act as functional icons only
(see *Iconography*). The vibe is hushed, complicit, dryly bureaucratic about
horror — you are an administrator of the unspeakable.

---

## Visual foundations

**Mood.** A candlelit basement table. Everything sits on warm *near-black*
(`#11100e`) over true black, with a faint warm vignette and a single dim red
ember glowing from the top-left corner (`--hh-backdrop`). Modals swap the ember
for a centered candle glow (`--hh-backdrop-altar`). The whole system is
dark-mode-only (`color-scheme: dark`).

**Color.** Parchment text (`#eee7dc`) and muted clay (`#b6aa9b`) on dark
surfaces. Two accents carry meaning: **cream/gold candlelight** (`#f6da9d` /
`#d2aa5c`) for headings, gilt card edges, and progress; **blood red**
(`#c0301e`) for the primary action, danger, and all threat. Three quiet tones —
sage green (gain/success), cold slate (info), arcane violet (ritual). Each of the
six resources owns a fixed band color (money gold, food green, cultists violet,
prisoners iron-blue, relics bronze, suspicion alarm-red).

**Type.** One family — **Inter** — does all the work; weight and tracking create
hierarchy. Event titles are heavy display (820, ~56px, line-height 0.98, cream).
Choice labels are 720. Section labels are small, UPPERCASE, tracked 0.06–0.10em,
muted. Stats and the log use **JetBrains Mono** with tabular numerals.

**Cards.** The motif is the drawn card. Event cards hold **tarot proportions**
(1 : 1.414), radius 8px, near-opaque black face, gilt edge when face-down →
threat-red edge when opened. Resource cards are small 80×112 sigils: a colored
band fills the top half, a circular letter-mark (M/F/C/P/R/!) sits over it, the
name anchors the bottom. Radius 8px, deep soft shadow.

**Borders & radii.** Hairline 1px borders everywhere, usually gilt-tinted
(`rgba(246,218,157,…)`) or threat-tinted. Radii: 2–3px for chips and pressure
fragments, 6px for buttons and choice cards, 8px for surfaces and event cards,
pill for stat capsules / tags / meters.

**Shadows & glow.** Deep, soft, fully black table-shadows (`0 18px 40px
rgba(0,0,0,.32)` and up) — never colored drop-shadows. Color glow is reserved
for **threat**: pressure fragments and the Suspicion card emit a red halo.

**Backgrounds.** No photography, no illustration, no gradients-as-decoration.
Just the layered candlelight vignette over black, plus a faint gilt sheen
(`--hh-sheen-gilt`) on card faces. Texture comes from translucency and shadow,
not images.

**Motion.** Minimal and grim. Overlays fade at 0.14s. Cards fade-up gently when
drawn (`hh-draw-in`). The only looping animation is **Suspicion's alarm pulse**
(`hh-suspicion-pulse`, 2.7s) — a breathing red glow that exists to make rising
danger feel alive. No bounces, no springs, no parallax.

**Interaction states.** Hover *gilts or reddens the border* and brightens the
text toward cream — it does not lift or scale. The primary (red) button darkens
to `#d63420` on hover. Disabled = ~0.55 opacity + `not-allowed`. Choices you
can't afford render disabled in place. There is no dedicated press/scale state;
the table stays still.

**Transparency & blur.** Surfaces are translucent (`rgba(…,0.72–0.94)`) so the
backdrop bleeds through; the menu overlay is a 0.66 black scrim. No backdrop
blur — clarity over glass.

**Layout.** Centered, table-like, max ~760px single-column or ~1100px when an
event opens into a two-column (event | choices) grid with pressure + hand
spanning full width below. A fixed 48px top header. Tight spacing throughout
(4 → 56px scale).

---

## Iconography

The Hidden Hand uses **no icon font and almost no icons.** Its symbol set is a
handful of **Unicode glyphs used functionally**, rendered in the current text
color:

- **Status stats:** `↻` cycle · `◆` turn · `▰` cards remaining · `🃏` hand count.
- **Resource marks:** single letters in a circle — **M** money, **F** food,
  **C** cultists, **P** prisoners, **R** relics, **!** suspicion. (These *are*
  the iconography — typographic sigils, not pictograms.)
- **Alarm:** `⚠` / `⚠️` on the Pânico action.
- **Menu:** a hamburger `☰` (the original used an inline Lucide-style "settings"
  gear SVG; this system substitutes `☰` — see *Caveats*).
- **Close:** `×`.

There are **no SVG icon assets, no PNG icons, and no logo image** in the source —
the wordmark is set type ("The Hidden Hand", Inter 700, uppercase, tracked,
cream). When you need an icon the brand doesn't have, prefer a single restrained
Unicode glyph in text color over importing a pictographic set; if you must, match
a thin-stroke set (e.g. Lucide) and flag it.

---

## Index

**Foundations**
- `styles.css` — the entry point; consumers link this one file (import-only).
- `tokens/colors.css` · `typography.css` · `spacing.css` · `effects.css` ·
  `fonts.css` · `base.css` — tokens, `@font-face`, and a light base layer.
- `cards/*.html` — foundation specimen cards (Colors, Type, Spacing, Brand).

**Components** (`window.TheHiddenHandDesignSystem_9a3a95.*`)
- `components/core/` — `Button`, `StatPill`, `Tag`, `ConsequenceChip`.
- `components/game/` — `EventCard`, `ChoiceCard`, `ResourceCard`, `PressureBar`,
  `Meter`.
- Each has a `.jsx`, a `.d.ts` (props), and a `.prompt.md` (usage).

**UI kit**
- `ui_kits/the-hidden-hand/` — a playable recreation of the full game flow
  (start → draw → choose → log → game over). See its `README.md`.

**Skill**
- `SKILL.md` — makes this folder usable as an Agent Skill.

> Components render against the compiled `_ds_bundle.js` (generated
> automatically). Mount them in plain HTML via
> `const { Button } = window.TheHiddenHandDesignSystem_9a3a95`.
