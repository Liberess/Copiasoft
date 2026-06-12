let state = null;
let visualLang = "ko";
let selectedSectionId = "hero";
let previewDevice = "desktop";

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

function assetPicker(label, currentValue, onChange, accept = "image/*") {
  const wrapper = document.createElement("label");
  wrapper.textContent = label;
  const row = document.createElement("div");
  row.className = "row";
  const pathInput = document.createElement("input");
  pathInput.value = currentValue || "";
  pathInput.placeholder = "/assets/example.png";
  pathInput.addEventListener("input", () => onChange(pathInput.value));

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = accept;
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, dataUrl })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Upload failed.");

      pathInput.value = data.path;
      onChange(data.path);
      render();
      setStatus(`Uploaded ${data.path}. Save & Build로 반영하세요.`);
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  row.append(pathInput, fileInput);
  wrapper.appendChild(row);
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

function getHomePage(lang) {
  let page = state.pages.find((item) => item.lang === lang && item.page === "home");
  if (!page) {
    page = {
      page: "home",
      lang,
      sections: [
        { id: "hero", type: "hero", visible: true, title: "Hero", settings: { paddingTop: 72, paddingBottom: 54, textAlign: "left", imagePosition: "right", background: "light" } },
        { id: "games", type: "games", visible: true, title: "Games", settings: { paddingTop: 42, paddingBottom: 42, columns: 1, cardImagePosition: "left", background: "dark" } },
        { id: "news", type: "news", visible: true, title: "Latest News", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
        { id: "support", type: "support", visible: true, title: "Support & Policy", settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } }
      ]
    };
    state.pages.push(page);
  }
  return page;
}

function selectedSection() {
  const page = getHomePage(visualLang);
  return page.sections.find((section) => section.id === selectedSectionId) || page.sections[0];
}

function localized(value, lang) {
  if (value && typeof value === "object") {
    return value[lang] || value.en || value.ko || "";
  }
  return value || "";
}

function sectionLabel(section) {
  const names = {
    hero: "Hero",
    games: "Games",
    news: "Latest News",
    support: "Support & Policy"
  };
  return section.title || names[section.type] || section.type;
}

function moveSection(delta) {
  const page = getHomePage(visualLang);
  const index = page.sections.findIndex((section) => section.id === selectedSectionId);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= page.sections.length) {
    return;
  }
  const [item] = page.sections.splice(index, 1);
  page.sections.splice(next, 0, item);
  renderVisual();
  renderRaw();
}

function ensureSection(type) {
  const page = getHomePage(visualLang);
  if (page.sections.some((section) => section.type === type)) {
    selectedSectionId = page.sections.find((section) => section.type === type).id;
    renderVisual();
    return;
  }

  const defaults = {
    hero: { id: "hero", type: "hero", visible: true, title: "Hero", settings: { paddingTop: 72, paddingBottom: 54, textAlign: "left", imagePosition: "right", background: "light" } },
    games: { id: "games", type: "games", visible: true, title: "Games", settings: { paddingTop: 42, paddingBottom: 42, columns: 1, cardImagePosition: "left", background: "dark" } },
    news: { id: "news", type: "news", visible: true, title: "Latest News", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
    support: { id: "support", type: "support", visible: true, title: "Support & Policy", settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } }
  };
  page.sections.push(defaults[type]);
  selectedSectionId = defaults[type].id;
  renderVisual();
  renderRaw();
}

function renderPreviewSection(section) {
  const home = state.site.home[visualLang];
  const visibleGames = state.games.filter((game) => game.visible);
  const posts = state.posts.filter((post) => post.visible && post.showOnHome).slice(0, 4);
  const settings = section.settings || {};
  const bg = settings.background === "light" ? "light" : "dark";
  const base = document.createElement("section");
  base.className = `previewSection ${bg} ${section.id === selectedSectionId ? "active" : ""}`;
  base.style.setProperty("--pt", `${settings.paddingTop || 42}px`);
  base.style.setProperty("--pb", `${settings.paddingBottom || 42}px`);
  base.addEventListener("click", () => {
    selectedSectionId = section.id;
    renderVisual();
  });

  if (!section.visible) {
    base.style.opacity = "0.42";
  }

  if (section.type === "hero") {
    const featuredGame = visibleGames.find((game) => game.featured) || visibleGames[0];
    const heroArt = featuredGame?.image
      ? `<div class="previewArt"><img src="${featuredGame.image}" alt="" /></div>`
      : `<div class="previewArt"><span>No game image</span></div>`;
    const hero = document.createElement("div");
    hero.className = `previewHero ${settings.textAlign === "center" ? "center" : ""} ${settings.imagePosition === "left" ? "image-left" : ""}`;
    hero.innerHTML = `
      <div>
        <div class="previewText">${home.heroEyebrow}</div>
        <div class="previewTitle">${home.heroTitle}</div>
        <div class="previewText">${home.heroDescription}</div>
      </div>
      ${heroArt}
    `;
    base.appendChild(hero);
    if (settings.effect === "animated-gradient") {
      base.style.backgroundImage = "radial-gradient(circle at 20% 20%, rgba(139,124,255,.28), transparent 32%), radial-gradient(circle at 82% 30%, rgba(68,215,168,.24), transparent 34%)";
    }
    if (settings.effect === "image" && settings.backgroundImage) {
      base.style.backgroundImage = `linear-gradient(rgba(247,251,255,.76), rgba(247,251,255,.76)), url("${settings.backgroundImage}")`;
      base.style.backgroundSize = "cover";
      base.style.backgroundPosition = "center";
    }
    if (settings.effect === "video") {
      base.style.backgroundImage = "linear-gradient(135deg, rgba(139,124,255,.32), rgba(68,215,168,.24))";
    }
    return base;
  }

  const title = document.createElement("div");
  title.className = "previewTitle";
  title.textContent = sectionLabel(section);
  base.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "previewCardGrid";
  grid.style.setProperty("--cols", Math.max(1, Math.min(3, Number(settings.columns || (section.type === "support" ? 3 : 2)))));

  const source = section.type === "games" ? visibleGames : section.type === "news" ? posts : [
    { title: { [visualLang]: "Contact" }, summary: { [visualLang]: "Support page" } },
    { title: { [visualLang]: "Privacy" }, summary: { [visualLang]: "Privacy policy" } },
    { title: { [visualLang]: "Terms" }, summary: { [visualLang]: "Terms of service" } }
  ];

  source.forEach((item) => {
    const cardEl = document.createElement("div");
    cardEl.className = "previewCard";
    cardEl.innerHTML = `<strong>${localized(item.title, visualLang) || item.slug || item.game}</strong><div class="previewText">${localized(item.shortDescription || item.summary, visualLang)}</div>`;
    grid.appendChild(cardEl);
  });
  base.appendChild(grid);
  return base;
}

function renderVisual() {
  const panel = $("#visualPanel");
  panel.innerHTML = "";
  const page = getHomePage(visualLang);
  if (!page.sections.some((section) => section.id === selectedSectionId)) {
    selectedSectionId = page.sections[0]?.id || "hero";
  }
  const section = selectedSection();

  const shell = document.createElement("div");
  shell.className = "builderShell";

  const hierarchy = document.createElement("aside");
  hierarchy.className = "builderPane";
  hierarchy.innerHTML = "<h2>Hierarchy</h2>";

  const langRow = document.createElement("div");
  langRow.className = "row";
  langRow.append(
    select("Language", visualLang, [{ value: "ko", label: "KO" }, { value: "en", label: "EN" }], (value) => {
      visualLang = value;
      selectedSectionId = getHomePage(visualLang).sections[0]?.id || "hero";
      renderVisual();
    })
  );
  hierarchy.appendChild(langRow);

  page.sections.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sectionNode ${item.id === selectedSectionId ? "active" : ""}`;
    btn.textContent = `${item.visible ? "●" : "○"} ${sectionLabel(item)}`;
    btn.addEventListener("click", () => {
      selectedSectionId = item.id;
      renderVisual();
    });
    hierarchy.appendChild(btn);
  });

  const mini = document.createElement("div");
  mini.className = "miniButtons";
  ["hero", "games", "news", "support"].forEach((type) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `Add ${type}`;
    btn.addEventListener("click", () => ensureSection(type));
    mini.appendChild(btn);
  });
  hierarchy.appendChild(mini);

  const canvasPane = document.createElement("section");
  canvasPane.className = "builderPane";
  const toolbar = document.createElement("div");
  toolbar.className = "canvasToolbar";
  toolbar.innerHTML = "<h2>Canvas Preview</h2>";
  const device = document.createElement("div");
  device.className = "deviceSwitch";
  ["desktop", "mobile"].forEach((mode) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = mode;
    if (previewDevice === mode) btn.classList.add("primary");
    btn.addEventListener("click", () => {
      previewDevice = mode;
      renderVisual();
    });
    device.appendChild(btn);
  });
  toolbar.appendChild(device);
  canvasPane.appendChild(toolbar);

  const canvas = document.createElement("div");
  canvas.className = "builderCanvas";
  const preview = document.createElement("div");
  preview.className = `previewPage ${previewDevice === "mobile" ? "mobile" : ""}`;
  preview.innerHTML = `<div class="previewHeader"><span>CopiaSoft</span><span>${visualLang.toUpperCase()}</span></div>`;
  page.sections.forEach((item) => preview.appendChild(renderPreviewSection(item)));
  canvas.appendChild(preview);
  canvasPane.appendChild(canvas);

  const inspector = document.createElement("aside");
  inspector.className = "builderPane";
  inspector.innerHTML = "<h2>Inspector</h2>";
  if (section) {
    const settings = section.settings || (section.settings = {});
    const fields = document.createElement("div");
    fields.className = "grid2";
    fields.append(
      input("Title", section.title, (value) => section.title = value),
      checkbox("Visible", section.visible, (value) => section.visible = value),
      input("Padding Top", settings.paddingTop || 42, (value) => settings.paddingTop = Number(value), { type: "number" }),
      input("Padding Bottom", settings.paddingBottom || 42, (value) => settings.paddingBottom = Number(value), { type: "number" }),
      select("Background", settings.background || "dark", [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }], (value) => settings.background = value)
    );

    if (section.type === "hero") {
      fields.append(
        select("Text Align", settings.textAlign || "left", [{ value: "left", label: "Left" }, { value: "center", label: "Center" }], (value) => settings.textAlign = value),
        select("Image Position", settings.imagePosition || "right", [{ value: "right", label: "Right" }, { value: "left", label: "Left" }], (value) => settings.imagePosition = value),
        select("Hero Background Effect", settings.effect || "none", [
          { value: "none", label: "None" },
          { value: "animated-gradient", label: "Animated Gradient" },
          { value: "image", label: "2D Image" },
          { value: "video", label: "Video" }
        ], (value) => settings.effect = value),
        assetPicker("Background Image", settings.backgroundImage || "", (value) => settings.backgroundImage = value),
        assetPicker("Background Video", settings.backgroundVideo || "", (value) => settings.backgroundVideo = value, "video/mp4,video/webm")
      );
    } else {
      fields.append(
        select("Columns", String(settings.columns || (section.type === "support" ? 3 : 2)), [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }], (value) => settings.columns = Number(value))
      );
      if (section.type === "games") {
        fields.append(select("Card Image Position", settings.cardImagePosition || "left", [{ value: "left", label: "Left" }, { value: "right", label: "Right" }], (value) => settings.cardImagePosition = value));
      }
    }
    inspector.appendChild(fields);

    const actions = document.createElement("div");
    actions.className = "actions";
    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "Move Up";
    up.addEventListener("click", () => moveSection(-1));
    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "Move Down";
    down.addEventListener("click", () => moveSection(1));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Remove Section";
    remove.addEventListener("click", () => {
      if (confirm(`${sectionLabel(section)} 섹션을 제거할까요? Add 버튼으로 다시 추가할 수 있습니다.`)) {
        page.sections = page.sections.filter((item) => item.id !== section.id);
        selectedSectionId = page.sections[0]?.id || "hero";
        renderVisual();
        renderRaw();
      }
    });
    actions.append(up, down, remove);
    inspector.appendChild(actions);

    inspector.addEventListener("input", () => {
      renderVisual();
      renderRaw();
    });
    inspector.addEventListener("change", () => {
      renderVisual();
      renderRaw();
    });
  }

  shell.append(hierarchy, canvasPane, inspector);
  panel.appendChild(shell);
}

function renderSite() {
  const panel = $("#sitePanel");
  panel.innerHTML = "";

  const common = card("Common");
  const grid = document.createElement("div");
  grid.className = "grid2";
  state.site.assets = state.site.assets || {};
  grid.append(
    input("Base URL", state.site.baseUrl, (value) => state.site.baseUrl = value),
    input("Support Email", state.site.supportEmail, (value) => state.site.supportEmail = value),
    input("Company Name", state.site.company.name, (value) => state.site.company.name = value),
    assetPicker("Logo Image", state.site.assets.logo, (value) => state.site.assets.logo = value),
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
      assetPicker("Game Key Art", game.image, (value) => game.image = value),
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
  renderVisual();
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
