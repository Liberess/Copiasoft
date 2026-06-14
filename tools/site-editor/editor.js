let state = null;
let visualLang = "ko";
let selectedSectionId = "hero";
let gameVisualLang = "ko";
let selectedGameSlug = "wallbreaker";
let selectedGameSectionId = "hero";
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
        { id: "hero", type: "hero", visible: true, title: "Hero", settings: { paddingTop: 72, paddingBottom: 54, textAlign: "left", showImage: true, imageWidth: 100, imageWidthPx: 320, imageHeightPx: 240, imageFit: "contain", imagePosition: "right", background: "light" } },
        { id: "games", type: "games", visible: true, title: "Games", settings: { paddingTop: 42, paddingBottom: 42, columns: 1, cardImagePosition: "left", cardMaxWidthPx: 980, cardImageHeightPx: 300, cardPaddingPx: 18, cardGapPx: 22, cardImageFit: "cover", background: "dark" } },
        { id: "news", type: "news", visible: true, title: "Latest News", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
        { id: "support", type: "support", visible: false, title: "Support & Policy", settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } }
      ]
    };
    state.pages.push(page);
  }
  return page;
}

function getGamePage(lang, gameSlug) {
  let page = state.pages.find((item) => item.lang === lang && item.page === "game" && item.game === gameSlug);
  if (!page) {
    page = {
      page: "game",
      lang,
      game: gameSlug,
      buttonStyle: "solid",
      sections: [
        { id: "hero", type: "hero", visible: true, title: "Hero", settings: { paddingTop: 72, paddingBottom: 54, textAlign: "left", showImage: true, imageWidth: 100, imageWidthPx: 360, imageHeightPx: 260, imageFit: "contain", imagePosition: "right", background: "light", effect: "none", backgroundImage: "", backgroundVideo: "" } },
        { id: "overview", type: "overview", visible: true, title: lang === "ko" ? "게임 소개" : "Overview", settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } },
        { id: "screenshots", type: "screenshots", visible: true, title: lang === "ko" ? "스크린샷" : "Screenshots", settings: { paddingTop: 42, paddingBottom: 42, background: "dark" } },
        { id: "notice", type: "notice", visible: true, title: lang === "ko" ? "공지사항" : "Notice", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
        { id: "update", type: "update", visible: false, title: lang === "ko" ? "업데이트" : "Updates", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
        { id: "patch-note", type: "patch-note", visible: true, title: lang === "ko" ? "패치노트" : "Patch Notes", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
        { id: "release-note", type: "release-note", visible: false, title: lang === "ko" ? "출시노트" : "Release Notes", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
        { id: "support", type: "support", visible: true, title: "Support", settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } }
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

function selectedGameSection() {
  const page = getGamePage(gameVisualLang, selectedGameSlug);
  return page.sections.find((section) => section.id === selectedGameSectionId) || page.sections[0];
}

function localized(value, lang) {
  if (value && typeof value === "object") {
    return value[lang] || value.en || value.ko || "";
  }
  return value || "";
}

function localizedObject(value = "") {
  return value && typeof value === "object" ? value : { ko: value || "", en: value || "" };
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    hero: { id: "hero", type: "hero", visible: true, title: "Hero", settings: { paddingTop: 72, paddingBottom: 54, textAlign: "left", showImage: true, imageWidth: 100, imageWidthPx: 320, imageHeightPx: 240, imageFit: "contain", imagePosition: "right", background: "light" } },
    games: { id: "games", type: "games", visible: true, title: "Games", settings: { paddingTop: 42, paddingBottom: 42, columns: 1, cardImagePosition: "left", cardMaxWidthPx: 980, cardImageHeightPx: 300, cardPaddingPx: 18, cardGapPx: 22, cardImageFit: "cover", background: "dark" } },
    news: { id: "news", type: "news", visible: true, title: "Latest News", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
    support: { id: "support", type: "support", visible: false, title: "Support & Policy", settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } }
  };
  page.sections.push(defaults[type]);
  selectedSectionId = defaults[type].id;
  renderVisual();
  renderRaw();
}

function defaultGameSection(type, lang) {
  const titles = {
    hero: "Hero",
    overview: lang === "ko" ? "게임 소개" : "Overview",
    notice: lang === "ko" ? "공지사항" : "Notice",
    update: lang === "ko" ? "업데이트" : "Updates",
    "patch-note": lang === "ko" ? "패치노트" : "Patch Notes",
    "release-note": lang === "ko" ? "출시노트" : "Release Notes",
    support: "Support"
  };
  return {
    id: type,
    type,
    visible: type !== "update" && type !== "release-note",
    title: titles[type] || type,
    settings: type === "hero"
      ? { paddingTop: 72, paddingBottom: 54, textAlign: "left", showImage: true, imageWidth: 100, imageWidthPx: 360, imageHeightPx: 260, imageFit: "contain", imagePosition: "right", background: "light", effect: "none", backgroundImage: "", backgroundVideo: "" }
      : { paddingTop: 42, paddingBottom: 42, columns: type === "support" || type === "overview" ? 3 : 2, background: "dark" }
  };
}

function previewImageStyle(settings) {
  const width = Number(settings.imageWidthPx || 0) > 0
    ? `${Number(settings.imageWidthPx)}px`
    : `${Math.max(1, Math.min(100, Number(settings.imageWidth || 100)))}%`;
  const height = Number(settings.imageHeightPx || 0) > 0
    ? `${Number(settings.imageHeightPx)}px`
    : "auto";
  const fit = ["contain", "cover", "fill"].includes(settings.imageFit) ? settings.imageFit : "contain";
  return `width:${width};height:${height};--preview-fit:${fit}`;
}

function moveGameSection(delta) {
  const page = getGamePage(gameVisualLang, selectedGameSlug);
  const index = page.sections.findIndex((section) => section.id === selectedGameSectionId);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= page.sections.length) return;
  const [item] = page.sections.splice(index, 1);
  page.sections.splice(next, 0, item);
  renderGameVisual();
  renderRaw();
}

function ensureGameSection(type) {
  const page = getGamePage(gameVisualLang, selectedGameSlug);
  const existing = page.sections.find((section) => section.type === type);
  if (existing) {
    selectedGameSectionId = existing.id;
  } else {
    const item = defaultGameSection(type, gameVisualLang);
    page.sections.push(item);
    selectedGameSectionId = item.id;
  }
  renderGameVisual();
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
    const heroArt = featuredGame?.image && settings.showImage !== false
      ? `<div class="previewArt" style="${previewImageStyle(settings)}"><img src="${featuredGame.image}" alt="" /></div>`
      : `<div class="previewArt"><span>No game image</span></div>`;
    const hero = document.createElement("div");
    hero.className = `previewHero ${settings.textAlign === "center" ? "center" : ""} ${settings.imagePosition === "left" ? "image-left" : ""} ${settings.showImage === false ? "noImage" : ""}`;
    hero.innerHTML = `
      <div>
        <div class="previewText">${home.heroEyebrow}</div>
        <div class="previewTitle">${home.heroTitle}</div>
        <div class="previewText">${home.heroDescription}</div>
      </div>
      ${settings.showImage === false ? "" : heroArt}
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
        checkbox("Show Hero Image", settings.showImage !== false, (value) => settings.showImage = value),
        input("Hero Image Width %", settings.imageWidth || 100, (value) => settings.imageWidth = Number(value), { type: "number" }),
        input("Hero Image Width px", settings.imageWidthPx || "", (value) => settings.imageWidthPx = Number(value), { type: "number" }),
        input("Hero Image Height px", settings.imageHeightPx || "", (value) => settings.imageHeightPx = Number(value), { type: "number" }),
        select("Hero Image Fit", settings.imageFit || "contain", [{ value: "contain", label: "Contain" }, { value: "cover", label: "Cover" }, { value: "fill", label: "Fill" }], (value) => settings.imageFit = value),
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
        fields.append(
          select("Card Image Position", settings.cardImagePosition || "left", [{ value: "left", label: "Left" }, { value: "right", label: "Right" }], (value) => settings.cardImagePosition = value),
          input("Card Max Width px", settings.cardMaxWidthPx || "", (value) => settings.cardMaxWidthPx = Number(value), { type: "number" }),
          input("Card Image Height px", settings.cardImageHeightPx || "", (value) => settings.cardImageHeightPx = Number(value), { type: "number" }),
          input("Card Padding px", settings.cardPaddingPx || "", (value) => settings.cardPaddingPx = Number(value), { type: "number" }),
          input("Card Gap px", settings.cardGapPx || "", (value) => settings.cardGapPx = Number(value), { type: "number" }),
          select("Card Image Fit", settings.cardImageFit || "cover", [{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }, { value: "fill", label: "Fill" }], (value) => settings.cardImageFit = value)
        );
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

function renderGamePreviewSection(section, game, page) {
  const posts = state.posts.filter((post) => post.game === game.slug && post.visible && post.type === section.type).slice(0, 4);
  const settings = section.settings || {};
  const bg = settings.background === "light" ? "light" : "dark";
  const base = document.createElement("section");
  base.className = `previewSection ${bg} ${section.id === selectedGameSectionId ? "active" : ""}`;
  base.style.setProperty("--pt", `${settings.paddingTop || 42}px`);
  base.style.setProperty("--pb", `${settings.paddingBottom || 42}px`);
  base.addEventListener("click", () => {
    selectedGameSectionId = section.id;
    renderGameVisual();
  });
  if (!section.visible) base.style.opacity = "0.42";

  if (section.type === "hero") {
    const hero = document.createElement("div");
    hero.className = `previewHero ${settings.textAlign === "center" ? "center" : ""} ${settings.imagePosition === "left" ? "image-left" : ""} ${settings.showImage === false ? "noImage" : ""}`;
    hero.innerHTML = `
      <div>
        <div class="previewText">${localized(game.genre, gameVisualLang)}</div>
        <div class="previewTitle">${localized(game.title, gameVisualLang)}</div>
        <div class="previewText">${localized(game.shortDescription, gameVisualLang)}</div>
        <div class="previewButtonRow"><span class="previewButton ${page.buttonStyle || "solid"}">Google Play</span><span class="previewButton secondary">Contact</span></div>
      </div>
      ${settings.showImage === false ? "" : `<div class="previewArt" style="${previewImageStyle(settings)}">${game.image ? `<img src="${game.image}" alt="" />` : "<span>No game image</span>"}</div>`}
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
  title.textContent = section.title || section.type;
  base.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "previewCardGrid";
  grid.style.setProperty("--cols", Math.max(1, Math.min(3, Number(settings.columns || 2))));
  let source = posts;
  if (section.type === "overview") {
    source = [
      { title: { [gameVisualLang]: "Genre" }, summary: game.genre },
      { title: { [gameVisualLang]: "Platform" }, summary: { [gameVisualLang]: game.platforms.join(" / ") } },
      { title: { [gameVisualLang]: "Status" }, summary: game.status }
    ];
  }
  if (section.type === "support") {
    source = [
      { title: { [gameVisualLang]: "Support" }, summary: { [gameVisualLang]: "Contact and help" } },
      { title: { [gameVisualLang]: "Privacy" }, summary: { [gameVisualLang]: "Privacy policy" } },
      { title: { [gameVisualLang]: "Terms" }, summary: { [gameVisualLang]: "Terms of service" } }
    ];
  }
  if (source.length === 0) {
    source = [{ title: { [gameVisualLang]: "No posts yet" }, summary: { [gameVisualLang]: "" } }];
  }
  source.forEach((item) => {
    const cardEl = document.createElement("div");
    cardEl.className = "previewCard";
    cardEl.innerHTML = `<strong>${localized(item.title, gameVisualLang) || item.slug || item.game}</strong><div class="previewText">${localized(item.shortDescription || item.summary || item.body, gameVisualLang)}</div>`;
    grid.appendChild(cardEl);
  });
  base.appendChild(grid);
  return base;
}

function renderGameVisual() {
  const panel = $("#gameVisualPanel");
  panel.innerHTML = "";
  const visibleGames = state.games.filter((game) => game.visible);
  const game = state.games.find((item) => item.slug === selectedGameSlug) || visibleGames[0] || state.games[0];
  if (!game) {
    panel.textContent = "No game data.";
    return;
  }
  selectedGameSlug = game.slug;
  const page = getGamePage(gameVisualLang, selectedGameSlug);
  if (!page.sections.some((section) => section.id === selectedGameSectionId)) {
    selectedGameSectionId = page.sections[0]?.id || "hero";
  }
  const section = selectedGameSection();

  const shell = document.createElement("div");
  shell.className = "builderShell";

  const hierarchy = document.createElement("aside");
  hierarchy.className = "builderPane";
  hierarchy.innerHTML = "<h2>Game Page Hierarchy</h2>";
  hierarchy.append(
    select("Language", gameVisualLang, [{ value: "ko", label: "KO" }, { value: "en", label: "EN" }], (value) => {
      gameVisualLang = value;
      selectedGameSectionId = getGamePage(gameVisualLang, selectedGameSlug).sections[0]?.id || "hero";
      renderGameVisual();
    }),
    select("Game", selectedGameSlug, state.games.map((item) => ({ value: item.slug, label: item.slug })), (value) => {
      selectedGameSlug = value;
      selectedGameSectionId = getGamePage(gameVisualLang, selectedGameSlug).sections[0]?.id || "hero";
      renderGameVisual();
    })
  );
  page.sections.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sectionNode ${item.id === selectedGameSectionId ? "active" : ""}`;
    btn.textContent = `${item.visible ? "●" : "○"} ${sectionLabel(item)}`;
    btn.addEventListener("click", () => {
      selectedGameSectionId = item.id;
      renderGameVisual();
    });
    hierarchy.appendChild(btn);
  });
  const mini = document.createElement("div");
  mini.className = "miniButtons";
  ["hero", "overview", "notice", "update", "patch-note", "release-note", "support"].forEach((type) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `Add ${type}`;
    btn.addEventListener("click", () => ensureGameSection(type));
    mini.appendChild(btn);
  });
  hierarchy.appendChild(mini);

  const canvasPane = document.createElement("section");
  canvasPane.className = "builderPane";
  const toolbar = document.createElement("div");
  toolbar.className = "canvasToolbar";
  toolbar.innerHTML = "<h2>Game Page Preview</h2>";
  const device = document.createElement("div");
  device.className = "deviceSwitch";
  ["desktop", "mobile"].forEach((mode) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = mode;
    if (previewDevice === mode) btn.classList.add("primary");
    btn.addEventListener("click", () => {
      previewDevice = mode;
      renderGameVisual();
    });
    device.appendChild(btn);
  });
  toolbar.appendChild(device);
  canvasPane.appendChild(toolbar);

  const canvas = document.createElement("div");
  canvas.className = "builderCanvas";
  const preview = document.createElement("div");
  preview.className = `previewPage ${previewDevice === "mobile" ? "mobile" : ""}`;
  preview.innerHTML = `<div class="previewHeader"><span>${localized(game.title, gameVisualLang)}</span><span>${gameVisualLang.toUpperCase()}</span></div>`;
  page.sections.forEach((item) => preview.appendChild(renderGamePreviewSection(item, game, page)));
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
      select("Button Style", page.buttonStyle || "solid", [{ value: "solid", label: "Solid" }, { value: "outline", label: "Outline" }, { value: "soft", label: "Soft" }], (value) => page.buttonStyle = value),
      input("Title", section.title, (value) => section.title = value),
      checkbox("Visible", section.visible, (value) => section.visible = value),
      input("Padding Top", settings.paddingTop || 42, (value) => settings.paddingTop = Number(value), { type: "number" }),
      input("Padding Bottom", settings.paddingBottom || 42, (value) => settings.paddingBottom = Number(value), { type: "number" }),
      select("Background", settings.background || "dark", [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }], (value) => settings.background = value)
    );
    if (section.type === "hero") {
      fields.append(
        select("Text Align", settings.textAlign || "left", [{ value: "left", label: "Left" }, { value: "center", label: "Center" }], (value) => settings.textAlign = value),
        checkbox("Show Hero Image", settings.showImage !== false, (value) => settings.showImage = value),
        input("Hero Image Width %", settings.imageWidth || 100, (value) => settings.imageWidth = Number(value), { type: "number" }),
        input("Hero Image Width px", settings.imageWidthPx || "", (value) => settings.imageWidthPx = Number(value), { type: "number" }),
        input("Hero Image Height px", settings.imageHeightPx || "", (value) => settings.imageHeightPx = Number(value), { type: "number" }),
        select("Hero Image Fit", settings.imageFit || "contain", [{ value: "contain", label: "Contain" }, { value: "cover", label: "Cover" }, { value: "fill", label: "Fill" }], (value) => settings.imageFit = value),
        select("Image Position", settings.imagePosition || "right", [{ value: "right", label: "Right" }, { value: "left", label: "Left" }], (value) => settings.imagePosition = value),
        select("Hero Background Effect", settings.effect || "none", [{ value: "none", label: "None" }, { value: "animated-gradient", label: "Animated Gradient" }, { value: "image", label: "2D Image" }, { value: "video", label: "Video" }], (value) => settings.effect = value),
        assetPicker("Background Image", settings.backgroundImage || "", (value) => settings.backgroundImage = value),
        assetPicker("Background Video", settings.backgroundVideo || "", (value) => settings.backgroundVideo = value, "video/mp4,video/webm")
      );
    } else {
      fields.append(select("Columns", String(settings.columns || 2), [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }], (value) => settings.columns = Number(value)));
    }
    inspector.appendChild(fields);

    const actions = document.createElement("div");
    actions.className = "actions";
    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "Move Up";
    up.addEventListener("click", () => moveGameSection(-1));
    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "Move Down";
    down.addEventListener("click", () => moveGameSection(1));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Remove Section";
    remove.addEventListener("click", () => {
      if (confirm(`${sectionLabel(section)} 섹션을 제거할까요?`)) {
        page.sections = page.sections.filter((item) => item.id !== section.id);
        selectedGameSectionId = page.sections[0]?.id || "hero";
        renderGameVisual();
        renderRaw();
      }
    });
    actions.append(up, down, remove);
    inspector.appendChild(actions);
    inspector.addEventListener("input", () => {
      renderGameVisual();
      renderRaw();
    });
    inspector.addEventListener("change", () => {
      renderGameVisual();
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
      steamUrl: "",
      screenshots: [],
      carouselArrowPrev: "",
      carouselArrowNext: "",
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
      input("Steam URL", game.steamUrl || "", (value) => game.steamUrl = value),
      input("Screenshots (comma separated)", (game.screenshots || []).map((item) => typeof item === "string" ? item : item.src).join(", "), (value) => game.screenshots = splitList(value), { multiline: true }),
      assetPicker("Add Screenshot", "", (value) => {
        game.screenshots = game.screenshots || [];
        game.screenshots.push(value);
      }, "image/*,video/mp4,video/webm"),
      assetPicker("Prev Arrow Image", game.carouselArrowPrev || "", (value) => game.carouselArrowPrev = value),
      assetPicker("Next Arrow Image", game.carouselArrowNext || "", (value) => game.carouselArrowNext = value),
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

function renderPostBlocks(post, parent) {
  post.blocks = Array.isArray(post.blocks) ? post.blocks : [];

  const blockPanel = card("Post Layout Blocks");
  const actions = document.createElement("div");
  actions.className = "actions";

  [
    ["text", "Add Text"],
    ["emoji", "Add Emoji"],
    ["image", "Add Image"],
    ["video", "Add Video"]
  ].forEach(([type, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      post.blocks.push({
        type,
        text: { ko: type === "emoji" ? "✨" : "", en: type === "emoji" ? "✨" : "" },
        src: "",
        alt: { ko: "", en: "" },
        align: type === "image" || type === "video" ? "center" : "left",
        fontSize: type === "emoji" ? 42 : 18,
        widthPercent: 100,
        padding: 0
      });
      render();
    });
    actions.appendChild(button);
  });

  blockPanel.appendChild(actions);

  post.blocks.forEach((block, blockIndex) => {
    block.text = localizedObject(block.text);
    block.alt = localizedObject(block.alt);

    const item = document.createElement("article");
    item.className = "card";
    const title = document.createElement("h2");
    title.textContent = `Block ${blockIndex + 1} / ${block.type || "text"}`;
    item.appendChild(title);

    const itemActions = document.createElement("div");
    itemActions.className = "actions";
    [
      ["Up", -1],
      ["Down", 1]
    ].forEach(([label, delta]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.disabled = blockIndex + delta < 0 || blockIndex + delta >= post.blocks.length;
      button.addEventListener("click", () => {
        const nextIndex = blockIndex + delta;
        [post.blocks[blockIndex], post.blocks[nextIndex]] = [post.blocks[nextIndex], post.blocks[blockIndex]];
        render();
      });
      itemActions.appendChild(button);
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Remove Block";
    remove.addEventListener("click", () => {
      post.blocks.splice(blockIndex, 1);
      render();
    });
    itemActions.appendChild(remove);
    item.appendChild(itemActions);

    const grid = document.createElement("div");
    grid.className = "grid2";
    grid.append(
      select("Type", block.type || "text", [
        { value: "text", label: "Text" },
        { value: "emoji", label: "Emoji / Emoticon" },
        { value: "image", label: "Image" },
        { value: "video", label: "Video" }
      ], (value) => {
        block.type = value;
        render();
      }),
      select("Align", block.align || "left", [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" }
      ], (value) => block.align = value),
      input("Font Size px", block.fontSize || "", (value) => block.fontSize = Number(value) || 0, { type: "number" }),
      input("Width %", block.widthPercent || 100, (value) => block.widthPercent = Number(value) || 100, { type: "number" }),
      input("Padding px", block.padding || 0, (value) => block.padding = Number(value) || 0, { type: "number" })
    );

    if (block.type === "image" || block.type === "video") {
      grid.append(
        assetPicker("Media Source", block.src || "", (value) => block.src = value, block.type === "video" ? "video/mp4,video/webm" : "image/*"),
        input("Alt KO", block.alt.ko, (value) => block.alt.ko = value),
        input("Alt EN", block.alt.en, (value) => block.alt.en = value)
      );
    } else {
      grid.append(
        input("Text KO", block.text.ko, (value) => block.text.ko = value, { multiline: true }),
        input("Text EN", block.text.en, (value) => block.text.en = value, { multiline: true })
      );
    }

    item.appendChild(grid);
    blockPanel.appendChild(item);
  });

  parent.appendChild(blockPanel);
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
      body: { ko: "", en: "" },
      blocks: []
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
    renderPostBlocks(post, el);
    panel.appendChild(el);
  });
}

function renderRaw() {
  $("#rawJson").value = JSON.stringify(state, null, 2);
}

function render() {
  renderVisual();
  renderGameVisual();
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
