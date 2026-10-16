import { supabase } from "@/integrations/supabase/client";
import {
  portalCommandSchema,
  type PortalCommand,
  type PortalCase,
  type PortalList,
  type Principal,
  type Intake,
} from "./portal-contract";
import { syntheticCase } from "./fixtures";
import { customerBrief } from "./customer-brief";
const DEMO_KEY = "gridmind:portal-demo:v1";
const ids = ["10000000-0000-4000-8000-000000000001", "10000000-0000-4000-8000-000000000002"];
function initialDemo() {
  const cases = ids.map((id, i): PortalCase => {
    const c = syntheticCase(i ? "C1" : "C4", id);
    return {
      id,
      revision: 1,
      title: i ? "Packaging line interruption" : "Monthly energy intensity review",
      site: i ? "Sample packaging line" : "Sample manufacturing site",
      question: c.scope.question,
      boundary: c.scope.boundary,
      from: c.scope.from,
      to: c.scope.to,
      stage: i ? "Evidence needed" : "Brief available",
      role: "customer",
      evidence: c.evidence.map((e) => ({ id: e.id, name: e.reference, verified: !i })),
      publication: i
        ? null
        : {
            id: "20000000-0000-4000-8000-000000000001",
            revision: 1,
            at: "2026-10-16T00:00:00Z",
            brief: customerBrief(c),
          },
      communications: i
        ? [
            {
              id: "30000000-0000-4000-8000-000000000001",
              role: "investigator",
              kind: "evidence_request",
              payload: {
                text: "Please reconcile the three source clocks before the interruption duration can be established.",
                evidenceId: "E01",
              },
              at: "2026-10-16T00:00:00Z",
            },
          ]
        : [],
    };
  });
  return { cases, requests: [] as Intake[] };
}
function demoCommand(command: PortalCommand): unknown {
  const raw = localStorage.getItem(DEMO_KEY);
  let data: ReturnType<typeof initialDemo>;
  try {
    data = raw ? JSON.parse(raw) : initialDemo();
    if (!Array.isArray(data.cases) || !Array.isArray(data.requests)) throw Error();
  } catch {
    throw new Error(
      "Sample workspace could not be loaded. Use Reset sample to recover; existing bytes were preserved.",
    );
  }
  let result: unknown = { ok: true };
  if (command.action === "principal")
    return {
      factories: [{ id: 1, name: "Sample manufacturing site", role: "owner" }],
      isCustomer: true,
    } satisfies Principal;
  if (command.action === "list")
    return {
      cases: data.cases.map((c) => ({
        id: c.id,
        title: c.title,
        site: c.site,
        revision: c.revision,
        factoryId: 1,
        role: "manager",
        candidate: c.id === ids[1] ? "C1" : "C4",
      })),
    } satisfies PortalList;
  if (command.action === "intakeList") return { requests: data.requests };
  if (command.action === "load") {
    const c = data.cases.find((v) => v.id === command.caseId);
    if (!c) throw new Error("Case not found");
    return c;
  }
  if (command.action === "submit") {
    if (!data.requests.some((r) => r.id === command.id))
      data.requests.unshift({
        id: command.id,
        requester: "Sample customer",
        payload: command.payload,
        caseId: null,
        at: new Date().toISOString(),
      });
    result = { id: command.id };
  } else if (command.action === "accept") {
    const r = data.requests.find((r) => r.id === command.id);
    if (!r) throw new Error("Request missing");
    if (r.caseId) return { caseId: r.caseId };
    const c = syntheticCase(r.payload.candidate, command.caseId);
    data.cases.unshift({
      id: c.id,
      revision: 1,
      title: r.payload.title,
      site: r.payload.site,
      question: r.payload.question,
      boundary: "Scope to confirm with the customer",
      from: r.payload.from,
      to: r.payload.to,
      stage: "Evidence needed",
      role: "customer",
      evidence: [],
      publication: null,
      communications: [],
    });
    r.caseId = c.id;
    result = { caseId: c.id };
  } else if ("caseId" in command) {
    const c = data.cases.find((c) => c.id === command.caseId);
    if (!c) throw new Error("Case not found");
    if (
      ["message", "evidence_reply", "evidence_request", "decision", "withdraw"].includes(
        command.action,
      ) &&
      "id" in command
    ) {
      if (!c.communications.some((v) => v.id === command.id)) {
        const { action, id, caseId: _case, ...payload } = command;
        c.communications.unshift({
          id,
          role: action === "evidence_request" ? "manager" : "customer",
          kind: action,
          payload: payload as Record<string, string>,
          at: new Date().toISOString(),
        });
      }
      if (command.action === "withdraw") {
        c.publication = null;
        c.stage = "In review";
      }
    } else throw new Error("This action requires the connected team workspace.");
  }
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  return result;
}
export function resetPortalDemo() {
  localStorage.removeItem(DEMO_KEY);
}
export async function portalCall<T>(command: PortalCommand, demo = false): Promise<T> {
  portalCommandSchema.parse(command);
  if (demo) return demoCommand(command) as T;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Sign in to access your workspace.");
  const response = await fetch("/api/portal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
    credentials: "omit",
    body: JSON.stringify(command),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      (
        {
          CONNECTED_CASES_DISABLED:
            "This environment is not enabled for connected cases. Explore the sample workspace or use an authorized isolated environment.",
          CASE_ACCESS_DENIED: "This account does not have active access to this case.",
          CURRENT_INDEPENDENT_REVIEW_REQUIRED:
            "This revision needs an accepted independent review before publication.",
          CURRENT_PUBLICATION_REQUIRED:
            "Read the current released brief before recording a decision.",
          STALE_CASE_REVISION: "The case changed. Reload the current version before continuing.",
          PUBLISH_DENIED: "Only the case manager can publish this brief.",
          INTAKE_NOT_CONFIGURED: "Investigation intake is not configured for this environment.",
        } as Record<string, string>
      )[body.error] ??
        body.error ??
        "Workspace request failed",
    );
  return body;
}
