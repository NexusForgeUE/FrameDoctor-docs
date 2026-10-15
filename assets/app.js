"use strict";
(() => {
  const sidebar = document.getElementById("sidebar");
  const menu = document.getElementById("menu-toggle");
  const veil = document.getElementById("menu-veil");
  const main = document.getElementById("main");
  const search = document.getElementById("doc-search");
  const results = document.getElementById("search-results");
  const status = document.getElementById("search-status");
  const sections = Array.from(document.querySelectorAll("main > .doc-section"));
  const links = Array.from(document.querySelectorAll("nav a[href^='#']"));
  const normalize = value => value.toLocaleLowerCase(document.documentElement.lang).normalize("NFD").replace(/\p{M}/gu, "");
  const entries = sections.map(section => ({
    id: section.id,
    title: section.dataset.title,
    text: normalize(section.textContent)
  }));
  function setMenu(open) {
    const wasOpen = menu.getAttribute("aria-expanded") === "true";
    sidebar.classList.toggle("is-open", open);
    veil.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", String(open));
    main.inert = open && window.matchMedia("(max-width: 880px)").matches;
    if (open) search.focus({preventScroll:true});
    else if (wasOpen && sidebar.contains(document.activeElement)) menu.focus({preventScroll:true});
  }
  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  veil.addEventListener("click", () => setMenu(false));
  const mobile = window.matchMedia("(max-width: 880px)");
  mobile.addEventListener("change", () => setMenu(false));
  document.addEventListener("focusin", event => {
    if (menu.getAttribute("aria-expanded") === "true" && !sidebar.contains(event.target) && event.target !== menu) setMenu(false);
  });
  document.querySelector(".brand").addEventListener("click", () => setMenu(false));
  links.forEach(link => link.addEventListener("click", () => {
    setMenu(false);
    const destination = document.querySelector(link.getAttribute("href"));
    if (destination) destination.focus({preventScroll: true});
  }));
  function renderSearch() {
    const terms = normalize(search.value.trim()).split(/\s+/u).filter(Boolean);
    results.replaceChildren();
    if (!terms.length) {results.hidden = true; status.textContent = ""; return;}
    const matches = entries.filter(entry => terms.every(term => entry.text.includes(term)));
    status.textContent = matches.length ? document.body.dataset.searchResults.replace("{count}", String(matches.length)) : document.body.dataset.searchEmpty;
    if (!matches.length) {
      const empty = document.createElement("p"); empty.textContent = document.body.dataset.searchEmpty; results.append(empty);
    } else {
      const list = document.createElement("ul");
      matches.forEach(entry => {
        const item = document.createElement("li"); const link = document.createElement("a");
        link.href = "#" + entry.id; link.textContent = entry.title;
        link.addEventListener("click", () => {setMenu(false); document.getElementById(entry.id).focus({preventScroll: true});});
        item.append(link); list.append(item);
      });
      results.append(list);
    }
    results.hidden = false;
  }
  search.addEventListener("input", renderSearch);
  document.addEventListener("keydown", event => {
    const editing = event.target instanceof Element && (event.target.matches("input,textarea,select") || event.target.isContentEditable);
    if (event.key === "/" && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); if (mobile.matches) setMenu(true); search.focus();
    }
    if (event.key === "Escape") {
      search.value = ""; renderSearch();
      if (menu.getAttribute("aria-expanded") === "true") {setMenu(false); menu.focus();}
    }
  });
  function markCurrent(id) {
    links.forEach(link => {
      if (link.hash === "#" + id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  let pendingScroll = false;
  function trackSection() {
    pendingScroll = false;
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header"), 10) + 75;
    let current = sections[0];
    for (const section of sections) {if (section.getBoundingClientRect().top <= offset) current = section;}
    if (current) markCurrent(current.id);
  }
  window.addEventListener("scroll", () => {
    if (!pendingScroll) {pendingScroll = true; requestAnimationFrame(trackSection);}
  }, {passive:true});
  window.addEventListener("hashchange", trackSection); trackSection();
  document.getElementById("doc-locale").addEventListener("change", event => {
    const siteRoot = new URL(document.querySelector("meta[name='site-root']").content, document.baseURI);
    const locale = event.target.value;
    const next = new URL(locale === "en" ? "index.html" : locale + "/index.html", siteRoot);
    next.hash = window.location.hash || "#overview";
    window.location.assign(next.href);
  });
  let openedForPrint = [];
  window.addEventListener("beforeprint", () => {
    openedForPrint = Array.from(document.querySelectorAll("details:not([open])"));
    openedForPrint.forEach(detail => {detail.open = true;});
  });
  window.addEventListener("afterprint", () => {
    openedForPrint.forEach(detail => {detail.open = false;}); openedForPrint = [];
  });
  document.getElementById("print-guide").addEventListener("click", () => window.print());
})();
