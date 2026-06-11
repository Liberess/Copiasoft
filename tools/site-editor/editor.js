let state = null;

const $ = (selector) => document.querySelector(selector);

function setStatus(message, isError = false) {
  const status = $("#status");
  status.textContent = message;
  status.style.color = isError ? "#b42318" : "#667085";
}

function input(label, value, onChange, options = {}) {
  const wrapper = document.createElement("label");
  wrapper.textContent = label;
  const field = document.createElement(options.multiline ? "textarea" : "input");
  field.value = value ?? "";
  if (options.type) field.type = options.type;
  field.addEventListener("input", () => onChange(field.value));
  wrapper.appendChild(field);
  return wrapper;
}

function checkbox(label, checked, onChange) {
  const wrapper = document.createElement("label");
  wrapper.className = "row";
  const field = document.createElement("input");
  field.type = "checkbox";
  field.checked = Boolean(checked);
  field.style.width = "auto";
  field.addEventListener("change", () => onChange(field.checked));
  wrapper.appendChild(field);
  wrapper.append(label);
  return wrapper;
}

function select(label, value, choices, onChange) {
  const wrapper = document.createElement("label");
  wrapper.textContent = label;
  const field = document.createElement("select");
  choices.forEach((choice) => {
    const option = document.createElement("option");
    option.value = choice.value;
    option.textContent = choice.label;
    field.appendChild(option);
  });
  field.value = value;
  field.addEventListener("change", () => onChange(field.value));
  wrapper.appendChild(field);
  return wrapper;
}

function card(title) {
  const el = document.createElement("article");
  el.className = "card";
  const h = document.createElement("h2");
  h.textContent = title;
  el.appendChild(h);
  return el;
}

function renderSite() {
  const panel = $("#sitePanel");
  panel.innerHTML = "";

  const common = card("Common");
  const grid = document.createElement("div");
  grid.className = "grid2";
  grid.append(
    input("Base URL", state.site.baseUrl, (value) => state.site.baseUrl = value),
    input("Support Email", state.site.supportEmail, (value) => state.site.supportEmail = value),
    input("Company Name", state.site.company.name, (value) => state.site.company.name = value),
    input("Studio Label KO", state.site.company.studioLabel.ko, (value) => state.site.company.studioLabel.ko = value),
    input("Studio Label EN", state.site.company.studioLabel.en, (value) => state.site.company.studioLabel.en = value)
  );
  common.appendChild(grid);
  panel.appendChild(common);

  for (const lang of ["ko", "en"]) {
    const home = card(`Home Hero (${lang.toUpperCase()})`);
    const homeData = state.site.home[lang];
    const homeGrid = document.createElement("div");
    homeGrid.className = "grid2";
    homeGrid.append(
      input("Meta Description", homeData.metaDescription, (value) => homeData.metaDescription = value, { multiline: true }),
      input("Hero Eyebrow", homeData.heroEyebrow, (value) => homeData.heroEyebrow = value),
      input("Hero Title", homeData.heroTitle, (value) => homeData.heroTitle = value, { multiline: true }),
      input("Hero Description", homeData.heroDescription, (value) => homeData.heroDescription = value, { multiline: true }),
      input("Primary CTA", homeData.primaryCta, (value) => homeData.primaryCta = value),
      input("Secondary CTA", homeData.secondaryCta, (value) => homeData.secondaryCta = value),
      input("Games Lead", homeData.gamesLead, (value) => homeData.gamesLead = value, { multiline: true }),
      input("News Lead", homeData.newsLead, (value) => homeData.newsLead = value, { multiline: true }),
      input("Support Lead", homeData.supportLead, (value) => homeData.supportLead = value, { multiline: true })
    );
    home.appendChild(homeGrid);
    panel.appendChild(home);
  }
}

function renderGames() {
  const panel = $("#gamesPanel");
  panel.innerHTML = "";

  const actions = document.createElement("div");
  actions.className = "actions";
  const add = document.createElement("button");
  add.type = "button";
  add.textContent = "Add Game";
  add.className = "primary";
  add.addEventListener("click", () => {
    state.games.push({
      slug: "new-game",
      visible: false,
      featured: false,
      image: "/assets/wallbreaker-card.svg",
      platforms: ["Google Play", "Android"],
      status: { ko: "개발 중", en: "In Development" },
      genre: { ko: "캐주얼", en: "Casual" },
      title: { ko: "새 게임", en: "New Game" },
      subtitle: { ko: "", en: "" },
      shortDescription: { ko: "", en: "" },
      longDescription: { ko: "", en: "" },
      googlePlayUrl: "",
      supportUrl: { ko: "/ko/support/", en: "/en/support/" },
      privacyUrl: { ko: "", en: "" },
      termsUrl: { ko: "", en: "" }
    });
    render();
  });
  actions.appendChild(add);
  panel.appendChild(actions);

  state.games.forEach((game, index) => {
    const el = card(`${game.slug} (${game.visible ? "visible" : "hidden"})`);
    const header = document.createElement("div");
    header.className = "itemHeader";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Remove from editor data";
    remove.addEventListener("click", () => {
      if (confirm(`${game.slug} 게임 데이터를 제거할까요? 기존 생성 HTML 파일은 자동 삭제되지 않습니다.`)) {
        state.games.splice(index, 1);
        render();
      }
    });
    header.append(remove);
    el.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "grid2";
    grid.append(
      input("Slug", game.slug, (value) => game.slug = value),
      input("Image Path", game.image, (value) => game.image = value),
      input("Platforms (comma separated)", game.platforms.join(", "), (value) => game.platforms = value.split(",").map((x) => x.trim()).filter(Boolean)),
      input("Google Play URL", game.googlePlayUrl, (value) => game.googlePlayUrl = value),
      checkbox("Visible on site", game.visible, (value) => game.visible = value),
      checkbox("Featured on home", game.featured, (value) => game.featured = value)
    );

    for (const lang of ["ko", "en"]) {
      grid.append(
        input(`Title ${lang.toUpperCase()}`, game.title[lang], (value) => game.title[lang] = value),
        input(`Status ${lang.toUpperCase()}`, game.status[lang], (value) => game.status[lang] = value),
        input(`Genre ${lang.toUpperCase()}`, game.genre[lang], (value) => game.genre[lang] = value),
        input(`Subtitle ${lang.toUpperCase()}`, game.subtitle[lang], (value) => game.subtitle[lang] = value),
        input(`Short Description ${lang.toUpperCase()}`, game.shortDescription[lang], (value) => game.shortDescription[lang] = value, { multiline: true }),
        input(`Long Description ${lang.toUpperCase()}`, game.longDescription[lang], (value) => game.longDescription[lang] = value, { multiline: true }),
        input(`Support URL ${lang.toUpperCase()}`, game.supportUrl[lang], (value) => game.supportUrl[lang] = value),
        input(`Privacy URL ${lang.toUpperCase()}`, game.privacyUrl[lang], (value) => game.privacyUrl[lang] = value),
        input(`Terms URL ${lang.toUpperCase()}`, game.termsUrl[lang], (value) => game.termsUrl[lang] = value)
      );
    }

    el.appendChild(grid);
    panel.appendChild(el);
  });
}

function renderPosts() {
  const panel = $("#postsPanel");
  panel.innerHTML = "";

  const actions = document.createElement("div");
  actions.className = "actions";
  const add = document.createElement("button");
  add.type = "button";
  add.textContent = "Add Post";
  add.className = "primary";
  add.addEventListener("click", () => {
    const game = state.games[0]?.slug || "wallbreaker";
    state.posts.unshift({
      slug: new Date().toISOString().slice(0, 10) + "-new-post",
      game,
      type: "notice",
      date: new Date().toISOString().slice(0, 10),
      version: "",
      visible: true,
      showOnHome: true,
      title: { ko: "새 공지", en: "New Post" },
      summary: { ko: "", en: "" },
      body: { ko: "", en: "" }
    });
    render();
  });
  actions.appendChild(add);
  panel.appendChild(actions);

  state.posts.forEach((post, index) => {
    const el = card(`${post.date} / ${post.game} / ${post.type}`);
    const header = document.createElement("div");
    header.className = "itemHeader";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      if (confirm(`${post.slug} 글을 제거할까요?`)) {
        state.posts.splice(index, 1);
        render();
      }
    });
    header.append(remove);
    el.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "grid2";
    grid.append(
      input("Slug", post.slug, (value) => post.slug = value),
      select("Game", post.game, state.games.map((game) => ({ value: game.slug, label: game.slug })), (value) => post.game = value),
      select("Type", post.type, [
        { value: "notice", label: "공지사항 / Notice" },
        { value: "update", label: "업데이트 / Update" },
        { value: "patch-note", label: "패치노트 / Patch Note" },
        { value: "release-note", label: "출시노트 / Release Note" }
      ], (value) => post.type = value),
      input("Date", post.date, (value) => post.date = value, { type: "date" }),
      input("Version", post.version, (value) => post.version = value),
      checkbox("Visible", post.visible, (value) => post.visible = value),
      checkbox("Show on Home", post.showOnHome, (value) => post.showOnHome = value)
    );

    for (const lang of ["ko", "en"]) {
      grid.append(
        input(`Title ${lang.toUpperCase()}`, post.title[lang], (value) => post.title[lang] = value),
        input(`Summary ${lang.toUpperCase()}`, post.summary[lang], (value) => post.summary[lang] = value, { multiline: true }),
        input(`Body ${lang.toUpperCase()}`, post.body[lang], (value) => post.body[lang] = value, { multiline: true })
      );
    }

    el.appendChild(grid);
    panel.appendChild(el);
  });
}

function renderRaw() {
  $("#rawJson").value = JSON.stringify(state, null, 2);
}

function render() {
  renderSite();
  renderGames();
  renderPosts();
  renderRaw();
}

async function load() {
  const res = await fetch("/api/content");
  state = await res.json();
  render();
  setStatus("Loaded. 수정 후 Save & Build를 누르면 HTML이 재생성됩니다.");
}

async function save(build = false) {
  const res = await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Save failed.");

  if (build) {
    const buildRes = await fetch("/api/build", { method: "POST" });
    const buildData = await buildRes.json();
    if (!buildData.ok) throw new Error(buildData.error || "Build failed.");
    setStatus(`Saved and built. ${buildData.output || ""}`);
  } else {
    setStatus("Saved JSON.");
  }
}

document.querySelectorAll(".tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.panel).classList.add("active");
  });
});

$("#saveButton").addEventListener("click", () => save(false).catch((error) => setStatus(error.message, true)));
$("#buildButton").addEventListener("click", () => save(true).catch((error) => setStatus(error.message, true)));
$("#applyRawButton").addEventListener("click", () => {
  try {
    state = JSON.parse($("#rawJson").value);
    render();
    setStatus("Raw JSON applied. Save & Build로 파일에 반영하세요.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

load().catch((error) => setStatus(error.message, true));
