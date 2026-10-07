import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie, setResponseHeader } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

export function createSupabaseServerClient() {
  const url = process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase URL or publishable key.");

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies, headers) {
        cookies.forEach(({ name, value, options }) => setCookie(name, value, options));
        Object.entries(headers).forEach(([name, value]) => setResponseHeader(name, value));
      },
    },
  });
}
