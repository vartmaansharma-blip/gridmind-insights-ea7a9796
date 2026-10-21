import { usePreferences, type Preferences } from "@/lib/preferences";
export function PreferencesPanel() {
  const { preferences: p, update, ready } = usePreferences();
  const select = (label: string, key: keyof Preferences, values: readonly string[]) => (
    <div className="text-sm">
      <label htmlFor={`preference-${key}`}>{label}</label>
      <select
        id={`preference-${key}`}
        className="mt-1 block w-full rounded border bg-background p-2"
        value={String(p[key])}
        onChange={(e) => update({ [key]: e.target.value })}
      >
        {values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <section className="panel space-y-4 p-5">
      <h2 className="text-xl font-semibold">Appearance and preferences</h2>
      <p className="text-sm text-muted-foreground">
        Saved on this browser only. No factory records, permissions or account tokens are stored
        here. Public website styling stays distinct.
      </p>
      {!ready && <p role="status">Loading browser preferences…</p>}
      <fieldset disabled={!ready} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {select("Theme", "theme", ["light", "dark", "system"])}
          {select("Display density", "density", ["comfortable", "compact"])}
          {select("Preferred timezone", "timezone", [
            "UTC",
            "Asia/Kolkata",
            "Europe/London",
            "America/New_York",
          ])}
          {select("Date format", "dateFormat", ["locale", "iso"])}
          {select("Number formatting", "numberLocale", ["en-IN", "en-US"])}
          {select("Default landing context", "landing", ["workspace", "profile", "explore"])}
        </div>
        <div className="grid gap-3 text-sm">
          {(
            [
              ["Simpler motion", "reducedMotion"],
              ["Collapse workspace sidebar", "sidebarCollapsed"],
              ["Start sample in guided mode", "guided"],
            ] as const
          ).map(([label, key]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={p[key]}
                onChange={(e) => update({ [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
