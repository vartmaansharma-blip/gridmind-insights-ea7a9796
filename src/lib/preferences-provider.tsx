import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  defaultPreferences,
  preferencesSchema,
  preferencesKey,
  PreferencesContext,
} from "./preferences";
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences),
    [loaded, setLoaded] = useState(false);
  const current = useRef(defaultPreferences);
  useEffect(() => {
    try {
      const result = preferencesSchema.safeParse(
        JSON.parse(localStorage.getItem(preferencesKey) ?? "{}"),
      );
      if (result.success) {
        current.current = result.data;
        setPreferences(result.data);
      }
    } catch {
      /* Malformed/non-sensitive preferences never affect authorization. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        preferences.theme === "system" ? (media.matches ? "dark" : "light") : preferences.theme;
      document.documentElement.dataset.density = preferences.density;
      document.documentElement.dataset.motion = preferences.reducedMotion ? "reduced" : "system";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences, loaded]);
  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        ready: loaded,
        update: (value) => {
          if (!loaded) return;
          const next = preferencesSchema.parse({ ...current.current, ...value });
          current.current = next;
          // Persist the actual interaction before a full-page navigation can unload passive effects.
          try {
            localStorage.setItem(preferencesKey, JSON.stringify(next));
          } catch {
            /* In-memory preference remains available. */
          }
          setPreferences(next);
        },
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
