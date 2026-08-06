(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-toggle]");
  const progress = document.querySelector("[data-reading-progress]");
  const backToTop = document.querySelector("[data-back-to-top]");
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const storageKey = "japanese-gravure-theme";

  const systemTheme = () => (media.matches ? "dark" : "light");
  const storedTheme = () => {
    try {
      const value = localStorage.getItem(storageKey);
      return value === "dark" || value === "light" ? value : null;
    } catch {
      return null;
    }
  };

  const setTheme = (theme, persist = false) => {
    root.dataset.theme = theme;
    if (persist) {
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // Theme still works for this page view when storage is unavailable.
      }
    }
    if (themeButton) {
      const isDark = theme === "dark";
      themeButton.setAttribute("aria-pressed", String(isDark));
      themeButton.setAttribute(
        "aria-label",
        isDark
          ? themeButton.dataset.labelLight
          : themeButton.dataset.labelDark
      );
      const icon = themeButton.querySelector(".theme-icon");
      const label = themeButton.querySelector(".theme-label");
      if (icon) icon.textContent = isDark ? "☀" : "☾";
      if (label) {
        label.textContent = isDark
          ? themeButton.dataset.textLight
          : themeButton.dataset.textDark;
      }
    }
  };

  setTheme(storedTheme() || systemTheme());

  themeButton?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next, true);
  });

  media.addEventListener?.("change", () => {
    if (!storedTheme()) setTheme(systemTheme());
  });

  const updateScrollUI = () => {
    const doc = document.documentElement;
    const distance = doc.scrollHeight - doc.clientHeight;
    const ratio = distance > 0 ? doc.scrollTop / distance : 0;
    if (progress) progress.style.width = `${Math.min(100, ratio * 100)}%`;
    backToTop?.classList.toggle("is-visible", doc.scrollTop > 700);
  };

  updateScrollUI();
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  window.addEventListener("resize", updateScrollUI);

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const tocLinks = [...document.querySelectorAll(".desktop-toc a")];
  const sections = tocLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;
        const id = visible[0].target.id;
        tocLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${id}`;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-15% 0px -72% 0px", threshold: [0, 1] }
    );
    sections.forEach((section) => observer.observe(section));
  }

  // Keep on-site navigation in the current tab, but open every external
  // HTTP(S) destination in a new tab. This also covers links added later.
  document.querySelectorAll("a[href]").forEach((link) => {
    try {
      const destination = new URL(link.getAttribute("href"), window.location.href);
      const isWebLink = destination.protocol === "http:" || destination.protocol === "https:";
      const isExternal = destination.origin !== window.location.origin;
      if (isWebLink && isExternal) {
        link.target = "_blank";
        const rel = new Set((link.rel || "").split(/\s+/).filter(Boolean));
        rel.add("noopener");
        rel.add("noreferrer");
        link.rel = [...rel].join(" ");
      }
    } catch {
      // Ignore malformed or non-standard URLs and leave them unchanged.
    }
  });
})();