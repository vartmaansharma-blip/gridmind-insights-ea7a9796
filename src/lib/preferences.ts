import { createContext, useContext } from "react";
import { z } from "zod";
export const preferencesSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    reducedMotion: z.boolean().default(false),
    density: z.enum(["comfortable", "compact"]).default("comfortable"),
    timezone: z
      .enum(["UTC", "Asia/Kolkata", "Europe/London", "America/New_York"])
      .default("Asia/Kolkata"),
    dateFormat: z.enum(["locale", "iso"]).default("locale"),
    numberLocale: z.enum(["en-IN", "en-US"]).default("en-IN"),
    sidebarCollapsed: z.boolean().default(false),
    guided: z.boolean().default(true),
    landing: z.enum(["workspace", "profile", "explore"]).default("workspace"),
  })
  .strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export const defaultPreferences = preferencesSchema.parse({});
export const preferencesKey = "gridmind.preferences.v1";
export const PreferencesContext = createContext<{
  preferences: Preferences;
  update: (value: Partial<Preferences>) => void;
}>({ preferences: defaultPreferences, update: () => {} });
export const usePreferences = () => useContext(PreferencesContext);
export function formatSampleTime(value: string, preferences: Preferences) {
  const date = new Date(value);
  return preferences.dateFormat === "iso"
    ? date.toISOString()
    : new Intl.DateTimeFormat(preferences.numberLocale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: preferences.timezone,
      }).format(date) + ` (${preferences.timezone})`;
}
export function savedLanding() {
  try {
    const p = preferencesSchema.safeParse(JSON.parse(localStorage.getItem(preferencesKey) ?? "{}"));
    return p.success ? p.data.landing : "workspace";
  } catch {
    return "workspace";
  }
}
