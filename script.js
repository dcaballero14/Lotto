// script.js
(() => {
  const STORAGE_KEY = "dynastyLottery_v1";

  const TEAMS = [
    { id: "crabs", name: "Snow Crabs", file: "assets/Crabs.PNG" },
    { id: "lemurs", name: "Lemurs", file: "assets/Lemurs.PNG" },
    { id: "breakers", name: "Beach Breakers", file: "assets/BeachBreakers.PNG" },
    { id: "turtles", name: "Snapping Turtles", file: "assets/Turtles.PNG" },
    { id: "predators", name: "Predators", file: "assets/Predators.PNG" },
    { id: "kodiaks", name: "Kodiaks", file: "assets/Kodiaks.PNG" },
    { id: "cyclones", name: "Cyclones", file: "assets/Cyclones.PNG" },
    { id: "smoghogs", name: "Smog Hogs", file: "assets/SmogHogs.PNG" },
    { id: "sanantonio", name: "San Antonio", file: "assets/SanAntonio.PNG" },
    { id: "inferno", name: "Tulsa Inferno", file: "assets/TulsaInferno.PNG" },
    { id: "qkiwis", name: "Qkiwis", file: "assets/Qkiwis.png" },
    { id: "spuds", name: "Dublin Spuds", file: "assets/DublinSpuds.PNG" },
  ];

  const teamGrid = document.getElementById("teamGrid");
  const orderList = document.getElementById("orderList");

  const undoBtn = document.getElementById("undoBtn");
  const resetBtn = document.getElementById("resetBtn");
  const randomBtn = document.getElementById("randomBtn");
  const copyBtn = document.getElementById("copyBtn");
  const completeBadge = document.getElementById("completeBadge");

  const toast = document.getElementById("toast");
  const pickSound = document.getElementById("pickSound");
  const muteBtn = document.getElementById("muteBtn");

  let state = loadState(); // { order: [teamId...], muted: boolean }

  // ---------- Render ----------
  function render() {
    renderGrid();
    renderOrder();
    renderControls();
    saveState();
  }

  function renderGrid() {
    teamGrid.innerHTML = "";

    const selected = new Set(state.order);

    TEAMS.forEach((t) => {
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("role", "listitem");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", t.name);

      const locked = selected.has(t.id);
      if (locked) {
        card.classList.add("locked");
        card.setAttribute("aria-disabled", "true");
        card.setAttribute("tabindex", "-1");
      }

      card.innerHTML = `
        <img class="logo" src="${t.file}" alt="${t.name} logo" loading="lazy" onerror="this.style.opacity=.25; this.title='Missing image: ${t.file}'" />
        <div>
          <div class="name">${t.name}</div>
          <span class="file">${t.file.replace("assets/","")}</span>
        </div>
        <div class="lock" aria-hidden="true">✓</div>
      `;

      if (!locked) {
        card.addEventListener("click", () => selectTeam(t.id));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectTeam(t.id);
          }
        });
      }

      teamGrid.appendChild(card);
    });
  }

  function renderOrder() {
    orderList.innerHTML = "";

    const idToTeam = new Map(TEAMS.map((t) => [t.id, t]));
    const picks = state.order.map((id) => idToTeam.get(id)).filter(Boolean);

    for (let i = 0; i < 12; i++) {
      const li = document.createElement("li");
      li.className = "pick";
      const pickNum = i + 1;

      const team = picks[i];
      if (team) {
        li.classList.add("slide-in");
        li.innerHTML = `
          <div class="pick-left">
            <div class="pick-num">Pick #${pickNum}</div>
            <img class="pick-logo" src="${team.file}" alt="${team.name} logo" loading="lazy" />
            <div class="pick-name">${team.name}</div>
          </div>
        `;
      } else {
        li.innerHTML = `
          <div class="pick-left">
            <div class="pick-num">Pick #${pickNum}</div>
            <div class="pick-empty">— empty</div>
          </div>
        `;
      }

      orderList.appendChild(li);
    }

    // Complete badge
    const done = state.order.length === 12;
    completeBadge.hidden = !done;
  }

  function renderControls() {
    undoBtn.disabled = state.order.length === 0;
    resetBtn.disabled = state.order.length === 0;
    randomBtn.disabled = state.order.length === 12;

    // sound toggle UI
    const muted = !!state.muted;
    muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    muteBtn.textContent = muted ? "🔇 Sound: Off" : "🔊 Sound: On";
  }

  // ---------- Actions ----------
  function selectTeam(teamId) {
    if (state.order.includes(teamId)) return;
    if (state.order.length >= 12) return;

    state.order.push(teamId);
    playPickSound();
    render();
  }

  function undo() {
    if (state.order.length === 0) return;
    state.order.pop();
    render();
  }

  function reset() {
    state.order = [];
    render();
    showToast("Reset complete.");
  }

  function randomizeRemaining() {
    const selected = new Set(state.order);
    const remaining = TEAMS.map(t => t.id).filter(id => !selected.has(id));

    // Fisher–Yates shuffle
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    state.order = state.order.concat(remaining).slice(0, 12);
    render();
    showToast("Filled remaining picks randomly.");
  }

  async function copyResults() {
    const idToTeam = new Map(TEAMS.map((t) => [t.id, t]));
    const lines = state.order.map((id, idx) => {
      const t = idToTeam.get(id);
      return `Pick #${idx + 1}: ${t ? t.name : id}`;
    });

    const text = lines.length ? lines.join("\n") : "No picks selected yet.";

    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied results to clipboard ✅");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Copied results (fallback) ✅");
    }
  }

  function toggleMute() {
    state.muted = !state.muted;
    renderControls();
    saveState();
  }

  function playPickSound() {
    if (state.muted) return;

    // Some browsers require user gesture; click qualifies.
    try {
      pickSound.currentTime = 0;
      pickSound.play();
    } catch {
      // ignore
    }
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 1600);
  }

  // ---------- Persistence ----------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { order: [], muted: false };
      const parsed = JSON.parse(raw);
      const order = Array.isArray(parsed.order) ? parsed.order : [];
      const muted = !!parsed.muted;

      // sanitize: ensure ids exist and unique
      const validIds = new Set(TEAMS.map(t => t.id));
      const seen = new Set();
      const cleaned = [];
      for (const id of order) {
        if (validIds.has(id) && !seen.has(id) && cleaned.length < 12) {
          seen.add(id);
          cleaned.push(id);
        }
      }

      return { order: cleaned, muted };
    } catch {
      return { order: [], muted: false };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  // ---------- Wire up ----------
  undoBtn.addEventListener("click", undo);
  resetBtn.addEventListener("click", reset);
  randomBtn.addEventListener("click", randomizeRemaining);
  copyBtn.addEventListener("click", copyResults);
  muteBtn.addEventListener("click", toggleMute);

  // Initial render
  render();
})();
