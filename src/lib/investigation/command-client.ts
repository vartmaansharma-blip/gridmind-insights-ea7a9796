import { supabase } from "@/integrations/supabase/client";
import { caseCommandSchema, storedCaseSchema, type CaseCommand } from "./connected-contract";
import { z } from "zod";
import { portalCommandSchema, type PortalCommand } from "./portal-contract";
import { sendCommand, CommandRequestError } from "./command-transport";

const portalSafe = new Set([
  "principal",
  "list",
  "load",
  "intakeList",
  "submit",
  "accept",
  "publish",
  "message",
  "evidence_request",
  "evidence_reply",
  "withdraw",
  "decision",
]);
const caseSafe = new Set(["list", "load", "create", "save", "assign", "verify", "review"]);
export async function authenticatedCommand(
  endpoint: "/api/portal" | "/api/investigations",
  command: PortalCommand | CaseCommand,
) {
  const parsed =
    endpoint === "/api/portal"
      ? portalCommandSchema.parse(command)
      : caseCommandSchema.parse(command);
  const result = await sendCommand(endpoint, parsed, {
    retrySafe: (endpoint === "/api/portal" ? portalSafe : caseSafe).has(parsed.action),
    session: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw new CommandRequestError("AUTHENTICATION_REQUIRED", 401);
      return { userId: data.session.user.id, token: data.session.access_token };
    },
  });
  // HTTP success alone is not a write receipt. Validate before acknowledging it.
  if (endpoint === "/api/investigations" && parsed.action !== "list")
    return storedCaseSchema.parse(result);
  if (endpoint === "/api/portal") {
    if (parsed.action === "accept") z.object({ caseId: z.string().uuid() }).parse(result);
    else if (parsed.action === "grant") z.object({ ok: z.literal(true) }).parse(result);
    else if ("id" in parsed && !z.object({ id: z.literal(parsed.id) }).safeParse(result).success)
      throw new CommandRequestError("INVALID_API_RESPONSE");
  }
  return result;
}
