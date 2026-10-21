import { z } from "zod";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
export const personalMetadataSchema = z
  .object({
    display_name: z.string().trim().min(1).max(100),
    designation: z.string().trim().max(100),
  })
  .strict();
type Client = SupabaseClient<Database>;
export type PersonalProfile = {
  user: User;
  organizations: { id: number; name: string; role: string }[];
  factories: { id: number; name: string; organizationId: number; role: string }[];
  accessError: string | null;
};
export async function verifiedProfileUser(client: Client) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) throw new Error("PROFILE_SIGN_IN_REQUIRED");
  return data.user;
}
/** Own Auth identity and existing RLS-protected membership records only. Metadata never grants access. */
export async function loadPersonalProfile(client: Client): Promise<PersonalProfile> {
  const user = await verifiedProfileUser(client);
  try {
    const orgMembership = await client
      .from("organization_members")
      .select("organization_id,role")
      .eq("user_id", user.id)
      .eq("status", "active");
    if (orgMembership.error) throw orgMembership.error;
    const orgIds = (orgMembership.data ?? []).map((m) => m.organization_id);
    const orgRecords = orgIds.length
      ? await client.from("organizations").select("id,name").in("id", orgIds).eq("status", "active")
      : { data: [], error: null };
    if (orgRecords.error) throw orgRecords.error;
    const organizations = (orgRecords.data ?? []).map((o) => ({
      ...o,
      role: orgMembership.data!.find((m) => m.organization_id === o.id)!.role,
    }));
    const activeOrgIds = organizations.map((o) => o.id);
    const membership = activeOrgIds.length
      ? await client
          .from("factory_members")
          .select("factory_id,organization_id,role")
          .eq("user_id", user.id)
          .in("organization_id", activeOrgIds)
      : { data: [], error: null };
    if (membership.error) throw membership.error;
    const ids = (membership.data ?? []).map((m) => m.factory_id);
    const factories = ids.length
      ? await client
          .from("factories")
          .select("id,name,organization_id")
          .in("id", ids)
          .in("organization_id", activeOrgIds)
      : { data: [], error: null };
    if (factories.error) throw factories.error;
    if ((await verifiedProfileUser(client)).id !== user.id)
      throw new Error("PROFILE_ACCOUNT_CHANGED");
    return {
      user,
      organizations,
      factories: (factories.data ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        organizationId: f.organization_id!,
        role: membership.data!.find(
          (m) => m.factory_id === f.id && m.organization_id === f.organization_id,
        )!.role,
      })),
      accessError: null,
    };
  } catch (error) {
    // Do not turn an unavailable membership service into an empty-membership claim.
    if ((await verifiedProfileUser(client)).id !== user.id)
      throw new Error("PROFILE_ACCOUNT_CHANGED");
    return {
      user,
      organizations: [],
      factories: [],
      accessError:
        error instanceof Error && error.message === "PROFILE_ACCOUNT_CHANGED"
          ? error.message
          : "Membership lookup unavailable. No workspace access is assumed; retry the lookup.",
    };
  }
}
export async function savePersonalMetadata(client: Client, expectedUserId: string, raw: unknown) {
  const data = personalMetadataSchema.parse(raw);
  if ((await verifiedProfileUser(client)).id !== expectedUserId)
    throw new Error("PROFILE_ACCOUNT_CHANGED");
  const result = await client.auth.updateUser({ data });
  if (result.error) throw new Error("Profile could not be saved. Please retry.");
  if (
    result.data.user?.id !== expectedUserId ||
    (await verifiedProfileUser(client)).id !== expectedUserId
  )
    throw new Error("PROFILE_ACCOUNT_CHANGED");
  return result.data.user;
}
export function profileName(user: User) {
  const name = user.user_metadata?.display_name ?? user.user_metadata?.full_name;
  return typeof name === "string" ? name.slice(0, 100) : "GridMind member";
}
