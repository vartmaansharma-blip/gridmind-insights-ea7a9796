import { supabase } from "@/integrations/supabase/client";
import { sendCommand, CommandRequestError } from "../investigation/command-transport";
import { airCommandSchema, airStoredSchema, type AirCommand } from "./connected";

export async function authenticatedAirCommand(command: AirCommand) {
  const parsed = airCommandSchema.parse(command);
  const result = await sendCommand("/api/investigations?method=compressed-air", parsed, {
    retrySafe: true,
    session: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw new CommandRequestError("AUTHENTICATION_REQUIRED", 401);
      return { userId: data.session.user.id, token: data.session.access_token };
    },
  });
  if (parsed.action !== "scope") airStoredSchema.parse(result);
  return result;
}
