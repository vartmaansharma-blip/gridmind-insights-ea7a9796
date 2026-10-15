import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
import { createFactoryWorkspace } from "./repository";

describe("workspace bootstrap client", () => {
  beforeEach(() => rpc.mockReset());
  it("explains ambiguous organization membership", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "WORKSPACE_ORGANIZATION_AMBIGUOUS" } });
    await expect(createFactoryWorkspace({ name: "Factory" })).rejects.toThrow(
      "explicit organization selection",
    );
  });
  it("preserves other authorization failures", async () => {
    const error = { message: "AUTHENTICATION_REQUIRED" };
    rpc.mockResolvedValue({ data: null, error });
    await expect(createFactoryWorkspace({ name: "Factory" })).rejects.toBe(error);
  });
  it("passes only workspace fields to the existing authenticated RPC", async () => {
    rpc.mockResolvedValue({ data: 42, error: null });
    expect(
      await createFactoryWorkspace({
        name: "Factory",
        location: "Mumbai",
        industry: "Manufacturing",
      }),
    ).toBe(42);
    expect(rpc).toHaveBeenCalledWith("create_factory_workspace", {
      p_name: "Factory",
      p_location: "Mumbai",
      p_industry: "Manufacturing",
    });
  });
});
