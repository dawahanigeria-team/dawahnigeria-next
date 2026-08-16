/**
 * Renders a synchronous inline script that applies the saved theme class to
 * <html> BEFORE first paint, eliminating the dark-mode flash on load.
 *
 * Must be placed inside <head> via the root layout.
 *
 * React 19 logs "Encountered a script tag while rendering React component" for
 * this in development, and next/script's `beforeInteractive` is flagged the
 * same way — it is a dev-overlay entry only. The script does execute (the
 * server-rendered HTML carries it), and the alternative — reading a theme
 * cookie in the root layout — would opt every route into dynamic rendering.
 *
 * XSS audit: the body is a string literal authored here. No interpolation, no
 * user/URL/DB input. If it is ever templated with dynamic input, rewrite it.
 * Defaults to dark when no preference is saved, matching CRA's design intent.
 */
const THEME_BOOTSTRAP =
  "(function(){try{var t=localStorage.getItem('dn:theme');var d=t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:t!=='light';document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();";

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
}
