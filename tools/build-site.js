const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const LANGS = ["ko", "en"];
const POST_TYPES = ["notice", "update", "patch-note", "release-note"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeFile(relativePath, content) {
  const target = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.replace(/[ \t]+$/gm, ""), "utf8");
}

function cleanGeneratedGamePages() {
  for (const lang of LANGS) {
    const target = path.join(ROOT, lang, "games");
    if (target.startsWith(ROOT) && fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listJsonFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
    });
}

function loadContent() {
  const site = readJson(path.join(CONTENT_DIR, "site.json"));
  const games = listJsonFiles(path.join(CONTENT_DIR, "games"))
    .map(readJson)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const posts = listJsonFiles(path.join(CONTENT_DIR, "posts"))
    .map(readJson)
    .sort((a, b) => `${b.date}-${b.slug}`.localeCompare(`${a.date}-${a.slug}`));
  const pages = listJsonFiles(path.join(CONTENT_DIR, "pages"))
    .map(readJson)
    .reduce((map, page) => {
      map[`${page.lang}-${page.page}`] = page;
      return map;
    }, {});

  return { site, games, posts, pages };
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attr(value) {
  return esc(value);
}

function localize(value, lang, fallback = "") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[lang] ?? value.en ?? value.ko ?? fallback;
  }

  return value ?? fallback;
}

function gameUrl(game, lang) {
  return `/${lang}/games/${game.slug}/`;
}

function policyUrl(game, lang, kind) {
  return localize(game[`${kind}Url`], lang, "");
}

function logoMarkup(site) {
  const logo = site.assets?.logo;
  if (logo) {
    return `<span class="logo imageLogo" aria-hidden="true"><img src="${attr(logo)}" alt="" /></span>`;
  }

  return `<span class="logo" aria-hidden="true"></span>`;
}

function sharedStyles() {
  return `
    :root {
      --bg: #111827;
      --panel: #182235;
      --panel-soft: #202c42;
      --text: #f8fafc;
      --muted: #b8c2d6;
      --line: rgba(255,255,255,0.14);
      --mint: #44d7a8;
      --violet: #8b7cff;
      --amber: #ffd166;
      --max: 1120px;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--text);
      background: linear-gradient(180deg, #f7fbff 0, #edf4ff 360px, var(--bg) 361px);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Malgun Gothic", Roboto, Arial, sans-serif;
      line-height: 1.6;
    }
    a { color: inherit; text-decoration: none; }
    img { display: block; max-width: 100%; }
    .container { max-width: var(--max); margin: 0 auto; padding: 0 22px; }
    .topbar { position: sticky; top: 0; z-index: 20; background: rgba(247,251,255,0.92); border-bottom: 1px solid rgba(17,24,39,0.1); backdrop-filter: blur(12px); color: #111827; }
    .nav { min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .brand { display: flex; align-items: center; gap: 12px; min-width: 172px; }
    .logo { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #7c5cff, #44d7a8); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5); overflow: hidden; flex: 0 0 auto; }
    .logo img { width: 100%; height: 100%; object-fit: cover; }
    .brand strong { display: block; font-size: 16px; line-height: 1.15; }
    .brand small { display: block; color: #667085; font-size: 12px; }
    .navLinks { display: flex; align-items: center; justify-content: flex-end; gap: 18px; font-size: 14px; font-weight: 700; }
    .navLinks a { color: #25324a; }
    .navLinks a:hover { color: #5b4dca; }
    .navCta { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; padding: 0 18px; border-radius: 8px; color: #fff !important; background: #5b4dca; }
    .langSwitch { display: inline-flex; gap: 4px; padding: 4px; border-radius: 8px; border: 1px solid rgba(17,24,39,0.12); background: #fff; }
    .langSwitch a { min-width: 38px; padding: 7px 8px; border-radius: 6px; color: #667085; text-align: center; font-size: 12px; }
    .langSwitch a.active { color: #111827; background: #edf0f7; }
    .hero { padding: 72px 0 54px; color: #111827; }
    .heroGrid { display: grid; grid-template-columns: minmax(0, 1.04fr) minmax(0, 0.96fr); gap: 46px; align-items: center; }
    .heroGrid.noImage { grid-template-columns: minmax(0, 1fr); }
    .eyebrow { margin: 0 0 12px; color: #5b4dca; font-weight: 800; font-size: 13px; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(34px, 5vw, 58px); line-height: 1.08; letter-spacing: 0; }
    .heroDesc { max-width: 620px; margin: 18px 0 0; color: #475467; font-size: 18px; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
    .button { min-height: 48px; display: inline-flex; align-items: center; justify-content: center; padding: 0 20px; border-radius: 8px; font-weight: 800; border: 1px solid transparent; }
    .button.primary { background: #111827; color: #fff; }
    .button.secondary { background: #fff; color: #111827; border-color: rgba(17,24,39,0.14); }
    .heroArt { border-radius: 8px; overflow: hidden; border: 1px solid rgba(17,24,39,0.12); box-shadow: 0 24px 70px rgba(30,41,59,0.18); background: #101827; justify-self: stretch; }
    .heroArt.resized { width: var(--hero-image-width, 100%); max-width: none; height: var(--hero-image-height, auto); }
    .heroArt.resized img { width: 100%; height: 100%; object-fit: var(--hero-image-fit, cover); }
    .darkBand { background: var(--bg); padding: 56px 0 0; }
    section { padding: 42px 0; }
    .sectionHead { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
    h2 { margin: 0; font-size: 28px; line-height: 1.2; letter-spacing: 0; }
    .sectionLead { margin: 8px 0 0; color: var(--muted); max-width: 680px; }
    .gameGrid { display: grid; gap: 18px; }
    .gameCard { display: grid; grid-template-columns: 0.92fr 1.08fr; gap: 26px; align-items: center; padding: 22px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
    .gameInfo h3 { margin: 0 0 10px; font-size: 30px; letter-spacing: 0; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 16px; }
    .tag { padding: 6px 10px; border-radius: 8px; background: var(--panel-soft); color: #dce6f8; font-size: 13px; font-weight: 700; }
    .gameInfo p, .notice p, .supportBox p, .copy { margin: 0 0 18px; color: var(--muted); }
    .linkRow { display: flex; flex-wrap: wrap; gap: 10px; }
    .linkButton { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; padding: 0 16px; border-radius: 8px; font-weight: 800; border: 1px solid var(--line); background: rgba(255,255,255,0.06); }
    .linkButton.accent { background: linear-gradient(135deg, var(--violet), var(--mint)); color: #101827; border: 0; }
    .noticeList { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .noticeList.columns-1 { grid-template-columns: 1fr; }
    .noticeList.columns-3 { grid-template-columns: repeat(3, 1fr); }
    .notice { padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,255,255,0.05); }
    .notice time { display: block; color: var(--amber); font-size: 13px; font-weight: 800; margin-bottom: 6px; }
    .notice strong { display: block; margin-bottom: 6px; }
    .supportGrid, .infoGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .supportGrid.columns-1, .infoGrid.columns-1 { grid-template-columns: 1fr; }
    .supportGrid.columns-2, .infoGrid.columns-2 { grid-template-columns: repeat(2, 1fr); }
    .supportBox, .infoBox { min-height: 144px; padding: 20px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
    .supportBox h3, .infoBox h3 { margin: 0 0 8px; font-size: 18px; }
    .tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
    .tabs a { min-height: 42px; display: inline-flex; align-items: center; padding: 0 14px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid var(--line); font-weight: 800; }
    .pageSection { padding: var(--section-pt, 42px) 0 var(--section-pb, 42px); }
    .pageSection.section-light { background: #f7fbff; color: #111827; }
    .pageSection.section-light .sectionLead { color: #475467; }
    .pageSection.section-dark { background: var(--bg); color: var(--text); }
    .hero.pageSection { padding: var(--section-pt, 72px) 0 var(--section-pb, 54px); }
    .hero.hasFx { position: relative; overflow: hidden; }
    .hero.hasFx > .container { position: relative; z-index: 2; }
    .fxLayer { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
    .fxGradient { background: radial-gradient(circle at 18% 25%, rgba(139,124,255,.26), transparent 28%), radial-gradient(circle at 78% 18%, rgba(68,215,168,.24), transparent 28%), radial-gradient(circle at 60% 80%, rgba(255,209,102,.18), transparent 30%); animation: driftFx 12s ease-in-out infinite alternate; }
    .fxImage, .fxVideo { width: 100%; height: 100%; object-fit: cover; opacity: .22; filter: saturate(1.1); }
    .fxVideo { position: absolute; inset: 0; }
    @keyframes driftFx { from { transform: translate3d(-2%, -1%, 0) scale(1.02); } to { transform: translate3d(2%, 2%, 0) scale(1.08); } }
    .heroGrid.center { text-align: center; grid-template-columns: 1fr; }
    .heroGrid.center .heroDesc, .heroGrid.center .actions { margin-left: auto; margin-right: auto; justify-content: center; }
    .heroGrid.image-left .heroArt { order: -1; }
    .gameCard.image-right > img { order: 2; }
    footer { margin-top: 34px; padding: 38px 0; border-top: 1px solid var(--line); color: var(--muted); }
    .footerGrid { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 24px; }
    .footerTitle { color: var(--text); font-weight: 900; margin-bottom: 8px; }
    .footerLinks { display: grid; gap: 8px; font-size: 14px; }
    .copyright { margin-top: 26px; font-size: 13px; }
    @media (max-width: 860px) {
      .nav { align-items: flex-start; flex-direction: column; padding: 14px 0; }
      .navLinks { width: 100%; justify-content: flex-start; flex-wrap: wrap; gap: 10px; }
      .heroGrid, .gameCard, .noticeList, .supportGrid, .infoGrid, .footerGrid { grid-template-columns: 1fr; }
      .heroArt.resized { max-width: 100%; }
      .hero { padding-top: 44px; }
      .heroDesc { font-size: 16px; }
      .sectionHead { align-items: flex-start; flex-direction: column; }
    }
  `;
}

function header(site, lang, titlePath = "") {
  const labels = site.labels[lang];
  const altLang = lang === "ko" ? "en" : "ko";
  const altPath = titlePath ? `/${altLang}${titlePath}` : `/${altLang}/`;
  return `
  <header class="topbar">
    <div class="container">
      <nav class="nav" aria-label="${lang === "ko" ? "주요 메뉴" : "Main navigation"}">
        <a class="brand" href="/${lang}/">
          ${logoMarkup(site)}
          <span><strong>${esc(site.company.name)}</strong><small>${esc(localize(site.company.studioLabel, lang))}</small></span>
        </a>
        <div class="navLinks">
          <a href="/${lang}/">${esc(labels.home)}</a>
          <a href="/${lang}/#games">${esc(labels.games)}</a>
          <a href="/${lang}/support/">${esc(labels.support)}</a>
          <a href="/${lang}/privacy/wallbreaker/">${esc(labels.privacy)}</a>
          <a href="/${lang}/terms/wallbreaker/">${esc(labels.terms)}</a>
          <a class="navCta" href="/${lang}/#games">${esc(site.home[lang].primaryCta)}</a>
          <span class="langSwitch" aria-label="${lang === "ko" ? "언어 선택" : "Language"}">
            <a class="${lang === "ko" ? "active" : ""}" href="${lang === "ko" ? `/${lang}${titlePath || "/"}` : altPath}">KO</a>
            <a class="${lang === "en" ? "active" : ""}" href="${lang === "en" ? `/${lang}${titlePath || "/"}` : altPath}">EN</a>
          </span>
        </div>
      </nav>
    </div>
  </header>`;
}

function footer(site, games, lang) {
  const labels = site.labels[lang];
  const visibleGames = games.filter((game) => game.visible);
  return `
      <footer>
        <div class="container">
          <div class="footerGrid">
            <div>
              <div class="footerTitle">${esc(site.company.name)}</div>
              <div>${esc(localize(site.company.studioLabel, lang))}</div>
            </div>
            <div>
              <div class="footerTitle">Company</div>
              <div class="footerLinks">
                <a href="/${lang}/">${esc(labels.footerAbout)}</a>
                <a href="/${lang}/support/">${esc(labels.footerContact)}</a>
              </div>
            </div>
            <div>
              <div class="footerTitle">${esc(labels.games)}</div>
              <div class="footerLinks">
                ${visibleGames.map((game) => `<a href="${gameUrl(game, lang)}">${esc(localize(game.title, lang))}</a>`).join("")}
              </div>
            </div>
            <div>
              <div class="footerTitle">Legal</div>
              <div class="footerLinks">
                <a href="/${lang}/privacy/wallbreaker/">${esc(labels.privacyPolicy)}</a>
                <a href="/${lang}/terms/wallbreaker/">${esc(labels.termsOfService)}</a>
                <a href="mailto:${attr(site.supportEmail)}">${esc(site.supportEmail)}</a>
              </div>
            </div>
          </div>
          <div class="copyright">© 2026 ${esc(site.company.name)}. All rights reserved.</div>
        </div>
      </footer>`;
}

function pageShell({ site, lang, title, description, canonical, body, titlePath = "" }) {
  const altLang = lang === "ko" ? "en" : "ko";
  const altCanonical = canonical.replace(`/${lang}/`, `/${altLang}/`);
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${attr(description)}" />
  <meta name="theme-color" content="#111827" />
  <meta property="og:title" content="${attr(title)}" />
  <meta property="og:description" content="${attr(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${attr(canonical)}" />
  <link rel="alternate" hreflang="ko" href="${attr(lang === "ko" ? canonical : altCanonical)}" />
  <link rel="alternate" hreflang="en" href="${attr(lang === "en" ? canonical : altCanonical)}" />
  <link rel="canonical" href="${attr(canonical)}" />
  <title>${esc(title)}</title>
  <style>${sharedStyles()}</style>
</head>
<body>
${header(site, lang, titlePath)}
${body}
</body>
</html>`;
}

function renderGameButtons(site, game, lang) {
  const labels = site.labels[lang];
  const store = game.googlePlayUrl;
  const storeButton = store
    ? `<a class="linkButton accent" href="${attr(store)}" target="_blank" rel="noreferrer">Google Play</a>`
    : `<span class="linkButton accent" aria-disabled="true">${esc(labels.googlePlayComingSoon)}</span>`;

  return `
    <div class="linkRow">
      ${storeButton}
      <a class="linkButton" href="${gameUrl(game, lang)}">${esc(labels.viewDetails)}</a>
    </div>`;
}

function sectionStyle(section) {
  const settings = section.settings || {};
  const pt = Number.isFinite(Number(settings.paddingTop)) ? Number(settings.paddingTop) : 42;
  const pb = Number.isFinite(Number(settings.paddingBottom)) ? Number(settings.paddingBottom) : 42;
  return `--section-pt:${pt}px;--section-pb:${pb}px;`;
}

function sectionClass(section, extra = "") {
  const background = section.settings?.background === "light" ? "section-light" : "section-dark";
  return `${extra} pageSection ${background}`.replace(/\s+/g, " ").trim();
}

function columnClass(value, fallback) {
  const columns = Number(value || fallback);
  return `columns-${Math.max(1, Math.min(3, columns))}`;
}

function renderHomeHero(site, games, lang, section) {
  const home = site.home[lang];
  const featured = games.find((game) => game.visible && game.featured) || games.find((game) => game.visible);
  const settings = section.settings || {};
  const imageClass = settings.imagePosition === "left" ? "image-left" : "";
  const alignClass = settings.textAlign === "center" ? "center" : "";
  const effect = settings.effect || "none";
  const fx = renderHeroEffect(settings);
  const showImage = settings.showImage !== false;
  const imageStyle = heroImageStyle(settings);
  const heroImage = featured && showImage ? `<a class="heroArt resized" style="${imageStyle}" href="${gameUrl(featured, lang)}" aria-label="${attr(localize(featured.title, lang))}">
          <img src="${attr(featured.image)}" alt="${attr(localize(featured.title, lang))} key art" width="720" height="480" />
        </a>` : "";

  return `
    <section id="hero" class="${sectionClass(section, `hero ${effect !== "none" ? "hasFx" : ""}`)}" style="${sectionStyle(section)}">
      ${fx}
      <div class="container heroGrid ${alignClass} ${imageClass} ${heroImage ? "" : "noImage"}">
        <div>
          <p class="eyebrow">${esc(home.heroEyebrow)}</p>
          <h1>${esc(home.heroTitle)}</h1>
          <p class="heroDesc">${esc(home.heroDescription)}</p>
          <div class="actions">
            <a class="button primary" href="#games">${esc(home.primaryCta)}</a>
            <a class="button secondary" href="/${lang}/support/">${esc(home.secondaryCta)}</a>
          </div>
        </div>
        ${heroImage}
      </div>
    </section>`;
}

function heroImageStyle(settings) {
  const widthPx = Number(settings.imageWidthPx || 0);
  const heightPx = Number(settings.imageHeightPx || 0);
  const widthPercent = Math.max(1, Math.min(100, Number(settings.imageWidth || 100)));
  const fit = ["contain", "cover", "fill"].includes(settings.imageFit) ? settings.imageFit : "cover";
  const width = widthPx > 0 ? `${widthPx}px` : `${widthPercent}%`;
  const height = heightPx > 0 ? `${heightPx}px` : "auto";
  return `--hero-image-width:${width};--hero-image-height:${height};--hero-image-fit:${fit};`;
}

function renderHeroEffect(settings) {
  const effect = settings.effect || "none";
  if (effect === "animated-gradient") {
    return `<div class="fxLayer fxGradient" aria-hidden="true"></div>`;
  }

  if (effect === "image" && settings.backgroundImage) {
    return `<div class="fxLayer" aria-hidden="true"><img class="fxImage" src="${attr(settings.backgroundImage)}" alt="" /></div>`;
  }

  if (effect === "video" && settings.backgroundVideo) {
    return `<div class="fxLayer" aria-hidden="true"><video class="fxVideo" src="${attr(settings.backgroundVideo)}" autoplay muted loop playsinline></video></div>`;
  }

  return "";
}

function renderHomeGames(site, games, lang, section) {
  const labels = site.labels[lang];
  const home = site.home[lang];
  const visibleGames = games.filter((game) => game.visible);
  const imageClass = section.settings?.cardImagePosition === "right" ? "image-right" : "";
  const gameCards = visibleGames.map((game) => `
          <article class="gameCard ${imageClass}">
            <img src="${attr(game.image)}" alt="${attr(localize(game.title, lang))} key art" width="720" height="480" />
            <div class="gameInfo">
              <div class="tags">
                <span class="tag">${esc(localize(game.genre, lang))}</span>
                ${game.platforms.map((platform) => `<span class="tag">${esc(platform)}</span>`).join("")}
                <span class="tag">${esc(localize(game.status, lang))}</span>
              </div>
              <h3>${esc(localize(game.title, lang))}</h3>
              <p>${esc(localize(game.shortDescription, lang))}</p>
              ${renderGameButtons(site, game, lang)}
            </div>
          </article>`).join("");

  return `
      <section id="games" class="${sectionClass(section)}" style="${sectionStyle(section)}">
        <div class="container">
          <div class="sectionHead">
            <div>
              <h2>${esc(labels.games)}</h2>
              <p class="sectionLead">${esc(home.gamesLead)}</p>
            </div>
          </div>
          <div class="gameGrid">${gameCards}</div>
        </div>
      </section>`;
}

function renderHomeNews(site, games, posts, lang, section) {
  const labels = site.labels[lang];
  const home = site.home[lang];
  const homePosts = posts.filter((post) => post.visible && post.showOnHome).slice(0, 6);
  const postCards = homePosts.map((post) => {
    const game = games.find((candidate) => candidate.slug === post.game);
    return `
            <article class="notice">
              <time datetime="${attr(post.date)}">${esc(post.date.replaceAll("-", "."))}</time>
              <strong>[${esc(game ? localize(game.title, lang) : post.game)}] ${esc(localize(post.title, lang))}</strong>
              <p>${esc(localize(post.summary, lang))}</p>
            </article>`;
  }).join("");

  return `
      <section id="news" class="${sectionClass(section)}" style="${sectionStyle(section)}">
        <div class="container">
          <div class="sectionHead">
            <div>
              <h2>${esc(labels.latestNews)}</h2>
              <p class="sectionLead">${esc(home.newsLead)}</p>
            </div>
          </div>
          <div class="noticeList ${columnClass(section.settings?.columns, 2)}">${postCards}</div>
        </div>
      </section>`;
}

function renderHomeSupport(site, games, lang, section) {
  const labels = site.labels[lang];
  const home = site.home[lang];
  const visibleGames = games.filter((game) => game.visible);
  const supportGame = visibleGames.find((game) => game.slug === "wallbreaker") || visibleGames[0];
  const supportLinks = supportGame ? `
            <a class="supportBox" href="${attr(policyUrl(supportGame, lang, "support"))}">
              <h3>${esc(labels.contactUs)}</h3>
              <p>${lang === "ko" ? "버그 제보, 결제 문의, 데이터 삭제 요청에 필요한 정보를 확인합니다." : "Find what to include for bug reports, payment questions, and data deletion requests."}</p>
              <strong>${esc(labels.support)}</strong>
            </a>
            <a class="supportBox" href="${attr(policyUrl(supportGame, lang, "privacy"))}">
              <h3>${esc(labels.privacyPolicy)}</h3>
              <p>${lang === "ko" ? "게임의 데이터 수집, 광고 SDK, 서버 저장 정보를 확인합니다." : "Review data collection, advertising SDK, and server storage information."}</p>
              <strong>${esc(labels.privacy)}</strong>
            </a>
            <a class="supportBox" href="${attr(policyUrl(supportGame, lang, "terms"))}">
              <h3>${esc(labels.termsOfService)}</h3>
              <p>${lang === "ko" ? "인앱결제, 광고 보상, 구매 복원, 환불 기준을 확인합니다." : "Review in-app purchases, ad rewards, purchase restoration, and refund policy notes."}</p>
              <strong>${esc(labels.terms)}</strong>
            </a>` : "";

  return `
      <section id="support" class="${sectionClass(section)}" style="${sectionStyle(section)}">
        <div class="container">
          <div class="sectionHead">
            <div>
              <h2>${esc(labels.supportPolicy)}</h2>
              <p class="sectionLead">${esc(home.supportLead)}</p>
            </div>
          </div>
          <div class="supportGrid ${columnClass(section.settings?.columns, 3)}">${supportLinks}</div>
        </div>
      </section>`;
}

function renderHomeSection(content, lang, section) {
  if (!section.visible) {
    return "";
  }

  switch (section.type) {
    case "hero":
      return renderHomeHero(content.site, content.games, lang, section);
    case "games":
      return renderHomeGames(content.site, content.games, lang, section);
    case "news":
      return renderHomeNews(content.site, content.games, content.posts, lang, section);
    case "support":
      return renderHomeSupport(content.site, content.games, lang, section);
    default:
      return "";
  }
}

function fallbackHomePage(lang) {
  return {
    sections: [
      { id: "hero", type: "hero", visible: true, settings: { paddingTop: 72, paddingBottom: 54, textAlign: "left", showImage: true, imageWidth: 100, imageWidthPx: 320, imageHeightPx: 240, imageFit: "contain", imagePosition: "right", background: "light" } },
      { id: "games", type: "games", visible: true, settings: { paddingTop: 42, paddingBottom: 42, cardImagePosition: "left", background: "dark" } },
      { id: "news", type: "news", visible: true, settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } },
      { id: "support", type: "support", visible: true, settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } }
    ]
  };
}

function renderIndex(content, lang) {
  const { site, games } = content;
  const home = site.home[lang];
  const visibleGames = games.filter((game) => game.visible);
  const page = content.pages?.[`${lang}-home`] || fallbackHomePage(lang);
  const sections = page.sections.map((section) => renderHomeSection(content, lang, section)).join("");

  const body = `
  <main>
    <div class="darkBand">
${sections}
${footer(site, visibleGames, lang)}
    </div>
  </main>`;

  return pageShell({
    site,
    lang,
    title: lang === "ko" ? "코피아소프트 | CopiaSoft - 인디 게임 스튜디오" : "CopiaSoft - Indie Game Studio",
    description: home.metaDescription,
    canonical: `${site.baseUrl}/${lang}/`,
    body,
    titlePath: "/"
  });
}

function renderPostSection(site, posts, lang, type) {
  const labels = site.labels[lang];
  const typedPosts = posts.filter((post) => post.visible && post.type === type);
  const content = typedPosts.length > 0
    ? typedPosts.map((post) => `
          <article class="notice">
            <time datetime="${attr(post.date)}">${esc(post.date.replaceAll("-", "."))}${post.version ? ` · ${esc(post.version)}` : ""}</time>
            <strong>${esc(localize(post.title, lang))}</strong>
            <p>${esc(localize(post.summary, lang))}</p>
            <p>${esc(localize(post.body, lang))}</p>
          </article>`).join("")
    : `<article class="notice"><p>${lang === "ko" ? "아직 등록된 글이 없습니다." : "No posts yet."}</p></article>`;

  return `
      <section id="${attr(type)}" class="pageSection section-dark" style="--section-pt:42px;--section-pb:42px;">
        <div class="container">
          <div class="sectionHead">
            <div><h2>${esc(labels[type])}</h2></div>
          </div>
          <div class="noticeList">${content}</div>
        </div>
      </section>`;
}

function fallbackGamePage(lang, game) {
  return {
    page: "game",
    lang,
    game: game.slug,
    buttonStyle: "solid",
    sections: [
      { id: "hero", type: "hero", visible: true, settings: { paddingTop: 72, paddingBottom: 54, textAlign: "left", showImage: true, imageWidth: 100, imageWidthPx: 360, imageHeightPx: 260, imageFit: "contain", imagePosition: "right", background: "light", effect: "none", backgroundImage: "", backgroundVideo: "" } },
      { id: "overview", type: "overview", visible: true, settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } },
      ...POST_TYPES.map((type) => ({ id: type, type, visible: type !== "update" && type !== "release-note", settings: { paddingTop: 42, paddingBottom: 42, columns: 2, background: "dark" } })),
      { id: "support", type: "support", visible: true, settings: { paddingTop: 42, paddingBottom: 42, columns: 3, background: "dark" } }
    ]
  };
}

function buttonClass(page, kind) {
  const style = page.buttonStyle || "solid";
  if (style === "outline") {
    return kind === "primary" ? "button secondary" : "button secondary";
  }
  if (style === "soft") {
    return kind === "primary" ? "linkButton" : "linkButton";
  }
  return kind === "primary" ? "button primary" : "button secondary";
}

function renderGameHero(site, game, lang, page, section) {
  const labels = site.labels[lang];
  const settings = section.settings || {};
  const imageClass = settings.imagePosition === "left" ? "image-left" : "";
  const alignClass = settings.textAlign === "center" ? "center" : "";
  const effect = settings.effect || "none";
  const showImage = settings.showImage !== false;
  const imageStyle = heroImageStyle(settings);
  return `
    <section id="hero" class="${sectionClass(section, `hero ${effect !== "none" ? "hasFx" : ""}`)}" style="${sectionStyle(section)}">
      ${renderHeroEffect(settings)}
      <div class="container heroGrid ${alignClass} ${imageClass} ${showImage ? "" : "noImage"}">
        <div>
          <p class="eyebrow">${esc(localize(game.genre, lang))}</p>
          <h1>${esc(localize(game.title, lang))}</h1>
          <p class="heroDesc">${esc(localize(game.shortDescription, lang))}</p>
          <div class="tags">
            ${game.platforms.map((platform) => `<span class="tag">${esc(platform)}</span>`).join("")}
            <span class="tag">${esc(localize(game.status, lang))}</span>
          </div>
          <div class="actions">
            ${game.googlePlayUrl
              ? `<a class="${buttonClass(page, "primary")}" href="${attr(game.googlePlayUrl)}" target="_blank" rel="noreferrer">Google Play</a>`
              : `<span class="${buttonClass(page, "primary")}" aria-disabled="true">${esc(labels.googlePlayComingSoon)}</span>`}
            <a class="${buttonClass(page, "secondary")}" href="${attr(policyUrl(game, lang, "support"))}">${esc(labels.contactUs)}</a>
          </div>
          <div class="tabs">
            ${page.sections.filter((item) => item.visible && item.type !== "hero").map((item) => `<a href="#${attr(item.id)}">${esc(item.title || labels[item.type] || item.type)}</a>`).join("")}
          </div>
        </div>
        ${showImage ? `<div class="heroArt resized" style="${imageStyle}"><img src="${attr(game.image)}" alt="${attr(localize(game.title, lang))} key art" width="720" height="480" /></div>` : ""}
      </div>
    </section>`;
}

function renderGameOverview(site, game, lang, section) {
  const labels = site.labels[lang];
  return `
      <section id="overview" class="${sectionClass(section)}" style="${sectionStyle(section)}">
        <div class="container">
          <div class="sectionHead">
            <div>
              <h2>${esc(section.title || labels.overview)}</h2>
              <p class="sectionLead">${esc(localize(game.longDescription, lang))}</p>
            </div>
          </div>
          <div class="infoGrid ${columnClass(section.settings?.columns, 3)}">
            <article class="infoBox"><h3>${esc(labels.genre)}</h3><p>${esc(localize(game.genre, lang))}</p></article>
            <article class="infoBox"><h3>${esc(labels.platform)}</h3><p>${esc(game.platforms.join(" / "))}</p></article>
            <article class="infoBox"><h3>${esc(labels.status)}</h3><p>${esc(localize(game.status, lang))}</p></article>
          </div>
        </div>
      </section>`;
}

function renderGamePostList(site, posts, lang, section) {
  const type = section.type;
  const typedPosts = posts.filter((post) => post.visible && post.type === type);
  const content = typedPosts.length > 0
    ? typedPosts.map((post) => `
            <article class="notice">
              <time datetime="${attr(post.date)}">${esc(post.date.replaceAll("-", "."))}${post.version ? ` · ${esc(post.version)}` : ""}</time>
              <strong>${esc(localize(post.title, lang))}</strong>
              <p>${esc(localize(post.summary, lang))}</p>
              <p>${esc(localize(post.body, lang))}</p>
            </article>`).join("")
    : `<article class="notice"><p>${lang === "ko" ? "아직 등록된 글이 없습니다." : "No posts yet."}</p></article>`;

  return `
      <section id="${attr(section.id)}" class="${sectionClass(section)}" style="${sectionStyle(section)}">
        <div class="container">
          <div class="sectionHead"><div><h2>${esc(section.title || site.labels[lang][type])}</h2></div></div>
          <div class="noticeList ${columnClass(section.settings?.columns, 2)}">${content}</div>
        </div>
      </section>`;
}

function renderGameSupport(site, games, game, lang, section) {
  const labels = site.labels[lang];
  const supportLinks = [
    ["support", labels.contactUs, policyUrl(game, lang, "support")],
    ["privacy", labels.privacyPolicy, policyUrl(game, lang, "privacy")],
    ["terms", labels.termsOfService, policyUrl(game, lang, "terms")]
  ].filter((entry) => entry[2]);

  return `
      <section id="support" class="${sectionClass(section)}" style="${sectionStyle(section)}">
        <div class="container">
          <div class="sectionHead"><div><h2>${esc(section.title || labels.supportPolicy)}</h2></div></div>
          <div class="supportGrid ${columnClass(section.settings?.columns, 3)}">
            ${supportLinks.map(([, label, url]) => `<a class="supportBox" href="${attr(url)}"><h3>${esc(label)}</h3><p>${esc(localize(game.title, lang))} ${lang === "ko" ? "관련 정보를 확인합니다." : "related information."}</p><strong>${esc(label)}</strong></a>`).join("")}
          </div>
        </div>
      </section>`;
}

function renderGameSection(content, game, lang, page, section) {
  if (!section.visible) {
    return "";
  }

  const gamePosts = content.posts.filter((post) => post.game === game.slug);
  switch (section.type) {
    case "hero":
      return renderGameHero(content.site, game, lang, page, section);
    case "overview":
      return renderGameOverview(content.site, game, lang, section);
    case "notice":
    case "update":
    case "patch-note":
    case "release-note":
      return renderGamePostList(content.site, gamePosts, lang, section);
    case "support":
      return renderGameSupport(content.site, content.games, game, lang, section);
    default:
      return "";
  }
}

function renderGamePage(content, game, lang) {
  const { site, games } = content;
  const title = `${localize(game.title, lang)} | ${site.company.name}`;
  const canonical = `${site.baseUrl}${gameUrl(game, lang)}`;
  const titlePath = `/games/${game.slug}/`;
  const page = content.pages?.[`${lang}-${game.slug}-game`] || fallbackGamePage(lang, game);
  const sections = page.sections.map((section) => renderGameSection(content, game, lang, page, section)).join("");

  const body = `
  <main>
    <div class="darkBand">
${sections}
${footer(site, games.filter((candidate) => candidate.visible), lang)}
    </div>
  </main>`;

  return pageShell({
    site,
    lang,
    title,
    description: localize(game.subtitle, lang),
    canonical,
    body,
    titlePath
  });
}

function renderSitemap(site, games) {
  const urls = [
    "/ko/",
    "/en/",
    ...games.filter((game) => game.visible).flatMap((game) => LANGS.map((lang) => gameUrl(game, lang))),
    "/ko/privacy/wallbreaker/",
    "/en/privacy/wallbreaker/",
    "/ko/terms/wallbreaker/",
    "/en/terms/wallbreaker/",
    "/ko/support/",
    "/en/support/"
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${site.baseUrl}${url}</loc></url>`).join("\n")}
</urlset>
`;
}

function build() {
  const content = loadContent();
  const visibleGames = content.games.filter((game) => game.visible);

  cleanGeneratedGamePages();

  for (const lang of LANGS) {
    writeFile(`${lang}/index.html`, renderIndex(content, lang));
  }

  for (const game of visibleGames) {
    for (const lang of LANGS) {
      writeFile(`${lang}/games/${game.slug}/index.html`, renderGamePage(content, game, lang));
    }
  }

  writeFile("sitemap.xml", renderSitemap(content.site, content.games));
}

if (require.main === module) {
  build();
  console.log("CopiaSoft site generated.");
}

module.exports = { build, loadContent };
