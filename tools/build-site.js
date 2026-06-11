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

  return { site, games, posts };
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
    .logo { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #7c5cff, #44d7a8); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5); }
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
    .heroGrid { display: grid; grid-template-columns: minmax(0, 1.04fr) minmax(320px, 0.96fr); gap: 46px; align-items: center; }
    .eyebrow { margin: 0 0 12px; color: #5b4dca; font-weight: 800; font-size: 13px; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(34px, 5vw, 58px); line-height: 1.08; letter-spacing: 0; }
    .heroDesc { max-width: 620px; margin: 18px 0 0; color: #475467; font-size: 18px; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
    .button { min-height: 48px; display: inline-flex; align-items: center; justify-content: center; padding: 0 20px; border-radius: 8px; font-weight: 800; border: 1px solid transparent; }
    .button.primary { background: #111827; color: #fff; }
    .button.secondary { background: #fff; color: #111827; border-color: rgba(17,24,39,0.14); }
    .heroArt { border-radius: 8px; overflow: hidden; border: 1px solid rgba(17,24,39,0.12); box-shadow: 0 24px 70px rgba(30,41,59,0.18); background: #101827; }
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
    .notice { padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: rgba(255,255,255,0.05); }
    .notice time { display: block; color: var(--amber); font-size: 13px; font-weight: 800; margin-bottom: 6px; }
    .notice strong { display: block; margin-bottom: 6px; }
    .supportGrid, .infoGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .supportBox, .infoBox { min-height: 144px; padding: 20px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
    .supportBox h3, .infoBox h3 { margin: 0 0 8px; font-size: 18px; }
    .tabs { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
    .tabs a { min-height: 42px; display: inline-flex; align-items: center; padding: 0 14px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid var(--line); font-weight: 800; }
    footer { margin-top: 34px; padding: 38px 0; border-top: 1px solid var(--line); color: var(--muted); }
    .footerGrid { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 24px; }
    .footerTitle { color: var(--text); font-weight: 900; margin-bottom: 8px; }
    .footerLinks { display: grid; gap: 8px; font-size: 14px; }
    .copyright { margin-top: 26px; font-size: 13px; }
    @media (max-width: 860px) {
      .nav { align-items: flex-start; flex-direction: column; padding: 14px 0; }
      .navLinks { width: 100%; justify-content: flex-start; flex-wrap: wrap; gap: 10px; }
      .heroGrid, .gameCard, .noticeList, .supportGrid, .infoGrid, .footerGrid { grid-template-columns: 1fr; }
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
          <span class="logo" aria-hidden="true"></span>
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

function renderIndex({ site, games, posts }, lang) {
  const labels = site.labels[lang];
  const home = site.home[lang];
  const visibleGames = games.filter((game) => game.visible);
  const featured = visibleGames[0];
  const homePosts = posts
    .filter((post) => post.visible && post.showOnHome)
    .slice(0, 4);
  const supportGame = visibleGames.find((game) => game.slug === "wallbreaker") || visibleGames[0];

  const gameCards = visibleGames.map((game) => `
          <article class="gameCard">
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

  const postCards = homePosts.map((post) => {
    const game = games.find((candidate) => candidate.slug === post.game);
    return `
            <article class="notice">
              <time datetime="${attr(post.date)}">${esc(post.date.replaceAll("-", "."))}</time>
              <strong>[${esc(game ? localize(game.title, lang) : post.game)}] ${esc(localize(post.title, lang))}</strong>
              <p>${esc(localize(post.summary, lang))}</p>
            </article>`;
  }).join("");

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

  const heroImage = featured ? `<a class="heroArt" href="${gameUrl(featured, lang)}" aria-label="${attr(localize(featured.title, lang))}">
          <img src="${attr(featured.image)}" alt="${attr(localize(featured.title, lang))} key art" width="720" height="480" />
        </a>` : "";

  const body = `
  <main>
    <section class="hero">
      <div class="container heroGrid">
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
    </section>

    <div class="darkBand">
      <section id="games">
        <div class="container">
          <div class="sectionHead">
            <div>
              <h2>${esc(labels.games)}</h2>
              <p class="sectionLead">${esc(home.gamesLead)}</p>
            </div>
          </div>
          <div class="gameGrid">${gameCards}</div>
        </div>
      </section>

      <section id="news">
        <div class="container">
          <div class="sectionHead">
            <div>
              <h2>${esc(labels.latestNews)}</h2>
              <p class="sectionLead">${esc(home.newsLead)}</p>
            </div>
          </div>
          <div class="noticeList">${postCards}</div>
        </div>
      </section>

      <section id="support">
        <div class="container">
          <div class="sectionHead">
            <div>
              <h2>${esc(labels.supportPolicy)}</h2>
              <p class="sectionLead">${esc(home.supportLead)}</p>
            </div>
          </div>
          <div class="supportGrid">${supportLinks}</div>
        </div>
      </section>
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
      <section id="${attr(type)}">
        <div class="container">
          <div class="sectionHead">
            <div><h2>${esc(labels[type])}</h2></div>
          </div>
          <div class="noticeList">${content}</div>
        </div>
      </section>`;
}

function renderGamePage({ site, games, posts }, game, lang) {
  const labels = site.labels[lang];
  const gamePosts = posts.filter((post) => post.game === game.slug);
  const title = `${localize(game.title, lang)} | ${site.company.name}`;
  const canonical = `${site.baseUrl}${gameUrl(game, lang)}`;
  const titlePath = `/games/${game.slug}/`;
  const supportLinks = [
    ["support", labels.contactUs, policyUrl(game, lang, "support")],
    ["privacy", labels.privacyPolicy, policyUrl(game, lang, "privacy")],
    ["terms", labels.termsOfService, policyUrl(game, lang, "terms")]
  ].filter((entry) => entry[2]);

  const body = `
  <main>
    <section class="hero">
      <div class="container heroGrid">
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
              ? `<a class="button primary" href="${attr(game.googlePlayUrl)}" target="_blank" rel="noreferrer">Google Play</a>`
              : `<span class="button primary" aria-disabled="true">${esc(labels.googlePlayComingSoon)}</span>`}
            <a class="button secondary" href="${attr(policyUrl(game, lang, "support"))}">${esc(labels.contactUs)}</a>
          </div>
          <div class="tabs">
            <a href="#overview">${esc(labels.overview)}</a>
            ${POST_TYPES.map((type) => `<a href="#${type}">${esc(labels[type])}</a>`).join("")}
            <a href="#support">${esc(labels.support)}</a>
          </div>
        </div>
        <div class="heroArt"><img src="${attr(game.image)}" alt="${attr(localize(game.title, lang))} key art" width="720" height="480" /></div>
      </div>
    </section>

    <div class="darkBand">
      <section id="overview">
        <div class="container">
          <div class="sectionHead">
            <div>
              <h2>${esc(labels.overview)}</h2>
              <p class="sectionLead">${esc(localize(game.longDescription, lang))}</p>
            </div>
          </div>
          <div class="infoGrid">
            <article class="infoBox"><h3>${esc(labels.genre)}</h3><p>${esc(localize(game.genre, lang))}</p></article>
            <article class="infoBox"><h3>${esc(labels.platform)}</h3><p>${esc(game.platforms.join(" / "))}</p></article>
            <article class="infoBox"><h3>${esc(labels.status)}</h3><p>${esc(localize(game.status, lang))}</p></article>
          </div>
        </div>
      </section>

      ${POST_TYPES.map((type) => renderPostSection(site, gamePosts, lang, type)).join("")}

      <section id="support">
        <div class="container">
          <div class="sectionHead"><div><h2>${esc(labels.supportPolicy)}</h2></div></div>
          <div class="supportGrid">
            ${supportLinks.map(([, label, url]) => `<a class="supportBox" href="${attr(url)}"><h3>${esc(label)}</h3><p>${esc(localize(game.title, lang))} ${lang === "ko" ? "관련 정보를 확인합니다." : "related information."}</p><strong>${esc(label)}</strong></a>`).join("")}
          </div>
        </div>
      </section>
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
