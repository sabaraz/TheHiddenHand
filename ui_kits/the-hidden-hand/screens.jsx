/* The Hidden Hand — interactive recreation built on the design system.
   Composes EventCard, ChoiceCard, ResourceCard, PressureBar, StatPill,
   Button, Meter from the bundled component library. */
const { useState } = React;
const DS = window.TheHiddenHandDesignSystem_9a3a95;
const { Button, StatPill, EventCard, ChoiceCard, ResourceCard, PressureBar } = DS;

const RES_ORDER = ["Money", "Food", "Cultists", "Prisoners", "Relics", "Suspicion"];
const SUSPICION_LIMIT = 8;

/* ── chips from a choice's cost + effects ─────────────────────────── */
function buildChips(choice) {
  const gains = [];
  const costs = [];
  const cost = choice.cost || {};
  for (const [res, amt] of Object.entries(cost)) {
    if (amt <= 0) continue;
    const label = res === "humanPower" ? "Cultists/Prisoners" : res;
    costs.push({ kind: "cost", text: `−${amt} ${label}` });
  }
  for (const [res, amt] of Object.entries(choice.effects || {})) {
    if (res === "Pressure") {
      if (amt > 0) costs.push({ kind: "threat", text: `+${amt} Pressure` });
      else if (amt < 0) gains.push({ kind: "gain", text: `−${Math.abs(amt)} Pressure` });
    } else if (amt > 0) {
      gains.push({ kind: res === "Suspicion" ? "threat" : "gain", text: `+${amt} ${res}` });
    } else if (amt < 0) {
      gains.push({ kind: res === "Suspicion" ? "gain" : "cost", text: `−${Math.abs(amt)} ${res}` });
    }
  }
  return { gains, costs };
}

function canAfford(choice, r) {
  const cost = choice.cost || {};
  for (const [res, amt] of Object.entries(cost)) {
    if (res === "humanPower") {
      if ((r.Cultists + r.Prisoners) < amt) return false;
    } else if ((r[res] || 0) < amt) return false;
  }
  return true;
}

/* ── header ───────────────────────────────────────────────────────── */
function AppHeader({ onMenu }) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: "var(--hh-header-h)",
      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px",
      background: "var(--hh-bg-deep)", borderBottom: "1px solid var(--hh-line-soft)",
      boxShadow: "var(--hh-shadow-header)",
    }}>
      <span style={{
        fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.10em",
        color: "var(--hh-cream)", textTransform: "uppercase",
      }}>The Hidden Hand</span>
      <button onClick={onMenu} aria-label="Abrir menu" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, border: "1px solid var(--hh-line)", borderRadius: 6,
        background: "var(--hh-surface-2)", color: "var(--hh-muted)", cursor: "pointer", fontSize: 16,
      }}>☰</button>
    </header>
  );
}

/* ── start screen ─────────────────────────────────────────────────── */
function StartScreen({ onNew, onLoad, message }) {
  return (
    <div style={{
      position: "fixed", inset: "var(--hh-header-h) 0 0 0", zIndex: 90, display: "grid",
      placeItems: "center", padding: "40px 20px", overflow: "hidden",
      background: "var(--hh-backdrop-altar)",
    }}>
      <div style={{
        position: "absolute", width: "min(68vw, 400px)", aspectRatio: "1 / 1.414",
        border: "1px solid rgba(246,218,157,0.16)", borderRadius: 8,
        background: "linear-gradient(180deg, rgba(246,218,157,0.035), rgba(0,0,0,0)), rgba(22,20,17,0.9)",
        boxShadow: "var(--hh-shadow-xl)",
      }} />
      <div style={{
        position: "relative", zIndex: 1, width: "min(92vw, 300px)", display: "flex",
        flexDirection: "column", alignItems: "center", padding: 18, border: "1px solid var(--hh-line)",
        borderRadius: 8, background: "rgba(12,11,9,0.92)", boxShadow: "var(--hh-shadow-lg)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <Button variant="primary" size="lg" onClick={onNew}>New run</Button>
          <Button variant="secondary" size="lg" onClick={onLoad}>Load</Button>
        </div>
        <p style={{ margin: "16px 0 0", fontSize: "0.84rem", color: "var(--hh-muted)", minHeight: "1.4em", textAlign: "center" }}>{message}</p>
      </div>
    </div>
  );
}

/* ── menu popup ───────────────────────────────────────────────────── */
function MenuPopup({ open, onClose, onNew, log, message }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.66)",
      display: "flex", alignItems: "flex-start", justifyContent: "flex-end", paddingTop: "var(--hh-header-h)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(300px, 90vw)", maxHeight: "calc(100vh - var(--hh-header-h))", display: "flex",
        flexDirection: "column", background: "var(--hh-bg-deep)", borderLeft: "1px solid var(--hh-line)",
        borderBottom: "1px solid var(--hh-line)", boxShadow: "var(--hh-shadow-popup)", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--hh-line)" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--hh-muted)", textTransform: "uppercase", letterSpacing: "0.10em" }}>Menu</span>
          <button onClick={onClose} aria-label="Fechar" style={{ width: 26, height: 26, border: "1px solid var(--hh-line)", borderRadius: 4, background: "transparent", color: "var(--hh-muted)", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 16px", borderBottom: "1px solid var(--hh-line)" }}>
          <Button variant="ghost" style={{ justifyContent: "flex-start" }}>Salvar</Button>
          <Button variant="ghost" style={{ justifyContent: "flex-start" }} onClick={onNew}>New run</Button>
          <Button variant="ghost" style={{ justifyContent: "flex-start" }}>Load</Button>
          <Button variant="panic" style={{ justifyContent: "flex-start" }} onClick={onNew}>⚠ Pânico</Button>
        </div>
        {message ? <p style={{ margin: 0, padding: "8px 16px", fontSize: "0.82rem", color: "var(--hh-muted)" }}>{message}</p> : null}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "12px 16px 16px", overflow: "hidden" }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--hh-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Log</p>
          <ol style={{ display: "flex", flexDirection: "column-reverse", gap: 7, margin: 0, padding: "0 2px 0 16px", overflowY: "auto", color: "var(--hh-muted)", fontSize: "0.84rem", lineHeight: 1.45 }}>
            {log.map((e, i) => <li key={i}>{e}</li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ── resource hand ────────────────────────────────────────────────── */
function Hand({ resources }) {
  const cards = [];
  for (const res of RES_ORDER) {
    const n = Math.max(0, resources[res] || 0);
    for (let i = 0; i < n; i++) cards.push(<ResourceCard key={res + i} resource={res.toLowerCase()} />);
  }
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span style={{ flex: 1 }} />
        <span style={{ color: "var(--hh-muted)", fontSize: "0.82rem", fontFamily: "var(--hh-font-mono)" }}>🃏 {cards.length}</span>
      </div>
      <div style={{ width: "100%", overflowX: "auto", padding: "2px 0 8px" }}>
        <div style={{ width: "max-content", minWidth: "100%", display: "flex", gap: "clamp(7px,1.4vw,13px)" }}>
          {cards.length ? cards : <span style={{ color: "var(--hh-faint)", fontSize: "0.84rem" }}>A mão está vazia.</span>}
        </div>
      </div>
    </div>
  );
}

/* ── game view ────────────────────────────────────────────────────── */
function GameView({ state, onOpen, onChoice }) {
  const { resources, pressure, turn, deckIndex, events, eventOpen } = state;
  const event = events[deckIndex % events.length];
  const cycle = Math.floor(turn / 5) + 1;
  const deckLeft = events.length;

  return (
    <>
      {/* Scrolling region: only the event + choices reflow here.
         The hand/pressure live in a fixed footer so they never move. */}
      <main style={{ padding: "14px 16px 248px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          <StatPill glyph="↻" value={cycle} title="Ciclo" />
          <StatPill glyph="◆" value={turn} title="Turno" />
          <StatPill glyph="▰" value={deckLeft} title="Cartas restantes" />
        </div>

        {!eventOpen ? (
          <div style={{ display: "flex", justifyContent: "center", width: "min(100%,760px)", margin: "0 auto" }}>
            <EventCard kind={event.kind} title={event.title} body={event.body} onClick={onOpen} />
          </div>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "minmax(280px,42%) minmax(300px,48%)",
            gap: "clamp(18px,4vw,56px)", justifyContent: "center", alignItems: "start",
            width: "min(100%,1100px)", margin: "0 auto",
          }}>
            <EventCard kind={event.kind} title={event.title} body={event.body} tags={event.tags} open />
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,2.2vw,24px)" }}>
              {event.choices.map((c) => {
                const { gains, costs } = buildChips(c);
                return (
                  <ChoiceCard key={c.id} label={c.label} gains={gains} costs={costs}
                    disabled={!canAfford(c, resources)} onClick={() => onChoice(c)} />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Frozen hand footer: pressure top-left, resources below. */}
      <footer style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        background: "linear-gradient(180deg, rgba(10,9,8,0), var(--hh-bg-deep) 26%)",
        borderTop: "1px solid var(--hh-line-soft)", padding: "14px 16px 16px",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ marginBottom: 10 }}>
            <PressureBar value={pressure} max={3} />
          </div>
          <Hand resources={resources} />
        </div>
      </footer>
    </>
  );
}

/* ── game over ────────────────────────────────────────────────────── */
function GameOver({ onRestart }) {
  return (
    <main style={{ display: "grid", placeItems: "center", padding: "60px 20px" }}>
      <div style={{ width: "min(100%,400px)" }}>
        <EventCard kind="apocalyptic" title="The Door Opens Wrong"
          body="A partida terminou em colapso ritual. A suspeita consumiu o porão." open tags={["derrota"]} />
        <div style={{ marginTop: 16 }}>
          <Button variant="primary" size="lg" onClick={onRestart}>Nova partida</Button>
        </div>
      </div>
    </main>
  );
}

/* ── app root ─────────────────────────────────────────────────────── */
function App() {
  const fresh = () => ({
    screen: "start", menuOpen: false, eventOpen: false, gameStatus: "playing",
    resources: { ...window.HH_INITIAL }, pressure: 0, turn: 0, deckIndex: 0,
    events: window.HH_EVENTS, log: ["A porta do porão fecha por dentro."],
    message: "", menuMessage: "",
  });
  const [s, setS] = useState(fresh);

  const startNew = () => setS({ ...fresh(), screen: "game" });
  const load = () => setS((p) => ({ ...p, message: "Nenhuma partida salva." }));

  const choose = (choice) => setS((p) => {
    const r = { ...p.resources };
    const cost = choice.cost || {};
    for (const [res, amt] of Object.entries(cost)) {
      if (res === "humanPower") {
        let left = amt;
        const takeP = Math.min(r.Prisoners, left); r.Prisoners -= takeP; left -= takeP;
        r.Cultists -= left;
      } else r[res] -= amt;
    }
    let pressure = p.pressure;
    for (const [res, amt] of Object.entries(choice.effects || {})) {
      if (res === "Pressure") pressure = Math.max(0, pressure + amt);
      else r[res] = Math.max(0, (r[res] || 0) + amt);
    }
    const log = [...p.log, `${choice.label}.`];
    const lost = r.Suspicion >= SUSPICION_LIMIT;
    return {
      ...p, resources: r, pressure, turn: p.turn + 1,
      deckIndex: (p.deckIndex + 1) % p.events.length, eventOpen: false,
      log, gameStatus: lost ? "lost" : "playing", screen: lost ? "over" : "game",
    };
  });

  return (
    <>
      <AppHeader onMenu={() => setS((p) => ({ ...p, menuOpen: true }))} />
      {s.screen === "start" && <StartScreen onNew={startNew} onLoad={load} message={s.message} />}
      {s.screen === "game" && <div style={{ paddingTop: "var(--hh-header-h)" }}>
        <GameView state={s} onOpen={() => setS((p) => ({ ...p, eventOpen: true }))} onChoice={choose} />
      </div>}
      {s.screen === "over" && <div style={{ paddingTop: "var(--hh-header-h)" }}><GameOver onRestart={startNew} /></div>}
      <MenuPopup open={s.menuOpen} onClose={() => setS((p) => ({ ...p, menuOpen: false }))}
        onNew={() => setS({ ...fresh(), screen: "game" })} log={s.log} message={s.menuMessage} />
    </>
  );
}

window.HHApp = App;
