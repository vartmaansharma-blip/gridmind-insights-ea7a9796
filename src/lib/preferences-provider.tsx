import { useEffect, useState, type ReactNode } from "react";
import {
  defaultPreferences,
  preferencesSchema,
  preferencesKey,
  PreferencesContext,
} from "./preferences";
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const result = preferencesSchema.safeParse(
        JSON.parse(localStorage.getItem(preferencesKey) ?? "{}"),
      );
      if (result.success) setPreferences(result.data);
    } catch {
      /* Malformed/non-sensitive preferences never affect authorization. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    } catch {
      /* In-memory preferences remain usable if browser storage is unavailable. */
    }
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
        update: (value) =>
          setPreferences((previous) => preferencesSchema.parse({ ...previous, ...value })),
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
