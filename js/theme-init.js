// Loaded as a blocking script in <head> so a saved theme applies before the first paint.
// main.js validates the value against THEMES; an unknown name simply matches no CSS.
try {
  const theme = window.localStorage.getItem("looko.theme");
  if (theme && theme !== "amber") {
    document.documentElement.dataset.theme = theme;
  }
} catch {
  // Storage unavailable: keep the default amber theme.
}
