import { handleAuthenticatedCaseRequest } from "./connected.server";
import { executePortalCommand } from "./portal-service";
export function handlePortal(request: Request) {
  return handleAuthenticatedCaseRequest(request, "portal_store", (store, actor, raw) =>
    executePortalCommand(store, actor, raw, Number(process.env.GRIDMIND_INTAKE_ORGANIZATION_ID)),
  );
}
