import { RESOURCE_NAMES } from "../engine/initialState.js";
import { getChoiceCost, canPayOption } from "../engine/gameEngine.js";
import { getActiveStage } from "../engine/ritualEngine.js";

let isEventOpen = false;
let lastRenderedEventId = null;
let dragScrollReady = false;

export function render(state, context, handlers) {
  renderCycleStats(state);
  renderLog(state);
  renderEvent(state, context, handlers);
  renderRitual(state, context);
  renderResourceHand(state);
  renderPressureBar(state);
}

function renderResourceHand(state) {
  const container = document.querySelector("#resources");
  const handCount = document.querySelector("#hand-count");
  const cards = [];

  for (const resource of RESOURCE_NAMES) {
    const amount = Math.max(0, state.resources[resource] || 0);
    for (let index = 0; index < amount; index += 1) {
      const card = document.createElement("div");
      card.className = `resource-card resource-card--${resource.toLowerCase()}`;
      card.setAttribute("aria-label", getResourceCardLabel(resource));
      card.innerHTML = `
        <span class="resource-card-mark">${getResourceMark(resource)}</span>
        <strong>${getResourceCardLabel(resource)}</strong>
      `;
      cards.push(card);
    }
  }

  const total = cards.length;
  handCount.textContent = `🃏 ${total}`;
  container.replaceChildren(...cards);
  setupDragScroll();
}

function setupDragScroll() {
  if (dragScrollReady) return;
  dragScrollReady = true;

  const scroll = document.querySelector(".resource-hand-scroll");
  if (!scroll) return;

  let active = false;
  let startX = 0;
  let originLeft = 0;

  scroll.addEventListener("pointerdown", (e) => {
    active = true;
    scroll.setPointerCapture(e.pointerId);
    startX = e.clientX;
    originLeft = scroll.scrollLeft;
    scroll.classList.add("is-dragging");
  });

  scroll.addEventListener("pointermove", (e) => {
    if (!active) return;
    scroll.scrollLeft = originLeft - (e.clientX - startX);
  });

  const stopDrag = () => {
    active = false;
    scroll.classList.remove("is-dragging");
  };
  scroll.addEventListener("pointerup", stopDrag);
  scroll.addEventListener("pointercancel", stopDrag);
}

function renderCycleStats(state) {
  document.querySelector("#cycle-stats").innerHTML = `
    <span aria-label="Ciclo">↻ ${state.cycle}</span>
    <span aria-label="Turno">◆ ${state.turn}</span>
    <span aria-label="Cartas restantes">▰ ${state.deck.length}</span>
  `;
}

function renderRitual(state, context) {
  const container = document.querySelector("#ritual");
  const wrapper = document.querySelector("#ritual-inline");
  const event = state.currentEvent;
  const shouldShow = Boolean(state.ritual && isEventOpen && event?.kind === "ritual");

  if (!shouldShow) {
    wrapper.hidden = true;
    container.replaceChildren();
    return;
  }

  wrapper.hidden = false;

  if (!state.ritual) {
    const hint = state.selectedRitualId
      ? `<p class="empty-copy">Um padr&#227;o aguarda o momento certo.</p>`
      : `<p class="empty-copy">Nenhum caminho escolhido.</p>`;
    container.innerHTML = hint;
    return;
  }

  if (state.ritual.status === "complete") {
    container.innerHTML = `<p class="success">Ritual conclu&#237;do.</p>`;
    return;
  }

  if (state.ritual.status === "failed") {
    container.innerHTML = `<p class="danger">O ritual falhou al&#233;m de reparo.</p>`;
    return;
  }

  const stage = getActiveStage(state, context.rituals);
  const percent = stage ? Math.round((state.ritual.stageProgress / stage.requiredProgress) * 100) : 0;
  container.innerHTML = `
    <div class="ritual-stage">
      <strong>${state.ritual.name}</strong>
      <p class="ritual-copy">${stage?.name || "Sem etapa"}: ${state.ritual.stageProgress}/${stage?.requiredProgress || 0}</p>
      <div class="meter" aria-label="Progresso ritual"><div class="meter-fill" style="width: ${percent}%"></div></div>
      <p class="ritual-copy">Falhas: ${state.ritual.failures}/${state.ritual.failureLimit}</p>
    </div>
  `;
}

function renderLog(state) {
  const entries = state.log.slice(-20).map((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    return li;
  });
  document.querySelector("#log").replaceChildren(...entries);
}

function renderPressureBar(state) {
  const area = document.querySelector("#pressure-bar-area");
  const maxFragments = 3;
  const filled = Math.min(state.pressure, maxFragments);
  const frags = Array.from({ length: maxFragments }, (_, i) => {
    const cls = i < filled ? "pressure-fragment is-filled" : "pressure-fragment";
    return `<span class="${cls}"></span>`;
  }).join("");
  area.innerHTML = `<div class="pressure-bar"><span class="pressure-bar__label">Press&#227;o</span>${frags}</div>`;
}

function renderEvent(state, context, handlers) {
  const card = document.querySelector("#event-card");
  const tableCenter = document.querySelector(".table-center");
  const choicesSection = document.querySelector("#choices-section");
  const choiceList = document.querySelector("#choices");
  choiceList.replaceChildren();

  if (state.gameStatus !== "playing") {
    const won = state.gameStatus === "won";
    tableCenter.classList.remove("is-event-open");
    card.className = "event-card event-card--open";
    card.removeAttribute("role");
    card.removeAttribute("tabindex");
    card.onclick = null;
    card.onkeydown = null;
    card.innerHTML = `
      <div class="event-card-inner">
        <div class="event-kicker">
          <span class="event-type ${won ? "success" : "danger"}">${won ? "Vit&#243;ria" : "Derrota"}</span>
        </div>
        <h3>${won ? "The Hidden Hand Opens" : "The Door Opens Wrong"}</h3>
        <p>${won ? "O ritual final foi conclu&#237;do corretamente." : "A partida terminou em colapso ritual."}</p>
      </div>
    `;
    choicesSection.hidden = false;
    const restart = document.createElement("button");
    restart.className = "choice-button";
    restart.type = "button";
    restart.innerHTML = `<span class="choice-title">Nova partida</span><span class="choice-meta">Recome&#231;ar</span>`;
    restart.addEventListener("click", handlers.onRestart);
    choiceList.append(restart);
    return;
  }

  const event = state.currentEvent;
  if (!event) {
    tableCenter.classList.remove("is-event-open");
    card.className = "event-card";
    card.removeAttribute("role");
    card.removeAttribute("tabindex");
    card.onclick = null;
    card.onkeydown = null;
    card.innerHTML = `<p class="empty-copy" style="padding:20px">A mesa est&#225; se recompondo.</p>`;
    choicesSection.hidden = true;
    return;
  }

  if (event.id !== lastRenderedEventId) {
    isEventOpen = false;
    lastRenderedEventId = event.id;
  }

  if (!isEventOpen) {
    tableCenter.classList.remove("is-event-open");
    card.className = "event-card event-card--closed";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.innerHTML = `
      <div class="event-card-inner">
        <div class="event-kicker">
          <span class="event-type">${event.kind}</span>
          <span class="event-closed-hint">toque para abrir</span>
        </div>
        <h3>${event.title}</h3>
        <p class="event-summary">${event.body}</p>
      </div>
    `;
    choicesSection.hidden = true;

    card.onclick = () => {
      isEventOpen = true;
      renderEvent(state, context, handlers);
      renderRitual(state, context);
    };
    card.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        isEventOpen = true;
        renderEvent(state, context, handlers);
        renderRitual(state, context);
      }
    };
  } else {
    tableCenter.classList.add("is-event-open");
    card.className = "event-card event-card--open";
    card.removeAttribute("role");
    card.removeAttribute("tabindex");
    card.onclick = null;
    card.onkeydown = null;

    const tags = event.tags.map((t) => `<span class="tag">${t}</span>`).join("");
    card.innerHTML = `
      <div class="event-card-inner">
        <div class="event-kicker">
          <span class="event-type">${event.kind}</span>
          <span class="event-closed-hint">toque para abrir</span>
        </div>
        <h3>${event.title}</h3>
        <p class="event-summary">${event.body}</p>
        <div class="tag-list">${tags}</div>
      </div>
    `;
    choicesSection.hidden = false;

    const template = document.querySelector("#choice-template");
    for (const choice of event.choices) {
      const node = template.content.firstElementChild.cloneNode(true);
      const cost = getChoiceCost(state, choice, context.rituals);
      const canPay = canPayOption(state, choice, context);
      const { gains, costs } = buildConsequences(choice, cost);

      node.classList.toggle("danger", choice.tone === "danger");
      node.classList.toggle("success", choice.tone === "success");
      node.classList.toggle("info", choice.tone === "info");
      node.disabled = !canPay;

      node.querySelector(".choice-card__label").textContent = choice.label;

      const gainsEl = node.querySelector(".choice-card__gains");
      const costsEl = node.querySelector(".choice-card__costs");

      gainsEl.innerHTML = gains.length
        ? gains.map((g) => `<span class="csq csq--${g.kind}">${g.text}</span>`).join("")
        : `<span class="csq csq--empty">&#8212;</span>`;

      costsEl.innerHTML = costs.length
        ? costs.map((c) => `<span class="csq csq--${c.kind}">${c.text}</span>`).join("")
        : `<span class="csq csq--empty">&#8212;</span>`;

      node.addEventListener("click", () => handlers.onChoice(choice.id));
      choiceList.append(node);
    }
  }
}

function buildConsequences(choice, cost) {
  const gains = [];
  const costs = [];

  for (const [resource, amount] of Object.entries(cost)) {
    if (amount <= 0) continue;
    const label = resource === "humanPower" ? "Cultists/Prisoners" : resource;
    const kind = resource === "Suspicion" ? "threat" : "cost";
    costs.push({ text: `−${amount} ${label}`, kind });
  }

  for (const effect of (choice.effects || [])) {
    switch (effect.type) {
      case "resource":
        if (effect.amount > 0) {
          const kind = effect.resource === "Suspicion" ? "threat" : "gain";
          gains.push({ text: `+${effect.amount} ${effect.resource}`, kind });
        } else if (effect.amount < 0) {
          costs.push({ text: `−${Math.abs(effect.amount)} ${effect.resource}`, kind: "cost" });
        }
        break;
      case "pressure":
        if (effect.amount > 0) {
          costs.push({ text: `+${effect.amount} Pressure`, kind: "threat" });
        } else if (effect.amount < 0) {
          gains.push({ text: `−${Math.abs(effect.amount)} Pressure`, kind: "gain" });
        }
        break;
      case "startRitual":
      case "startSelectedRitual":
        gains.push({ text: "Iniciar Ritual", kind: "ritual" });
        break;
      case "advanceRitual":
        gains.push({ text: effect.unsafe ? "Ritual +2" : "Ritual +1", kind: "ritual" });
        break;
      case "advanceRitualChance": {
        const pct = Math.round((effect.successChance ?? 0.5) * 100);
        gains.push({ text: `Ritual ${pct}%`, kind: "ritual" });
        costs.push({ text: "Risco Falha", kind: "threat" });
        break;
      }
      case "ritualFailure":
        costs.push({ text: "Falha Ritual", kind: "threat" });
        break;
      case "ritualStabilize":
        gains.push({ text: "Estabilizar Ritual", kind: "ritual" });
        break;
      case "stabilizeCycle":
        gains.push({ text: `−${effect.amount} Pressure`, kind: "gain" });
        break;
    }
  }

  if (choice.destination === "stabilize") {
    gains.push({ text: "−1 Pressure", kind: "gain" });
  }

  return { gains, costs };
}

function getResourceCardLabel(resource) {
  const labels = {
    Money: "Money",
    Food: "Food",
    Cultists: "Cultist",
    Prisoners: "Prisoner",
    Relics: "Relic",
    Suspicion: "Suspicion"
  };
  return labels[resource] || resource;
}

function getResourceMark(resource) {
  const marks = {
    Money: "M",
    Food: "F",
    Cultists: "C",
    Prisoners: "P",
    Relics: "R",
    Suspicion: "!"
  };
  return marks[resource] || "?";
}
