import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type Field = {
  key: string;
  label: string;
  kind?: "number" | "date" | "checkbox" | "multiline" | "ids";
  options?: readonly string[];
  nullable?: boolean;
  hint?: string;
  maxLength?: number;
};
type Value = unknown;

/** Minimal functional controls; Lovable owns the final layout and interaction design. */
export function RecordForm({
  value,
  fields,
  onSave,
  label = "Save revision",
}: {
  value: Record<string, Value>;
  fields: Field[];
  onSave: (value: Record<string, Value>) => void | Promise<void>;
  label?: string;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <form
      className="grid min-w-0 grid-cols-1 gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const next = { ...value };
        for (const field of fields) {
          const raw = String(data.get(field.key) ?? "");
          next[field.key] =
            field.kind === "checkbox"
              ? data.has(field.key)
              : field.kind === "ids"
                ? raw
                    .split(",")
                    .map((id) => id.trim())
                    .filter(Boolean)
                : field.kind === "number"
                  ? raw === "" && field.nullable
                    ? null
                    : raw === ""
                      ? NaN
                      : Number(raw)
                  : raw;
        }
        try {
          setSaving(true);
          await onSave(next);
          setError("");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Save failed");
        } finally {
          setSaving(false);
        }
      }}
    >
      {fields.map((field) => {
        const current = value[field.key];
        return (
          <label key={field.key} className="grid min-w-0 gap-1 text-sm">
            <span className="font-medium">{field.label}</span>
            {field.options ? (
              <select
                aria-label={field.label}
                name={field.key}
                defaultValue={String(current)}
                className="min-w-0 max-w-full rounded-md border border-input bg-background p-2"
              >
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            ) : field.kind === "checkbox" ? (
              <input
                type="checkbox"
                aria-label={field.label}
                name={field.key}
                defaultChecked={current === true}
                className="size-4"
              />
            ) : field.kind === "multiline" ? (
              <Textarea
                aria-label={field.label}
                name={field.key}
                defaultValue={String(current ?? "")}
                maxLength={field.maxLength ?? 4000}
              />
            ) : (
              <Input
                aria-label={field.label}
                name={field.key}
                type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
                step={field.kind === "number" ? "any" : undefined}
                defaultValue={Array.isArray(current) ? current.join(", ") : String(current ?? "")}
                maxLength={field.maxLength ?? 4000}
              />
            )}
            {field.hint && <span className="text-xs text-muted-foreground">{field.hint}</span>}
          </label>
        );
      })}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving} variant="outline" className="justify-self-start">
        {saving ? "Saving…" : label}
      </Button>
    </form>
  );
}
