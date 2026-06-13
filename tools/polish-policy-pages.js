const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, "content/site.json"), "utf8"));

const TARGETS = [
  {
    file: "ko/privacy/wallbreaker/index.html",
    lang: "ko",
    alt: "/en/privacy/wallbreaker/",
    title: "개인정보처리방침"
  },
  {
    file: "en/privacy/wallbreaker/index.html",
    lang: "en",
    alt: "/ko/privacy/wallbreaker/",
    title: "Privacy Policy"
  },
  {
    file: "ko/terms/wallbreaker/index.html",
    lang: "ko",
    alt: "/en/terms/wallbreaker/",
    title: "이용약관"
  },
  {
    file: "en/terms/wallbreaker/index.html",
    lang: "en",
    alt: "/ko/terms/wallbreaker/",
    title: "Terms of Service"
  },
  {
    file: "ko/support/index.html",
    lang: "ko",
    alt: "/en/support/",
    title: "고객지원"
  },
  {
    file: "en/support/index.html",
    lang: "en",
    alt: "/ko/support/",
    title: "Support"
  }
];

function policyStyle() {
  return `    :root { --bg:#f6f9fe; --ink:#111827; --muted:#667085; --line:#d9e1ee; --primary:#5b4dca; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", "Malgun Gothic", Roboto, Arial, sans-serif; margin: 0; line-height: 1.7; color: #222; background: var(--bg); }
    .siteHeader { background: rgba(247,251,255,.94); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 5; backdrop-filter: blur(10px); }
    .siteNav { max-width: 980px; min-height: 72px; margin: 0 auto; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
    .brand { display: flex; align-items: center; gap: 12px; color: var(--ink); text-decoration: none; }
    .brandMark { width: 40px; height: 40px; border-radius: 8px; flex: 0 0 auto; overflow: hidden; background: linear-gradient(135deg, #8b7cff, #44d7a8); box-shadow: inset 0 0 0 1px rgba(255,255,255,.58); }
    .brandMark img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .brand strong { display: block; font-size: 16px; line-height: 1.1; }
    .brand small { display: block; color: var(--muted); font-size: 12px; }
    .navLinks { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: flex-end; font-size: 14px; font-weight: 800; }
    .navLinks a { color: #25324a; text-decoration: none; padding: 8px 10px; border-radius: 8px; min-height: 40px; display: inline-flex; align-items: center; }
    .navLinks a:hover { background: #edf2fb; color: var(--primary); }
    .navLinks .active { background: #5b4dca; color: #fff; padding-left: 14px; padding-right: 14px; }
    .navLinks .active:hover { background: #4939b7; color: #fff; }
    .navLinks .langPill { border: 1px solid var(--line); background: #fff; }
    .docHero { background: linear-gradient(135deg, #111827, #1e2a44); color: #fff; }
    .docHeroInner { max-width: 980px; margin: 0 auto; padding: 42px 20px; }
    .docHero h1 { color: #fff; margin: 0 0 8px; font-size: 34px; line-height: 1.2; }
    .docHero p { margin: 0; color: #cbd5e1; }
    .docPage { max-width: 900px; margin: 28px auto 60px; padding: 30px 24px; background: #fff; border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 18px 50px rgba(17,24,39,.08); }
    h1 { font-size: 26px; margin: 18px 0 6px; }
    h2 { font-size: 18px; margin: 28px 0 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    ul, ol { margin: 8px 0 8px 22px; padding: 0; }
    li { margin: 4px 0; }
    a { color: #4338ca; }
    .mailbox { display: inline-block; margin: 8px 0; padding: 12px 18px; border: 1px solid #ddd; border-radius: 10px; background: #f8f8fb; font-size: 16px; }
    .footer { margin-top: 44px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
    .nav { display: none; }
    @media (max-width: 720px) { .siteNav { align-items: flex-start; flex-direction: column; padding: 14px 20px; } .docHeroInner { padding-top: 32px; padding-bottom: 32px; } .docPage { margin: 0; border-left: 0; border-right: 0; border-radius: 0; } }`;
}

function header(target) {
  const home = target.lang === "ko" ? "/ko/" : "/en/";
  const games = `${home}#games`;
  const support = target.lang === "ko" ? "/ko/support/" : "/en/support/";
  const privacy = target.lang === "ko" ? "/ko/privacy/wallbreaker/" : "/en/privacy/wallbreaker/";
  const terms = target.lang === "ko" ? "/ko/terms/wallbreaker/" : "/en/terms/wallbreaker/";
  const current = target.file.includes("/support/") ? "support" : target.file.includes("/privacy/") ? "privacy" : "terms";
  const active = (key) => current === key ? ` class="active"` : "";
  const logo = SITE.assets && SITE.assets.logo ? SITE.assets.logo : "/assets/copiasoft-logo.svg";
  const subtitle = target.lang === "ko" ? "공식 문서" : "Official document";
  const studio = target.lang === "ko" ? "인디 게임 스튜디오" : "Indie game studio";
  const altLabel = target.lang === "ko" ? "English" : "한국어";
  return `<header class="siteHeader">
    <nav class="siteNav" aria-label="${target.lang === "ko" ? "문서 메뉴" : "Document navigation"}">
      <a class="brand" href="${home}">
        <span class="brandMark"><img src="${logo}" alt="" onerror="this.style.display='none'" /></span>
        <span><strong>CopiaSoft</strong><small>${studio}</small></span>
      </a>
      <div class="navLinks">
        <a href="${home}">Home</a>
        <a href="${games}">Games</a>
        <a${active("support")} href="${support}">Support</a>
        <a${active("privacy")} href="${privacy}">Privacy</a>
        <a${active("terms")} href="${terms}">Terms</a>
        <a class="langPill" href="${target.alt}">${altLabel}</a>
      </div>
    </nav>
  </header>
  <section class="docHero">
    <div class="docHeroInner">
      <h1>${target.title}</h1>
      <p>${subtitle} · Wallbreaker · CopiaSoft</p>
    </div>
  </section>
  <main class="docPage">`;
}

function polishPages() {
  for (const target of TARGETS) {
    const filePath = path.join(ROOT, target.file);
    let html = fs.readFileSync(filePath, "utf8");
    html = html.replace(/\s*<header class="siteHeader">[\s\S]*?<main class="docPage">\s*/, "\n");
    html = html.replace(/\s*<\/main>\s*(?=<\/body>)/, "\n");
    html = html.replace(/<style>[\s\S]*?<\/style>/, `<style>\n${policyStyle()}\n  </style>`);
    html = html.replace(/<body>\s*/, `<body>\n  ${header(target)}\n`);
    html = html.replace(/\s*<\/body>/, "\n  </main>\n</body>");
    fs.writeFileSync(filePath, html.replace(/[ \t]+$/gm, ""), "utf8");
  }
}

if (require.main === module) {
  polishPages();
  console.log("Policy/support pages polished.");
}

module.exports = { polishPages };
