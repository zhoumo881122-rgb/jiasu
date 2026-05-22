const REGISTER_URL = "https://app.lanhai.in:7779/#/register?code=cBg4CIga";

const dictionaries = {
  zh: {
    pageTitle: "蓝海加速 · 发布页 | 蓝海节点官网入口",
    description: "蓝海加速发布页，提供蓝海节点官网入口、备用网址和注册链接。建议收藏本页，防止失联。",
    keywords: "蓝海加速,蓝海节点,蓝海云,蓝海官网,蓝海发布页,IPLC专线,IEPL专线,机场节点,科学上网,VPN加速,流媒体解锁",
    badge: "蓝海发布页",
    title: "永久地址入口",
    official: "官网入口",
    backup: "备用网址",
    enter: "进入",
    bookmarkAction: "收藏本站",
    bookmarkHint: "建议收藏本页，防止失联",
    bookmarkManual: "请按 Ctrl+D 收藏本页",
    languageLabel: "切换为英文"
  },
  en: {
    pageTitle: "LanHai Node Official Entry | LanHai Release Page",
    description: "LanHai official release page with primary website entry, backup access and registration link for stable global network acceleration.",
    keywords: "LanHai,LanHai Node,LanHai official entry,global proxy,stable VPN,IPLC,IEPL,streaming unlock,network acceleration",
    badge: "LanHai Release Page",
    title: "Permanent Access Entry",
    official: "Official Website",
    backup: "Backup Entry",
    enter: "Enter",
    bookmarkAction: "Bookmark",
    bookmarkHint: "Bookmark this page to avoid losing access",
    bookmarkManual: "Press Ctrl+D to bookmark this page",
    languageLabel: "Switch to Chinese"
  }
};

const state = {
  language: detectLanguage()
};

const els = {
  languageToggle: document.querySelector("#languageToggle"),
  bookmarkButton: document.querySelector("#bookmarkButton"),
  bookmarkHint: document.querySelector("#bookmarkHint")
};

function getUrlLanguage() {
  const value = new URLSearchParams(window.location.search).get("lang");
  return value === "en" || value === "zh" ? value : "";
}

function detectLanguage() {
  const fromUrl = getUrlLanguage();
  if (fromUrl) return fromUrl;

  const saved = localStorage.getItem("lanhai-language");
  if (saved === "en" || saved === "zh") return saved;

  const languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
  const systemLanguage = languages.join(",").toLowerCase();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  if (systemLanguage.includes("zh") || /Asia\/(Shanghai|Chongqing|Hong_Kong|Macau|Taipei)/i.test(timeZone)) {
    return "zh";
  }

  return "en";
}

function setMeta(name, content) {
  const node = document.querySelector(`meta[name="${name}"]`);
  if (node) node.setAttribute("content", content);
}

function applyLanguage() {
  const dictionary = dictionaries[state.language];
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  document.title = dictionary.pageTitle;
  setMeta("description", dictionary.description);
  setMeta("keywords", dictionary.keywords);

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = dictionary[node.dataset.i18n];
    if (value) node.textContent = value;
  });

  document.querySelectorAll(".entry-link").forEach((link) => {
    link.href = REGISTER_URL;
  });

  if (els.languageToggle) {
    els.languageToggle.textContent = state.language === "zh" ? "EN" : "中文";
    els.languageToggle.setAttribute("aria-label", dictionary.languageLabel);
  }

  localStorage.setItem("lanhai-language", state.language);
}

function toggleLanguage() {
  state.language = state.language === "zh" ? "en" : "zh";
  applyLanguage();
}

function bookmarkPage() {
  const title = document.title;
  const url = window.location.href;

  if (window.sidebar && window.sidebar.addPanel) {
    window.sidebar.addPanel(title, url, "");
    return;
  }

  if (window.external && "AddFavorite" in window.external) {
    window.external.AddFavorite(url, title);
    return;
  }

  if (els.bookmarkHint) {
    els.bookmarkHint.textContent = dictionaries[state.language].bookmarkManual;
    els.bookmarkHint.classList.add("is-active");
  }
}

els.languageToggle?.addEventListener("click", toggleLanguage);
els.bookmarkButton?.addEventListener("click", bookmarkPage);

applyLanguage();
