import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  loadPersonalProfile,
  savePersonalMetadata,
  personalMetadataSchema,
  profileName,
} from "./profile";
const user = {
  id: "10000000-0000-4000-8000-000000000001",
  email: "sample@example.test",
  user_metadata: { display_name: "Person", role: "owner", organization_id: 999 },
  is_anonymous: false,
} as unknown as User;
function fixture(
  options: { rows?: Record<string, unknown[]>; error?: boolean; users?: User[] } = {},
) {
  const users = [...(options.users ?? [user])],
    queries: unknown[] = [];
  const auth = {
    getUser: vi.fn(async () => ({
      data: { user: users.length > 1 ? users.shift()! : users[0] },
      error: null,
    })),
    updateUser: vi.fn(async (args: unknown) => ({ data: { user }, error: null })),
  };
  const from = vi.fn((table: string) => {
    const filters: unknown[] = [];
    const q = {
      select: (fields: string) => {
        queries.push({ table, fields, filters });
        return q;
      },
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        return q;
      },
      in: (column: string, value: unknown) => {
        filters.push([column, value]);
        return q;
      },
      then: (resolve: (value: unknown) => void) =>
        resolve({
          data: options.rows?.[table] ?? [],
          error: options.error ? new Error("unavailable") : null,
        }),
    };
    return q;
  });
  return { client: { auth, from } as unknown as SupabaseClient<Database>, auth, from, queries };
}
describe("own personal profile without authorization metadata", () => {
  it("allows a verified no-membership personal account and ignores forged metadata roles", async () => {
    const f = fixture(),
      p = await loadPersonalProfile(f.client);
    expect(p.organizations).toEqual([]);
    expect(p.factories).toEqual([]);
    expect(p.accessError).toBeNull();
    expect(f.queries).toEqual([
      expect.objectContaining({
        table: "organization_members",
        filters: [
          ["user_id", user.id],
          ["status", "active"],
        ],
      }),
    ]);
  });
  it("loads only verified own membership rows and active organization scope", async () => {
    const f = fixture({
      rows: {
        organization_members: [{ organization_id: 1, role: "viewer" }],
        organizations: [{ id: 1, name: "Allowed" }],
        factory_members: [{ factory_id: 2, organization_id: 1, role: "viewer" }],
        factories: [{ id: 2, name: "Plant", organization_id: 1 }],
      },
    });
    const p = await loadPersonalProfile(f.client);
    expect(p.factories).toEqual([{ id: 2, name: "Plant", organizationId: 1, role: "viewer" }]);
    expect(p.organizations[0].role).toBe("viewer");
    expect(f.queries).toContainEqual(
      expect.objectContaining({
        table: "factory_members",
        filters: [
          ["user_id", user.id],
          ["organization_id", [1]],
        ],
      }),
    );
  });
  it("reports unavailable access separately from no membership and never assumes grants", async () => {
    const f = fixture({ error: true });
    const p = await loadPersonalProfile(f.client);
    expect(p.accessError).toContain("unavailable");
    expect(p.factories).toEqual([]);
  });
  it("refuses anonymous identities and account switches during lookup", async () => {
    await expect(
      loadPersonalProfile(fixture({ users: [{ ...user, is_anonymous: true }] }).client),
    ).rejects.toThrow("SIGN_IN_REQUIRED");
    await expect(
      loadPersonalProfile(fixture({ users: [user, { ...user, id: "different" }] }).client),
    ).rejects.toThrow("ACCOUNT_CHANGED");
  });
  it("updates only bounded personal display name/designation through supported Auth", async () => {
    const f = fixture();
    await savePersonalMetadata(f.client, user.id, {
      display_name: "  Name  ",
      designation: "Engineer",
    });
    expect(f.auth.updateUser).toHaveBeenCalledWith({
      data: { display_name: "Name", designation: "Engineer" },
    });
    expect(f.from).not.toHaveBeenCalled();
  });
  it("cannot write email, provider, organization role or arbitrary metadata", async () => {
    for (const extra of [
      { email: "other@example.test" },
      { role: "admin" },
      { organization_id: 999 },
      { app_metadata: { role: "owner" } },
    ]) {
      expect(
        personalMetadataSchema.safeParse({ display_name: "Test", designation: "", ...extra })
          .success,
      ).toBe(false);
    }
    expect(
      personalMetadataSchema.safeParse({ display_name: "x".repeat(101), designation: "" }).success,
    ).toBe(false);
    const f = fixture({ users: [{ ...user, id: "other" }] });
    await expect(
      savePersonalMetadata(f.client, user.id, { display_name: "Name", designation: "" }),
    ).rejects.toThrow("ACCOUNT_CHANGED");
    expect(f.auth.updateUser).not.toHaveBeenCalled();
    expect(profileName(user)).toBe("Person");
  });
});
